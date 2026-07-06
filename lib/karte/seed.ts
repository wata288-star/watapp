import type {
  Company,
  Database,
  Machine,
  MaintRecord,
  Partner,
  RecordType,
  User,
} from "./types";

// シードは決定的に生成する(乱数は線形合同法)
const SEED_NOW = "2026-07-01";

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addMonths(date: string, n: number): { y: number; m: number } {
  const [y, m] = date.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return { y: Math.floor(total / 12), m: (total % 12) + 1 };
}

interface Vocab {
  type: RecordType;
  title: string;
  titleEn: string;
  memos: string[];
}

const INSPECTION_VOCAB: Vocab = {
  type: "inspection",
  title: "月次定期点検",
  titleEn: "Monthly periodic inspection",
  memos: [
    "各部増し締め、潤滑油量・漏れなし。異音なし。",
    "摺動面の給油実施。切粉清掃、動作確認良好。",
    "油量・エア圧正常。フィルタ目詰まりなし。",
    "安全カバー・非常停止の作動確認。問題なし。",
    "電流値・温度とも基準内。ベルト張り良好。",
  ],
};

interface RepairSpec {
  title: string;
  titleEn: string;
  memo: string;
  symptom: string;
  cause: string;
  action: string;
  cost: number;
  downtimeHours: number;
  vendor?: string;
  parts?: { name: string; nameEn: string; qty: number }[];
}

function buildMonthly(
  rand: () => number,
  machineId: string,
  companyId: string,
  userIds: string[],
  from: string, // YYYY-MM-01
  toExclusive: string,
  skipRatio = 0,
): MaintRecord[] {
  const out: MaintRecord[] = [];
  let i = 0;
  for (;;) {
    const { y, m } = addMonths(from, i);
    const cur = iso(y, m, 1);
    if (cur >= toExclusive) break;
    i++;
    if (rand() < skipRatio) continue;
    const day = 8 + Math.floor(rand() * 14);
    const memo = INSPECTION_VOCAB.memos[Math.floor(rand() * INSPECTION_VOCAB.memos.length)];
    const workDate = iso(y, m, day);
    out.push({
      id: `r_${machineId}_${y}${String(m).padStart(2, "0")}`,
      machineId,
      companyId,
      userId: userIds[Math.floor(rand() * userIds.length)],
      type: "inspection",
      title: INSPECTION_VOCAB.title,
      titleEn: INSPECTION_VOCAB.titleEn,
      memo,
      photoFileIds: [],
      workDate,
      createdAt: `${workDate}T09:${String(10 + Math.floor(rand() * 40))}:00.000Z`,
      autoClassified: true,
    });
  }
  return out;
}

function repairRecord(
  machineId: string,
  companyId: string,
  userId: string,
  workDate: string,
  spec: RepairSpec,
  idSuffix: string,
): MaintRecord {
  return {
    id: `r_${machineId}_${idSuffix}`,
    machineId,
    companyId,
    userId,
    type: spec.parts && !spec.symptom ? "parts" : "repair",
    title: spec.title,
    titleEn: spec.titleEn,
    memo: spec.memo,
    structured: { symptom: spec.symptom, cause: spec.cause, action: spec.action },
    parts: spec.parts,
    photoFileIds: [],
    cost: spec.cost,
    downtimeHours: spec.downtimeHours,
    vendor: spec.vendor,
    workDate,
    createdAt: `${workDate}T13:30:00.000Z`,
    autoClassified: true,
  };
}

function partsRecord(
  machineId: string,
  companyId: string,
  userId: string,
  workDate: string,
  title: string,
  titleEn: string,
  memo: string,
  parts: { name: string; nameEn: string; qty: number }[],
  cost: number,
  idSuffix: string,
): MaintRecord {
  return {
    id: `r_${machineId}_${idSuffix}`,
    machineId,
    companyId,
    userId,
    type: "parts",
    title,
    titleEn,
    memo,
    parts,
    photoFileIds: [],
    cost,
    workDate,
    createdAt: `${workDate}T10:15:00.000Z`,
    autoClassified: true,
  };
}

const PRESS_CHECKLIST = [
  "クラッチ及びブレーキの機能",
  "クランクシャフト・フライホイールの異常有無",
  "スライド機構・コンロッドのゆるみ",
  "電気系統・非常停止装置の作動",
  "安全装置(光線式)の機能",
  "給油状態・油圧配管の漏れ",
];

function legalRecord(
  machineId: string,
  companyId: string,
  userId: string,
  workDate: string,
  idSuffix: string,
  kind: "press" | "forklift",
): MaintRecord {
  const isPress = kind === "press";
  return {
    id: `r_${machineId}_${idSuffix}`,
    machineId,
    companyId,
    userId,
    type: "legal",
    title: isPress ? "定期自主検査(年次)" : "特定自主検査(年次)",
    titleEn: isPress
      ? "Annual statutory self-inspection (power press)"
      : "Annual specified self-inspection (forklift)",
    memo: isPress
      ? "労働安全衛生法第45条に基づく年次検査。全項目良好、検査標章を更新。"
      : "労働安全衛生法に基づく特定自主検査。検査業者による実施、標章更新済み。",
    checklist: isPress
      ? PRESS_CHECKLIST.map((label) => ({ label, result: "ok" as const }))
      : undefined,
    photoFileIds: [],
    vendor: isPress ? undefined : "長野リフトサービス株式会社",
    cost: isPress ? undefined : 28000,
    workDate,
    createdAt: `${workDate}T15:00:00.000Z`,
    autoClassified: false,
  };
}

