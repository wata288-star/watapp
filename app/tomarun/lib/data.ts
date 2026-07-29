/**
 * TOMARUN プロトタイプ用のモックデータ。
 * 実装時はテナント（メーカー）単位に分離した API から取得する。
 */

export type Machine = {
  id: string;
  name: string;
  serial: string;
  category: string;
  treeCount: number;
  videoCount: number;
};

export const machines: Machine[] = [
  { id: "mr100", name: "MR100", serial: "SA20001", category: "印刷・加工機", treeCount: 4, videoCount: 12 },
  { id: "mc100", name: "MC100", serial: "SA20014", category: "成形機", treeCount: 3, videoCount: 8 },
  { id: "cn1000", name: "CN1000", serial: "SB10022", category: "マシニングセンタ", treeCount: 0, videoCount: 6 },
  { id: "cm125", name: "CM125", serial: "SB10045", category: "研削盤", treeCount: 0, videoCount: 4 },
  { id: "fil100", name: "FiL100", serial: "SC30007", category: "レーザー加工機", treeCount: 1, videoCount: 5 },
  { id: "lq10", name: "LQ10", serial: "SC30019", category: "射出成形機", treeCount: 0, videoCount: 3 },
  { id: "mx2000", name: "MX2000", serial: "SD40002", category: "旋盤", treeCount: 2, videoCount: 7 },
  { id: "gr12", name: "GR12", serial: "SD40031", category: "粉砕機", treeCount: 0, videoCount: 2 },
];

export function findMachine(id: string) {
  return machines.find((m) => m.id === id);
}

/* -------------------------------------------------------------------------
   トラブルシューティング（分岐ツリー）
   ------------------------------------------------------------------------- */

export type TreeChoice = {
  label: string;
  detail?: string;
  next: string;
};

export type TreeNode = {
  id: string;
  question: string;
  hint?: string;
  choices: TreeChoice[];
};

export type TreeResult = {
  id: string;
  cause: string;
  action: string;
  /** 「上記を確認した上で◯◯」に続く、対応記録の下書き用の処置文 */
  draft: string;
  videoId?: string;
  relatedRecordId?: string;
  docTopicId?: string;
};

export type Tree = {
  id: string;
  machineId: string;
  title: string;
  errorCodes: string[];
  version: string;
  depth: number;
  updatedAt: string;
  rootId: string;
  nodes: Record<string, TreeNode>;
  results: Record<string, TreeResult>;
};

