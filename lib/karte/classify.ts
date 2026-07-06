import type { RecordType } from "./types";

// 現場メモの自動分類・整形
// 「写真を撮って一言メモ」の入力を、キーワード辞書に基づいて記録種別へ分類し、
// 表題を自動生成する。外部APIに依存しないルールベースの実装。

interface Rule {
  type: RecordType;
  keywords: string[];
  weight: number;
}

const RULES: Rule[] = [
  { type: "legal", keywords: ["定期自主検査", "特定自主検査", "法定", "検査標章", "年次検査"], weight: 3 },
  { type: "hygiene", keywords: ["洗浄", "殺菌", "消毒", "HACCP", "ハサップ", "衛生", "ATP", "アルコール"], weight: 2 },
  { type: "parts", keywords: ["交換", "取替", "取り替え", "付け替え", "新品に", "フィルタ", "ベルト", "パッキン", "オイル交換", "グリス", "バッテリ"], weight: 2 },
  { type: "repair", keywords: ["修理", "故障", "不良", "異音", "警報", "アラーム", "停止", "漏れ", "断線", "破損", "復旧", "調整", "直した", "なおした"], weight: 2 },
  { type: "inspection", keywords: ["点検", "確認", "チェック", "増し締め", "給油", "清掃", "測定", "巡回", "異常なし", "問題なし", "良好"], weight: 1 },
];

export interface ClassifyResult {
  type: RecordType;
  title: string;
  confidence: "high" | "medium" | "low";
}

export function classifyMemo(memo: string): ClassifyResult {
  const scores = new Map<RecordType, number>();
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (memo.includes(kw)) {
        scores.set(rule.type, (scores.get(rule.type) ?? 0) + rule.weight);
      }
    }
  }
  let best: RecordType = "note";
  let bestScore = 0;
  for (const [type, score] of scores) {
    if (score > bestScore) {
      best = type;
      bestScore = score;
    }
  }
  const title = suggestTitle(memo, best);
  return {
    type: best,
    title,
    confidence: bestScore >= 4 ? "high" : bestScore >= 2 ? "medium" : "low",
  };
}

const TITLE_PATTERNS: { match: string[]; title: string; titleEn: string }[] = [
  { match: ["定期自主検査"], title: "定期自主検査(年次)", titleEn: "Annual statutory self-inspection" },
  { match: ["特定自主検査"], title: "特定自主検査(年次)", titleEn: "Annual specified self-inspection" },
  { match: ["洗浄", "殺菌"], title: "洗浄・殺菌記録", titleEn: "Cleaning and sanitizing record" },
  { match: ["フィルタ", "交換"], title: "フィルタ交換", titleEn: "Filter replacement" },
  { match: ["ベルト", "交換"], title: "ベルト交換", titleEn: "Belt replacement" },
  { match: ["オイル", "交換"], title: "オイル交換", titleEn: "Oil change" },
  { match: ["バッテリ"], title: "バッテリ交換", titleEn: "Battery replacement" },
  { match: ["グリス"], title: "グリスアップ", titleEn: "Greasing" },
  { match: ["異音"], title: "異音の調査・対応", titleEn: "Abnormal noise investigation" },
  { match: ["漏れ"], title: "漏れの点検・処置", titleEn: "Leak check and treatment" },
  { match: ["警報"], title: "警報発生の対応", titleEn: "Alarm response" },
  { match: ["増し締め"], title: "各部増し締め点検", titleEn: "Bolt tightening inspection" },
  { match: ["給油"], title: "給油・潤滑点検", titleEn: "Lubrication check" },
  { match: ["清掃"], title: "清掃・点検", titleEn: "Cleaning and inspection" },
];

const DEFAULT_TITLES: Record<RecordType, { ja: string; en: string }> = {
  inspection: { ja: "日常点検", en: "Routine inspection" },
  repair: { ja: "修理対応", en: "Repair work" },
  parts: { ja: "部品交換", en: "Parts replacement" },
  legal: { ja: "法定点検", en: "Statutory inspection" },
  hygiene: { ja: "衛生記録", en: "Hygiene record" },
  note: { ja: "申し送り", en: "Handover note" },
};

export function suggestTitle(memo: string, type: RecordType): string {
  for (const p of TITLE_PATTERNS) {
    if (p.match.every((m) => memo.includes(m))) return p.title;
  }
  return DEFAULT_TITLES[type].ja;
}

export function suggestTitleEn(memo: string, type: RecordType): string {
  for (const p of TITLE_PATTERNS) {
    if (p.match.every((m) => memo.includes(m))) return p.titleEn;
  }
  return DEFAULT_TITLES[type].en;
}
