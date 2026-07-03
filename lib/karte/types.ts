// マシンカルテ ドメイン型定義

export type MachineCategory =
  | "工作機械"
  | "射出成形機"
  | "プレス機"
  | "食品機械"
  | "搬送・包装機械"
  | "その他";

export type MachineStatus = "active" | "idle" | "listed" | "sold";

export type RecordType =
  | "inspection" // 定期点検
  | "repair" // 修理
  | "parts" // 部品交換
  | "legal" // 法定点検(定期自主検査等)
  | "hygiene" // 衛生記録(HACCP)
  | "note"; // 申し送り・メモ

export type CertGrade = "A" | "B" | "C";

export type SaleStatus =
  | "consulting" // 売却相談受付
  | "assessing" // 査定準備中
  | "referred" // 提携業者へ紹介済み
  | "negotiating" // 商談中
  | "closed" // 成約
  | "cancelled"; // 取り下げ

export interface Company {
  id: string;
  name: string;
  nameEn: string;
  plantName: string;
  address: string;
  industry: string;
  joinedAt: string; // ISO date
}

export interface User {
  id: string;
  companyId: string;
  name: string;
  nameKana: string;
  role: "admin" | "field";
  title: string; // 役職・担当
  loginId: string;
  password: string;
}

export interface LegalPlan {
  kind: "プレス機 定期自主検査" | "食品機械 衛生管理(HACCP)" | "フォークリフト 特定自主検査";
  intervalMonths: number;
  note: string;
}

export interface MachineDoc {
  id: string;
  title: string;
  kind: "取扱説明書" | "検査成績書" | "図面" | "その他";
  fileId?: string;
}

export interface Machine {
  id: string;
  companyId: string;
  code: string; // QRコード短縮コード (例: 7F3A-2B9C)
  name: string; // 呼称 (例: NC旋盤 1号機)
  nameEn: string;
  category: MachineCategory;
  maker: string;
  makerEn: string;
  model: string;
  serialNo: string;
  yearMade: number; // 製造年
  purchasedAt: string; // 導入年月 ISO
  acquisition: "new" | "used";
  location: string; // 設置場所 (例: 第一工場 A棟)
  status: MachineStatus;
  ratedPower?: string; // 定格等の仕様メモ
  legalPlan?: LegalPlan;
  docs: MachineDoc[];
  photoFileId?: string;
  registeredAt: string; // カルテ登録日 ISO
  notes?: string;
}

export interface ChecklistItem {
  label: string;
  result: "ok" | "ng" | "na";
}

export interface PartReplacement {
  name: string;
  nameEn: string;
  qty: number;
}

export interface MaintRecord {
  id: string;
  machineId: string;
  companyId: string;
  userId: string;
  type: RecordType;
  title: string;
  titleEn: string;
  memo: string;
  structured?: {
    symptom?: string; // 状況
    cause?: string; // 原因
    action?: string; // 処置
  };
  checklist?: ChecklistItem[];
  parts?: PartReplacement[];
  photoFileIds: string[];
  cost?: number; // 円
  downtimeHours?: number;
  vendor?: string; // 外部業者名
  workDate: string; // 作業日 ISO date
  createdAt: string; // ISO datetime
  autoClassified: boolean;
}

export interface CertSummary {
  ownershipMonths: number;
  coverageRatio: number; // 0-1 履歴カバレッジ
  legalCompliance: boolean;
  counts: {
    inspection: number;
    repair: number;
    parts: number;
    legal: number;
    hygiene: number;
    total: number;
  };
  firstRecordAt: string | null;
  lastRecordAt: string | null;
  majorParts: PartReplacement[];
}

export interface Certificate {
  id: string;
  certNo: string; // MC-2026-0001
  machineId: string;
  companyId: string;
  grade: CertGrade;
  issuedAt: string;
  expiresAt: string; // 発行から6ヶ月
  summary: CertSummary;
  machineSnapshot: {
    name: string;
    nameEn: string;
    category: MachineCategory;
    maker: string;
    makerEn: string;
    model: string;
    serialNo: string;
    yearMade: number;
    location: string;
  };
  recordIds: string[]; // 発行時点の履歴スナップショット
  withEnglish: boolean;
  fee: number;
  revoked: boolean;
}

export interface Partner {
  id: string;
  name: string;
  type: "買取業者" | "マーケットプレイス" | "輸出商社";
  regions: string;
  specialties: string;
  feeNote: string;
}

export interface SaleCase {
  id: string;
  caseNo: string; // SL-2026-0001
  machineId: string;
  companyId: string;
  status: SaleStatus;
  partnerId?: string;
  certificateId?: string;
  askingPrice?: number;
  agreedPrice?: number;
  feeRate: number; // 0.05
  timeline: { at: string; label: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
}

export interface StoredFile {
  id: string;
  name: string;
  mime: string;
  size: number;
  createdAt: string;
}

export interface Database {
  companies: Company[];
  users: User[];
  machines: Machine[];
  records: MaintRecord[];
  certificates: Certificate[];
  partners: Partner[];
  sales: SaleCase[];
  sessions: Session[];
  files: StoredFile[];
  counters: { cert: number; sale: number };
}

export const RECORD_TYPE_LABEL: Record<RecordType, string> = {
  inspection: "定期点検",
  repair: "修理",
  parts: "部品交換",
  legal: "法定点検",
  hygiene: "衛生記録",
  note: "申し送り",
};

export const RECORD_TYPE_LABEL_EN: Record<RecordType, string> = {
  inspection: "Periodic inspection",
  repair: "Repair",
  parts: "Parts replacement",
  legal: "Statutory inspection",
  hygiene: "Hygiene record",
  note: "Handover note",
};

export const MACHINE_STATUS_LABEL: Record<MachineStatus, string> = {
  active: "稼働中",
  idle: "遊休",
  listed: "売却手続中",
  sold: "売却済",
};

export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  consulting: "売却相談",
  assessing: "査定準備中",
  referred: "業者紹介済",
  negotiating: "商談中",
  closed: "成約",
  cancelled: "取り下げ",
};

export const GRADE_DESCRIPTION: Record<CertGrade, string> = {
  A: "導入時からの全履歴と規定どおりの定期点検が確認できる",
  B: "直近3年以上の継続した履歴がある",
  C: "基本情報と部分的な履歴がある",
};

export const GRADE_DESCRIPTION_EN: Record<CertGrade, string> = {
  A: "Complete history since introduction with statutory inspections performed as required",
  B: "Continuous maintenance history for the most recent three years or more",
  C: "Basic machine information with partial maintenance history",
};
