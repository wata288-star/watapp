export function yen(n: number): string {
  return "¥" + Math.round(n).toLocaleString("ja-JP");
}

// 大きな金額を見やすく（億・万）
export function yenShort(n: number): string {
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1_0000_0000) return `${sign}${(a / 1_0000_0000).toFixed(2)}億円`;
  if (a >= 1_0000) return `${sign}${Math.round(a / 1_0000).toLocaleString("ja-JP")}万円`;
  return `${sign}¥${Math.round(a).toLocaleString("ja-JP")}`;
}

export function num(n: number, digits = 0): string {
  return n.toLocaleString("ja-JP", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function pct(n: number, digits = 1): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s.length <= 10 ? s + "T00:00:00" : s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
