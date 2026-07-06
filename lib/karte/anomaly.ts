import type { AuditFlag, Machine, MaintRecord, SaleCase } from "./types";
import { monthsBetween } from "./format";

// 異常パターン検知
// 実運用では生じにくい記録パターンをルールベースで検知し、
// 証明書発行時の審査対象とする。移行データは検知対象から除外する。

export function detectAnomalies(
  machine: Machine,
  records: MaintRecord[],
  sales: SaleCase[],
): AuditFlag[] {
  const flags: AuditFlag[] = [];
  const live = records.filter((r) => !r.migrated);

  // 1) 短時間での大量一括入力: 同一時間帯(1時間)に登録された記録の集中
  const byHour = new Map<string, number>();
  for (const r of live) {
    const key = r.createdAt.slice(0, 13);
    byHour.set(key, (byHour.get(key) ?? 0) + 1);
  }
  const maxBurst = Math.max(0, ...byHour.values());
  if (maxBurst >= 8) {
    flags.push({
      code: "bulk-entry",
      label: "短時間での大量一括入力",
      labelEn: "Bulk entry within a short period",
      detail: `同一時間帯に${maxBurst}件の記録が登録されています。実施の都度の記録か確認が必要です。`,
      detailEn: `${maxBurst} records were registered within the same hour. Verification is advised.`,
    });
  }

  // 2) 売却直前の記録の急増: 売却相談前30日の記録数が月次平均の3倍以上
  for (const sale of sales.filter((s) => s.machineId === machine.id)) {
    const saleDate = sale.createdAt.slice(0, 10);
    const before = live.filter(
      (r) => r.createdAt.slice(0, 10) <= saleDate && monthsBetween(r.createdAt.slice(0, 10), saleDate) < 1,
    ).length;
    const spanMonths = Math.max(
      monthsBetween(live[live.length - 1]?.createdAt.slice(0, 10) ?? saleDate, saleDate),
      1,
    );
    const monthlyAvg = live.length / spanMonths;
    if (before >= 6 && before > monthlyAvg * 3) {
      flags.push({
        code: "pre-sale-spike",
        label: "売却直前の記録の急増",
        labelEn: "Surge of records immediately before sale",
        detail: `売却相談前30日間に${before}件の記録が集中しています(月次平均の3倍超)。`,
        detailEn: `${before} records were concentrated in the 30 days before the sale request (over 3x the monthly average).`,
      });
      break;
    }
  }

  // 3) 遡及登録: 作業日と登録日時の乖離が14日を超える記録(移行データ除く)
  const retro = live.filter(
    (r) => monthsBetween(r.workDate, r.createdAt.slice(0, 10)) > 0 &&
      (new Date(r.createdAt.slice(0, 10)).getTime() - new Date(r.workDate).getTime()) / 86400000 > 14,
  );
  if (retro.length >= 3) {
    flags.push({
      code: "retroactive",
      label: "遡及登録の疑い",
      labelEn: "Possible retroactive registration",
      detail: `作業日から14日以上遅れて登録された記録が${retro.length}件あります。`,
      detailEn: `${retro.length} records were registered more than 14 days after the stated work date.`,
    });
  }

  // 4) 記録間隔の不自然な規則性: 点検記録の間隔が完全に一定(n>=8)
  const insp = live
    .filter((r) => r.type === "inspection")
    .map((r) => r.workDate)
    .sort();
  if (insp.length >= 8) {
    const gaps = new Set<number>();
    for (let i = 1; i < insp.length; i++) {
      gaps.add(Math.round((new Date(insp[i]).getTime() - new Date(insp[i - 1]).getTime()) / 86400000));
    }
    if (gaps.size === 1) {
      flags.push({
        code: "uniform-interval",
        label: "記録間隔の不自然な規則性",
        labelEn: "Unnaturally uniform record intervals",
        detail: "すべての点検記録が完全に同一の間隔で登録されています。",
        detailEn: "All inspection records were registered at exactly identical intervals.",
      });
    }
  }

  return flags;
}