export const trees: Tree[] = [
  {
    id: "dpf-service",
    machineId: "mr100",
    title: "DPFサービスルーチン未完了（差圧異常）",
    errorCodes: ["KWP809", "KWP810"],
    version: "公開版 v1",
    depth: 3,
    updatedAt: "2026/07/12",
    rootId: "q1",
    nodes: {
      q1: {
        id: "q1",
        question: "診断機Serdiaで確認した際、KWP809およびKWP810のエラーコードが検出されましたか？",
        hint: "診断機を接続し、故障コード一覧を表示してください",
        choices: [
          { label: "KWP809/810を検出した", next: "q2" },
          { label: "KWP809/810以外のエラーを検出した", next: "r-other" },
        ],
      },
      q2: {
        id: "q2",
        question: "DPF差圧データは通常の動作範囲を超えていますか？",
        hint: "Serdiaの実測データ画面で差圧値を確認",
        choices: [
          { label: "はい、範囲を超えている", next: "q3" },
          { label: "いいえ、範囲内である", next: "r-sensor-wiring" },
        ],
      },
      q3: {
        id: "q3",
        question: "EGR配管の詰まりは確認済みですか？",
        hint: "配管を取り外し、内部の堆積物を目視で確認",
        choices: [
          { label: "確認済みで異常なし", next: "r-dpf-sensor" },
          { label: "未確認", next: "r-check-egr" },
          { label: "詰まりを確認した", next: "r-egr-clean" },
        ],
      },
    },
    results: {
      "r-dpf-sensor": {
        id: "r-dpf-sensor",
        cause: "DPF差圧センサーの故障",
        action:
          "EGR配管に異常がないため、DPF差圧センサーの故障が原因の可能性があります。エンジンを停止し電源を遮断した上でDPF差圧センサーを交換してください。交換後、Serdiaにて再度DPFサービスルーチンを実行し、エラーが解消され正常完了することを確認してください。",
        draft:
          "DPF差圧センサーを交換。交換後、診断機で再度サービスルーチンを実行し、エラーが解消され正常完了することを確認した。",
        videoId: "mr100-dpf-sensor",
        relatedRecordId: "2026-010",
        docTopicId: "mr100-error-list",
      },
      "r-egr-clean": {
        id: "r-egr-clean",
        cause: "EGR配管の詰まり",
        action:
          "EGR配管の堆積物が差圧異常の原因です。配管を取り外して洗浄し、再組付け後にDPFサービスルーチンを実行してください。堆積が著しい場合はEGRクーラーの点検も併せて実施してください。",
        draft:
          "EGR配管を取り外して洗浄し、再組付け後にDPFサービスルーチンを実行して正常完了することを確認した。",
        videoId: "mr100-egr-clean",
        docTopicId: "mr100-egr",
      },
      "r-check-egr": {
        id: "r-check-egr",
        cause: "EGR配管の確認が未実施",
        action:
          "先にEGR配管の詰まりを確認してください。動画マニュアルの手順に従って配管を取り外し、内部の堆積状況を目視で確認した上で、このトラブルシューティングをやり直してください。",
        draft:
          "EGR配管の確認が未実施のため、動画マニュアルの手順に沿って確認を行うこととした。",
        videoId: "mr100-egr-clean",
      },
      "r-sensor-wiring": {
        id: "r-sensor-wiring",
        cause: "差圧センサー配線の接触不良",
        action:
          "差圧値が正常範囲であるにもかかわらずエラーが出る場合、センサー配線のコネクタ接触不良や断線が疑われます。コネクタの緩み・腐食・ハーネスの擦れを点検してください。改善しない場合はメーカーへ連絡してください。",
        draft:
          "差圧センサーのコネクタと配線を点検し、接触不良を修正した。",
        docTopicId: "mr100-error-list",
      },
      "r-other": {
        id: "r-other",
        cause: "別系統のエラー",
        action:
          "KWP809/810以外のエラーコードが出ている場合は、資料集のエラーコード一覧から該当コードを検索してください。該当のトラブルシューティングがない場合は対応記録を起票してメーカーへ共有してください。",
        draft:
          "該当するツリーがないため、資料集のエラーコード一覧を確認した上でメーカーへ共有した。",
        docTopicId: "mr100-error-list",
      },
    },
  },
];

export function treesForMachine(machineId: string) {
  return trees.filter((t) => t.machineId === machineId);
}

export function findTree(id: string) {
  return trees.find((t) => t.id === id);
}

/* -------------------------------------------------------------------------
   動画マニュアル
   ------------------------------------------------------------------------- */

export type Chapter = { at: string; title: string };

export type Video = {
  id: string;
  machineId: string;
  part: string;
  title: string;
  duration: string;
  updatedAt: string;
  saved: boolean;
  chapters: Chapter[];
  summary: string;
};

