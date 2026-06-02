"use client";

import { useEffect, useState, useCallback } from "react";
import { LineChart } from "@/components/Charts";
import { yen, yenShort, pct, fmtDate } from "@/lib/format";
import type { Snapshot } from "@/lib/types";

export default function TrendsPage() {
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [recording, setRecording] = useState(false);

  const load = useCallback(async () => {
    setSnaps(await fetch("/api/snapshots").then((r) => r.json()));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const record = async () => {
    setRecording(true);
    await fetch("/api/snapshots", { method: "POST" });
    await load();
    setRecording(false);
  };

  const remove = async (id: number) => {
    if (!confirm("この記録を削除しますか？")) return;
    await fetch(`/api/snapshots/${id}`, { method: "DELETE" });
    load();
  };

  const first = snaps[0];
  const last = snaps[snaps.length - 1];
  const totalGrowth =
    first && last && first.total !== 0
      ? ((last.total - first.total) / Math.abs(first.total)) * 100
      : null;

  const reversed = [...snaps].reverse();

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">資産推移</h1>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            純資産のスナップショット履歴
          </p>
        </div>
        <button
          onClick={record}
          disabled={recording}
          className="btn btn-primary disabled:opacity-50"
        >
          {recording ? "記録中..." : "＋ 今日の資産を記録"}
        </button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="現在の純資産" value={last ? yen(last.total) : "—"} />
        <Stat label="記録数" value={`${snaps.length}件`} />
        <Stat
          label="累計成長率"
          value={totalGrowth != null ? pct(totalGrowth) : "—"}
          cls={totalGrowth != null && totalGrowth >= 0 ? "pos" : "neg"}
        />
        <Stat
          label="期間"
          value={
            first && last
              ? `${fmtDate(first.date)}〜`
              : "—"
          }
        />
      </div>

      <div className="card p-5">
        <h2 className="font-bold text-[15px] mb-3">純資産の推移</h2>
        <LineChart
          data={snaps.map((s) => ({ label: fmtDate(s.date), value: s.total }))}
          height={300}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] font-semibold text-[13px] text-[var(--muted)]">
          履歴
        </div>
        {snaps.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted)] text-sm">
            記録がありません。「今日の資産を記録」で最初のスナップショットを作成。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>日付</th>
                  <th className="text-right">純資産</th>
                  <th className="text-right">現物</th>
                  <th className="text-right">株式</th>
                  <th className="text-right">負債</th>
                  <th>メモ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reversed.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium">{fmtDate(s.date)}</td>
                    <td className="text-right font-bold">{yen(s.total)}</td>
                    <td className="text-right text-[var(--muted)]">
                      {yenShort(s.assets_total)}
                    </td>
                    <td className="text-right text-[var(--muted)]">
                      {yenShort(s.stocks_total)}
                    </td>
                    <td className="text-right neg">
                      {s.liabilities_total ? "−" + yenShort(s.liabilities_total) : "—"}
                    </td>
                    <td className="text-[12px] text-[var(--muted)]">
                      {s.note ?? ""}
                    </td>
                    <td className="text-right">
                      <button
                        className="neg hover:opacity-70 px-2"
                        onClick={() => remove(s.id)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  cls = "",
}: {
  label: string;
  value: string;
  cls?: string;
}) {
  return (
    <div className="card p-4">
      <div className="text-[12px] text-[var(--muted)]">{label}</div>
      <div className={`text-lg font-bold mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
