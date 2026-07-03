import type { CertGrade, CertSummary, Machine, MaintRecord, PartReplacement } from "./types";
import { monthsBetween, todayIso } from "./format";

function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function coveredMonths(records: MaintRecord[], fromIso: string, toIso: string): number {
  const keys = new Set(records.map((r) => monthKey(r.workDate)));
  let covered = 0;
  const total = Math.max(monthsBetween(fromIso, toIso), 1);
  for (let i = 0; i < total; i++) {
    const [y, m] = fromIso.split("-").map(Number);
    const t = y * 12 + (m - 1) + i;
    const key = `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
    if (keys.has(key)) covered++;
  }
  return covered;
}

/** 法定点検が規定周期(+2ヶ月の猶予)で継続実施されているか */
export function legalCompliant(machine: Machine, records: MaintRecord[], asOf: string): boolean {
  if (!machine.legalPlan) return true;
  const legal = records
    .filter((r) => r.type === "legal" || r.type === "hygiene")
    .sort((a, b) => (a.workDate < b.workDate ? -1 : 1));
  if (legal.length === 0) return false;
  const interval = machine.legalPlan.intervalMonths;
  // 直近の実施が周期+猶予以内であること
  const last = legal[legal.length - 1];
  if (monthsBetween(last.workDate, asOf) > interval + 2) return false;
  // 連続する実施間隔が周期+猶予以内であること(直近3回まで確認)
  const recent = legal.slice(-4);
  for (let i = 1; i < recent.length; i++) {
    if (monthsBetween(recent[i - 1].workDate, recent[i].workDate) > interval + 2) return false;
  }
  return true;
}

export function computeGrade(
  machine: Machine,
  records: MaintRecord[],
  asOf: string = todayIso(),
): { grade: CertGrade; summary: CertSummary } {
  const sorted = [...records].sort((a, b) => (a.workDate < b.workDate ? -1 : 1));
  const ownershipMonths = Math.max(monthsBetween(machine.purchasedAt, asOf), 1);

  const allCovered = coveredMonths(sorted, machine.purchasedAt.slice(0, 7) + "-01", asOf);
  const coverageAll = allCovered / ownershipMonths;

  const recentWindow = Math.min(36, ownershipMonths);
  const [ay, am] = asOf.split("-").map(Number);
  const t = ay * 12 + (am - 1) - recentWindow;
  const recentFrom = `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}-01`;
  const recentCovered = coveredMonths(sorted, recentFrom, asOf);
  const coverageRecent = recentCovered / Math.max(recentWindow, 1);

  const spanMonths =
    sorted.length > 0 ? monthsBetween(sorted[0].workDate, sorted[sorted.length - 1].workDate) : 0;

  const legalOk = legalCompliant(machine, sorted, asOf);

  let grade: CertGrade = "C";
  if (coverageAll >= 0.85 && legalOk) grade = "A";
  else if (spanMonths >= 34 && coverageRecent >= 0.7 && legalOk) grade = "B";

  const counts = {
    inspection: sorted.filter((r) => r.type === "inspection").length,
    repair: sorted.filter((r) => r.type === "repair").length,
    parts: sorted.filter((r) => r.type === "parts").length,
    legal: sorted.filter((r) => r.type === "legal").length,
    hygiene: sorted.filter((r) => r.type === "hygiene").length,
    total: sorted.length,
  };

  const majorParts: PartReplacement[] = [];
  for (const r of sorted) {
    if (r.parts) majorParts.push(...r.parts);
  }

  return {
    grade,
    summary: {
      ownershipMonths,
      coverageRatio: Math.round(coverageAll * 100) / 100,
      legalCompliance: legalOk,
      counts,
      firstRecordAt: sorted[0]?.workDate ?? null,
      lastRecordAt: sorted[sorted.length - 1]?.workDate ?? null,
      majorParts: majorParts.slice(-8),
    },
  };
}

/** 次回法定点検の予定日 (ISO) — 期限管理用 */
export function nextLegalDue(machine: Machine, records: MaintRecord[]): string | null {
  if (!machine.legalPlan) return null;
  const legal = records
    .filter((r) => r.type === "legal" || r.type === "hygiene")
    .sort((a, b) => (a.workDate < b.workDate ? -1 : 1));
  const base = legal.length > 0 ? legal[legal.length - 1].workDate : machine.registeredAt;
  const [y, m, d] = base.slice(0, 10).split("-").map(Number);
  const total = y * 12 + (m - 1) + machine.legalPlan.intervalMonths;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const lastDay = new Date(ny, nm, 0).getDate();
  return `${ny}-${String(nm).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`;
}
