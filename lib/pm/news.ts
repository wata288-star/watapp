// 業界ニュース自動収集（1日2回：8:00 / 18:00 JST）
//
// 外部ライブラリを使わずに RSS / Atom を解析する。
// 収集したニュースは TOMARUN の営業観点でスコアリングして並べ替える。

import type { NewsItem, NewsSource, PmState } from "./types";
import { mutate, newId, readState } from "./store";

/** スコアリング用キーワード（重み付き） */
const KEYWORDS: { word: string; weight: number }[] = [
  { word: "ダウンタイム", weight: 20 },
  { word: "生産停止", weight: 20 },
  { word: "設備停止", weight: 18 },
  { word: "予知保全", weight: 18 },
  { word: "設備保全", weight: 16 },
  { word: "技能継承", weight: 18 },
  { word: "技術継承", weight: 18 },
  { word: "熟練", weight: 14 },
  { word: "ベテラン", weight: 12 },
  { word: "属人化", weight: 16 },
  { word: "人手不足", weight: 12 },
  { word: "アフターサービス", weight: 16 },
  { word: "保守", weight: 12 },
  { word: "メンテナンス", weight: 10 },
  { word: "トラブルシューティング", weight: 20 },
  { word: "産業機械", weight: 14 },
  { word: "工作機械", weight: 12 },
  { word: "製造業", weight: 10 },
  { word: "工場", weight: 8 },
  { word: "スマートファクトリー", weight: 14 },
  { word: "生成AI", weight: 12 },
  { word: "マニュアル", weight: 12 },
  { word: "ナレッジ", weight: 12 },
  { word: "OEM", weight: 12 },
  { word: "サブスク", weight: 10 },
  { word: "補助金", weight: 12 },
  { word: "DX", weight: 8 },
  { word: "IoT", weight: 8 },
];

export function scoreNews(title: string, summary: string): number {
  const text = `${title} ${summary}`;
  let score = 20;
  for (const { word, weight } of KEYWORDS) {
    if (text.includes(word)) score += weight;
  }
  return Math.min(100, score);
}

// ---------------------------------------------------------------- XML 解析

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&");
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]).trim() : "";
}

interface RawEntry {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
}

export function parseFeed(xml: string): RawEntry[] {
  const out: RawEntry[] = [];

  // RSS 2.0
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const block of items) {
    out.push({
      title: stripTags(pick(block, "title")),
      link: pick(block, "link"),
      pubDate: pick(block, "pubDate") || pick(block, "dc:date"),
      description: stripTags(pick(block, "description")),
      source: stripTags(pick(block, "source")),
    });
  }
  if (out.length > 0) return out;

  // Atom
  const entries = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const block of entries) {
    const hrefMatch = block.match(/<link[^>]*href="([^"]+)"/i);
    out.push({
      title: stripTags(pick(block, "title")),
      link: hrefMatch ? decodeEntities(hrefMatch[1]) : "",
      pubDate: pick(block, "updated") || pick(block, "published"),
      description: stripTags(pick(block, "summary") || pick(block, "content")),
      source: "",
    });
  }
  return out;
}

// ---------------------------------------------------------------- スケジュール

const JST_OFFSET_MIN = 9 * 60;

/** 直近の配信スロット（JST の HH:mm 配列）を UTC 時刻として返す */
export function lastSlotBoundary(slots: string[], now = new Date()): Date {
  const jstNow = new Date(now.getTime() + JST_OFFSET_MIN * 60_000);
  const y = jstNow.getUTCFullYear();
  const mo = jstNow.getUTCMonth();
  const d = jstNow.getUTCDate();

  const candidates: Date[] = [];
  for (const dayOffset of [0, -1]) {
    for (const slot of slots) {
      const [hh, mm] = slot.split(":").map((n) => parseInt(n, 10));
      const jst = Date.UTC(y, mo, d + dayOffset, hh || 0, mm || 0);
      candidates.push(new Date(jst - JST_OFFSET_MIN * 60_000));
    }
  }
  const past = candidates.filter((c) => c.getTime() <= now.getTime());
  past.sort((a, b) => b.getTime() - a.getTime());
  return past[0] ?? new Date(now.getTime() - 24 * 3600_000);
}

/** 直近の配信スロットを過ぎてから未取得なら true */
export function shouldRefresh(state: PmState, now = new Date()): boolean {
  const last = state.newsMeta.lastFetchedAt ? new Date(state.newsMeta.lastFetchedAt) : null;
  if (!last || Number.isNaN(last.getTime())) return true;
  return last.getTime() < lastSlotBoundary(state.newsMeta.slots, now).getTime();
}

