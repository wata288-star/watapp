"use client";

import { useMemo, useRef, useState } from "react";
import { createRecord } from "@/app/actions/karte";
import { classifyMemo } from "@/lib/karte/classify";
import { RECORD_TYPE_LABEL, type RecordType } from "@/lib/karte/types";
import { IconCamera, IconShield, IconX } from "./icons";

const PRESS_CHECKLIST = [
  "クラッチ及びブレーキの機能",
  "クランクシャフト・フライホイールの異常有無",
  "スライド機構・コンロッドのゆるみ",
  "電気系統・非常停止装置の作動",
  "安全装置(光線式)の機能",
  "給油状態・油圧配管の漏れ",
];

const HACCP_CHECKLIST = [
  "分解洗浄の実施",
  "洗浄剤・殺菌剤の規定濃度",
  "すすぎ・乾燥の確認",
  "異物・残渣なし",
  "パッキン・シール類の状態",
];

const FORKLIFT_CHECKLIST = [
  "制動装置・走行装置の機能",
  "油圧装置・荷役装置の機能",
  "ヘッドガード・バックレストの状態",
  "灯火・警報装置の作動",
];

const TYPES: (RecordType | "auto")[] = ["auto", "inspection", "repair", "parts", "legal", "hygiene", "note"];

const inputClass =
  "w-full border border-line2 bg-panel px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-navy";

