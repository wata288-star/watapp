"use client";

// アプリ全体の枠組み（サイドバー + トップバー）

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { usePm } from "../_lib/store";
import { diffDays, today } from "../_lib/format";

interface NavDef {
  group: string;
  items: { href: string; icon: string; label: string; badge?: "alerts" | "news" | "hot" }[];
}

export const NAV: NavDef[] = [
  {
    group: "全体",
    items: [
      { href: "/pm", icon: "◈", label: "ダッシュボード" },
      { href: "/pm/gantt", icon: "▤", label: "ガントチャート" },
      { href: "/pm/tasks", icon: "☑", label: "タスクボード", badge: "alerts" },
      { href: "/pm/okr", icon: "◎", label: "OKR / KPI" },
    ],
  },
  {
    group: "営業",
    items: [
      { href: "/pm/deals", icon: "◧", label: "商談パイプライン", badge: "hot" },
      { href: "/pm/playbook", icon: "◔", label: "トークスクリプト" },
      { href: "/pm/materials", icon: "▣", label: "営業資料ライブラリ" },
      { href: "/pm/roi", icon: "⌁", label: "ROIシミュレーター" },
    ],
  },
  {
    group: "マーケティング",
    items: [
      { href: "/pm/expo", icon: "▦", label: "展示会マネジメント" },
      { href: "/pm/marketing", icon: "◑", label: "マーケ施策・記事" },
      { href: "/pm/news", icon: "◇", label: "業界ニュース", badge: "news" },
    ],
  },
  {
    group: "経営",
    items: [
      { href: "/pm/funding", icon: "◭", label: "資金調達" },
      { href: "/pm/knowledge", icon: "◫", label: "ナレッジ / リスク" },
    ],
  },
];

export const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/pm": { title: "ダッシュボード", subtitle: "TOMARUN 事業の今日の状況をひと目で" },
  "/pm/gantt": { title: "ガントチャート", subtitle: "部門横断のスケジュールと進捗" },
  "/pm/tasks": { title: "タスクボード", subtitle: "ドラッグでステータスを動かせます" },
  "/pm/okr": { title: "OKR / KPI", subtitle: "目標と達成度の管理" },
  "/pm/deals": { title: "商談パイプライン", subtitle: "見込み顧客とステージごとの受注見込み" },
  "/pm/playbook": { title: "トークスクリプト", subtitle: "営業台本・想定問答・競合バトルカード" },
  "/pm/materials": { title: "営業資料ライブラリ", subtitle: "どの資料をいつ使うかを一元管理" },
  "/pm/roi": { title: "ROIシミュレーター", subtitle: "顧客ごとの投資対効果をその場で試算" },
  "/pm/expo": { title: "展示会マネジメント", subtitle: "出展準備・獲得リード・費用対効果" },
  "/pm/marketing": { title: "マーケ施策・記事", subtitle: "チャネル別の施策とコンテンツカレンダー" },
  "/pm/news": { title: "業界ニュース", subtitle: "1日2回（8:00 / 18:00）自動収集" },
  "/pm/funding": { title: "資金調達", subtitle: "投資家パイプラインと必要書類の進捗" },
  "/pm/knowledge": { title: "ナレッジ / リスク", subtitle: "意思決定ログ・学び・リスク管理" },
};

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, loading, error, toast } = usePm();
  const [collapsed, setCollapsed] = useState(false);

  const badges = useMemo(() => {
    if (!state) return { alerts: 0, news: 0, hot: 0 };
    const t = today();
    const alerts = state.tasks.filter(
      (x) => x.status !== "done" && x.end && diffDays(t, x.end) < 0,
    ).length;
    const news = state.news.filter((n) => !n.read && n.score >= 60).length;
    const hot = state.deals.filter(
      (d) => !["won", "lost"].includes(d.stage) && d.nextActionDate && diffDays(t, d.nextActionDate) <= 2,
    ).length;
    return { alerts, news, hot };
  }, [state]);

  const meta = PAGE_META[pathname] ?? { title: "TOMARUN", subtitle: "" };

  return (
    <div className="pm-root">
      <aside className={`pm-sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="pm-brand">
          <div className="pm-brand-mark">T</div>
          {!collapsed && (
            <div className="pm-brand-text">
              <div className="pm-brand-title">TOMARUN</div>
              <div className="pm-brand-sub">COMMAND CENTER</div>
            </div>
          )}
        </div>

        <nav className="pm-nav">
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="pm-nav-group">{g.group}</div>
              {g.items.map((item) => {
                const active = pathname === item.href;
                const count = item.badge ? badges[item.badge] : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`pm-nav-item ${active ? "active" : ""}`}
                    title={item.label}
                  >
                    <span className="pm-nav-icon">{item.icon}</span>
                    <span className="pm-nav-label">{item.label}</span>
                    {count > 0 && (
                      <span className={`pm-nav-badge ${item.badge === "alerts" ? "alert" : ""}`}>
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="pm-sidebar-foot">
          <button
            className="pm-btn ghost sm"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? "»" : "« 折りたたむ"}
          </button>
        </div>
      </aside>

      <div className="pm-main">
        <header className="pm-topbar">
          <button
            className="pm-btn ghost icon pm-no-print"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="メニュー"
          >
            ☰
          </button>
          <div>
            <h1>{meta.title}</h1>
            {meta.subtitle && <p className="pm-subtitle">{meta.subtitle}</p>}
          </div>
          <div className="pm-spacer" />
          <div className="pm-muted pm-nowrap" style={{ fontSize: 11.5 }}>
            {new Date().toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </div>
        </header>

        <main className="pm-content">
          {loading && <div className="pm-empty">読み込み中…</div>}
          {error && (
            <div className="pm-empty pm-red-text">
              データの読み込みに失敗しました：{error}
            </div>
          )}
          {!loading && !error && state && children}
        </main>
      </div>

      {toast && <div className="pm-toast">{toast}</div>}
    </div>
  );
}