const HYGIENE_MEMOS = [
  "使用後の分解洗浄・アルコール殺菌を実施。パッキン劣化なし。",
  "接液部の洗浄・すすぎ・乾燥を確認。ATP検査基準値内。",
  "洗浄後の目視確認良好。異物・残渣なし。",
  "殺菌剤濃度を規定値で確認。記録表に転記済み。",
];

function buildHygiene(
  rand: () => number,
  machineId: string,
  companyId: string,
  userId: string,
  from: string,
  toExclusive: string,
): MaintRecord[] {
  // 週次の衛生記録
  const out: MaintRecord[] = [];
  let i = 0;
  for (;;) {
    const { y, m } = addMonths(from, Math.floor(i / 4));
    const week = i % 4;
    const day = 3 + week * 7 + Math.floor(rand() * 3);
    const cur = iso(y, m, Math.min(day, 28));
    if (cur >= toExclusive) break;
    i++;
    out.push({
      id: `r_${machineId}_h${i}`,
      machineId,
      companyId,
      userId,
      type: "hygiene",
      title: "洗浄・殺菌記録(週次)",
      titleEn: "Weekly cleaning and sanitizing record",
      memo: HYGIENE_MEMOS[Math.floor(rand() * HYGIENE_MEMOS.length)],
      photoFileIds: [],
      workDate: cur,
      createdAt: `${cur}T17:20:00.000Z`,
      autoClassified: true,
    });
  }
  return out;
}