export const videos: Video[] = [
  {
    id: "mr100-dpf-sensor",
    machineId: "mr100",
    part: "エンジン・排気系",
    title: "DPF差圧センサーの交換手順",
    duration: "4:32",
    updatedAt: "2026/06/28",
    saved: true,
    summary: "電源遮断からセンサー交換、サービスルーチン再実行までを一本で解説します。",
    chapters: [
      { at: "0:00", title: "安全確認と電源遮断" },
      { at: "0:48", title: "カバーの取り外し" },
      { at: "1:35", title: "差圧センサーの取り外し" },
      { at: "2:40", title: "新品センサーの取り付け" },
      { at: "3:25", title: "サービスルーチンの再実行" },
    ],
  },
  {
    id: "mr100-egr-clean",
    machineId: "mr100",
    part: "エンジン・排気系",
    title: "EGR配管の取り外しと洗浄",
    duration: "6:10",
    updatedAt: "2026/06/14",
    saved: false,
    summary: "配管の脱着と堆積物の洗浄方法、再組付け時の締付トルクまで。",
    chapters: [
      { at: "0:00", title: "必要な工具" },
      { at: "0:55", title: "配管の取り外し" },
      { at: "2:30", title: "堆積物の洗浄" },
      { at: "4:40", title: "再組付けと締付トルク" },
    ],
  },
  {
    id: "mr100-daily-check",
    machineId: "mr100",
    part: "日常点検",
    title: "始業前点検の手順",
    duration: "3:05",
    updatedAt: "2026/05/30",
    saved: true,
    summary: "毎朝の点検項目を順番どおりに確認できます。",
    chapters: [
      { at: "0:00", title: "外観・漏れの確認" },
      { at: "1:10", title: "油量・冷却水の確認" },
      { at: "2:05", title: "安全装置の作動確認" },
    ],
  },
  {
    id: "mr100-roller",
    machineId: "mr100",
    part: "駆動・ローラー部",
    title: "ローラーベアリングの交換",
    duration: "8:44",
    updatedAt: "2026/04/18",
    saved: false,
    summary: "異音発生時のベアリング交換手順と、交換後の振動値の確認方法。",
    chapters: [
      { at: "0:00", title: "異音の切り分け" },
      { at: "1:20", title: "ローラーの取り外し" },
      { at: "3:50", title: "ベアリング圧入" },
      { at: "6:30", title: "試運転と振動値確認" },
    ],
  },
  {
    id: "mr100-hydraulic",
    machineId: "mr100",
    part: "油圧ユニット",
    title: "油圧ユニットの圧力調整",
    duration: "5:20",
    updatedAt: "2026/03/22",
    saved: false,
    summary: "圧力が上がらない場合のリリーフ弁調整とエア抜き。",
    chapters: [
      { at: "0:00", title: "圧力計の確認" },
      { at: "1:15", title: "リリーフ弁の調整" },
      { at: "3:30", title: "エア抜き" },
    ],
  },
];

export function videosForMachine(machineId: string) {
  return videos.filter((v) => v.machineId === machineId);
}

export function findVideo(id: string) {
  return videos.find((v) => v.id === id);
}

export function partsForMachine(machineId: string) {
  const list = videosForMachine(machineId);
  return Array.from(new Set(list.map((v) => v.part)));
}

/* -------------------------------------------------------------------------
   対応記録
   ------------------------------------------------------------------------- */

export type RecordStatus = "done" | "draft" | "shared";

export type MaintRecord = {
  id: string;
  machineId: string;
  machineName: string;
  title: string;
  kind: string;
  genre: string;
  cause: string;
  occurredAt: string;
  restoredAt?: string;
  downtimeMin?: number;
  assignee: string;
  hourMeter: number;
  status: RecordStatus;
  fromTree?: string;
  body: string;
  checklist?: string[];
  photos: number;
};

