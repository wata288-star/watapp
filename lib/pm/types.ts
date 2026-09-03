// TOMARUN ビジネス管理ツール — ドメイン型定義

export type Dept = "sales" | "marketing" | "product" | "funding" | "expo" | "cs";

export const DEPTS: { id: Dept; label: string; color: string }[] = [
  { id: "sales", label: "営業", color: "#d4af6a" },
  { id: "marketing", label: "マーケティング", color: "#4fc3d9" },
  { id: "product", label: "プロダクト開発", color: "#8b9df0" },
  { id: "funding", label: "資金調達", color: "#6ddba0" },
  { id: "expo", label: "展示会", color: "#e88a6a" },
  { id: "cs", label: "カスタマーサクセス", color: "#c98fd0" },
];

export type TaskStatus = "todo" | "doing" | "review" | "done" | "blocked";

export const TASK_STATUSES: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "未着手", color: "#7d919f" },
  { id: "doing", label: "進行中", color: "#4fc3d9" },
  { id: "review", label: "レビュー", color: "#d4af6a" },
  { id: "done", label: "完了", color: "#6ddba0" },
  { id: "blocked", label: "ブロック", color: "#e8735a" },
];

export type Priority = "high" | "mid" | "low";

export const PRIORITIES: { id: Priority; label: string; color: string }[] = [
  { id: "high", label: "高", color: "#e8735a" },
  { id: "mid", label: "中", color: "#d4af6a" },
  { id: "low", label: "低", color: "#7d919f" },
];

export interface PmTask {
  id: string;
  title: string;
  dept: Dept;
  owner: string;
  status: TaskStatus;
  priority: Priority;
  /** YYYY-MM-DD */
  start: string;
  /** YYYY-MM-DD */
  end: string;
  /** 0-100 */
  progress: number;
  /** 依存する先行タスクの id 一覧 */
  deps: string[];
  isMilestone: boolean;
  notes: string;
}

// ---------------------------------------------------------------- 商談 / CRM

export type Plan = "starter" | "standard" | "premium";

export const PLANS: { id: Plan; label: string; initial: number; monthly: number; note: string }[] = [
  { id: "starter", label: "スタータープラン", initial: 500_000, monthly: 50_000, note: "【検証】現場資料のAI構造化と最短5分復旧の有効性検証" },
  { id: "standard", label: "スタンダードプラン", initial: 1_000_000, monthly: 100_000, note: "【定着】AI学習フィードバックによる「動的な知恵」の資産化" },
  { id: "premium", label: "プレミアムOEMプラン", initial: 1_800_000, monthly: 180_000, note: "【収益化】自社ブランド化による保守ビジネスのプロフィットセンター化" },
];

export type DealStage =
  | "lead"
  | "qualified"
  | "meeting"
  | "proposal"
  | "poc"
  | "negotiation"
  | "won"
  | "lost";

export const DEAL_STAGES: { id: DealStage; label: string; probability: number; color: string }[] = [
  { id: "lead", label: "リード", probability: 5, color: "#7d919f" },
  { id: "qualified", label: "有望", probability: 15, color: "#5f7c8c" },
  { id: "meeting", label: "初回商談", probability: 30, color: "#4fc3d9" },
  { id: "proposal", label: "提案・見積", probability: 50, color: "#8b9df0" },
  { id: "poc", label: "PoC / 資料提供", probability: 70, color: "#d4af6a" },
  { id: "negotiation", label: "最終条件詰め", probability: 85, color: "#e8c87f" },
  { id: "won", label: "受注", probability: 100, color: "#6ddba0" },
  { id: "lost", label: "失注", probability: 0, color: "#e8735a" },
];

export interface Deal {
  id: string;
  company: string;
  industry: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  plan: Plan;
  /** 手動上書き用。0 のときはプラン定価を使う */
  amountInitial: number;
  amountMonthly: number;
  stage: DealStage;
  /** 手動上書き用。-1 のときはステージ標準確度を使う */
  probability: number;
  owner: string;
  source: string;
  nextAction: string;
  nextActionDate: string;
  expectedCloseDate: string;
  painPoints: string;
  notes: string;
  createdAt: string;
}

// ---------------------------------------------------------------- 展示会

export interface ExpoChecklistItem {
  id: string;
  label: string;
  done: boolean;
  due: string;
  owner: string;
  category: string;
}

