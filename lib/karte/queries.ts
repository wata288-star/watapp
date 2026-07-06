import { getDb } from "./db";
import type { Certificate, Machine, MaintRecord, Partner, SaleCase, User } from "./types";

// 企業ごとの厳格なデータ分離: すべての参照は companyId でスコープする

export function machinesOf(companyId: string): Machine[] {
  return getDb().machines.filter((m) => m.companyId === companyId);
}

export function machineOf(companyId: string, machineId: string): Machine | null {
  const m = getDb().machines.find((x) => x.id === machineId);
  return m && m.companyId === companyId ? m : null;
}

export function machineByCode(code: string): Machine | null {
  const normalized = code.trim().toUpperCase();
  return getDb().machines.find((m) => m.code === normalized) ?? null;
}

export function recordsOfMachine(companyId: string, machineId: string): MaintRecord[] {
  return getDb()
    .records.filter((r) => r.companyId === companyId && r.machineId === machineId)
    .sort((a, b) => (a.workDate < b.workDate ? 1 : a.workDate > b.workDate ? -1 : a.createdAt < b.createdAt ? 1 : -1));
}

export function recordsOf(companyId: string): MaintRecord[] {
  return getDb()
    .records.filter((r) => r.companyId === companyId)
    .sort((a, b) => (a.workDate < b.workDate ? 1 : a.workDate > b.workDate ? -1 : a.createdAt < b.createdAt ? 1 : -1));
}

export function certificatesOf(companyId: string): Certificate[] {
  return getDb()
    .certificates.filter((c) => c.companyId === companyId)
    .sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1));
}

export function certificateOf(companyId: string, certId: string): Certificate | null {
  const c = getDb().certificates.find((x) => x.id === certId);
  return c && c.companyId === companyId ? c : null;
}

export function certificateByNo(certNo: string): Certificate | null {
  const normalized = certNo.trim().toUpperCase();
  return getDb().certificates.find((c) => c.certNo === normalized) ?? null;
}

export function salesOf(companyId: string): SaleCase[] {
  return getDb()
    .sales.filter((s) => s.companyId === companyId)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function partners(): Partner[] {
  return getDb().partners;
}

export function usersOf(companyId: string): User[] {
  return getDb().users.filter((u) => u.companyId === companyId);
}

export function userName(userId: string): string {
  return getDb().users.find((u) => u.id === userId)?.name ?? "—";
}
