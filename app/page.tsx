"use client";

import { useEffect, useState, useCallback } from "react";
import { LineChart, DonutChart } from "@/components/Charts";
import { yenShort, yen, pct, fmtDate } from "@/lib/format";
import type { Summary } from "@/lib/queries";
import type { Snapshot } from "@/lib/types";

export default function Dashboard() {
  const [sum, setSum] = useState<Summary | null>(null);
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [recording, setRecording] = useState(false);

  const load = useCallback(async () => {
    const [s, sn] = await Promise.all([
      fetch("/api/summary").then((r) => r.json()),
      fetch("/api/snapshots").then((r) => r.json()),
    ]);
    setSum(s);
    setSnaps(sn);
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

  if (!sum) return <div className="text-[var(--muted)]">読み込み中...</div>;

  const plPct =
    sum.stocksCost > 0 ? (sum.stocksPL / sum.stocksCost) * 100 : 0;
  const prev = snaps.length >= 2 ? snaps[snaps.length - 2].total : null;
  const change = prev != null ? sum.netWorth - prev : null;
  const changePct =
    prev && prev !== 0 ? ((sum.netWorth - prev) / Math.abs(prev)) * 100 : null;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">ダッシュボード</h1>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            株式会社FLYHEIT 人生管理システム
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

      {/* 純資産 */}
      <div className="card p-6">
        <div className="text-[13px] text-[var(--muted)]">純資産（Net Worth）</div>
        <div className="text-4xl md:text-5xl font-black mt-1 tracking-tight">
          {yen(sum.netWorth)}
        </div>
        {change != null && (
          <div className="mt-2 text-sm">
            <span className={change >= 0 ? "pos" : "neg"}>
              {change >= 0 ? "▲" : "▼"} {yenShort(Math.abs(change))}
              {changePct != null && ` (${pct(changePct)})`}
            </span>
            <span className="text-[var(--muted)] ml-2">前回記録比</span>
          </div>
        )}
      </div>

      {/* サブ統計 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="現物資産" value={yenShort(sum.assetsTotal)} sub={`${sum.counts.assets}件`} />
        <Stat
          label="株式評価額"
          value={yenShort(sum.stocksTotal)}
          sub={
            <span className={sum.stocksPL >= 0 ? "pos" : "neg"}>
              {yenShort(sum.stocksPL)} ({pct(plPct)})
            </span>
          }
        />
        <Stat label="負債" value={yenShort(sum.liabilitiesTotal)} sub={<span className="neg">マイナス計上</span>} />
        <Stat
          label="案件パイプライン"
          value={yenShort(sum.pipeline.open)}
          sub={`成約済 ${yenShort(sum.pipeline.won)}`}
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* 推移 */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-[15px]">資産推移</h2>
            <span className="text-[11px] text-[var(--muted)]">
              {snaps.length}件の記録
            </span>
          </div>
          <LineChart
            data={snaps.map((s) => ({
              label: fmtDate(s.date),
              value: s.total,
            }))}
          />
          {snaps.length === 0 && (
            <p className="text-[12px] text-[var(--muted)] text-center mt-2">
              「今日の資産を記録」を押すと推移グラフが作られます
            </p>
          )}
        </div>

        {/* 内訳 */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-bold text-[15px] mb-4">資産内訳</h2>
          <DonutChart data={sum.breakdown} />
        </div>
      </div>

      <div className="text-[11px] text-[var(--muted)]">
        為替レート USD/JPY = {sum.usdjpy}（株式管理ページで更新可）
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="text-[12px] text-[var(--muted)]">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
      {sub && <div className="text-[12px] mt-0.5">{sub}</div>}
    </div>
  );
}
