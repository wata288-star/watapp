"use client";

// ガントチャート
// 部門ごとにグループ化し、進捗・マイルストーン・依存関係・本日ラインを表示する。

import { useMemo, useState } from "react";
import type { Dept, PmTask } from "@/lib/pm/types";
import { DEPTS, TASK_STATUSES } from "@/lib/pm/types";
import { addDays, diffDays, parseDate, shortDate, toDateStr, today } from "../_lib/format";

export type GanttScale = "day" | "week" | "month";

const LABEL_W = 268;

interface Tick {
  key: string;
  label: string;
  start: string;
  days: number;
  weekend: boolean;
  isToday: boolean;
}

function buildTicks(from: string, to: string, scale: GanttScale): Tick[] {
  const ticks: Tick[] = [];
  const t = today();

  if (scale === "day") {
    for (let cur = from; diffDays(cur, to) >= 0; cur = addDays(cur, 1)) {
      const d = parseDate(cur);
      ticks.push({
        key: cur,
        label: `${d.getDate()}`,
        start: cur,
        days: 1,
        weekend: d.getDay() === 0 || d.getDay() === 6,
        isToday: cur === t,
      });
    }
    return ticks;
  }

  if (scale === "week") {
    // 月曜始まり
    const first = parseDate(from);
    first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    for (let cur = toDateStr(first); diffDays(cur, to) >= 0; cur = addDays(cur, 7)) {
      const d = parseDate(cur);
      ticks.push({
        key: cur,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        start: cur,
        days: 7,
        weekend: false,
        isToday: diffDays(cur, t) >= 0 && diffDays(cur, t) < 7,
      });
    }
    return ticks;
  }

  const first = parseDate(from);
  first.setDate(1);
  let cur = toDateStr(first);
  while (diffDays(cur, to) >= 0) {
    const d = parseDate(cur);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    ticks.push({
      key: cur,
      label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
      start: cur,
      days: daysInMonth,
      weekend: false,
      isToday: t.slice(0, 7) === cur.slice(0, 7),
    });
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    cur = toDateStr(next);
  }
  return ticks;
}

const TICK_PX: Record<GanttScale, number> = { day: 30, week: 62, month: 128 };

