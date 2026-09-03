// 表示用フォーマッタと日付ユーティリティ

export function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

/** 万円・億円に丸めた読みやすい表記 */
export function manYen(n: number): string {
  const v = Math.round(n);
  if (Math.abs(v) >= 100_000_000) return `${(v / 100_000_000).toFixed(2)}億円`;
  if (Math.abs(v) >= 10_000) return `${Math.round(v / 10_000).toLocaleString("ja-JP")}万円`;
  return `${v.toLocaleString("ja-JP")}円`;
}

export function num(n: number): string {
  return Math.round(n).toLocaleString("ja-JP");
}

export function pct(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}

export function today(): string {
  return toDateStr(new Date());
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map((v) => parseInt(v, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(s: string, days: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000);
}

/** 日付を「9/12(金)」形式で */
export function shortDate(s: string): string {
  if (!s) return "—";
  const d = parseDate(s);
  if (Number.isNaN(d.getTime())) return s;
  const w = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${w})`;
}

/** 期限までの残り日数を人が読める形に */
export function dueLabel(dateStr: string, base = today()): { text: string; tone: "ok" | "soon" | "over" } {
  if (!dateStr) return { text: "期限なし", tone: "ok" };
  const d = diffDays(base, dateStr);
  if (d < 0) return { text: `${-d}日超過`, tone: "over" };
  if (d === 0) return { text: "本日", tone: "soon" };
  if (d <= 3) return { text: `あと${d}日`, tone: "soon" };
  return { text: `あと${d}日`, tone: "ok" };
}

/** ISO 日時を「9/2 14:30」形式で */
export function dateTimeLabel(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()} ${`${d.getHours()}`.padStart(2, "0")}:${`${d.getMinutes()}`.padStart(2, "0")}`;
}

/** 「3時間前」形式 */
export function relativeTime(iso: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const mins = Math.round((Date.now() - t) / 60_000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}日前`;
  return dateTimeLabel(iso);
}

export function download(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([`﻿${content}`], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 配列を CSV 文字列へ（Excel で開ける BOM 付きは download 側で付与） */
export function toCsv(rows: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = headers.map((h) => esc(h.label)).join(",");
  const body = rows.map((r) => headers.map((h) => esc(r[h.key])).join(",")).join("\n");
  return `${head}\n${body}`;
}

/** クライアント側で一時的な ID を作る（サーバー側で確定 ID が振られるまでの繋ぎ） */
let idCounter = 0;
export function localId(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}