export function buildSeed(): Database {
  const companies: Company[] = [
    {
      id: "c_yamato",
      name: "大和精密工業株式会社",
      nameEn: "Yamato Precision Industries Co., Ltd.",
      plantName: "本社第一工場",
      address: "長野県上田市住吉町2-14-8",
      industry: "自動車部品・精密機械加工",
      joinedAt: "2023-09-01",
    },
    {
      id: "c_hokuriku",
      name: "北陸フーズ株式会社",
      nameEn: "Hokuriku Foods Co., Ltd.",
      plantName: "富山工場",
      address: "富山県射水市奈呉の江11-3",
      industry: "食品製造(惣菜・製パン)",
      joinedAt: "2024-06-01",
    },
  ];

  const users: User[] = [
    {
      id: "u_tabuchi",
      companyId: "c_yamato",
      name: "田淵 誠",
      nameKana: "たぶち まこと",
      role: "admin",
      title: "製造部長",
      loginId: "yamato-admin",
      password: "demo",
    },
    {
      id: "u_sawai",
      companyId: "c_yamato",
      name: "沢井 拓真",
      nameKana: "さわい たくま",
      role: "field",
      title: "設備保全担当",
      loginId: "yamato-field",
      password: "demo",
    },
    {
      id: "u_miyoshi",
      companyId: "c_yamato",
      name: "三好 剛",
      nameKana: "みよし つよし",
      role: "field",
      title: "設備保全担当",
      loginId: "yamato-field2",
      password: "demo",
    },
    {
      id: "u_kuwahara",
      companyId: "c_hokuriku",
      name: "桑原 由紀",
      nameKana: "くわはら ゆき",
      role: "admin",
      title: "品質管理課長",
      loginId: "hokuriku-admin",
      password: "demo",
    },
  ];

  const machines: Machine[] = [
    {
      id: "m_nc1",
      companyId: "c_yamato",
      code: "K7F3-A2BC",
      name: "NC旋盤 1号機",
      nameEn: "NC Lathe No.1",
      category: "工作機械",
      maker: "ヤマザキマザック",
      makerEn: "Yamazaki Mazak",
      model: "QUICK TURN 250MSY",
      serialNo: "QT250-190447",
      yearMade: 2019,
      purchasedAt: "2019-04-01",
      acquisition: "new",
      location: "A棟 切削ライン",
      status: "active",
      ratedPower: "AC200V 26kVA / 主軸5,000min-1",
      docs: [
        { id: "d_nc1_1", title: "取扱説明書(本体)", kind: "取扱説明書" },
        { id: "d_nc1_2", title: "出荷時検査成績書", kind: "検査成績書" },
      ],
      registeredAt: "2023-09-12",
      notes: "導入時に過去の紙台帳から履歴を移行済み。",
    },
    {
      id: "m_mc1",
      companyId: "c_yamato",
      code: "M4QN-8XLD",
      name: "マシニングセンタ 3号機",
      nameEn: "Machining Center No.3",
      category: "工作機械",
      maker: "DMG森精機",
      makerEn: "DMG MORI",
      model: "CMX 1100 V",
      serialNo: "CMX11-201182",
      yearMade: 2020,
      purchasedAt: "2020-11-01",
      acquisition: "new",
      location: "A棟 切削ライン",
      status: "active",
      ratedPower: "AC200V 30kVA / BT40",
      docs: [{ id: "d_mc1_1", title: "取扱説明書(本体)", kind: "取扱説明書" }],
      registeredAt: "2023-09-12",
    },
    {
      id: "m_press1",
      companyId: "c_yamato",
      code: "P2TV-6HJW",
      name: "200tプレス 1号機",
      nameEn: "200t Power Press No.1",
      category: "プレス機",
      maker: "アマダ",
      makerEn: "AMADA",
      model: "TP-200EX",
      serialNo: "TP200-150233",
      yearMade: 2015,
      purchasedAt: "2016-02-01",
      acquisition: "new",
      location: "B棟 プレスライン",
      status: "active",
      ratedPower: "加圧能力2,000kN / AC200V",
      legalPlan: {
        kind: "プレス機 定期自主検査",
        intervalMonths: 12,
        note: "労働安全衛生法第45条・年次。検査標章の更新を含む。",
      },
      docs: [
        { id: "d_p1_1", title: "取扱説明書(本体)", kind: "取扱説明書" },
        { id: "d_p1_2", title: "定期自主検査記録表(様式)", kind: "その他" },
      ],
      registeredAt: "2023-09-12",
    },
    {
      id: "m_press2",
      companyId: "c_yamato",
      code: "P9RD-3KMF",
      name: "80tプレス 2号機",
      nameEn: "80t Power Press No.2",
      category: "プレス機",
      maker: "コマツ産機",
      makerEn: "Komatsu Industries",
      model: "OBS-80",
      serialNo: "OBS80-120871",
      yearMade: 2012,
      purchasedAt: "2013-05-01",
      acquisition: "new",
      location: "B棟 プレスライン",
      status: "listed",
      ratedPower: "加圧能力800kN / AC200V",
      legalPlan: {
        kind: "プレス機 定期自主検査",
        intervalMonths: 12,
        note: "労働安全衛生法第45条・年次。",
      },
      docs: [{ id: "d_p2_1", title: "取扱説明書(本体)", kind: "取扱説明書" }],
      registeredAt: "2023-09-12",
      notes: "ライン再編により遊休化。売却手続き中。",
    },
    {
      id: "m_inj1",
      companyId: "c_yamato",
      code: "J5WB-7NPQ",
      name: "射出成形機 5号機",
      nameEn: "Injection Molding Machine No.5",
      category: "射出成形機",
      maker: "住友重機械工業",
      makerEn: "Sumitomo Heavy Industries",
      model: "SE180EV-A",
      serialNo: "SE180-190562",
      yearMade: 2019,
      purchasedAt: "2019-08-01",
      acquisition: "new",
      location: "C棟 成形ライン",
      status: "active",
      ratedPower: "型締力1,800kN / 全電動",
      docs: [{ id: "d_i1_1", title: "取扱説明書(本体)", kind: "取扱説明書" }],
      registeredAt: "2023-10-02",
    },
    {
      id: "m_inj2",
      companyId: "c_yamato",
      code: "J8ZC-2RSU",
      name: "射出成形機 6号機",
      nameEn: "Injection Molding Machine No.6",
      category: "射出成形機",
      maker: "日精樹脂工業",
      makerEn: "Nissei Plastic Industrial",
      model: "NEX140IV",
      serialNo: "NEX14-210349",
      yearMade: 2021,
      purchasedAt: "2021-06-01",
      acquisition: "new",
      location: "C棟 成形ライン",
      status: "active",
      ratedPower: "型締力1,400kN / 全電動",
      docs: [],
      registeredAt: "2025-11-20",
      notes: "カルテ登録が新しく履歴が少ない。記録の定着を推進中。",
    },
    {
      id: "m_grind1",
      companyId: "c_yamato",
      code: "G6HK-4TVX",
      name: "平面研削盤 1号機",
      nameEn: "Surface Grinder No.1",
      category: "工作機械",
      maker: "岡本工作機械製作所",
      makerEn: "Okamoto Machine Tool Works",
      model: "PSG-64DX",
      serialNo: "PSG64-160118",
      yearMade: 2016,
      purchasedAt: "2017-03-01",
      acquisition: "used",
      location: "A棟 仕上げ工程",
      status: "active",
      docs: [{ id: "d_g1_1", title: "取扱説明書(本体)", kind: "取扱説明書" }],
      registeredAt: "2023-11-06",
    },
    {
      id: "m_lathe2",
      companyId: "c_yamato",
      code: "L3MN-9WYA",
      name: "CNC旋盤 2号機",
      nameEn: "CNC Lathe No.2",
      category: "工作機械",
      maker: "オークマ",
      makerEn: "Okuma",
      model: "LB3000EX II",
      serialNo: "LB30-170925",
      yearMade: 2017,
      purchasedAt: "2018-01-01",
      acquisition: "new",
      location: "A棟 切削ライン",
      status: "idle",
      docs: [{ id: "d_l2_1", title: "取扱説明書(本体)", kind: "取扱説明書" }],
      registeredAt: "2024-04-15",
      notes: "受注減により2026年3月から遊休。売却を検討中。",
    },
    {
      id: "m_comp1",
      companyId: "c_yamato",
      code: "C1PQ-5BDE",
      name: "スクリューコンプレッサ",
      nameEn: "Screw Compressor",
      category: "その他",
      maker: "日立産機システム",
      makerEn: "Hitachi Industrial Equipment Systems",
      model: "OSP-22M6",
      serialNo: "OSP22-180644",
      yearMade: 2018,
      purchasedAt: "2018-07-01",
      acquisition: "new",
      location: "動力棟",
      status: "active",
      docs: [{ id: "d_c1_1", title: "取扱説明書(本体)", kind: "取扱説明書" }],
      registeredAt: "2024-01-22",
    },
    {
      id: "m_fork1",
      companyId: "c_yamato",
      code: "F7GH-8JKA",
      name: "フォークリフト 2.5t",
      nameEn: "Forklift 2.5t",
      category: "その他",
      maker: "コマツ",
      makerEn: "Komatsu",
      model: "FE25-2",
      serialNo: "FE25-200311",
      yearMade: 2020,
      purchasedAt: "2020-04-01",
      acquisition: "new",
      location: "資材倉庫",
      status: "active",
      legalPlan: {
        kind: "フォークリフト 特定自主検査",
        intervalMonths: 12,
        note: "労働安全衛生法・年次。検査業者による実施。",
      },
      docs: [],
      registeredAt: "2024-01-22",
    },
    {
      id: "m_bandsaw",
      companyId: "c_yamato",
      code: "B2CD-6EFG",
      name: "帯鋸盤",
      nameEn: "Band Saw",
      category: "工作機械",
      maker: "アマダ",
      makerEn: "AMADA",
      model: "HA-250W",
      serialNo: "HA250-140507",
      yearMade: 2014,
      purchasedAt: "2014-09-01",
      acquisition: "new",
      location: "A棟 材料切断",
      status: "sold",
      docs: [],
      registeredAt: "2023-11-06",
      notes: "2026年3月に売却成約。履歴証明書(B等級)付きで適正価格での売却を実現。",
    },
    // ---- 北陸フーズ ----
    {
      id: "h_mixer",
      companyId: "c_hokuriku",
      code: "H4JK-2LMN",
      name: "真空ミキサー 1号機",
      nameEn: "Vacuum Mixer No.1",
      category: "食品機械",
      maker: "愛工舎製作所",
      makerEn: "Aicohsha Manufacturing",
      model: "ACM-100",
      serialNo: "ACM10-190072",
      yearMade: 2019,
      purchasedAt: "2019-11-01",
      acquisition: "new",
      location: "第1製造室",
      status: "active",
      legalPlan: {
        kind: "食品機械 衛生管理(HACCP)",
        intervalMonths: 1,
        note: "HACCPに基づく衛生管理計画。週次の洗浄・殺菌記録。",
      },
      docs: [{ id: "d_hm_1", title: "取扱説明書(本体)", kind: "取扱説明書" }],
      registeredAt: "2024-06-10",
    },
    {
      id: "h_filler",
      companyId: "c_hokuriku",
      code: "H8PQ-5RST",
      name: "自動充填機",
      nameEn: "Automatic Filling Machine",
      category: "食品機械",
      maker: "四国化工機",
      makerEn: "Shikoku Kakoki",
      model: "UP-FS10",
      serialNo: "UPFS-200418",
      yearMade: 2020,
      purchasedAt: "2020-06-01",
      acquisition: "new",
      location: "第2製造室",
      status: "active",
      legalPlan: {
        kind: "食品機械 衛生管理(HACCP)",
        intervalMonths: 1,
        note: "HACCPに基づく衛生管理計画。週次の洗浄・殺菌記録。",
      },
      docs: [{ id: "d_hf_1", title: "取扱説明書(本体)", kind: "取扱説明書" }],
      registeredAt: "2024-06-10",
    },
    {
      id: "h_oven",
      companyId: "c_hokuriku",
      code: "H3UV-9WXY",
      name: "トンネルオーブン",
      nameEn: "Tunnel Oven",
      category: "食品機械",
      maker: "中井機械工業",
      makerEn: "Nakai Machinery",
      model: "NTO-12",
      serialNo: "NTO12-170255",
      yearMade: 2017,
      purchasedAt: "2018-04-01",
      acquisition: "used",
      location: "第1製造室",
      status: "active",
      docs: [],
      registeredAt: "2024-07-01",
    },
    {
      id: "h_pack",
      companyId: "c_hokuriku",
      code: "H6AB-3CDE",
      name: "ピロー包装機",
      nameEn: "Pillow Packaging Machine",
      category: "搬送・包装機械",
      maker: "大森機械工業",
      makerEn: "Omori Machinery",
      model: "OW-450",
      serialNo: "OW45-210133",
      yearMade: 2021,
      purchasedAt: "2021-10-01",
      acquisition: "new",
      location: "包装室",
      status: "active",
      docs: [],
      registeredAt: "2024-07-01",
    },
  ];

  const records: MaintRecord[] = [];
  const now = SEED_NOW;

  // NC旋盤1号機: 導入時からの全履歴(紙台帳移行分を含む) → A等級相当
  {
    const rand = lcg(11);
    records.push(...buildMonthly(rand, "m_nc1", "c_yamato", ["u_sawai", "u_miyoshi"], "2019-05-01", now, 0.04));
    records.push(
      repairRecord("m_nc1", "c_yamato", "u_sawai", "2021-03-16", {
        title: "主軸異音の調査・修理",
        titleEn: "Spindle noise investigation and repair",
        memo: "加工中に主軸から連続的な異音。ベアリング損傷と判明しメーカーサービスにて交換。",
        symptom: "3,000min-1以上で主軸から連続異音。加工面粗さ悪化。",
        cause: "主軸前側ベアリングの摩耗・フレーキング。",
        action: "メーカーサービスによりベアリング一式交換、芯出し・試運転確認。",
        cost: 486000,
        downtimeHours: 52,
        vendor: "ヤマザキマザック サービス",
        parts: [{ name: "主軸ベアリングセット", nameEn: "Spindle bearing set", qty: 1 }],
      }, "rep1"),
      repairRecord("m_nc1", "c_yamato", "u_miyoshi", "2023-11-08", {
        title: "チャック爪動作不良の修理",
        titleEn: "Chuck jaw malfunction repair",
        memo: "チャック開閉が渋くワーク着座不良が発生。分解清掃とマスタージョー交換で復旧。",
        symptom: "チャック開閉動作が遅く、把握力低下の警報。",
        cause: "チャック内部への切粉侵入とグリス固着。",
        action: "分解清掃・グリスアップ、マスタージョー交換。把握力を規定値で確認。",
        cost: 92000,
        downtimeHours: 6,
        parts: [{ name: "マスタージョー", nameEn: "Master jaw", qty: 3 }],
      }, "rep2"),
      partsRecord("m_nc1", "c_yamato", "u_sawai", "2024-06-14",
        "切削油フィルタ・クーラント交換", "Cutting fluid filter and coolant replacement",
        "定期交換。タンク清掃も併せて実施。",
        [{ name: "クーラントフィルタ", nameEn: "Coolant filter", qty: 2 }], 34000, "pt1"),
      partsRecord("m_nc1", "c_yamato", "u_sawai", "2025-09-19",
        "制御装置バッテリ交換", "Controller backup battery replacement",
        "バッテリ低下警告により交換。パラメータバックアップ取得済み。",
        [{ name: "NCバッテリ", nameEn: "NC backup battery", qty: 1 }], 8500, "pt2"),
    );
  }

  // マシニングセンタ3号機: 直近3年の履歴 → B等級相当
  {
    const rand = lcg(22);
    records.push(...buildMonthly(rand, "m_mc1", "c_yamato", ["u_sawai", "u_miyoshi"], "2023-06-01", now, 0.08));
    records.push(
      repairRecord("m_mc1", "c_yamato", "u_sawai", "2024-10-03", {
        title: "ATC割出し不良の修理",
        titleEn: "ATC indexing fault repair",
        memo: "工具交換時に割出しずれの警報。近接スイッチ交換と原点再設定で復旧。",
        symptom: "ATC旋回後に工具番号ずれの警報が断続的に発生。",
        cause: "割出し確認用近接スイッチの感度低下。",
        action: "近接スイッチ交換、原点再設定、全ポット動作確認。",
        cost: 45000,
        downtimeHours: 4,
        parts: [{ name: "近接スイッチ", nameEn: "Proximity switch", qty: 1 }],
      }, "rep1"),
      partsRecord("m_mc1", "c_yamato", "u_miyoshi", "2025-04-11",
        "主軸テーパ清掃・ドローバー点検", "Spindle taper cleaning and drawbar check",
        "保持力測定は基準内。テーパ面の軽微な当たりを修正。",
        [], 0, "pt1"),
    );
  }

  // 200tプレス1号機: 全履歴+年次法定点検を規定どおり → A等級相当
  {
    const rand = lcg(33);
    records.push(...buildMonthly(rand, "m_press1", "c_yamato", ["u_sawai", "u_miyoshi"], "2019-07-01", now, 0.05));
    for (let yy = 2019; yy <= 2026; yy++) {
      records.push(legalRecord("m_press1", "c_yamato", "u_sawai", iso(yy, 6, 20), `lg${yy}`, "press"));
    }
    records.push(
      repairRecord("m_press1", "c_yamato", "u_sawai", "2022-09-27", {
        title: "クラッチ用電磁弁不良の修理",
        titleEn: "Clutch solenoid valve fault repair",
        memo: "運転中にクラッチ動作遅れ。電磁弁交換とエア配管の点検を実施。",
        symptom: "起動時にクラッチの噛み込み遅れが発生。",
        cause: "クラッチ用電磁弁のスプール摩耗。",
        action: "電磁弁交換、作動タイミングを規定値で調整・確認。",
        cost: 128000,
        downtimeHours: 9,
        parts: [{ name: "クラッチ電磁弁", nameEn: "Clutch solenoid valve", qty: 1 }],
      }, "rep1"),
      partsRecord("m_press1", "c_yamato", "u_miyoshi", "2024-12-10",
        "ブレーキライニング交換", "Brake lining replacement",
        "摩耗限度接近のため交換。すきま調整・制動確認済み。",
        [{ name: "ブレーキライニング", nameEn: "Brake lining", qty: 1 }], 156000, "pt1"),
    );
  }

  // 80tプレス2号機: 直近3年強の履歴+法定点検 → B等級・売却手続中
  {
    const rand = lcg(44);
    records.push(...buildMonthly(rand, "m_press2", "c_yamato", ["u_sawai", "u_miyoshi"], "2022-10-01", "2026-03-01", 0.1));
    for (let yy = 2023; yy <= 2026; yy++) {
      records.push(legalRecord("m_press2", "c_yamato", "u_sawai", iso(yy, 2, 15), `lg${yy}`, "press"));
    }
    records.push(
      repairRecord("m_press2", "c_yamato", "u_sawai", "2024-08-21", {
        title: "スライドギブ調整・給油装置修理",
        titleEn: "Slide gib adjustment and lubricator repair",
        memo: "スライドのガタつきを調整。自動給油ポンプの吐出不良も併せて修理。",
        symptom: "下死点付近でスライドに微小なガタ。給油警報が点灯。",
        cause: "ギブすきまの経年増大、給油ポンプの逆止弁不良。",
        action: "ギブすきま調整、給油ポンプ逆止弁交換、吐出量確認。",
        cost: 87000,
        downtimeHours: 7,
        parts: [{ name: "給油ポンプ逆止弁", nameEn: "Lubricator check valve", qty: 1 }],
      }, "rep1"),
    );
  }

  // 射出成形機5号機: 2022年以降の履歴 → B等級相当
  {
    const rand = lcg(55);
    records.push(...buildMonthly(rand, "m_inj1", "c_yamato", ["u_miyoshi", "u_sawai"], "2022-01-01", now, 0.07));
    records.push(
      repairRecord("m_inj1", "c_yamato", "u_miyoshi", "2023-07-19", {
        title: "ヒーター断線修理",
        titleEn: "Barrel heater burnout repair",
        memo: "シリンダ第2ゾーンの昇温不良。バンドヒーター交換で復旧。",
        symptom: "第2ゾーンの温度が設定に到達せず昇温警報。",
        cause: "バンドヒーターの断線。",
        action: "バンドヒーター交換、熱電対の導通確認、昇温試験良好。",
        cost: 38000,
        downtimeHours: 3,
        parts: [{ name: "バンドヒーター 2kW", nameEn: "Band heater 2kW", qty: 1 }],
      }, "rep1"),
      partsRecord("m_inj1", "c_yamato", "u_miyoshi", "2025-02-06",
        "スクリューヘッド・逆止リング交換", "Screw head and check ring replacement",
        "計量ばらつき増大のため先端部品一式を交換。成形条件を再調整。",
        [
          { name: "スクリューヘッド", nameEn: "Screw head", qty: 1 },
          { name: "逆止リング", nameEn: "Check ring", qty: 1 },
        ], 214000, "pt1"),
    );
  }

  // 射出成形機6号機: 登録が新しく履歴僅少 → C等級相当
  {
    const rand = lcg(66);
    records.push(...buildMonthly(rand, "m_inj2", "c_yamato", ["u_miyoshi"], "2025-12-01", now, 0));
  }

  // 平面研削盤: 中程度
  {
    const rand = lcg(77);
    records.push(...buildMonthly(rand, "m_grind1", "c_yamato", ["u_sawai"], "2023-11-01", now, 0.15));
    records.push(
      partsRecord("m_grind1", "c_yamato", "u_sawai", "2025-06-24",
        "砥石軸ベルト交換", "Wheel spindle belt replacement",
        "ベルトひび割れのため交換。張り調整済み。",
        [{ name: "Vベルト", nameEn: "V-belt", qty: 2 }], 12000, "pt1"),
    );
  }

  // CNC旋盤2号機: 履歴が断続的 → C等級相当・売却検討
  {
    const rand = lcg(88);
    records.push(...buildMonthly(rand, "m_lathe2", "c_yamato", ["u_miyoshi"], "2024-05-01", "2026-03-01", 0.35));
  }

  // コンプレッサ
  {
    const rand = lcg(99);
    records.push(...buildMonthly(rand, "m_comp1", "c_yamato", ["u_sawai"], "2024-02-01", now, 0.2));
    records.push(
      partsRecord("m_comp1", "c_yamato", "u_sawai", "2025-08-08",
        "吸込みフィルタ・オイル交換", "Intake filter and oil replacement",
        "定期交換(4,000時間)。ドレン排出確認。",
        [{ name: "エアフィルタ", nameEn: "Air filter", qty: 1 }, { name: "コンプレッサオイル 20L", nameEn: "Compressor oil 20L", qty: 1 }], 42000, "pt1"),
    );
  }

  // フォークリフト: 年次特定自主検査
  {
    const rand = lcg(110);
    records.push(...buildMonthly(rand, "m_fork1", "c_yamato", ["u_miyoshi"], "2024-02-01", now, 0.25));
    for (let yy = 2024; yy <= 2026; yy++) {
      records.push(legalRecord("m_fork1", "c_yamato", "u_miyoshi", iso(yy, 4, 10), `lg${yy}`, "forklift"));
    }
  }

  // 帯鋸盤(売却済み): 2026-03まで
  {
    const rand = lcg(121);
    records.push(...buildMonthly(rand, "m_bandsaw", "c_yamato", ["u_sawai"], "2023-12-01", "2026-03-01", 0.1));
  }

  // 北陸フーズ: 衛生記録中心
  {
    const rand = lcg(131);
    records.push(...buildHygiene(rand, "h_mixer", "c_hokuriku", "u_kuwahara", "2024-06-01", now));
    records.push(...buildMonthly(lcg(132), "h_mixer", "c_hokuriku", ["u_kuwahara"], "2024-06-01", now, 0.1));
    records.push(
      repairRecord("h_mixer", "c_hokuriku", "u_kuwahara", "2025-05-13", {
        title: "攪拌羽根シール交換修理",
        titleEn: "Agitator shaft seal replacement",
        memo: "軸封部から微量の漏れ。シール一式交換、洗浄・殺菌後に復帰。",
        symptom: "攪拌軸の軸封部からわずかな液漏れを確認。",
        cause: "メカニカルシールの経年摩耗。",
        action: "シール一式交換、CIP洗浄・殺菌後に生産再開。",
        cost: 65000,
        downtimeHours: 5,
        vendor: "愛工舎製作所 サービス",
        parts: [{ name: "メカニカルシール", nameEn: "Mechanical seal", qty: 1 }],
      }, "rep1"),
    );
    records.push(...buildHygiene(lcg(141), "h_filler", "c_hokuriku", "u_kuwahara", "2024-06-01", now));
    records.push(...buildMonthly(lcg(142), "h_filler", "c_hokuriku", ["u_kuwahara"], "2024-07-01", now, 0.12));
    records.push(...buildMonthly(lcg(151), "h_oven", "c_hokuriku", ["u_kuwahara"], "2024-07-01", now, 0.15));
    records.push(
      repairRecord("h_oven", "c_hokuriku", "u_kuwahara", "2026-01-28", {
        title: "搬送チェーン張り調整・修理",
        titleEn: "Conveyor chain tension adjustment and repair",
        memo: "搬送速度ムラが発生。チェーン伸びを調整し、ガイドレール摩耗部を交換。",
        symptom: "オーブン内搬送速度にムラ。焼きムラの原因に。",
        cause: "チェーンの経年伸びとガイドレールの偏摩耗。",
        action: "チェーン張り調整、ガイドレール交換、速度実測で確認。",
        cost: 118000,
        downtimeHours: 8,
        vendor: "中井機械工業 サービス",
        parts: [{ name: "ガイドレール", nameEn: "Guide rail", qty: 2 }],
      }, "rep1"),
    );
    records.push(...buildMonthly(lcg(161), "h_pack", "c_hokuriku", ["u_kuwahara"], "2024-07-01", now, 0.15));
  }

  const partners: Partner[] = [
    {
      id: "p_kanto",
      name: "関東マシントレード株式会社",
      type: "買取業者",
      regions: "関東・甲信越",
      specialties: "工作機械・プレス機の買取。自社整備工場あり",
      feeNote: "成約額の5%を紹介手数料として受領",
    },
    {
      id: "p_mplace",
      name: "マシンプレイス株式会社",
      type: "マーケットプレイス",
      regions: "全国",
      specialties: "産業機械オンライン売買。常時約4,000点を掲載",
      feeNote: "成約額の5%を紹介手数料として受領",
    },
    {
      id: "p_toa",
      name: "東亜機械貿易株式会社",
      type: "輸出商社",
      regions: "東南アジア・インド",
      specialties: "日本製中古機械の輸出。輸出貿易管理令への対応は同社が担当",
      feeNote: "成約額の5%を紹介手数料として受領。英文履歴証明書に対応",
    },
  ];

  // カルテ登録日より前の作業日を持つ記録は、導入時にExcel・紙台帳から
  // 移行した「移行データ」として区別する(登録日時は移行作業日で揃える)
  const regDates = new Map(machines.map((m) => [m.id, m.registeredAt]));
  for (const r of records) {
    const reg = regDates.get(r.machineId);
    if (reg && r.workDate < reg) {
      r.migrated = true;
      r.createdAt = `${reg}T10:00:00.000Z`;
    }
  }

  // 発行済み証明書(スナップショットは発行時点の履歴)
  const press2Records = records
    .filter((r) => r.machineId === "m_press2" && r.workDate <= "2026-05-20")
    .sort((a, b) => (a.workDate < b.workDate ? 1 : -1));
  const bandsawRecords = records
    .filter((r) => r.machineId === "m_bandsaw" && r.workDate <= "2026-01-15")
    .sort((a, b) => (a.workDate < b.workDate ? 1 : -1));

  const db: Database = {
    companies,
    users,
    machines,
    records,
    partners,
    certificates: [
      {
        id: "cert_bandsaw",
        certNo: "MC-2026-0003",
        machineId: "m_bandsaw",
        companyId: "c_yamato",
        grade: "B",
        issuedAt: "2026-01-15",
        expiresAt: "2026-07-15",
        summary: {
          ownershipMonths: 136,
          coverageRatio: 0.19,
          legalCompliance: true,
          counts: {
            inspection: bandsawRecords.filter((r) => r.type === "inspection").length,
            repair: bandsawRecords.filter((r) => r.type === "repair").length,
            parts: bandsawRecords.filter((r) => r.type === "parts").length,
            legal: 0,
            hygiene: 0,
            total: bandsawRecords.length,
            live: bandsawRecords.filter((r) => !r.migrated).length,
            migrated: bandsawRecords.filter((r) => r.migrated).length,
          },
          firstRecordAt: bandsawRecords.at(-1)?.workDate ?? null,
          lastRecordAt: bandsawRecords[0]?.workDate ?? null,
          majorParts: [],
        },
        machineSnapshot: {
          name: "帯鋸盤",
          nameEn: "Band Saw",
          category: "工作機械",
          maker: "アマダ",
          makerEn: "AMADA",
          model: "HA-250W",
          serialNo: "HA250-140507",
          yearMade: 2014,
          location: "A棟 材料切断",
        },
        recordIds: bandsawRecords.map((r) => r.id),
        auditFlags: [],
        withEnglish: false,
        fee: 20000,
        revoked: false,
      },
      {
        id: "cert_press2",
        certNo: "MC-2026-0007",
        machineId: "m_press2",
        companyId: "c_yamato",
        grade: "B",
        issuedAt: "2026-05-20",
        expiresAt: "2026-11-20",
        summary: {
          ownershipMonths: 156,
          coverageRatio: 0.26,
          legalCompliance: true,
          counts: {
            inspection: press2Records.filter((r) => r.type === "inspection").length,
            repair: press2Records.filter((r) => r.type === "repair").length,
            parts: press2Records.filter((r) => r.type === "parts").length,
            legal: press2Records.filter((r) => r.type === "legal").length,
            hygiene: 0,
            total: press2Records.length,
            live: press2Records.filter((r) => !r.migrated).length,
            migrated: press2Records.filter((r) => r.migrated).length,
          },
          firstRecordAt: press2Records.at(-1)?.workDate ?? null,
          lastRecordAt: press2Records[0]?.workDate ?? null,
          majorParts: [{ name: "給油ポンプ逆止弁", nameEn: "Lubricator check valve", qty: 1 }],
        },
        machineSnapshot: {
          name: "80tプレス 2号機",
          nameEn: "80t Power Press No.2",
          category: "プレス機",
          maker: "コマツ産機",
          makerEn: "Komatsu Industries",
          model: "OBS-80",
          serialNo: "OBS80-120871",
          yearMade: 2012,
          location: "B棟 プレスライン",
        },
        recordIds: press2Records.map((r) => r.id),
        auditFlags: [],
        withEnglish: true,
        fee: 30000,
        revoked: false,
      },
    ],
    sales: [
      {
        id: "sale_bandsaw",
        caseNo: "SL-2026-0002",
        machineId: "m_bandsaw",
        companyId: "c_yamato",
        status: "closed",
        partnerId: "p_kanto",
        certificateId: "cert_bandsaw",
        askingPrice: 1200000,
        agreedPrice: 1350000,
        feeRate: 0.05,
        timeline: [
          { at: "2026-01-08", label: "売却相談を受付" },
          { at: "2026-01-15", label: "履歴証明書(B等級)を発行" },
          { at: "2026-01-22", label: "関東マシントレード株式会社へ紹介" },
          { at: "2026-02-14", label: "現機確認・商談開始" },
          { at: "2026-03-06", label: "成約(135万円)・紹介手数料67,500円" },
        ],
        createdAt: "2026-01-08T09:00:00.000Z",
        updatedAt: "2026-03-06T15:00:00.000Z",
      },
      {
        id: "sale_press2",
        caseNo: "SL-2026-0004",
        machineId: "m_press2",
        companyId: "c_yamato",
        status: "referred",
        partnerId: "p_kanto",
        certificateId: "cert_press2",
        askingPrice: 4800000,
        feeRate: 0.05,
        timeline: [
          { at: "2026-05-12", label: "売却相談を受付" },
          { at: "2026-05-20", label: "履歴証明書(B等級・英語版付き)を発行" },
          { at: "2026-06-02", label: "関東マシントレード株式会社へ紹介" },
        ],
        createdAt: "2026-05-12T10:00:00.000Z",
        updatedAt: "2026-06-02T11:00:00.000Z",
      },
    ],
    sessions: [],
    files: [],
    counters: { cert: 8, sale: 5 },
  };

  return db;
}