/** 次の配信予定時刻 */
export function nextSlotTime(slots: string[], now = new Date()): Date {
  const jstNow = new Date(now.getTime() + JST_OFFSET_MIN * 60_000);
  const y = jstNow.getUTCFullYear();
  const mo = jstNow.getUTCMonth();
  const d = jstNow.getUTCDate();
  const candidates: Date[] = [];
  for (const dayOffset of [0, 1]) {
    for (const slot of slots) {
      const [hh, mm] = slot.split(":").map((n) => parseInt(n, 10));
      const jst = Date.UTC(y, mo, d + dayOffset, hh || 0, mm || 0);
      candidates.push(new Date(jst - JST_OFFSET_MIN * 60_000));
    }
  }
  const future = candidates.filter((c) => c.getTime() > now.getTime());
  future.sort((a, b) => a.getTime() - b.getTime());
  return future[0];
}

// ---------------------------------------------------------------- 取得

async function fetchSource(source: NewsSource, signal: AbortSignal): Promise<NewsItem[]> {
  const res = await fetch(source.url, {
    signal,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TOMARUN-CommandCenter/1.0)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const entries = parseFeed(xml).slice(0, 25);
  const fetchedAt = new Date().toISOString();

  return entries
    .filter((e) => e.title && e.link)
    .map((e) => {
      // Google News のタイトルは「見出し - 媒体名」形式
      const parts = e.title.split(" - ");
      const mediaName = parts.length > 1 ? parts[parts.length - 1] : "";
      const title = parts.length > 1 ? parts.slice(0, -1).join(" - ") : e.title;
      const summary = e.description.slice(0, 240);
      const published = e.pubDate ? new Date(e.pubDate) : new Date();
      return {
        id: newId("nw"),
        title,
        url: e.link,
        source: e.source || mediaName || source.name,
        publishedAt: Number.isNaN(published.getTime()) ? fetchedAt : published.toISOString(),
        category: source.category,
        score: scoreNews(title, summary),
        summary,
        read: false,
        starred: false,
        memo: "",
        fetchedAt,
      } satisfies NewsItem;
    });
}

function normalizeKey(item: { title: string; url: string }): string {
  return `${item.title.replace(/\s+/g, "").toLowerCase()}`;
}

export interface RefreshResult {
  added: number;
  total: number;
  errors: string[];
  fetchedAt: string;
}

/** 全ソースを取得してストアへマージする */
export async function refreshNews(): Promise<RefreshResult> {
  const state = readState();
  const sources = state.newsSources.filter((s) => s.enabled);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);

  const errors: string[] = [];
  const collected: NewsItem[] = [];

  const results = await Promise.allSettled(
    sources.map((s) => fetchSource(s, controller.signal)),
  );
  clearTimeout(timer);

  results.forEach((r, i) => {
    if (r.status === "fulfilled") collected.push(...r.value);
    else errors.push(`${sources[i].name}: ${r.reason?.message ?? r.reason}`);
  });

  const fetchedAt = new Date().toISOString();
  let added = 0;
  let total = 0;

  mutate((s) => {
    const seen = new Set(s.news.map(normalizeKey));
    const fresh = collected.filter((n) => {
      const key = normalizeKey(n);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    added = fresh.length;

    // 新着 + 既存。スター付きは必ず残し、それ以外は 400 件で打ち切る。
    const merged = [...fresh, ...s.news];
    const starred = merged.filter((n) => n.starred);
    const rest = merged
      .filter((n) => !n.starred)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, 400);
    s.news = [...starred, ...rest].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    total = s.news.length;

    s.newsMeta.lastFetchedAt = fetchedAt;
    s.newsMeta.lastResult =
      errors.length === 0
        ? `${added}件の新着を取得（${sources.length}ソース）`
        : `${added}件取得 / ${errors.length}ソースで失敗`;
  });

  return { added, total, errors, fetchedAt };
}

/** 配信スロットを過ぎていれば取得する。ページ表示時に呼ぶ想定。 */
export async function ensureFreshNews(): Promise<RefreshResult | null> {
  if (!shouldRefresh(readState())) return null;
  try {
    return await refreshNews();
  } catch (e) {
    mutate((s) => {
      s.newsMeta.lastResult = `取得に失敗: ${(e as Error).message}`;
    });
    return null;
  }
}