export interface ExpoEvent {
  id: string;
  name: string;
  venue: string;
  start: string;
  end: string;
  boothSize: string;
  cost: number;
  targetLeads: number;
  targetDeals: number;
  status: "planning" | "confirmed" | "running" | "done" | "cancelled";
  notes: string;
  checklist: ExpoChecklistItem[];
}

export type LeadHeat = "hot" | "warm" | "cold";

export interface ExpoLead {
  id: string;
  expoId: string;
  company: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  heat: LeadHeat;
  interest: string;
  memo: string;
  followedUp: boolean;
  convertedDealId: string;
  createdAt: string;
}

// ---------------------------------------------------------------- 営業資料

export type MaterialType =
  | "deck"
  | "onepager"
  | "pamphlet"
  | "roi"
  | "proposal"
  | "contract"
  | "faq"
  | "demo";

export const MATERIAL_TYPES: { id: MaterialType; label: string }[] = [
  { id: "deck", label: "提案スライド" },
  { id: "onepager", label: "1枚もの" },
  { id: "pamphlet", label: "パンフレット" },
  { id: "roi", label: "ROI試算" },
  { id: "proposal", label: "提案書" },
  { id: "contract", label: "契約書類" },
  { id: "faq", label: "FAQ・想定問答" },
  { id: "demo", label: "デモ・動画" },
];

export interface Material {
  id: string;
  title: string;
  type: MaterialType;
  audience: string;
  version: string;
  status: "draft" | "review" | "published" | "outdated";
  owner: string;
  updatedAt: string;
  url: string;
  summary: string;
  /** 使いどころ */
  useCase: string;
}

// ---------------------------------------------------------------- トークスクリプト

export interface ScriptLine {
  id: string;
  speaker: "self" | "customer";
  text: string;
  tip: string;
}

export interface TalkScript {
  id: string;
  scene: string;
  target: string;
  goal: string;
  durationMin: number;
  lines: ScriptLine[];
}

export interface Objection {
  id: string;
  category: string;
  question: string;
  answer: string;
  evidence: string;
}

export interface Battlecard {
  id: string;
  competitor: string;
  category: string;
  theirStrength: string;
  theirWeakness: string;
  ourAngle: string;
  killerQuestion: string;
}

// ---------------------------------------------------------------- 資金調達

export type InvestorStatus =
  | "longlist"
  | "contacted"
  | "meeting"
  | "dd"
  | "termsheet"
  | "closed"
  | "passed";

export const INVESTOR_STATUSES: { id: InvestorStatus; label: string; color: string }[] = [
  { id: "longlist", label: "ロングリスト", color: "#7d919f" },
  { id: "contacted", label: "コンタクト済", color: "#5f7c8c" },
  { id: "meeting", label: "面談", color: "#4fc3d9" },
  { id: "dd", label: "デューデリ", color: "#8b9df0" },
  { id: "termsheet", label: "タームシート", color: "#d4af6a" },
  { id: "closed", label: "着金", color: "#6ddba0" },
  { id: "passed", label: "見送り", color: "#e8735a" },
];

export interface Investor {
  id: string;
  name: string;
  type: "vc" | "cvc" | "angel" | "bank" | "grant" | "jgrants";
  personName: string;
  status: InvestorStatus;
  ticketMin: number;
  ticketMax: number;
  thesis: string;
  intro: string;
  nextAction: string;
  nextActionDate: string;
  memo: string;
}

export interface FundingDoc {
  id: string;
  name: string;
  category: string;
  status: "todo" | "doing" | "done";
  owner: string;
  due: string;
  memo: string;
}

export interface FundingRound {
  id: string;
  name: string;
  targetAmount: number;
  committedAmount: number;
  preMoney: number;
  targetClose: string;
  useOfFunds: string;
  status: string;
}

// ---------------------------------------------------------------- マーケ

export type Channel =
  | "web"
  | "seo"
  | "ads"
  | "sns"
  | "mail"
  | "seminar"
  | "expo"
  | "pr"
  | "partner"
  | "outbound";

export const CHANNELS: { id: Channel; label: string }[] = [
  { id: "web", label: "自社サイト" },
  { id: "seo", label: "SEO / オウンドメディア" },
  { id: "ads", label: "広告" },
  { id: "sns", label: "SNS" },
  { id: "mail", label: "メール / ナーチャリング" },
  { id: "seminar", label: "セミナー・ウェビナー" },
  { id: "expo", label: "展示会" },
  { id: "pr", label: "PR・メディア" },
  { id: "partner", label: "パートナー・代理店" },
  { id: "outbound", label: "アウトバウンド" },
];