export function RecordForm({
  machineId,
  machineName,
  legalKind,
  from,
  viaQr = false,
  correctionOf,
  hints = [],
}: {
  machineId: string;
  machineName: string;
  legalKind: "press" | "haccp" | "forklift" | null;
  from: "console" | "m";
  viaQr?: boolean;
  correctionOf?: { id: string; title: string; date: string } | null;
  hints?: string[]; // 査定準備状況で不足している高インパクト項目
}) {
  const [memo, setMemo] = useState("");
  const [typeChoice, setTypeChoice] = useState<RecordType | "auto">("auto");
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [pending, setPending] = useState(false);
  const geoRef = useRef<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_PHOTOS = 6;

  // 撮影即時アップロード: カメラで撮った写真を編集工程を挟まずそのまま送信する
  async function uploadCapture(file: File) {
    setUploading(true);
    setUploadError(null);
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
      setPhotoIds((ids) => [...ids, data.fileId].slice(0, MAX_PHOTOS));
    } catch {
      setUploadError("アップロードに失敗しました。電波状況を確認して撮り直してください。");
    }
    setUploading(false);
  }

  const suggestion = useMemo(() => (memo.trim() ? classifyMemo(memo) : null), [memo]);
  const resolvedType: RecordType = typeChoice === "auto" ? (suggestion?.type ?? "note") : typeChoice;

  const checklist =
    resolvedType === "legal" && legalKind === "press"
      ? PRESS_CHECKLIST
      : resolvedType === "legal" && legalKind === "forklift"
        ? FORKLIFT_CHECKLIST
        : resolvedType === "hygiene"
          ? HACCP_CHECKLIST
          : null;

  return (
    <form action={createRecord} onSubmit={() => setPending(true)} className="space-y-6">
      <input type="hidden" name="machineId" value={machineId} />
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="type" value={typeChoice} />
      <input type="hidden" name="viaQr" value={viaQr ? "1" : "0"} />
      <input type="hidden" name="photoIds" value={JSON.stringify(photoIds)} />
      {correctionOf && <input type="hidden" name="correctionOf" value={correctionOf.id} />}

      {correctionOf && (
        <p className="border border-copper/30 bg-coppersoft px-4 py-3 text-[13px] leading-6 text-copper">
          この記録は「{correctionOf.title}({correctionOf.date})」の訂正記録として追加されます。
          過去の記録は書き換えられず、両方が履歴に残ります。
        </p>
      )}

      {/* 現場写真 — アプリ内カメラ限定・撮影即時アップロード(複数可) */}
      <div>
        <p className="mk-label mb-2">
          現場写真(アプリ内カメラ)
          <span className="ml-2 font-normal normal-case tracking-normal text-ink3">
            複数枚可(最大{MAX_PHOTOS}枚)
          </span>
        </p>
        {photoIds.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {photoIds.map((fid, i) => (
              <div key={fid} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/karte/files/${fid}`}
                  alt={`現場写真 ${i + 1}`}
                  className="h-16 w-16 border border-ok/40 object-cover"
                />
                <span className="absolute bottom-0 right-0 bg-ok px-1 text-[9px] font-semibold text-white">
                  {i + 1}
                </span>
              </div>
            ))}
            <p className="text-xs font-medium text-ok">
              {photoIds.length}枚を撮影即時アップロード済み
            </p>
          </div>
        )}
        {photoIds.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`flex w-full flex-col items-center justify-center gap-1.5 px-4 text-center transition-colors disabled:opacity-60 ${
              photoIds.length === 0
                ? "border border-dashed border-line2 bg-panel2 py-7 hover:border-navy"
                : "border border-navy/40 bg-navysoft py-3 hover:bg-navy [&:hover_*]:text-white"
            }`}
          >
            <span className={`flex items-center gap-2 text-sm font-medium ${photoIds.length === 0 ? "text-ink2" : "text-navy"}`}>
              <IconCamera width={20} height={20} className={photoIds.length === 0 ? "text-ink3" : "text-navy"} />
              {uploading
                ? "アップロード中..."
                : photoIds.length === 0
                  ? "カメラで撮影する"
                  : "もう1枚撮影する"}
            </span>
            {photoIds.length === 0 && (
              <span className="text-xs text-ink3">
                撮影した瞬間にそのまま保存されます。ギャラリー選択・編集はできません(改ざん防止)
              </span>
            )}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadCapture(file);
            e.target.value = "";
          }}
        />
        {uploadError && <p className="mt-2 text-xs text-alert">{uploadError}</p>}
      </div>

      {/* 記録の狙いどころ(査定準備状況で不足している項目) */}
      {hints.length > 0 && !correctionOf && (
        <div className="border border-line bg-panel px-4 py-3.5">
          <p className="mk-label mb-1.5">記録の狙いどころ</p>
          <p className="text-xs leading-5 text-ink3">
            査定で重視されるうち、この機械でまだ記録が薄い項目です。写真と一言で残しておくと売却時に効きます。
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {hints.map((h) => (
              <li key={h} className="border border-copper/30 bg-coppersoft px-2.5 py-1 text-xs font-medium text-copper">
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 一言メモ */}
      <div>
        <label htmlFor="memo" className="mk-label mb-2 block">
          一言メモ
        </label>
        <textarea
          id="memo"
          name="memo"
          rows={3}
          required
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="例: 潤滑油を補充、漏れなし。異音なし。"
          className={inputClass}
        />
        {suggestion && typeChoice === "auto" && (
          <p className="mt-2 border border-navy/20 bg-navysoft px-3.5 py-2.5 text-xs leading-5 text-navy">
            自動分類: <span className="font-medium">{RECORD_TYPE_LABEL[suggestion.type]}</span> /
            表題案「{suggestion.title}」として整形されます。
            {suggestion.confidence === "low" && " 判定の確度が低いため、必要に応じて種別を選択してください。"}
          </p>
        )}
      </div>

      {/* 種別 */}
      <div>
        <p className="mk-label mb-2">記録の種別</p>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeChoice(t)}
              className={`px-3 py-1.5 text-[13px] transition-colors ${
                typeChoice === t
                  ? "bg-navy font-medium text-white"
                  : "border border-line2 bg-panel text-ink2 hover:border-navy"
              }`}
            >
              {t === "auto" ? "自動判定" : RECORD_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* テンプレート チェックリスト */}
      {checklist && (
        <div className="border border-line bg-panel p-5">
          <p className="text-sm font-semibold">
            {resolvedType === "hygiene" ? "衛生管理チェック(HACCP)" : "検査項目チェック"}
          </p>
          <p className="mt-1 text-xs text-ink3">
            {resolvedType === "hygiene"
              ? "衛生管理計画に基づく確認項目です。"
              : "法定の検査項目テンプレートです。結果を選択してください。"}
          </p>
          <ul className="mt-4 space-y-3">
            {checklist.map((item) => (
              <li key={item} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-ink2">{item}</span>
                <span className="flex gap-1">
                  {(["ok", "ng", "na"] as const).map((v) => (
                    <label
                      key={v}
                      className="cursor-pointer border border-line2 px-2.5 py-1 text-xs text-ink2 transition-colors has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-white"
                    >
                      <input type="radio" name={`check_${item}`} value={v} defaultChecked={v === "ok"} className="sr-only" />
                      {v === "ok" ? "良" : v === "ng" ? "否" : "対象外"}
                    </label>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 追記専用の説明 */}
      <div className="flex items-start gap-3 border border-line bg-panel2 px-4 py-3">
        <IconShield width={17} height={17} className="mt-0.5 shrink-0 text-navy" />
        <p className="text-xs leading-5 text-ink2">
          作業日・登録日時はサーバー側で自動記録されます。保存した記録の編集・削除はできません。
          誤りがあった場合は、その記録の「訂正記録を追加」から訂正してください。
        </p>
      </div>

      {/* 詳細 */}
      <div>
        <button
          type="button"
          onClick={() => setShowDetail((s) => !s)}
          className="flex items-center gap-2 text-sm text-ink2 underline underline-offset-4"
        >
          {showDetail ? <IconX width={14} height={14} /> : null}
          {showDetail ? "詳細項目を閉じる" : "詳細項目(表題・費用・業者)を開く"}
        </button>
        {showDetail && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mk-label mb-1.5 block">表題(空欄なら自動生成)</span>
              <input name="title" placeholder={suggestion?.title ?? "日常点検"} className={inputClass} />
            </label>
            <label className="block">
              <span className="mk-label mb-1.5 block">費用(円)</span>
              <input name="cost" inputMode="numeric" placeholder="0" className={inputClass} />
            </label>
            <label className="block">
              <span className="mk-label mb-1.5 block">実施業者(外部委託の場合)</span>
              <input name="vendor" placeholder="メーカーサービス等" className={inputClass} />
            </label>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || uploading || !memo.trim()}
        className="w-full bg-navy px-4 py-3.5 text-sm font-medium text-white transition-colors hover:bg-navy2 disabled:opacity-50"
      >
        {pending ? "保存中..." : `${machineName} に記録を保存する`}
      </button>
    </form>
  );
}