export function Gantt({
  tasks,
  scale = "week",
  onSelect,
  depts,
}: {
  tasks: PmTask[];
  scale?: GanttScale;
  onSelect?: (task: PmTask) => void;
  depts?: Dept[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const { ticks, pxPerDay, totalW } = useMemo(() => {
    if (tasks.length === 0) {
      return { ticks: [] as Tick[], pxPerDay: 0, totalW: 0 };
    }
    const starts = tasks.map((x) => x.start).filter(Boolean).sort();
    const ends = tasks.map((x) => x.end).filter(Boolean).sort();
    const rawFrom = addDays(starts[0] || today(), -3);
    const rawTo = addDays(ends[ends.length - 1] || today(), 5);
    const built = buildTicks(rawFrom, rawTo, scale);
    const tickW = TICK_PX[scale];
    const px = tickW / (scale === "day" ? 1 : built[0]?.days || 7);
    return {
      ticks: built,
      // 月スケールは月ごとに日数が違うため、日→px はティック単位で計算する
      pxPerDay: px,
      totalW: built.reduce((sum, t) => sum + (scale === "month" ? (t.days * tickW) / 30.4 : tickW), 0),
    };
  }, [tasks, scale]);

  /** 日付 → 左端からの px */
  const xOf = (date: string): number => {
    if (ticks.length === 0) return 0;
    let x = 0;
    for (const t of ticks) {
      const offset = diffDays(t.start, date);
      const tickW = scale === "month" ? (t.days * TICK_PX.month) / 30.4 : TICK_PX[scale];
      if (offset < t.days) {
        return x + Math.max(0, (offset / t.days) * tickW);
      }
      x += tickW;
    }
    return x;
  };

  const groups = useMemo(() => {
    const order = depts ?? DEPTS.map((d) => d.id);
    return order
      .map((id) => ({
        dept: DEPTS.find((d) => d.id === id)!,
        items: tasks
          .filter((t) => t.dept === id)
          .sort((a, b) => a.start.localeCompare(b.start)),
      }))
      .filter((g) => g.items.length > 0);
  }, [tasks, depts]);

  if (tasks.length === 0) {
    return <div className="pm-empty">表示できるタスクがありません。</div>;
  }

  const todayX = xOf(today());
  const tickWidthStyle = { ["--tick-w" as string]: `${TICK_PX[scale]}px` } as React.CSSProperties;

  return (
    <div className="pm-gantt">
      <div className="pm-gantt-scroll">
        <div className="pm-gantt-inner" style={{ width: LABEL_W + totalW, position: "relative" }}>
          {/* ヘッダー */}
          <div className="pm-gantt-row header" style={tickWidthStyle}>
            <div className="pm-gantt-label">
              <span className="pm-gantt-label-text pm-muted" style={{ fontSize: 10.5, letterSpacing: "0.1em" }}>
                タスク / 部門
              </span>
            </div>
            <div className="pm-gantt-track">
              {ticks.map((t) => (
                <div
                  key={t.key}
                  className={`pm-gantt-tick ${t.weekend ? "weekend" : ""} ${t.isToday ? "today" : ""}`}
                  style={{
                    flex: `0 0 ${scale === "month" ? (t.days * TICK_PX.month) / 30.4 : TICK_PX[scale]}px`,
                  }}
                >
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          {groups.map((g) => {
            const avg =
              g.items.reduce((s, t) => s + t.progress, 0) / Math.max(1, g.items.length);
            return (
              <div key={g.dept.id}>
                {/* 部門行 */}
                <div className="pm-gantt-row group" style={tickWidthStyle}>
                  <div className="pm-gantt-label">
                    <span className="pm-dot" style={{ background: g.dept.color }} />
                    <span className="pm-gantt-label-text">{g.dept.label}</span>
                    <span className="pm-mono pm-muted" style={{ fontSize: 10.5 }}>
                      {Math.round(avg)}%
                    </span>
                  </div>
                  <div className="pm-gantt-track" style={{ position: "relative" }}>
                    {ticks.map((t) => (
                      <div
                        key={t.key}
                        className={`pm-gantt-tick ${t.isToday ? "today" : ""}`}
                        style={{
                          flex: `0 0 ${scale === "month" ? (t.days * TICK_PX.month) / 30.4 : TICK_PX[scale]}px`,
                        }}
                      />
                    ))}
                    {/* 部門のサマリーバー */}
                    {(() => {
                      const s = g.items.map((t) => t.start).sort()[0];
                      const e = g.items.map((t) => t.end).sort().reverse()[0];
                      const left = xOf(s);
                      const width = Math.max(4, xOf(e) - left + pxPerDay);
                      return (
                        <div
                          style={{
                            position: "absolute",
                            left,
                            width,
                            top: 14,
                            height: 4,
                            borderRadius: 3,
                            background: `${g.dept.color}55`,
                          }}
                        />
                      );
                    })()}
                  </div>
                </div>

                {/* タスク行 */}
                {g.items.map((t) => {
                  const left = xOf(t.start);
                  const width = Math.max(
                    scale === "day" ? TICK_PX.day : 10,
                    xOf(t.end) - left + (scale === "month" ? 4 : TICK_PX[scale] / (scale === "week" ? 7 : 1)),
                  );
                  const status = TASK_STATUSES.find((s) => s.id === t.status)!;
                  const overdue = t.status !== "done" && diffDays(today(), t.end) < 0;
                  const barColor = t.status === "done" ? "#3f5f52" : overdue ? "#8a3a2c" : g.dept.color;

                  return (
                    <div
                      key={t.id}
                      className="pm-gantt-row"
                      style={tickWidthStyle}
                      onMouseEnter={() => setHovered(t.id)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div className="pm-gantt-label" style={{ paddingLeft: 24 }}>
                        <span className="pm-dot" style={{ background: status.color }} />
                        <span
                          className="pm-gantt-label-text"
                          style={{ cursor: onSelect ? "pointer" : undefined }}
                          onClick={() => onSelect?.(t)}
                          title={t.title}
                        >
                          {t.isMilestone && "◆ "}
                          {t.title}
                        </span>
                      </div>
                      <div className="pm-gantt-track" style={{ position: "relative" }}>
                        {ticks.map((tk) => (
                          <div
                            key={tk.key}
                            className={`pm-gantt-tick ${tk.weekend ? "weekend" : ""} ${tk.isToday ? "today" : ""}`}
                            style={{
                              flex: `0 0 ${scale === "month" ? (tk.days * TICK_PX.month) / 30.4 : TICK_PX[scale]}px`,
                            }}
                          />
                        ))}

                        {t.isMilestone ? (
                          <div
                            className="pm-gantt-milestone"
                            style={{ left: left - 8, background: g.dept.color }}
                            title={`${t.title}（${shortDate(t.end)}）`}
                            onClick={() => onSelect?.(t)}
                          />
                        ) : (
                          <div
                            className="pm-gantt-bar"
                            style={{
                              left,
                              width,
                              background: barColor,
                              opacity: hovered === t.id ? 1 : 0.92,
                            }}
                            onClick={() => onSelect?.(t)}
                            title={`${t.title}\n${shortDate(t.start)} 〜 ${shortDate(t.end)}\n進捗 ${t.progress}% / 担当 ${t.owner}`}
                          >
                            <div className="pm-gantt-bar-fill" style={{ width: `${t.progress}%` }} />
                            <span className="pm-gantt-bar-text">
                              {t.progress}%{overdue ? " ⚠" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* 本日ライン */}
          <div
            className="pm-gantt-today-line"
            style={{ left: LABEL_W + todayX }}
          />
        </div>
      </div>
    </div>
  );
}