export const records: MaintRecord[] = [
  {
    id: "2026-014",
    machineId: "mr100",
    machineName: "MR100（SA20001）",
    title: "DPF差圧センサー交換",
    kind: "トラブル対応",
    genre: "機械系",
    cause: "破損",
    occurredAt: "2026/07/27 15:26",
    restoredAt: "2026/07/27 16:12",
    downtimeMin: 46,
    assignee: "徳田 菜摘",
    hourMeter: 1412,
    status: "done",
    fromTree: "DPFサービスルーチン未完了（差圧異常）",
    checklist: [
      "エラーコード KWP809/810 の検出を確認",
      "DPF差圧データが動作範囲を超過していることを確認",
      "EGR配管の詰まりがないことを確認",
    ],
    body: "上記を確認した上で、DPF差圧センサーを交換。交換後、診断機で再度サービスルーチンを実行し、エラーが解消され正常完了することを確認した。",
    photos: 2,
  },
  {
    id: "2026-013",
    machineId: "mx2000",
    machineName: "MX2000（SD40002）",
    title: "主軸から異音・E-310で停止",
    kind: "トラブル対応",
    genre: "機械系",
    cause: "摩耗",
    occurredAt: "2026/07/24 09:05",
    restoredAt: "2026/07/24 11:40",
    downtimeMin: 155,
    assignee: "村上 拓真",
    hourMeter: 8890,
    status: "shared",
    body: "加工中に主軸から異音、E-310表示で停止。手回しで確認しゴロつきあり、ベアリング周辺の温度上昇も確認。ベアリングを交換し、試運転で振動値が基準内に収まることを確認した。",
    photos: 3,
  },
  {
    id: "2026-012",
    machineId: "mr100",
    machineName: "MR100（SA20001）",
    title: "始業前点検",
    kind: "点検",
    genre: "定期点検",
    cause: "―",
    occurredAt: "2026/07/24 08:10",
    assignee: "徳田 菜摘",
    hourMeter: 1398,
    status: "done",
    body: "始業前点検を実施。油量・冷却水・安全装置の作動、いずれも異常なし。",
    photos: 0,
  },
  {
    id: "2026-011",
    machineId: "fil100",
    machineName: "FiL100（SC30007）",
    title: "集塵ファンの風量低下（写真のみ仮保存）",
    kind: "トラブル対応",
    genre: "機械系",
    cause: "未分類",
    occurredAt: "2026/07/23 14:02",
    assignee: "村上 拓真",
    hourMeter: 4120,
    status: "draft",
    body: "",
    photos: 2,
  },
  {
    id: "2026-010",
    machineId: "mr100",
    machineName: "MR100（SA20001）",
    title: "DPF再生が完了しない",
    kind: "トラブル対応",
    genre: "機械系",
    cause: "詰まり",
    occurredAt: "2026/06/30 13:48",
    restoredAt: "2026/06/30 15:30",
    downtimeMin: 102,
    assignee: "石田 遼",
    hourMeter: 1290,
    status: "done",
    body: "DPF再生が途中で停止。EGR配管に堆積物を確認したため洗浄を実施。再組付け後にサービスルーチンを実行し正常完了を確認した。",
    photos: 4,
  },
];

export function findRecord(id: string) {
  return records.find((r) => r.id === id);
}

export const causeChips = ["摩耗", "破損", "詰まり", "電気系", "油圧系", "操作起因", "その他"];
export const kindChips = ["トラブル対応", "点検", "部品交換", "調整"];
export const phraseChips = [
  "異音が発生した",
  "エラー表示で停止した",
  "部品を交換した",
  "清掃・洗浄した",
  "増し締め・調整した",
  "試運転で正常を確認した",
];

/* -------------------------------------------------------------------------
   資料集（システム化された取扱説明書）
   ------------------------------------------------------------------------- */

export type DocBlock =
  | { type: "text"; body: string }
  | { type: "heading"; body: string }
  | { type: "steps"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "figure"; caption: string }
  | { type: "danger"; label: string; body: string }
  | { type: "warn"; label: string; body: string };

export type DocTopic = {
  id: string;
  machineId: string;
  chapter: string;
  title: string;
  summary: string;
  tags: string[];
  errorCodes: string[];
  sourceEdition: string;
  favorite: boolean;
  offline: boolean;
  blocks: DocBlock[];
  relatedVideoId?: string;
  relatedTreeId?: string;
};