export interface Campaign {
  id: string;
  name: string;
  channel: Channel;
  goal: string;
  kpiName: string;
  kpiTarget: number;
  kpiActual: number;
  budget: number;
  spent: number;
  start: string;
  end: string;
  status: "planning" | "running" | "done" | "paused";
  owner: string;
  learning: string;
}

export interface ContentItem {
  id: string;
  title: string;
  channel: Channel;
  format: string;
  publishDate: string;
  status: "idea" | "writing" | "review" | "scheduled" | "published";
  owner: string;
  keyword: string;
  url: string;
}

// ---------------------------------------------------------------- OKR / KPI

export interface KeyResult {
  id: string;
  title: string;
  unit: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
}

export interface Objective {
  id: string;
  title: string;
  quarter: string;
  owner: string;
  dept: Dept;
  keyResults: KeyResult[];
}

// ---------------------------------------------------------------- ニュース

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  /** 収集したキーワードカテゴリ */
  category: string;
  /** 関連度スコア 0-100 */
  score: number;
  summary: string;
  read: boolean;
  starred: boolean;
  /** 営業ネタとしてのメモ */
  memo: string;
  fetchedAt: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: string;
  enabled: boolean;
}

export interface NewsMeta {
  lastFetchedAt: string;
  lastResult: string;
  /** 1日2回の配信時刻(JST) */
  slots: string[];
}

// ---------------------------------------------------------------- ナレッジ / 意思決定

export interface KnowledgeNote {
  id: string;
  title: string;
  type: "meeting" | "decision" | "insight" | "playbook" | "risk";
  date: string;
  owner: string;
  tags: string[];
  body: string;
  /** リスクの場合のみ使用 */
  impact: Priority;
  likelihood: Priority;
  mitigation: string;
  status: "open" | "watching" | "closed";
}

// ---------------------------------------------------------------- ROI

export interface RoiInputs {
  plan: Plan;
  /** 月間トラブル対応件数 */
  monthlyCases: number;
  /** 短縮率 (0-1) */
  timeSavedRatio: number;
  /** エンジニア時間単価(円) */
  hourlyCost: number;
  /** 従来の1件あたり所要時間(分) */
  beforeMinutes: number;
  /** TOMARUN導入後の所要時間(分) */
  afterMinutes: number;
  /** 年間の想定ダウンタイム発生回数 */
  downtimeEventsPerYear: number;
  /** ダウンタイム1回あたりの損失額(円) */
  downtimeCostPerEvent: number;
  /** 年間の部品受注件数 */
  annualPartsOrders: number;
  /** 部品受注の増加率 (0-1) */
  partsUpliftRatio: number;
  /** 部品1件あたりの粗利(円) */
  partsMarginPerOrder: number;
  /** OEM再販: 顧客社数 */
  oemCustomers: number;
  /** OEM再販: 1社あたり月額(円) */
  oemMonthlyPerCustomer: number;
}

export interface RoiScenario {
  id: string;
  name: string;
  dealId: string;
  inputs: RoiInputs;
  createdAt: string;
  memo: string;
}

// ---------------------------------------------------------------- 全体

export interface PmState {
  tasks: PmTask[];
  deals: Deal[];
  expos: ExpoEvent[];
  expoLeads: ExpoLead[];
  materials: Material[];
  scripts: TalkScript[];
  objections: Objection[];
  battlecards: Battlecard[];
  investors: Investor[];
  fundingDocs: FundingDoc[];
  fundingRounds: FundingRound[];
  campaigns: Campaign[];
  contents: ContentItem[];
  objectives: Objective[];
  notes: KnowledgeNote[];
  roiScenarios: RoiScenario[];
  news: NewsItem[];
  newsSources: NewsSource[];
  newsMeta: NewsMeta;
}

export type Collection = Exclude<keyof PmState, "newsMeta">;

export const COLLECTIONS: Collection[] = [
  "tasks",
  "deals",
  "expos",
  "expoLeads",
  "materials",
  "scripts",
  "objections",
  "battlecards",
  "investors",
  "fundingDocs",
  "fundingRounds",
  "campaigns",
  "contents",
  "objectives",
  "notes",
  "roiScenarios",
  "news",
  "newsSources",
];
