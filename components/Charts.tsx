"use client";

import { useState } from "react";
import { yenShort } from "@/lib/format";

const PALETTE = [
  "#5b8cff",
  "#22c55e",
  "#f59e0b",
  "#a78bfa",
  "#f87171",
  "#2dd4bf",
  "#fb7185",
  "#60a5fa",
  "#facc15",
  "#94a3b8",
];

export function color(i: number) {
  return PALETTE[i % PALETTE.length];
}

/** 折れ線（資産推移） */
export function LineChart({
  data,
  height = 240,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = height;
  const padX = 8;
  const padY = 24;

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[var(--muted)] text-sm"
        style={{ height }}
      >
        データがありません
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const n = data.length;

  const x = (i: number) =>
    n === 1 ? W / 2 : padX + (i * (W - padX * 2)) / (n - 1);
  const y = (v: number) =>
    padY + (1 - (v - min) / range) * (H - padY * 2);

  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const area = `${padX},${H - padY} ${pts} ${x(n - 1)},${H - padY}`;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="lc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b8cff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#5b8cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((g) => (
          <line
            key={g}
            x1={padX}
            x2={W - padX}
            y1={padY + g * (H - padY * 2)}
            y2={padY + g * (H - padY * 2)}
            stroke="#243049"
            strokeWidth={1}
          />
        ))}
        <polygon points={area} fill="url(#lc)" />
        <polyline
          points={pts}
          fill="none"
          stroke="#5b8cff"
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={x(i)}
              cy={y(d.value)}
              r={hover === i ? 5 : 3}
              fill="#5b8cff"
              stroke="#0b0f1a"
              strokeWidth={2}
            />
            <rect
              x={x(i) - (W - padX * 2) / n / 2}
              y={0}
              width={(W - padX * 2) / n}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-[var(--panel-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs pointer-events-none">
          <span className="text-[var(--muted)]">{data[hover].label}</span>{" "}
          <span className="font-bold">{yenShort(data[hover].value)}</span>
        </div>
      )}
    </div>
  );
}

/** 月次の収入/支出グループ棒グラフ */
export function BarChart({
  data,
  height = 220,
}: {
  data: { label: string; income: number; expense: number }[];
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[var(--muted)] text-sm"
        style={{ height }}
      >
        データがありません
      </div>
    );
  }
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  return (
    <div>
      <div className="flex items-end gap-3" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="flex items-end gap-1 w-full justify-center h-full">
              <div
                className="w-1/2 max-w-[22px] rounded-t"
                style={{
                  height: `${(d.income / max) * 100}%`,
                  background: "#22c55e",
                }}
                title={`収入 ${Math.round(d.income).toLocaleString()}`}
              />
              <div
                className="w-1/2 max-w-[22px] rounded-t"
                style={{
                  height: `${(d.expense / max) * 100}%`,
                  background: "#f87171",
                }}
                title={`支出 ${Math.round(d.expense).toLocaleString()}`}
              />
            </div>
            <span className="text-[10px] text-[var(--muted)] truncate w-full text-center">
              {d.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 justify-center mt-3 text-[12px] text-[var(--muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#22c55e" }} />
          収入
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#f87171" }} />
          支出
        </span>
      </div>
    </div>
  );
}

/** ドーナツ（資産内訳） */
export function DonutChart({
  data,
  size = 180,
}: {
  data: { label: string; value: number }[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) {
    return (
      <div
        className="flex items-center justify-center text-[var(--muted)] text-sm"
        style={{ height: size }}
      >
        データがありません
      </div>
    );
  }
  const r = size / 2;
  const stroke = size * 0.16;
  const radius = r - stroke / 2;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${r} ${r})`}>
          {data.map((d, i) => {
            const frac = d.value / total;
            const dash = frac * circ;
            const seg = (
              <circle
                key={i}
                cx={r}
                cy={r}
                r={radius}
                fill="none"
                stroke={color(i)}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return seg;
          })}
        </g>
        <text
          x={r}
          y={r - 4}
          textAnchor="middle"
          fill="#8a97b3"
          fontSize="11"
        >
          合計
        </text>
        <text
          x={r}
          y={r + 14}
          textAnchor="middle"
          fill="#e6ecf7"
          fontSize="14"
          fontWeight="700"
        >
          {yenShort(total)}
        </text>
      </svg>
      <div className="flex-1 min-w-[140px] space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-[13px]">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: color(i) }}
            />
            <span className="flex-1 text-[var(--muted)]">{d.label}</span>
            <span className="font-medium">{yenShort(d.value)}</span>
            <span className="text-[var(--muted)] w-10 text-right">
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