export const docTopics: DocTopic[] = [
  {
    id: "mr100-error-list",
    machineId: "mr100",
    chapter: "エラー対応",
    title: "エラーコード一覧（KWP系）",
    summary: "診断機に表示されるKWP系エラーコードの意味と一次対応。",
    tags: ["エラーコード", "診断機", "Serdia"],
    errorCodes: ["KWP809", "KWP810", "KWP812"],
    sourceEdition: "元取説 第4版に基づく",
    favorite: true,
    offline: true,
    relatedTreeId: "dpf-service",
    relatedVideoId: "mr100-dpf-sensor",
    blocks: [
      {
        type: "text",
        body: "診断機Serdiaを接続して読み出せるエラーコードのうち、DPF・EGR系統に関するものを示します。コードは複数同時に検出される場合があります。",
      },
      {
        type: "table",
        head: ["コード", "内容", "一次対応"],
        rows: [
          ["KWP809", "DPF差圧 上限超過", "差圧センサー・EGR配管の確認"],
          ["KWP810", "DPFサービスルーチン未完了", "ルーチンの再実行"],
          ["KWP812", "排気温度センサー異常", "配線・コネクタの点検"],
        ],
      },
      {
        type: "danger",
        label: "危険",
        body: "エンジン停止直後は排気系が高温です。冷却を待たずに触れると重度の火傷を負うおそれがあります。必ず十分に冷えてから作業してください。",
      },
      {
        type: "warn",
        label: "注意",
        body: "エラーコードを消去する前に、必ず発生時のデータを記録してください。消去すると原因追究に必要な情報が失われます。",
      },
    ],
  },
  {
    id: "mr100-daily",
    machineId: "mr100",
    chapter: "日常点検",
    title: "日常点検の手順",
    summary: "始業前に確認する項目を順番に示します。所要およそ5分。",
    tags: ["点検", "始業前", "日常"],
    errorCodes: [],
    sourceEdition: "元取説 第4版に基づく",
    favorite: true,
    offline: true,
    relatedVideoId: "mr100-daily-check",
    blocks: [
      { type: "heading", body: "点検の前に" },
      {
        type: "text",
        body: "点検は必ず機械を停止し、主電源を切った状態で行ってください。可動部に手を入れる場合は電源のロックアウトを実施します。",
      },
      { type: "heading", body: "手順" },
      {
        type: "steps",
        items: [
          "外観を確認し、油漏れ・水漏れがないことを確認する",
          "作動油タンクの油量がゲージの上下限の間にあることを確認する",
          "冷却水量を確認し、不足していれば補給する",
          "非常停止ボタンを押し、確実に停止することを確認する",
          "安全カバーのインターロックが機能することを確認する",
        ],
      },
      {
        type: "warn",
        label: "注意",
        body: "非常停止の作動確認は、周囲に人がいないことを確認してから行ってください。",
      },
      { type: "figure", caption: "図1: 作動油ゲージの位置" },
    ],
  },
  {
    id: "mr100-egr",
    machineId: "mr100",
    chapter: "調整・整備",
    title: "EGR配管の清掃",
    summary: "堆積物による差圧異常が出た場合の清掃方法。",
    tags: ["EGR", "清掃", "差圧"],
    errorCodes: ["KWP809"],
    sourceEdition: "元取説 第4版に基づく",
    favorite: false,
    offline: false,
    relatedVideoId: "mr100-egr-clean",
    relatedTreeId: "dpf-service",
    blocks: [
      {
        type: "danger",
        label: "危険",
        body: "作業前に必ず主電源を遮断し、排気系が常温まで下がっていることを確認してください。",
      },
      { type: "heading", body: "必要な工具" },
      { type: "text", body: "12mm・14mmスパナ、トルクレンチ、専用洗浄剤、ウエス。" },
      { type: "heading", body: "手順" },
      {
        type: "steps",
        items: [
          "クランプを緩め、EGR配管を機体から取り外す",
          "配管内部の堆積物を専用洗浄剤で除去する",
          "内部を目視し、貫通していることを確認する",
          "ガスケットを新品に交換して組み付ける",
          "締付トルク 25N・m で固定する",
        ],
      },
      {
        type: "warn",
        label: "注意",
        body: "ガスケットは再使用しないでください。排気漏れの原因になります。",
      },
    ],
  },
  {
    id: "mr100-hydraulic-adj",
    machineId: "mr100",
    chapter: "調整・整備",
    title: "油圧ユニットの調整方法",
    summary: "圧力が規定値まで上がらない場合の調整手順。",
    tags: ["油圧", "調整", "圧力"],
    errorCodes: [],
    sourceEdition: "元取説 第4版に基づく",
    favorite: false,
    offline: false,
    relatedVideoId: "mr100-hydraulic",
    blocks: [
      { type: "heading", body: "規定値" },
      {
        type: "table",
        head: ["項目", "規定値"],
        rows: [
          ["主回路圧力", "13.5 MPa ± 0.5"],
          ["パイロット圧", "3.5 MPa ± 0.2"],
          ["作動油温度", "35〜55 ℃"],
        ],
      },
      { type: "heading", body: "手順" },
      {
        type: "steps",
        items: [
          "作動油温度が35℃以上になるまで暖機運転する",
          "圧力計を主回路のチェックポートに接続する",
          "リリーフ弁のロックナットを緩める",
          "調整ねじを回して規定値に合わせる",
          "ロックナットを締め、再度圧力を確認する",
        ],
      },
    ],
  },
  {
    id: "mr100-spec",
    machineId: "mr100",
    chapter: "仕様・諸元",
    title: "主要諸元",
    summary: "本機の基本仕様。",
    tags: ["仕様", "諸元"],
    errorCodes: [],
    sourceEdition: "元取説 第4版に基づく",
    favorite: false,
    offline: false,
    blocks: [
      {
        type: "table",
        head: ["項目", "仕様"],
        rows: [
          ["電源", "三相 200V 50/60Hz"],
          ["最大加工幅", "1,000 mm"],
          ["質量", "3,200 kg"],
          ["作動油", "ISO VG46"],
        ],
      },
    ],
  },
];

