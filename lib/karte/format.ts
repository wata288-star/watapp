export function fmtDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

export function fmtDateShort(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
}

export function fmtDateEn(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}

export function fmtYen(n: number | null | undefined): string {
  if (n == null) return "—";
  return `¥${n.toLocaleString("ja-JP")}`;
}

export function fmtMan(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 10000) {
    const man = n / 10000;
    return `${man.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}万円`;
  }
  return `${n.toLocaleString("ja-JP")}円`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function monthsBetween(fromIso: string, toIso: string): number {
  const [fy, fm] = fromIso.split("-").map(Number);
  const [ty, tm] = toIso.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

export function addMonthsIso(isoDate: string, n: number): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const lastDay = new Date(ny, nm, 0).getDate();
  return `${ny}-${String(nm).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`;
}
