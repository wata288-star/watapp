export type AssetCategory =
  | "cash"
  | "deposit"
  | "real_estate"
  | "vehicle"
  | "crypto"
  | "securities"
  | "insurance"
  | "receivable"
  | "other"
  | "liability";

export interface Asset {
  id: number;
  name: string;
  category: AssetCategory;
  value: number;
  is_liability: number; // 0 | 1
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: number;
  symbol: string;
  name: string;
  market: "JP" | "US";
  currency: "JPY" | "USD";
  quantity: number;
  avg_cost: number;
  current_price: number;
  note: string | null;
  price_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus =
  | "lead"
  | "proposal"
  | "in_progress"
  | "delivered"
  | "closed"
  | "lost";

export interface Project {
  id: number;
  name: string;
  client: string | null;
  status: ProjectStatus;
  amount: number;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Snapshot {
  id: number;
  date: string;
  total: number;
  assets_total: number;
  stocks_total: number;
  liabilities_total: number;
  breakdown: string | null;
  note: string | null;
  created_at: string;
}

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  cash: "現金",
  deposit: "預貯金",
  real_estate: "不動産",
  vehicle: "車両",
  crypto: "暗号資産",
  securities: "有価証券",
  insurance: "保険",
  receivable: "売掛・貸付",
  other: "その他",
  liability: "負債",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  lead: "リード",
  proposal: "提案中",
  in_progress: "進行中",
  delivered: "納品済",
  closed: "完了・入金",
  lost: "失注",
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  lead: "#94a3b8",
  proposal: "#38bdf8",
  in_progress: "#6366f1",
  delivered: "#a78bfa",
  closed: "#22c55e",
  lost: "#f87171",
};
