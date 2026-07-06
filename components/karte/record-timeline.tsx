"use client";

import { useState } from "react";
import Link from "next/link";
import type { MaintRecord } from "@/lib/karte/types";
import { TypeBadge } from "./ui";

function fmtDate(isoDate: string): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

function fmtYen(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export function RecordTimeline({
  records,
  initialCount = 15,
  dense = false,
  correctionBase,
}: {
  records: MaintRecord[];
  initialCount?: number;
  dense?: boolean;
  correctionBase?: string; // 訂正記録の作成ページ(追記専用設計)
}) {
  const [count, setCount] = useState(initialCount);
  const visible = records.slice(0, count);
  const byId = new Map(records.map((r) => [r.id, r]));

  if (records.length === 0) {
    return (
      <div className="border border-dashed border-line2 bg-panel2 px-6 py-12 text-center text-sm text-ink3">
        まだ記録がありません。最初の記録を追加してください。
      </div>
    );
  }

  return (
    <div>
      <ol className="divide-y divide-line border border-line bg-panel">
        {visible.map((r) => {
          const corrected = r.correctionOf ? byId.get(r.correctionOf) : undefined;
          return (
            <li key={r.id} className={dense ? "px-4 py-3.5" : "px-5 py-4"}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <time className="font-mono text-xs text-ink3 mk-tabular">{fmtDate(r.workDate)}</time>
                <TypeBadge type={r.type} />
                <span className="text-sm font-medium">{r.title}</span>
                {r.correctionOf && (
                  <span className="border border-copper/30 bg-coppersoft px-1.5 text-[10px] font-medium tracking-wider text-copper">
                    訂正記録
                  </span>
                )}
                {r.migrated && (
                  <span className="border border-line2 bg-panel2 px-1.5 text-[10px] font-medium tracking-wider text-ink3">
                    移行データ
                  </span>
                )}
                {r.autoClassified && <span className="text-[10px] tracking-wider text-ink3">自動分類</span>}
              </div>
              {corrected && (
                <p className="mt-1 text-[11px] text-copper">
                  {fmtDate(corrected.workDate)}の「{corrected.title}」に対する訂正
                </p>
              )}
              {r.memo && <p className="mt-1.5 text-[13px] leading-6 text-ink2">{r.memo}</p>}

              {r.structured && (r.structured.symptom || r.structured.cause || r.structured.action) && (
                <dl className="mt-2.5 space-y-1 border-l-2 border-line pl-3.5 text-xs leading-5">
                  {r.structured.symptom && (
                    <div className="flex gap-2">
                      <dt className="w-8 shrink-0 text-ink3">状況</dt>
                      <dd className="text-ink2">{r.structured.symptom}</dd>
                    </div>
                  )}
                  {r.structured.cause && (
                    <div className="flex gap-2">
                      <dt className="w-8 shrink-0 text-ink3">原因</dt>
                      <dd className="text-ink2">{r.structured.cause}</dd>
                    </div>
                  )}
                  {r.structured.action && (
                    <div className="flex gap-2">
                      <dt className="w-8 shrink-0 text-ink3">処置</dt>
                      <dd className="text-ink2">{r.structured.action}</dd>
                    </div>
                  )}
                </dl>
              )}

              {r.items && r.items.length > 0 && (
                <ul className="mt-2.5 divide-y divide-line border border-line bg-panel2">
                  {r.items.map((x) => {
                    const photos = x.photoFileIds ?? (x.photoFileId ? [x.photoFileId] : []);
                    return (
                      <li key={x.itemId} className="flex items-center gap-3 px-3 py-2 text-xs leading-5">
                        {photos.length > 0 ? (
                          <span className="flex shrink-0 gap-1">
                            {photos.map((fid) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={fid}
                                src={`/api/karte/files/${fid}`}
                                alt={x.label}
                                className="h-9 w-9 border border-line object-cover"
                              />
                            ))}
                          </span>
                        ) : (
                          <span className="h-9 w-9 shrink-0 border border-dashed border-line" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-ink">{x.label}</span>
                          {x.note && <span className="block text-ink3">{x.note}</span>}
                        </span>
                        <span
                          className={`shrink-0 font-semibold ${
                            x.result === "ok" ? "text-ok" : x.result === "ng" ? "text-alert" : "text-ink3"
                          }`}
                        >
                          {x.result === "ok" ? "良" : x.result === "ng" ? "否" : "対象外"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {r.checklist && r.checklist.length > 0 && (
                <ul className="mt-2.5 grid gap-x-6 gap-y-1 text-xs leading-5 sm:grid-cols-2">
                  {r.checklist.map((c) => (
                    <li key={c.label} className="flex items-center justify-between gap-3">
                      <span className="text-ink2">{c.label}</span>
                      <span
                        className={
                          c.result === "ok"
                            ? "shrink-0 font-medium text-ok"
                            : c.result === "ng"
                              ? "shrink-0 font-medium text-alert"
                              : "shrink-0 text-ink3"
                        }
                      >
                        {c.result === "ok" ? "良" : c.result === "ng" ? "否" : "対象外"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {r.parts && r.parts.length > 0 && (
                <p className="mt-2 text-xs text-ink2">
                  <span className="text-ink3">交換部品: </span>
                  {r.parts.map((p) => `${p.name} × ${p.qty}`).join("、")}
                </p>
              )}

              {r.photoFileIds.length > 0 && (
                <div className="mt-2.5 flex gap-2">
                  {r.photoFileIds.map((fid) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={fid}
                      src={`/api/karte/files/${fid}`}
                      alt="現場写真"
                      className="h-16 w-16 border border-line object-cover"
                    />
                  ))}
                </div>
              )}

              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink3">
                {r.vendor && <span>実施: {r.vendor}</span>}
                {r.cost != null && r.cost > 0 && <span className="mk-tabular">費用 {fmtYen(r.cost)}</span>}
                {r.downtimeHours != null && <span className="mk-tabular">停止 {r.downtimeHours}時間</span>}
                {r.capture && (
                  <span className="text-ok">
                    撮影検証: アプリ内カメラ
                    {r.capture.geo ? "・位置" : ""}
                    {r.capture.viaQr ? "・QR起点" : ""}
                  </span>
                )}
                <span className="mk-tabular">
                  {r.migrated ? "移行登録" : "登録"} {fmtDate(r.createdAt)}
                </span>
                {correctionBase && !r.migrated && (
                  <Link
                    href={`${correctionBase}?correct=${r.id}`}
                    className="ml-auto text-copper underline underline-offset-4"
                  >
                    訂正記録を追加
                  </Link>
                )}
              </p>
            </li>
          );
        })}
      </ol>
      {records.length > count && (
        <button
          type="button"
          onClick={() => setCount((c) => c + 30)}
          className="mt-3 w-full border border-line bg-panel py-2.5 text-sm text-ink2 transition-colors hover:border-navy hover:text-navy"
        >
          さらに表示(残り{records.length - count}件)
        </button>
      )}
    </div>
  );
}
