"use client";

// 業界ニュース：1日2回（8:00 / 18:00 JST）自動収集

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, ConfirmButton, Field, Modal, Select, Stat, TextArea, TextInput } from "../_components/ui";
import { usePm } from "../_lib/store";
import { dateTimeLabel, relativeTime } from "../_lib/format";
import type { NewsItem, NewsSource } from "@/lib/pm/types";

type Filter = "all" | "unread" | "starred" | "high";
type Sort = "relevance" | "recent";

export default function NewsPage() {
  const { state, update, create, remove, reload, showToast } = usePm();
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("relevance");
  const [refreshing, setRefreshing] = useState(false);
  const [nextFetchAt, setNextFetchAt] = useState("");
  const [memoTarget, setMemoTarget] = useState<NewsItem | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [autoTried, setAutoTried] = useState(false);

  /** 画面を開いたときに、配信スロットを過ぎていれば自動で取得する */
  const ensure = useCallback(async () => {
    try {
      const res = await fetch("/api/pm/newsfeed", { cache: "no-store" });
      const json = await res.json();
      setNextFetchAt(json.nextFetchAt ?? "");
      await reload();
    } catch {
      /* ネットワークが使えない環境では何もしない */
    }
  }, [reload]);

  useEffect(() => {
    if (autoTried) return;
    setAutoTried(true);
    void ensure();
  }, [autoTried, ensure]);

  const manualRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/pm/newsfeed/refresh", { method: "POST" });
      const json = await res.json();
      setNextFetchAt(json.nextFetchAt ?? "");
      await reload();
      if (json.errors?.length) {
        showToast(`${json.added ?? 0}件取得（${json.errors.length}ソースで失敗）`);
      } else {
        showToast(`${json.added ?? 0}件の新着を取得しました`);
      }
    } catch (e) {
      showToast(`取得に失敗しました：${(e as Error).message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const categories = useMemo(
    () => Array.from(new Set((state?.news ?? []).map((n) => n.category))),
    [state],
  );

  const items = useMemo(() => {
    if (!state) return [];
    const q = query.trim().toLowerCase();
    return state.news
      .filter((n) => {
        if (filter === "unread" && n.read) return false;
        if (filter === "starred" && !n.starred) return false;
        if (filter === "high" && n.score < 60) return false;
        if (category !== "all" && n.category !== category) return false;
        if (q && !`${n.title} ${n.summary} ${n.source}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) =>
        sort === "recent"
          ? b.publishedAt.localeCompare(a.publishedAt)
          : b.score - a.score || b.publishedAt.localeCompare(a.publishedAt),
      );
  }, [state, filter, category, query, sort]);

  if (!state) return null;

  const unread = state.news.filter((n) => !n.read).length;
  const starred = state.news.filter((n) => n.starred).length;
  const high = state.news.filter((n) => n.score >= 60).length;

  return (
    <>
      <div className="pm-grid cols-4">
        <Stat label="収集済みニュース" value={state.news.length} unit="件" sub={`未読 ${unread}件`} />
        <Stat label="関連度の高い記事" tone="gold" value={high} unit="件" sub="スコア60以上" />
        <Stat label="スター（営業ネタ）" tone="cyan" value={starred} unit="件" />
        <Stat
          label="最終取得"
          value={
            state.newsMeta.lastFetchedAt ? (
              <span style={{ fontSize: 17 }}>{relativeTime(state.newsMeta.lastFetchedAt)}</span>
            ) : (
              <span style={{ fontSize: 17 }}>未取得</span>
            )
          }
          sub={
            nextFetchAt
              ? `次回 ${dateTimeLabel(nextFetchAt)}（毎日 ${state.newsMeta.slots.join(" / ")}）`
              : `毎日 ${state.newsMeta.slots.join(" / ")} に自動取得`
          }
        />
      </div>

      <div className="pm-toolbar" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", gap: 2 }}>
          {([
            { id: "all", label: "すべて" },
            { id: "unread", label: `未読 ${unread}` },
            { id: "high", label: "重要" },
            { id: "starred", label: "スター" },
          ] as { id: Filter; label: string }[]).map((f) => (
            <button
              key={f.id}
              className={`pm-btn sm ${filter === f.id ? "primary" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} style={{ width: 120 }}>
          <option value="relevance">おすすめ順</option>
          <option value="recent">新着順</option>
        </Select>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: 170 }}>
          <option value="all">すべてのカテゴリ</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <span className="pm-search-wrap">
          <TextInput
            className="pm-search"
            placeholder="キーワードで検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </span>
        <div className="pm-spacer" />
        <button className="pm-btn" onClick={() => setShowSources(true)}>
          収集ソース（{state.newsSources.filter((s) => s.enabled).length}）
        </button>
        <button className="pm-btn primary" onClick={manualRefresh} disabled={refreshing}>
          {refreshing ? "取得中…" : "今すぐ取得"}
        </button>
      </div>

      {state.newsMeta.lastResult && state.newsMeta.lastResult !== "未取得" && (
        <div className="pm-muted" style={{ fontSize: 11.5, marginBottom: 12 }}>
          前回の結果：{state.newsMeta.lastResult}
        </div>
      )}

      {state.news.length === 0 && (
        <Card title="◇ まだニュースがありません">
          <div style={{ lineHeight: 1.9 }}>
            「今すぐ取得」を押すと、製造業DX・予知保全・技能継承などのキーワードで
            記事を集めてきます。以降は<b className="pm-gold-text">毎日 8:00 と 18:00</b> に
            サーバー側で自動更新されます。
            <br />
            <span className="pm-muted">
              ※ インターネットに接続できない環境では取得できません。その場合はネットワーク設定をご確認ください。
            </span>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((n) => (
          <div
            key={n.id}
            className="pm-card"
            style={{ padding: 13, opacity: n.read ? 0.62 : 1 }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <button
                className="pm-btn ghost icon"
                style={{ border: "none", color: n.starred ? "#f0d69c" : "var(--pm-muted)", fontSize: 15 }}
                title="営業ネタとしてスターを付ける"
                onClick={() => update("news", n.id, { starred: !n.starred })}
              >
                {n.starred ? "★" : "☆"}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit", textDecoration: "none", fontWeight: 600, fontSize: 13 }}
                  onClick={() => !n.read && update("news", n.id, { read: true })}
                >
                  {n.title}
                </a>
                {n.summary && !n.summary.startsWith(n.title.slice(0, 24)) && (
                  <div className="pm-muted pm-clamp2" style={{ fontSize: 11.5, marginTop: 3 }}>
                    {n.summary}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
                  <span className="pm-badge" style={{ background: "rgba(79,195,217,0.14)", color: "#4fc3d9" }}>
                    {n.category}
                  </span>
                  <span className="pm-muted" style={{ fontSize: 10.5 }}>{n.source}</span>
                  <span className="pm-muted" style={{ fontSize: 10.5 }}>{relativeTime(n.publishedAt)}</span>
                  <span
                    className="pm-mono"
                    style={{ fontSize: 10.5, color: n.score >= 70 ? "#f0d69c" : "var(--pm-muted)" }}
                    title="TOMARUN の営業観点での関連度"
                  >
                    関連度 {n.score}
                  </span>
                </div>
                {n.memo && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 9,
                      borderRadius: 8,
                      background: "rgba(217,178,106,0.08)",
                      fontSize: 11.5,
                    }}
                  >
                    <span className="pm-gold-text">メモ：</span>
                    {n.memo}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button className="pm-btn sm ghost" onClick={() => setMemoTarget(n)}>
                  メモ
                </button>
                <button
                  className="pm-btn sm ghost"
                  onClick={() => update("news", n.id, { read: !n.read })}
                >
                  {n.read ? "未読に" : "既読に"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && state.news.length > 0 && (
        <div className="pm-empty">条件に合うニュースがありません。</div>
      )}

      {/* メモ */}
      {memoTarget && (
        <Modal
          title="このニュースを営業ネタにする"
          onClose={() => setMemoTarget(null)}
          footer={
            <>
              <div className="pm-spacer" />
              <button className="pm-btn primary" onClick={() => setMemoTarget(null)}>閉じる</button>
            </>
          }
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{memoTarget.title}</div>
          <div className="pm-muted" style={{ fontSize: 11.5, marginBottom: 14 }}>
            {memoTarget.source} ・ {relativeTime(memoTarget.publishedAt)}
          </div>
          <Field
            label="メモ"
            hint="例）この記事を山陽精機工業への次回訪問で切り出しに使う。「同業でもこの動きが出ています」"
          >
            <TextArea
              value={memoTarget.memo}
              autoFocus
              onChange={(e) => {
                setMemoTarget({ ...memoTarget, memo: e.target.value });
                void update("news", memoTarget.id, { memo: e.target.value });
              }}
            />
          </Field>
        </Modal>
      )}

      {/* 収集ソース設定 */}
      {showSources && (
        <SourcesModal
          sources={state.newsSources}
          onClose={() => setShowSources(false)}
          onToggle={(s) => update("newsSources", s.id, { enabled: !s.enabled })}
          onAdd={(s) => create("newsSources", s)}
          onRemove={(id) => remove("newsSources", id)}
        />
      )}
    </>
  );
}

function SourcesModal({
  sources,
  onClose,
  onToggle,
  onAdd,
  onRemove,
}: {
  sources: NewsSource[];
  onClose: () => void;
  onToggle: (s: NewsSource) => void;
  onAdd: (s: Omit<NewsSource, "id">) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");

  return (
    <Modal
      wide
      title="ニュース収集ソースの設定"
      onClose={onClose}
      footer={
        <>
          <div className="pm-spacer" />
          <button className="pm-btn primary" onClick={onClose}>閉じる</button>
        </>
      }
    >
      <div className="pm-muted" style={{ fontSize: 11.5, marginBottom: 14, lineHeight: 1.8 }}>
        キーワードを登録すると、そのキーワードのニュースを毎日 2 回集めてきます。
        RSS の URL を直接指定することもできます。
      </div>

      <div className="pm-table-wrap" style={{ marginBottom: 16 }}>
        <table className="pm-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>有効</th>
              <th>名前</th>
              <th>カテゴリ</th>
              <th>URL</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={() => onToggle(s)}
                    style={{ accentColor: "#5fcf9a" }}
                  />
                </td>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td className="pm-muted">{s.category}</td>
                <td style={{ maxWidth: 280 }}>
                  <span className="pm-clamp2 pm-muted" style={{ fontSize: 10.5, wordBreak: "break-all" }}>
                    {decodeURIComponent(s.url)}
                  </span>
                </td>
                <td>
                  <ConfirmButton label="✕" onConfirm={() => onRemove(s.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pm-section-title">キーワードを追加</div>
      <div className="pm-grid cols-3">
        <Field label="表示名">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="例）射出成形機" />
        </Field>
        <Field label="検索キーワード">
          <TextInput
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="例）射出成形機 保守"
          />
        </Field>
        <Field label="カテゴリ">
          <TextInput value={category} onChange={(e) => setCategory(e.target.value)} placeholder="例）業界動向" />
        </Field>
      </div>
      <button
        className="pm-btn primary"
        onClick={() => {
          if (!keyword.trim()) return;
          onAdd({
            name: name.trim() || keyword.trim(),
            url: `https://news.google.com/rss/search?q=${encodeURIComponent(keyword.trim())}&hl=ja&gl=JP&ceid=JP:ja`,
            category: category.trim() || "その他",
            enabled: true,
          });
          setName("");
          setKeyword("");
          setCategory("");
        }}
      >
        ＋ 追加
      </button>
    </Modal>
  );
}
