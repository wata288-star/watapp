"use client";

// ダッシュボード：事業全体の状況をひと目で把握する画面

import Link from "next/link";
import { useMemo } from "react";
import { DEALS_HELPERS } from "./_lib/derive";
import { usePm } from "./_lib/store";
import { BarList, Card, Progress, Stat } from "./_components/ui";
import { DEPTS, DEAL_STAGES, TASK_STATUSES } from "@/lib/pm/types";
import { diffDays, dueLabel, manYen, num, relativeTime, shortDate, today } from "./_lib/format";

export default function DashboardPage() {
  const { state } = usePm();

  const d = useMemo(() => {
    if (!state) return null;
    const t = today();
    const open = state.deals.filter((x) => !["won", "lost"].includes(x.stage));
    const won = state.deals.filter((x) => x.stage === "won");

    const weighted = open.reduce((s, x) => s + DEALS_HELPERS.weightedValue(x), 0);
    const pipeline = open.reduce((s, x) => s + DEALS_HELPERS.firstYearValue(x), 0);
    const wonArr = won.reduce((s, x) => s + DEALS_HELPERS.monthly(x) * 12, 0);

    const overdue = state.tasks.filter((x) => x.status !== "done" && x.end && diffDays(t, x.end) < 0);
    const dueSoon = state.tasks.filter(
      (x) => x.status !== "done" && x.end && diffDays(t, x.end) >= 0 && diffDays(t, x.end) <= 7,
    );
    const actions = [...state.deals]
      .filter((x) => !["won", "lost"].includes(x.stage) && x.nextActionDate)
      .sort((a, b) => a.nextActionDate.localeCompare(b.nextActionDate))
      .slice(0, 6);

    const deptProgress = DEPTS.map((dept) => {
      const items = state.tasks.filter((x) => x.dept === dept.id);
      const done = items.filter((x) => x.status === "done").length;
      const avg = items.length
        ? items.reduce((s, x) => s + x.progress, 0) / items.length
        : 0;
      return { ...dept, total: items.length, done, avg };
    }).filter((x) => x.total > 0);

    const stageBars = DEAL_STAGES.filter((s) => !["won", "lost"].includes(s.id)).map((s) => ({
      label: s.label,
      value: state.deals
        .filter((x) => x.stage === s.id)
        .reduce((sum, x) => sum + DEALS_HELPERS.firstYearValue(x), 0),
      color: s.color,
      sub: `${state.deals.filter((x) => x.stage === s.id).length}件`,
    }));

    const topNews = [...state.news]
      .sort((a, b) => b.score - a.score || b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, 5);

    const risks = state.notes.filter((n) => n.type === "risk" && n.status !== "closed");

    const nextExpo = [...state.expos]
      .filter((x) => x.status !== "done" && x.status !== "cancelled")
      .sort((a, b) => a.start.localeCompare(b.start))[0];

    const expoChecklistDone = nextExpo
      ? nextExpo.checklist.filter((c) => c.done).length
      : 0;

    return {
      open, won, weighted, pipeline, wonArr, overdue, dueSoon, actions,
      deptProgress, stageBars, topNews, risks, nextExpo, expoChecklistDone,
    };
  }, [state]);

  if (!state || !d) return null;

  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter((x) => x.status === "done").length;

  return (
    <>
      {/* --------------------------------------------------- KPI */}
      <div className="pm-grid cols-5">
        <Stat
          label="加重パイプライン"
          tone="gold"
          icon="◧"
          value={manYen(d.weighted)}
          sub={`商談 ${d.open.length}件・総額 ${manYen(d.pipeline)}（初年度）`}
        />
        <Stat
          label="受注済み ARR"
          tone="green"
          icon="✓"
          value={manYen(d.wonArr)}
          sub={`受注 ${d.won.length}社`}
        />
        <Stat
          label="タスク進捗"
          tone="cyan"
          icon="☑"
          value={`${Math.round((doneTasks / Math.max(1, totalTasks)) * 100)}`}
          unit="%"
          sub={`${doneTasks} / ${totalTasks} 完了`}
        />
        <Stat
          label="期限超過タスク"
          tone={d.overdue.length > 0 ? "red" : ""}
          icon="⚠"
          value={num(d.overdue.length)}
          unit="件"
          sub={`今週締切 ${d.dueSoon.length}件`}
        />
        <Stat
          label="未対応の重要ニュース"
          icon="◇"
          value={num(state.news.filter((n) => !n.read && n.score >= 60).length)}
          unit="件"
          sub={
            state.newsMeta.lastFetchedAt
              ? `最終取得 ${relativeTime(state.newsMeta.lastFetchedAt)}`
              : "未取得（ニュース画面で取得）"
          }
        />
      </div>

      {/* --------------------------------------------------- 今日やること */}
      <div className="pm-grid cols-2" style={{ marginTop: 14 }}>
        <Card
          title="⚑ 直近のアクション（商談）"
          actions={<Link href="/pm/deals" className="pm-btn sm ghost">一覧へ</Link>}
        >
          {d.actions.length === 0 && <div className="pm-empty">予定されたアクションはありません。</div>}
          {d.actions.map((deal) => {
            const due = dueLabel(deal.nextActionDate);
            const stage = DEAL_STAGES.find((s) => s.id === deal.stage)!;
            return (
              <div
                key={deal.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--pm-line-soft)",
                }}
              >
                <span className="pm-dot" style={{ background: stage.color, marginTop: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{deal.company}</div>
                  <div className="pm-muted pm-clamp2" style={{ fontSize: 11.5 }}>
                    {deal.nextAction || "次アクション未設定"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }} className="pm-nowrap">
                  <div
                    style={{ fontSize: 11 }}
                    className={due.tone === "over" ? "pm-red-text" : due.tone === "soon" ? "pm-gold-text" : "pm-muted"}
                  >
                    {due.text}
                  </div>
                  <div className="pm-muted" style={{ fontSize: 10.5 }}>
                    {shortDate(deal.nextActionDate)}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>

        <Card
          title="⚠ 期限超過・今週締切のタスク"
          actions={<Link href="/pm/tasks" className="pm-btn sm ghost">ボードへ</Link>}
        >
          {[...d.overdue, ...d.dueSoon].length === 0 && (
            <div className="pm-empty">遅れているタスクはありません。順調です。</div>
          )}
          {[...d.overdue, ...d.dueSoon].slice(0, 7).map((t) => {
            const dept = DEPTS.find((x) => x.id === t.dept)!;
            const due = dueLabel(t.end);
            return (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--pm-line-soft)",
                }}
              >
                <span className="pm-dot" style={{ background: dept.color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pm-clamp2">{t.title}</div>
                  <div className="pm-muted" style={{ fontSize: 10.5 }}>
                    {dept.label} ・ {t.owner} ・ 進捗{t.progress}%
                  </div>
                </div>
                <span
                  className={`pm-nowrap ${due.tone === "over" ? "pm-red-text" : "pm-gold-text"}`}
                  style={{ fontSize: 11 }}
                >
                  {due.text}
                </span>
              </div>
            );
          })}
        </Card>
      </div>

      {/* --------------------------------------------------- 部門進捗 / パイプライン */}
      <div className="pm-grid cols-2" style={{ marginTop: 14 }}>
        <Card title="▤ 部門別の進捗" actions={<Link href="/pm/gantt" className="pm-btn sm ghost">ガントへ</Link>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {d.deptProgress.map((dept) => (
              <div key={dept.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4 }}>
                  <span>
                    <span className="pm-dot" style={{ background: dept.color, display: "inline-block", marginRight: 6 }} />
                    {dept.label}
                  </span>
                  <span className="pm-mono pm-muted">
                    {dept.done}/{dept.total}件 ・ {Math.round(dept.avg)}%
                  </span>
                </div>
                <Progress value={dept.avg} color={dept.color} />
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="◧ ステージ別パイプライン（初年度売上）"
          desc="初年度売上＝初期費用＋月額×12。加重前の総額です。"
        >
          <BarList items={d.stageBars} formatValue={manYen} />
        </Card>
      </div>

      {/* --------------------------------------------------- 展示会 / リスク / ニュース */}
      <div className="pm-grid cols-3" style={{ marginTop: 14 }}>
        <Card title="▦ 次の展示会" actions={<Link href="/pm/expo" className="pm-btn sm ghost">詳細</Link>}>
          {!d.nextExpo && <div className="pm-empty">予定されている展示会はありません。</div>}
          {d.nextExpo && (
            <>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{d.nextExpo.name}</div>
              <div className="pm-muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
                {d.nextExpo.venue} ・ {shortDate(d.nextExpo.start)} 〜 {shortDate(d.nextExpo.end)}
              </div>
              <div className="pm-stat-value pm-gold-text" style={{ fontSize: 22 }}>
                あと{Math.max(0, diffDays(today(), d.nextExpo.start))}
                <span className="unit">日</span>
              </div>
              <div style={{ marginTop: 12, marginBottom: 4, fontSize: 11.5 }} className="pm-dim">
                準備チェックリスト {d.expoChecklistDone}/{d.nextExpo.checklist.length}
              </div>
              <Progress
                value={(d.expoChecklistDone / Math.max(1, d.nextExpo.checklist.length)) * 100}
              />
              <div className="pm-muted" style={{ fontSize: 11, marginTop: 10 }}>
                目標リード {d.nextExpo.targetLeads}件 / 目標商談 {d.nextExpo.targetDeals}件
              </div>
            </>
          )}
        </Card>

        <Card title="⚑ 対応中のリスク" actions={<Link href="/pm/knowledge" className="pm-btn sm ghost">一覧</Link>}>
          {d.risks.length === 0 && <div className="pm-empty">オープンなリスクはありません。</div>}
          {d.risks.slice(0, 4).map((r) => (
            <div key={r.id} style={{ padding: "7px 0", borderBottom: "1px solid var(--pm-line-soft)" }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span
                  className="pm-dot"
                  style={{ background: r.impact === "high" ? "#e8735a" : "#d9b26a" }}
                />
                <span style={{ fontSize: 12 }} className="pm-clamp2">{r.title}</span>
              </div>
              <div className="pm-muted" style={{ fontSize: 10.5, paddingLeft: 12 }}>
                影響 {r.impact === "high" ? "大" : r.impact === "mid" ? "中" : "小"} / 発生可能性{" "}
                {r.likelihood === "high" ? "高" : r.likelihood === "mid" ? "中" : "低"}
              </div>
            </div>
          ))}
        </Card>

        <Card title="◇ 注目ニュース" actions={<Link href="/pm/news" className="pm-btn sm ghost">すべて</Link>}>
          {d.topNews.length === 0 && (
            <div className="pm-empty">
              まだ取得していません。
              <br />
              <Link href="/pm/news" className="pm-cyan-text">ニュース画面</Link>
              を開くと自動で収集します。
            </div>
          )}
          {d.topNews.map((n) => (
            <a
              key={n.id}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                padding: "7px 0",
                borderBottom: "1px solid var(--pm-line-soft)",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <div className="pm-clamp2" style={{ fontSize: 12 }}>{n.title}</div>
              <div className="pm-muted" style={{ fontSize: 10.5 }}>
                {n.source} ・ {relativeTime(n.publishedAt)} ・ 関連度 {n.score}
              </div>
            </a>
          ))}
        </Card>
      </div>

      {/* --------------------------------------------------- タスク状況 */}
      <div className="pm-grid cols-1" style={{ marginTop: 14 }}>
        <Card title="☑ タスクのステータス内訳">
          <div className="pm-grid cols-5">
            {TASK_STATUSES.map((s) => {
              const count = state.tasks.filter((t) => t.status === s.id).length;
              return (
                <div key={s.id} style={{ textAlign: "center" }}>
                  <div className="pm-stat-value" style={{ color: s.color, fontSize: 22 }}>
                    {count}
                  </div>
                  <div className="pm-muted" style={{ fontSize: 11 }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
