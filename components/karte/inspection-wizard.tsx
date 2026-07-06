"use client";

import { useRef, useState } from "react";
import { createInspection } from "@/app/actions/karte";
import { IconCamera, IconCheck, IconChevronRight, IconArrowLeft, IconShield } from "./icons";

export interface WizardItem {
  id: string;
  label: string;
  desc: string;
  impact: "高" | "中" | "低";
  kind: string;
}

interface ItemState {
  result?: "ok" | "ng" | "na";
  note: string;
  photoFileIds: string[];
  uploading: boolean;
  error?: string;
}

const MAX_PHOTOS = 5;

const RESULT_LABEL = { ok: "良", ng: "否", na: "対象外" } as const;

export function InspectionWizard({
  machineId,
  machineName,
  items,
  viaQr,
}: {
  machineId: string;
  machineName: string;
  items: WizardItem[];
  viaQr: boolean;
}) {
  const [idx, setIdx] = useState(0); // items.length = 確認画面
  const [states, setStates] = useState<Record<string, ItemState>>({});
  const [pending, setPending] = useState(false);
  const geoRef = useRef<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const patch = (itemId: string, p: Partial<ItemState>) =>
    setStates((s) => {
      const prev: ItemState = s[itemId] ?? { note: "", uploading: false, photoFileIds: [] };
      return { ...s, [itemId]: { ...prev, ...p } };
    });

  // 撮影即時アップロード: カメラで撮った写真を編集工程を挟まずそのまま送信する
  async function uploadCapture(item: WizardItem, file: File) {
    patch(item.id, { uploading: true, error: undefined });
    if (!geoRef.current && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          geoRef.current = `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`;
        },
        () => {},
        { timeout: 4000 },
      );
    }
    const form = new FormData();
    form.append("photo", file);
    form.append("machineId", machineId);
    form.append("capturedAt", new Date().toISOString());
    form.append("geo", geoRef.current);
    try {
      const res = await fetch("/api/karte/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { fileId: string };
      setStates((s) => {
        const prev: ItemState = s[item.id] ?? { note: "", uploading: false, photoFileIds: [] };
        return {
          ...s,
          [item.id]: {
            ...prev,
            uploading: false,
            photoFileIds: [...prev.photoFileIds, data.fileId].slice(0, MAX_PHOTOS),
          },
        };
      });
    } catch {
      patch(item.id, { uploading: false, error: "アップロードに失敗しました。電波状況を確認して撮り直してください。" });
    }
  }

  const answered = items.filter((it) => states[it.id]?.result).length;
  const isSummary = idx >= items.length;
  const item = isSummary ? null : items[idx];
  const st = item ? states[item.id] : undefined;

  if (isSummary) {
    const ng = items.filter((it) => states[it.id]?.result === "ng");
    const photos = items.reduce((n, it) => n + (states[it.id]?.photoFileIds.length ?? 0), 0);
    return (
      <div>
        <p className="mk-label">定期自主整備 — 結果の確認</p>
        <h2 className="mt-1 font-serif text-xl font-semibold">全{items.length}項目の点検が完了</h2>
        <div className="mt-4 grid grid-cols-3 gap-px border border-line bg-line text-center">
          {[
            { label: "良", n: items.filter((it) => states[it.id]?.result === "ok").length },
            { label: "否(要対応)", n: ng.length },
            { label: "写真", n: photos },
          ].map((x) => (
            <div key={x.label} className="bg-panel px-2 py-3">
              <p className="font-serif text-xl font-semibold mk-tabular">{x.n}</p>
              <p className="mt-0.5 text-[10px] text-ink3">{x.label}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 divide-y divide-line border border-line bg-panel">
          {items.map((it, i) => {
            const s = states[it.id];
            return (
              <li key={it.id} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                <button
                  type="button"
                  onClick={() => setIdx(i)}
                  className="min-w-0 flex-1 truncate text-left underline-offset-4 hover:underline"
                >
                  {it.label}
                </button>
                {(s?.photoFileIds ?? []).slice(0, 3).map((fid) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={fid}
                    src={`/api/karte/files/${fid}`}
                    alt=""
                    className="h-8 w-8 shrink-0 border border-line object-cover"
                  />
                ))}
                <span
                  className={`shrink-0 font-medium ${
                    s?.result === "ok" ? "text-ok" : s?.result === "ng" ? "text-alert" : "text-ink3"
                  }`}
                >
                  {s?.result ? RESULT_LABEL[s.result] : "—"}
                </span>
              </li>
            );
          })}
        </ul>
        <form
          action={createInspection}
          onSubmit={() => setPending(true)}
          className="mt-5"
        >
          <input type="hidden" name="machineId" value={machineId} />
          <input type="hidden" name="viaQr" value={viaQr ? "1" : "0"} />
          <input
            type="hidden"
            name="items"
            value={JSON.stringify(
              items
                .filter((it) => states[it.id]?.result)
                .map((it) => ({
                  itemId: it.id,
                  result: states[it.id].result,
                  note: states[it.id].note || undefined,
                  photoFileIds: states[it.id].photoFileIds,
                })),
            )}
          />
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-navy px-4 py-3.5 text-sm font-medium text-white transition-colors hover:bg-navy2 disabled:opacity-50"
          >
            {pending ? "保存中..." : `${machineName} の定期自主整備を保存する`}
          </button>
          <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-ink3">
            <IconShield width={14} height={14} className="mt-0.5 shrink-0" />
            保存後の編集・削除はできません。結果は査定準備状況と履歴証明書に反映されます。
          </p>
        </form>
      </div>
    );
  }

  return (
    <div>
      {/* 進捗 */}
      <div className="flex items-baseline justify-between">
        <p className="mk-label">
          項目 {idx + 1} / {items.length}
        </p>
        <p className="text-xs text-ink3 mk-tabular">回答済み {answered}</p>
      </div>
      <div className="mt-1.5 h-1 w-full bg-panel2">
        <div className="h-full bg-navy" style={{ width: `${(idx / items.length) * 100}%` }} />
      </div>

      {/* 項目 */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {item!.kind === "法定" && (
          <span className="border border-steel/35 bg-panel2 px-1.5 text-[10px] font-medium tracking-wider text-steel">
            法定
          </span>
        )}
        <span
          className={`border px-1.5 text-[10px] font-medium tracking-wider ${
            item!.impact === "高" ? "border-navy/25 bg-navysoft text-navy" : "border-line2 bg-panel2 text-ink3"
          }`}
        >
          査定影響 {item!.impact}
        </span>
      </div>
      <h2 className="mt-2 font-serif text-xl font-semibold leading-snug">{item!.label}</h2>
      <p className="mt-2 text-[13px] leading-6 text-ink2">{item!.desc}</p>

      {/* 1. 写真: カメラ起動→撮影即時アップロード(編集不可・複数可) */}
      <div className="mt-5">
        <p className="mk-label mb-2">
          1. 写真を撮る
          <span className="ml-2 font-normal normal-case tracking-normal text-ink3">
            複数枚可(最大{MAX_PHOTOS}枚)
          </span>
        </p>
        {(st?.photoFileIds.length ?? 0) > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {st!.photoFileIds.map((fid, i) => (
              <div key={fid} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/karte/files/${fid}`}
                  alt={`点検写真 ${i + 1}`}
                  className="h-16 w-16 border border-ok/40 object-cover"
                />
                <span className="absolute bottom-0 right-0 bg-ok px-1 text-[9px] font-semibold text-white">
                  {i + 1}
                </span>
              </div>
            ))}
            <p className="flex items-center gap-1.5 text-xs font-medium text-ok">
              <IconCheck width={14} height={14} />
              {st!.photoFileIds.length}枚を撮影即時アップロード済み
            </p>
          </div>
        )}
        {(st?.photoFileIds.length ?? 0) < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={st?.uploading}
            className={`flex w-full items-center justify-center gap-2.5 px-4 text-sm font-semibold transition-colors disabled:opacity-60 ${
              (st?.photoFileIds.length ?? 0) === 0
                ? "bg-navy py-5 text-white hover:bg-navy2"
                : "border border-navy/40 bg-navysoft py-3 text-navy hover:bg-navy hover:text-white"
            }`}
          >
            <IconCamera width={19} height={19} />
            {st?.uploading
              ? "アップロード中..."
              : (st?.photoFileIds.length ?? 0) === 0
                ? "カメラを起動して撮影"
                : "もう1枚撮影する"}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadCapture(item!, f);
            e.target.value = "";
          }}
        />
        {st?.error && <p className="mt-2 text-xs text-alert">{st.error}</p>}
        {(st?.photoFileIds.length ?? 0) === 0 && !st?.uploading && (
          <p className="mt-1.5 text-[11px] leading-4 text-ink3">
            撮影した写真は編集の余地なくそのまま保存されます。ギャラリー選択はできません。
          </p>
        )}
      </div>

      {/* 2. コメント */}
      <div className="mt-4">
        <p className="mk-label mb-2">2. コメントを残す</p>
        <input
          value={st?.note ?? ""}
          onChange={(e) => patch(item!.id, { note: e.target.value })}
          placeholder="例: 異音なし。前回よりベルトの張りやや緩め。"
          className="w-full border border-line2 bg-panel px-3.5 py-3 text-sm outline-none focus:border-navy"
        />
      </div>

      {/* 3. 判定 */}
      <div className="mt-4">
        <p className="mk-label mb-2">3. 状態の判定</p>
        <div className="grid grid-cols-3 gap-1.5">
          {(["ok", "ng", "na"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => patch(item!.id, { result: v })}
              className={`py-3.5 text-sm font-semibold transition-colors ${
                st?.result === v
                  ? v === "ok"
                    ? "bg-ok text-white"
                    : v === "ng"
                      ? "bg-alert text-white"
                      : "bg-ink2 text-white"
                  : "border border-line2 bg-panel text-ink2"
              }`}
            >
              {RESULT_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      {/* ナビ */}
      <div className="mt-5 flex gap-2">
        {idx > 0 && (
          <button
            type="button"
            onClick={() => setIdx((i) => i - 1)}
            className="flex items-center gap-1.5 border border-line2 bg-panel px-4 py-3 text-sm font-medium text-ink2"
          >
            <IconArrowLeft width={15} height={15} />
            戻る
          </button>
        )}
        <button
          type="button"
          disabled={!st?.result || st?.uploading}
          onClick={() => setIdx((i) => i + 1)}
          className="flex flex-1 items-center justify-center gap-1.5 bg-navy px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-navy2 disabled:opacity-40"
        >
          {idx === items.length - 1 ? "確認画面へ" : "次の項目へ"}
          <IconChevronRight width={15} height={15} />
        </button>
      </div>
    </div>
  );
}