export function findTopic(id: string) {
  return docTopics.find((t) => t.id === id);
}

export function topicsForMachine(machineId: string) {
  return docTopics.filter((t) => t.machineId === machineId);
}

/* -------------------------------------------------------------------------
   お知らせ
   ------------------------------------------------------------------------- */

export type Notice = {
  id: string;
  kind: "generated" | "content" | "system";
  title: string;
  body: string;
  at: string;
  unread: boolean;
};

export const notices: Notice[] = [
  {
    id: "n1",
    kind: "generated",
    title: "新しいトラブルシューティングが3件公開されました",
    body: "先週の対応記録から自動生成され、メーカーの承認を経て公開されました。MR100 / MX2000 が対象です。",
    at: "今日 07:00",
    unread: true,
  },
  {
    id: "n2",
    kind: "content",
    title: "動画マニュアルを1件追加しました",
    body: "MR100「DPF差圧センサーの交換手順」にチャプターが追加されました。",
    at: "昨日 18:20",
    unread: true,
  },
  {
    id: "n3",
    kind: "content",
    title: "資料集を改訂しました（第4版）",
    body: "「エラーコード一覧（KWP系）」の項目が差し替えられました。",
    at: "7/25 11:05",
    unread: false,
  },
  {
    id: "n4",
    kind: "system",
    title: "オフライン保存の同期が完了しました",
    body: "お気に入りの項目3件と動画2件を端末に保存しました。",
    at: "7/24 08:02",
    unread: false,
  },
];

export const tenant = {
  name: "フライハイト検証工場",
  appName: "TOMARUN",
  user: "徳田 菜摘",
  role: "現場作業者",
  unread: notices.filter((n) => n.unread).length,
};
