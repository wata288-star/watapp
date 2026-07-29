"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  IconCamera,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconPlus,
  IconRecord,
} from "../components/icons";
import type { MaintRecord } from "../lib/data";

const filters = ["すべて", "未完了", "トラブル対応", "点検"] as const;

const statusLabel: Record<MaintRecord["status"], { text: string; cls: string }> = {
  done: { text: "完了", cls: "tm-badge--green" },
  shared: { text: "メーカー共有済み", cls: "tm-badge--blue" },
  draft: { text: "未完了", cls: "tm-badge--amber" },
};

export default function RecordList({ records }: { records: MaintRecord[] }) {
  const params = useSearchParams();
  const [filter, setFilter] = useState<string>("すべて");
  const [toast, setToast] = useState(params.get("saved") === "1");

  const list = records.filter((r) => {
    if (filter === "すべて") return true;
    if (filter === "未完了") return r.status === "draft";
    return r.kind === filter;
  });

  return (
    <>
      <div className="tm-scroll">
        {toast ? (
          <div className="tm-toast tm-anim" role="status">
            <IconCheck size={20} />
            対応記録を保存しました（#2026-015）
            <button type="button" onClick={() => setToast(false)}>
              閉じる
            </button>
          </div>
        ) : null}

        <div className="tm-pad">
          <div className="tm-chiprow">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                className="tm-chip tm-chip--sm"
                data-on={f === filter}
                onClick={() => setFilter(f)}
              >
                {f}
                {f === "未完了" ? (
                  <i className="tm-chip__count">
                    {records.filter((r) => r.status === "draft").length}
                  </i>
                ) : null}
              </button>
            ))}
          </div>

          <div className="tm-section-label">
            <span>対応記録</span>
            <span>{list.length}件</span>
          </div>

          {list.length === 0 ? (
            <div className="tm-empty">
              <IconRecord size={44} />
              <b>該当する記録がありません</b>
              <p>条件を変えるか、新しく起票してください。</p>
            </div>
          ) : (
            <div className="tm-stack">
              {list.map((r) => {
                const s = statusLabel[r.status];
                return (
                  <Link key={r.id} href={`/tomarun/records/${r.id}`} className="tm-reccard">
                    <div className="tm-reccard__top">
                      <span className={`tm-badge ${s.cls}`}>{s.text}</span>
                      <span className="tm-reccard__id">#{r.id}</span>
                    </div>
                    <b className="tm-reccard__title">
                      {r.title || "（本文未入力）"}
                    </b>
                    <div className="tm-reccard__meta">
                      <span>{r.machineName}</span>
                      <span>{r.occurredAt}</span>
                    </div>
                    <div className="tm-reccard__foot">
                      <span className="tm-badge tm-badge--gray">{r.kind}</span>
                      {r.cause !== "―" && r.cause !== "未分類" ? (
                        <span className="tm-badge tm-badge--gray">{r.cause}</span>
                      ) : null}
                      {r.downtimeMin ? (
                        <span className="tm-reccard__stat">
                          <IconClock size={14} />
                          停止 {r.downtimeMin}分
                        </span>
                      ) : null}
                      {r.photos > 0 ? (
                        <span className="tm-reccard__stat">
                          <IconCamera size={14} />
                          {r.photos}
                        </span>
                      ) : null}
                      <IconChevronRight className="tm-row__chev" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Link href="/tomarun/records/new" className="tm-fab">
        <IconPlus />
        記録する
      </Link>
    </>
  );
}
