// ROI シミュレーター計算モデル
// tomarunroisimulator.xlsx の計算構造を再現し、時間短縮の根拠を明示化したもの。
//
//   月次効果 = ①人件費削減 + ②ダウンタイム回避 + ③部品受注の増加 + ④OEM再販収益
//   月次コスト = 月額利用料（初月のみ + 初期費用）
//
// すべて円ベース。クライアント / サーバー双方から呼べる純粋関数。

import { PLANS, type Plan, type RoiInputs } from "./types";

export const DEFAULT_ROI_INPUTS: RoiInputs = {
  plan: "standard",
  monthlyCases: 50,
  timeSavedRatio: 0.6,
  hourlyCost: 5000,
  beforeMinutes: 120,
  afterMinutes: 5,
  downtimeEventsPerYear: 30,
  downtimeCostPerEvent: 50_000,
  annualPartsOrders: 50,
  partsUpliftRatio: 0.4,
  partsMarginPerOrder: 40_000,
  oemCustomers: 0,
  oemMonthlyPerCustomer: 10_000,
};

export function planPricing(plan: Plan) {
  const p = PLANS.find((x) => x.id === plan) ?? PLANS[1];
  return { initial: p.initial, monthly: p.monthly, label: p.label };
}

export interface RoiMonthRow {
  month: number;
  cost: number;
  labor: number;
  downtime: number;
  parts: number;
  oem: number;
  net: number;
  cumulative: number;
}

export interface RoiResult {
  initialCost: number;
  monthlyCost: number;
  /** 1件あたりの短縮時間(分) */
  minutesSavedPerCase: number;
  monthly: {
    labor: number;
    downtime: number;
    parts: number;
    oem: number;
    total: number;
  };
  annual: {
    labor: number;
    downtime: number;
    parts: number;
    oem: number;
    total: number;
    cost: number;
    net: number;
  };
  /** 投資回収までの月数（36ヶ月以内に回収できない場合は null） */
  paybackMonths: number | null;
  /** 1年目 ROI（%） */
  roiYear1: number;
  /** 3年目までの累積 ROI（%） */
  roiYear3: number;
  /** 年間で解放されるエンジニア工数（時間） */
  hoursFreedPerYear: number;
  rows: RoiMonthRow[];
}

export function calcRoi(input: RoiInputs, months = 36): RoiResult {
  const { initial, monthly } = planPricing(input.plan);

  const minutesSavedPerCase = Math.max(0, input.beforeMinutes - input.afterMinutes);
  const hoursSavedPerCase = minutesSavedPerCase / 60;

  // ① 人件費削減：件数 × 短縮時間 × 単価 × 効果発現率
  const labor =
    input.monthlyCases * hoursSavedPerCase * input.hourlyCost * input.timeSavedRatio;

  // ② ダウンタイム回避：年間発生回数 × 1回あたり損失 ÷ 12
  const downtime = (input.downtimeEventsPerYear * input.downtimeCostPerEvent) / 12;

  // ③ 部品受注の増加：年間受注件数 × 増加率 × 1件あたり粗利 ÷ 12
  const parts = (input.annualPartsOrders * input.partsUpliftRatio * input.partsMarginPerOrder) / 12;

  // ④ OEM 再販収益（プレミアムOEMプランのみ有効）
  const oem = input.plan === "premium" ? input.oemCustomers * input.oemMonthlyPerCustomer : 0;

  const total = labor + downtime + parts + oem;

  const rows: RoiMonthRow[] = [];
  let cumulative = -initial;
  rows.push({
    month: 0,
    cost: -initial,
    labor: 0,
    downtime: 0,
    parts: 0,
    oem: 0,
    net: -initial,
    cumulative,
  });

  let paybackMonths: number | null = null;
  for (let m = 1; m <= months; m++) {
    const net = total - monthly;
    cumulative += net;
    rows.push({ month: m, cost: -monthly, labor, downtime, parts, oem, net, cumulative });
    if (paybackMonths === null && cumulative >= 0) paybackMonths = m;
  }

  const annualCost = initial + monthly * 12;
  const annualTotal = total * 12;

  const roiYear1 = annualCost > 0 ? ((annualTotal - annualCost) / annualCost) * 100 : 0;
  const cost3y = initial + monthly * 36;
  const roiYear3 = cost3y > 0 ? ((total * 36 - cost3y) / cost3y) * 100 : 0;

  return {
    initialCost: initial,
    monthlyCost: monthly,
    minutesSavedPerCase,
    monthly: { labor, downtime, parts, oem, total },
    annual: {
      labor: labor * 12,
      downtime: downtime * 12,
      parts: parts * 12,
      oem: oem * 12,
      total: annualTotal,
      cost: annualCost,
      net: annualTotal - annualCost,
    },
    paybackMonths,
    roiYear1,
    roiYear3,
    hoursFreedPerYear: input.monthlyCases * hoursSavedPerCase * input.timeSavedRatio * 12,
    rows,
  };
}

/** 提案書にそのまま貼れる要約テキストを生成 */
export function roiSummaryText(input: RoiInputs, r: RoiResult, customer: string): string {
  const yen = (n: number) => `${Math.round(n).toLocaleString("ja-JP")}円`;
  const man = (n: number) => `約${(Math.round(n / 10000)).toLocaleString("ja-JP")}万円`;
  const lines = [
    `【${customer || "貴社"} 向け TOMARUN 投資対効果（ROI）試算】`,
    "",
    `■ 前提条件`,
    `・プラン：${planPricing(input.plan).label}（初期 ${yen(r.initialCost)} / 月額 ${yen(r.monthlyCost)}）`,
    `・月間トラブル対応件数：${input.monthlyCases}件`,
    `・原因調査時間：${input.beforeMinutes}分 → ${input.afterMinutes}分（1件あたり${r.minutesSavedPerCase}分短縮）`,
    `・エンジニア時間単価：${yen(input.hourlyCost)}`,
    `・効果発現率：${Math.round(input.timeSavedRatio * 100)}%`,
    "",
    `■ 年間効果（合計 ${man(r.annual.total)}）`,
    `・① 人件費削減：${man(r.annual.labor)}`,
    `・② ダウンタイム回避：${man(r.annual.downtime)}`,
    `・③ 部品受注の増加：${man(r.annual.parts)}`,
    input.plan === "premium" ? `・④ OEM再販収益：${man(r.annual.oem)}` : "",
    "",
    `■ 投資対効果`,
    `・年間コスト：${man(r.annual.cost)}`,
    `・年間純増：${man(r.annual.net)}`,
    `・投資回収期間：${r.paybackMonths === null ? "36ヶ月以上" : `${r.paybackMonths}ヶ月`}`,
    `・1年目ROI：${Math.round(r.roiYear1)}%　／　3年累計ROI：${Math.round(r.roiYear3)}%`,
    `・年間で解放されるエンジニア工数：約${Math.round(r.hoursFreedPerYear).toLocaleString("ja-JP")}時間`,
    "",
    `「生産を、止めない。」— 原因調査を、最短5分へ。`,
  ];
  return lines.filter((l) => l !== "").join("\n");
}
