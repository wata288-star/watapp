// 商談などの派生値の計算をひとまとめにする

import { DEAL_STAGES, PLANS, type Deal } from "@/lib/pm/types";

function planOf(deal: Deal) {
  return PLANS.find((p) => p.id === deal.plan) ?? PLANS[0];
}

export const DEALS_HELPERS = {
  /** 初期費用（未設定ならプラン定価） */
  initial(deal: Deal): number {
    return deal.amountInitial > 0 ? deal.amountInitial : planOf(deal).initial;
  },
  /** 月額（未設定ならプラン定価） */
  monthly(deal: Deal): number {
    return deal.amountMonthly > 0 ? deal.amountMonthly : planOf(deal).monthly;
  },
  /** 確度（-1 ならステージ標準値） */
  probability(deal: Deal): number {
    if (deal.probability >= 0) return deal.probability;
    return DEAL_STAGES.find((s) => s.id === deal.stage)?.probability ?? 0;
  },
  /** 初年度売上 = 初期費用 + 月額 × 12 */
  firstYearValue(deal: Deal): number {
    return DEALS_HELPERS.initial(deal) + DEALS_HELPERS.monthly(deal) * 12;
  },
  /** 加重売上 = 初年度売上 × 確度 */
  weightedValue(deal: Deal): number {
    return (DEALS_HELPERS.firstYearValue(deal) * DEALS_HELPERS.probability(deal)) / 100;
  },
};
