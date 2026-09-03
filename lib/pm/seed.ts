// TOMARUN ビジネス管理ツール — 初期データ
//
// アップロードされた 4 つの資料（パンフレット改善提案書 / 新価格体系・プラン提案書 /
// ROI提案書 / OEM収益化戦略デック）と ROI シミュレーターの内容をもとに、
// 実務でそのまま使える状態の初期データを構成しています。

import type { PmState } from "./types";
import { DEFAULT_ROI_INPUTS } from "./roi";

const T = "2026-09-02";

export function buildSeed(): PmState {
  return {
    // ================================================================ タスク
    tasks: [
      // --- 営業
      { id: "t-s1", title: "ターゲット企業100社リスト作成（産業機械メーカー）", dept: "sales", owner: "ワタル", status: "done", priority: "high", start: "2026-08-04", end: "2026-08-22", progress: 100, deps: [], isMilestone: false, notes: "日本産業機械工業会の会員名簿と展示会出展社リストから抽出。従業員100〜2000名、アフターサービス部門を持つ企業に絞る。" },
      { id: "t-s2", title: "アウトバウンド初回接触（30社）", dept: "sales", owner: "ワタル", status: "doing", priority: "high", start: "2026-08-25", end: "2026-09-19", progress: 55, deps: ["t-s1"], isMilestone: false, notes: "フック文言は「原因調査を、最短5分へ」。決裁者はサービス本部長・技術部長。" },
      { id: "t-s3", title: "提案書テンプレートの標準化（3プラン版）", dept: "sales", owner: "ワタル", status: "doing", priority: "high", start: "2026-09-01", end: "2026-09-12", progress: 40, deps: [], isMilestone: false, notes: "スターター/スタンダード/プレミアムOEMの3階層を1本の提案書で出し分けられる形に。" },
      { id: "t-s4", title: "ROIシミュレーターの顧客提示版を整備", dept: "sales", owner: "ワタル", status: "doing", priority: "high", start: "2026-09-03", end: "2026-09-16", progress: 20, deps: ["t-s3"], isMilestone: false, notes: "商談中にその場で数字を動かせる状態にする。年間約960万円削減のロジックを可視化。" },
      { id: "t-s5", title: "初回商談 10件実施", dept: "sales", owner: "ワタル", status: "todo", priority: "high", start: "2026-09-16", end: "2026-10-24", progress: 0, deps: ["t-s2"], isMilestone: false, notes: "" },
      { id: "t-s6", title: "パイロット導入 1社目の契約締結", dept: "sales", owner: "ワタル", status: "todo", priority: "high", start: "2026-10-27", end: "2026-11-28", progress: 0, deps: ["t-s5"], isMilestone: true, notes: "スタータープラン（初期50万/月額5万）でのスモールスタートを想定。" },
      { id: "t-s7", title: "販売パートナー（商社・SIer）2社と代理店契約", dept: "sales", owner: "ワタル", status: "todo", priority: "mid", start: "2026-11-04", end: "2026-12-19", progress: 0, deps: [], isMilestone: false, notes: "" },

      // --- マーケティング
      { id: "t-m1", title: "コーポレートサイト / LP 制作", dept: "marketing", owner: "ワタル", status: "doing", priority: "high", start: "2026-08-18", end: "2026-09-26", progress: 60, deps: [], isMilestone: false, notes: "ファーストビューは「生産を、止めない。原因調査を、最短5分へ。」" },
      { id: "t-m2", title: "パンフレット改訂版（v2）の入稿", dept: "marketing", owner: "ワタル", status: "doing", priority: "high", start: "2026-09-01", end: "2026-09-19", progress: 35, deps: [], isMilestone: false, notes: "改善提案書の優先順位①〜⑤の順で構成。AIアプリであることではなく「初日から使える」を主役に。" },
      { id: "t-m3", title: "導入事例インタビュー記事 第1弾", dept: "marketing", owner: "ワタル", status: "todo", priority: "mid", start: "2026-11-30", end: "2026-12-25", progress: 0, deps: [], isMilestone: false, notes: "パイロット企業の許諾取得が前提。" },
      { id: "t-m4", title: "ホワイトペーパー「技能継承2027年問題とAI」", dept: "marketing", owner: "ワタル", status: "todo", priority: "mid", start: "2026-09-28", end: "2026-10-23", progress: 0, deps: [], isMilestone: false, notes: "リード獲得用。ダウンロードフォームで企業名・役職を取得。" },
      { id: "t-m5", title: "ウェビナー第1回「ダウンタイムを5分で止める」", dept: "marketing", owner: "ワタル", status: "todo", priority: "mid", start: "2026-10-19", end: "2026-11-13", progress: 0, deps: ["t-m4"], isMilestone: false, notes: "" },
      { id: "t-m6", title: "SEO記事 月4本の運用体制構築", dept: "marketing", owner: "ワタル", status: "todo", priority: "low", start: "2026-10-01", end: "2026-12-26", progress: 0, deps: ["t-m1"], isMilestone: false, notes: "「予知保全」「技能継承」「ダウンタイム 削減」など。" },

      // --- プロダクト
      { id: "t-p1", title: "AI資料解析パイプラインの精度改善", dept: "product", owner: "開発", status: "doing", priority: "high", start: "2026-08-11", end: "2026-10-03", progress: 45, deps: [], isMilestone: false, notes: "機械台帳・マニュアル・トラブル事例・過去動画からトラブルシューティングを自動生成する中核機能。" },
      { id: "t-p2", title: "OEMホワイトラベル機能（ロゴ・カラー・アプリ名）", dept: "product", owner: "開発", status: "doing", priority: "high", start: "2026-09-01", end: "2026-10-31", progress: 25, deps: [], isMilestone: false, notes: "プレミアムOEMプランの中核。テナントごとのブランド設定。" },
      { id: "t-p3", title: "AI学習フィードバックループ実装", dept: "product", owner: "開発", status: "todo", priority: "high", start: "2026-10-05", end: "2026-11-27", progress: 0, deps: ["t-p1"], isMilestone: false, notes: "スタンダードプランの差別化機能。現場の運用結果を継続学習し回答精度を上げる。" },
      { id: "t-p4", title: "部品コード → 発注ページ連携", dept: "product", owner: "開発", status: "todo", priority: "mid", start: "2026-11-02", end: "2026-12-11", progress: 0, deps: ["t-p1"], isMilestone: false, notes: "手順書から部品コードを特定し発注導線へ。誤発注30%削減の根拠機能。" },
      { id: "t-p5", title: "動画検索（過去の不具合対応動画）", dept: "product", owner: "開発", status: "todo", priority: "mid", start: "2026-10-12", end: "2026-11-20", progress: 0, deps: ["t-p1"], isMilestone: false, notes: "" },
      { id: "t-p6", title: "v1.0 正式リリース", dept: "product", owner: "開発", status: "todo", priority: "high", start: "2026-12-14", end: "2026-12-18", progress: 0, deps: ["t-p2", "t-p3"], isMilestone: true, notes: "" },
      { id: "t-p7", title: "セキュリティ体制整備（ISMS準拠チェックリスト）", dept: "product", owner: "開発", status: "todo", priority: "mid", start: "2026-10-01", end: "2026-11-28", progress: 0, deps: [], isMilestone: false, notes: "大手メーカーの購買審査で必ず聞かれる。先回りして整備する。" },

      // --- 資金調達
      { id: "t-f1", title: "事業計画書・財務モデル（3ヵ年）作成", dept: "funding", owner: "ワタル", status: "doing", priority: "high", start: "2026-08-25", end: "2026-09-26", progress: 50, deps: [], isMilestone: false, notes: "ARRベースのSaaSモデル。OEM再販の上振れシナリオも併記。" },
      { id: "t-f2", title: "投資家向けピッチデック（10枚）", dept: "funding", owner: "ワタル", status: "doing", priority: "high", start: "2026-09-01", end: "2026-09-30", progress: 30, deps: ["t-f1"], isMilestone: false, notes: "課題→市場→解決策→トラクション→ビジネスモデル→競合→チーム→調達計画。" },
      { id: "t-f3", title: "VCロングリスト作成（30社）", dept: "funding", owner: "ワタル", status: "todo", priority: "mid", start: "2026-09-22", end: "2026-10-09", progress: 0, deps: [], isMilestone: false, notes: "製造業DX・ディープテック・SaaSに投資実績のあるシード〜プレシリーズA。" },
      { id: "t-f4", title: "ものづくり補助金 / IT導入補助金の申請調査", dept: "funding", owner: "ワタル", status: "todo", priority: "mid", start: "2026-09-14", end: "2026-10-02", progress: 0, deps: [], isMilestone: false, notes: "顧客側が使える補助金は営業トークにも直結する。" },
      { id: "t-f5", title: "シードラウンド ファーストクローズ", dept: "funding", owner: "ワタル", status: "todo", priority: "high", start: "2027-01-11", end: "2027-01-29", progress: 0, deps: ["t-f2", "t-f3"], isMilestone: true, notes: "" },

      // --- 展示会
      { id: "t-e1", title: "出展展示会の選定と申込", dept: "expo", owner: "ワタル", status: "done", priority: "high", start: "2026-08-04", end: "2026-08-29", progress: 100, deps: [], isMilestone: false, notes: "" },
      { id: "t-e2", title: "ブースデザイン・施工会社の選定", dept: "expo", owner: "ワタル", status: "doing", priority: "high", start: "2026-09-01", end: "2026-09-30", progress: 40, deps: ["t-e1"], isMilestone: false, notes: "キーメッセージ1つだけを大きく。「原因調査を、最短5分へ。」" },
      { id: "t-e3", title: "デモシナリオ設計（3分で伝わる実演）", dept: "expo", owner: "ワタル", status: "doing", priority: "high", start: "2026-09-08", end: "2026-10-09", progress: 15, deps: [], isMilestone: false, notes: "来場者が自分の機械のトラブルを入力→5分で手順が出る、を体験させる。" },
      { id: "t-e4", title: "配布物・ノベルティ手配", dept: "expo", owner: "ワタル", status: "todo", priority: "mid", start: "2026-10-01", end: "2026-10-30", progress: 0, deps: ["t-m2"], isMilestone: false, notes: "" },
      { id: "t-e5", title: "リード獲得オペレーション設計（名刺→CRM即時登録）", dept: "expo", owner: "ワタル", status: "todo", priority: "high", start: "2026-10-13", end: "2026-11-06", progress: 0, deps: [], isMilestone: false, notes: "その場でホット/ウォーム/コールドを判定し、48時間以内に一次フォロー。" },

      // --- カスタマーサクセス
      { id: "t-c1", title: "導入オンボーディング手順書の作成", dept: "cs", owner: "ワタル", status: "todo", priority: "high", start: "2026-10-05", end: "2026-10-30", progress: 0, deps: [], isMilestone: false, notes: "資料受領→AI分析→トラブルシューティング生成→リリースの4ステップを標準化。" },
      { id: "t-c2", title: "資料受領チェックリスト（機械台帳/マニュアル/動画）", dept: "cs", owner: "ワタル", status: "todo", priority: "high", start: "2026-10-05", end: "2026-10-16", progress: 0, deps: [], isMilestone: false, notes: "「資料を渡すだけ」を実現するための受け入れ基準。" },
      { id: "t-c3", title: "サポートSLA・保守契約書ひな形", dept: "cs", owner: "ワタル", status: "todo", priority: "mid", start: "2026-11-02", end: "2026-11-27", progress: 0, deps: [], isMilestone: false, notes: "" },
    ],

    // ================================================================ 商談
    deals: [
      { id: "d1", company: "山陽精機工業", industry: "産業機械（射出成形機）", contactName: "田中 誠", contactTitle: "サービス本部長", contactEmail: "", plan: "premium", amountInitial: 0, amountMonthly: 0, stage: "proposal", probability: -1, owner: "ワタル", source: "展示会", nextAction: "ROI試算を持って再訪、経営層同席を依頼", nextActionDate: "2026-09-09", expectedCloseDate: "2026-11-30", painPoints: "ベテラン3名が2年以内に定年。サービスエンジニアの一次回答率が低く、現地出向が多い。", notes: "OEM展開（自社ブランドの保守アプリ）に強い関心。顧客50社に月1万円で提供する構想を提示済み。", createdAt: "2026-07-15" },
      { id: "d2", company: "北陸プレス機械", industry: "産業機械（プレス機）", contactName: "佐藤 由紀", contactTitle: "技術部 次長", contactEmail: "", plan: "standard", amountInitial: 0, amountMonthly: 0, stage: "meeting", probability: -1, owner: "ワタル", source: "アウトバウンド", nextAction: "機械台帳サンプルを受領してAI解析デモを作成", nextActionDate: "2026-09-08", expectedCloseDate: "2026-12-20", painPoints: "紙のマニュアルが大量。過去のトラブル事例が個人のExcelに散在。", notes: "情シスが不在で、社内開発は不可能との認識。パッケージ導入に前向き。", createdAt: "2026-08-05" },
      { id: "d3", company: "東海食品機械", industry: "食品機械", contactName: "鈴木 健一", contactTitle: "アフターサービス課長", contactEmail: "", plan: "starter", amountInitial: 0, amountMonthly: 0, stage: "poc", probability: -1, owner: "ワタル", source: "紹介", nextAction: "PoC結果レビュー会（現場5名同席）", nextActionDate: "2026-09-11", expectedCloseDate: "2026-10-31", painPoints: "24時間稼働のラインが止まると1時間あたり数十万円の損失。", notes: "資料提供済み（マニュアル120冊分、トラブル事例380件）。AI解析結果の評価待ち。最有力。", createdAt: "2026-06-20" },
      { id: "d4", company: "関西包装システム", industry: "包装機械", contactName: "高橋 亮", contactTitle: "取締役 技術本部長", contactEmail: "", plan: "premium", amountInitial: 0, amountMonthly: 0, stage: "qualified", probability: -1, owner: "ワタル", source: "Webサイト", nextAction: "初回オンライン商談の日程調整", nextActionDate: "2026-09-05", expectedCloseDate: "2027-01-30", painPoints: "海外顧客向けサポートが電話とメールのみで負荷が高い。", notes: "多言語対応の要望あり。ロードマップ確認が必要。", createdAt: "2026-08-25" },
      { id: "d5", company: "信州工作機械", industry: "工作機械", contactName: "伊藤 修", contactTitle: "経営企画部長", contactEmail: "", plan: "standard", amountInitial: 0, amountMonthly: 0, stage: "negotiation", probability: -1, owner: "ワタル", source: "紹介", nextAction: "契約書のリーガルチェック結果を待つ", nextActionDate: "2026-09-04", expectedCloseDate: "2026-09-30", painPoints: "技術部門のブラックボックス化を経営課題として認識。", notes: "予算は承認済み。契約書の秘密保持条項のみ調整中。", createdAt: "2026-05-30" },
      { id: "d6", company: "九州搬送機器", industry: "搬送機器", contactName: "渡辺 一郎", contactTitle: "サービス部 主任", contactEmail: "", plan: "starter", amountInitial: 0, amountMonthly: 0, stage: "lead", probability: -1, owner: "ワタル", source: "展示会", nextAction: "パンフレット送付とヒアリングアポ打診", nextActionDate: "2026-09-10", expectedCloseDate: "2027-02-27", painPoints: "", notes: "展示会で名刺交換のみ。決裁権は不明。", createdAt: "2026-08-28" },
      { id: "d7", company: "中部樹脂機械", industry: "産業機械", contactName: "小林 直樹", contactTitle: "製造部長", contactEmail: "", plan: "starter", amountInitial: 0, amountMonthly: 0, stage: "lost", probability: -1, owner: "ワタル", source: "アウトバウンド", nextAction: "半年後に再アプローチ", nextActionDate: "2027-02-01", expectedCloseDate: "2026-08-31", painPoints: "", notes: "失注理由：今期の設備投資枠を使い切っており予算なし。ニーズ自体は明確にあった。来期4月の予算取りのタイミングで再提案する。", createdAt: "2026-06-10" },
    ],

    // ================================================================ 展示会
    expos: [
      {
        id: "x1",
        name: "機械要素技術展（M-Tech）",
        venue: "東京ビッグサイト",
        start: "2026-11-18",
        end: "2026-11-20",
        boothSize: "1小間（9㎡）",
        cost: 1_600_000,
        targetLeads: 150,
        targetDeals: 8,
        status: "confirmed",
        notes: "産業機械メーカーの技術者・購買が最も集まる展示会。TOMARUNのメインターゲットと完全に一致する。",
        checklist: [
          { id: "x1c1", label: "出展申込・小間位置の確定", done: true, due: "2026-08-29", owner: "ワタル", category: "申込" },
          { id: "x1c2", label: "ブースデザイン確定（キーメッセージ1つに絞る）", done: false, due: "2026-09-30", owner: "ワタル", category: "設営" },
          { id: "x1c3", label: "施工会社との契約・見積確定", done: false, due: "2026-10-09", owner: "ワタル", category: "設営" },
          { id: "x1c4", label: "デモ環境の構築（オフライン動作も確保）", done: false, due: "2026-10-30", owner: "開発", category: "デモ" },
          { id: "x1c5", label: "デモシナリオのリハーサル（3分版・10分版）", done: false, due: "2026-11-06", owner: "ワタル", category: "デモ" },
          { id: "x1c6", label: "パンフレット v2 の印刷・納品（500部）", done: false, due: "2026-10-30", owner: "ワタル", category: "配布物" },
          { id: "x1c7", label: "ノベルティ手配", done: false, due: "2026-10-30", owner: "ワタル", category: "配布物" },
          { id: "x1c8", label: "名刺スキャン→CRM登録フローのテスト", done: false, due: "2026-11-06", owner: "ワタル", category: "オペレーション" },
          { id: "x1c9", label: "来場者アンケート（ヒアリング項目）の設計", done: false, due: "2026-11-06", owner: "ワタル", category: "オペレーション" },
          { id: "x1c10", label: "接客スクリプトの共有・ロールプレイ", done: false, due: "2026-11-13", owner: "ワタル", category: "オペレーション" },
          { id: "x1c11", label: "招待状の送付（既存リード・見込み客）", done: false, due: "2026-10-23", owner: "ワタル", category: "集客" },
          { id: "x1c12", label: "プレスリリース配信", done: false, due: "2026-11-11", owner: "ワタル", category: "集客" },
          { id: "x1c13", label: "会期後48時間以内の一次フォローメール準備", done: false, due: "2026-11-13", owner: "ワタル", category: "フォロー" },
          { id: "x1c14", label: "撤収・備品返却", done: false, due: "2026-11-20", owner: "ワタル", category: "設営" },
          { id: "x1c15", label: "出展レポート作成（獲得リード数・商談化率）", done: false, due: "2026-11-27", owner: "ワタル", category: "フォロー" },
        ],
      },
      {
        id: "x2",
        name: "スマート工場EXPO",
        venue: "東京ビッグサイト",
        start: "2027-01-20",
        end: "2027-01-22",
        boothSize: "検討中",
        cost: 1_800_000,
        targetLeads: 180,
        targetDeals: 10,
        status: "planning",
        notes: "製造業DXの意思決定層が集まる。M-Techの結果を見て出展規模を決める。",
        checklist: [
          { id: "x2c1", label: "出展可否の意思決定（M-Tech結果を踏まえて）", done: false, due: "2026-11-27", owner: "ワタル", category: "申込" },
          { id: "x2c2", label: "出展申込", done: false, due: "2026-12-11", owner: "ワタル", category: "申込" },
          { id: "x2c3", label: "M-Techの学びを反映したブース改善案", done: false, due: "2026-12-18", owner: "ワタル", category: "設営" },
        ],
      },
      {
        id: "x3",
        name: "関西 ものづくりワールド",
        venue: "インテックス大阪",
        start: "2027-02-17",
        end: "2027-02-19",
        boothSize: "検討中",
        cost: 1_200_000,
        targetLeads: 120,
        targetDeals: 6,
        status: "planning",
        notes: "西日本の中堅メーカー開拓用。関西包装システムなど既存商談先も近い。",
        checklist: [
          { id: "x3c1", label: "出展可否の意思決定", done: false, due: "2026-12-18", owner: "ワタル", category: "申込" },
        ],
      },
    ],

    expoLeads: [
      { id: "xl1", expoId: "x1", company: "山陽精機工業", name: "田中 誠", title: "サービス本部長", email: "", phone: "", heat: "hot", interest: "OEM展開", memo: "その場でROI試算を実施。経営層への説明資料を要望。", followedUp: true, convertedDealId: "d1", createdAt: "2026-07-15" },
      { id: "xl2", expoId: "x1", company: "九州搬送機器", name: "渡辺 一郎", title: "サービス部 主任", email: "", phone: "", heat: "warm", interest: "トラブルシューティング自動生成", memo: "決裁権なし。上長へのアプローチルートを探る。", followedUp: false, convertedDealId: "d6", createdAt: "2026-08-28" },
    ],

    // ================================================================ 営業資料
    materials: [
      { id: "mt1", title: "TOMARUN パンフレット改善提案書", type: "pamphlet", audience: "全般（初回接触）", version: "v1.0", status: "published", owner: "ワタル", updatedAt: "2026-08-20", url: "", summary: "メインキャッチ「生産を、止めない。／原因調査を、最短5分へ。」から導入効果・OEM対応までを1冊に。最も伝えたいのは「AIアプリであること」ではなく「メーカーが蓄積した技術資産を導入初日から誰でも使える仕組み」であること。", useCase: "展示会での配布、初回接触時の郵送。まずこれ1枚で興味を持たせる。" },
      { id: "mt2", title: "新価格体系・プラン提案書 v5", type: "proposal", audience: "検討中の担当者・決裁者", version: "v5", status: "published", owner: "ワタル", updatedAt: "2026-08-28", url: "", summary: "3プラン（スターター50万/5万、スタンダード100万/10万、プレミアムOEM180万/18万）の戦略的位置付けを「検証→定着→収益化」のフェーズに紐付けて説明。スクラッチ開発（数千万円・6ヶ月〜1年）との比較で導入合理性を示す。", useCase: "2回目以降の商談。価格の話が出たタイミングで提示する。" },
      { id: "mt3", title: "投資対効果（ROI）提案書", type: "proposal", audience: "経営層・決裁者", version: "v1.0", status: "published", owner: "ワタル", updatedAt: "2026-08-28", url: "", summary: "年間問い合わせ1,000件・1件115分短縮・エンジニア単価5,000円で年間約958万円の直接削減効果。技術資産の流動化（Technical Asset Liquidity）という経営視点で保守部門をコストセンターからプロフィットセンターへ転換する提言。", useCase: "決裁者・経営層が同席する商談。数字で押し切る場面。" },
      { id: "mt4", title: "貴社の技術資産を、最強の「収益化エンジン」へ（OEM戦略デック）", type: "deck", audience: "メーカー経営層", version: "v1.0", status: "published", owner: "ワタル", updatedAt: "2026-08-30", url: "", summary: "OEM展開による次世代アフターセールス戦略。スポット修理収益から継続収益（ARR）への移行、有償保守契約のサブスクリプション化、部品発注動線の構築などの収益化モデルを提示。", useCase: "プレミアムOEMプランを提案する商談。相手が「自社ブランドで顧客に提供する」構想を持てるかが分岐点。" },
      { id: "mt5", title: "ROIシミュレーター（Excel版）", type: "roi", audience: "担当者・決裁者", version: "v1.0", status: "published", owner: "ワタル", updatedAt: "2026-08-30", url: "", summary: "プラン選択と現場条件を入力すると、人件費削減・ダウンタイム回避・部品受注増加の3効果と投資回収期間を自動計算。", useCase: "商談中にその場で顧客の数字を入れる。本ツールの『ROIシミュレーター』が最新版。" },
      { id: "mt6", title: "セキュリティ・情報管理に関する説明資料", type: "faq", audience: "情シス・購買部門", version: "v0.1", status: "draft", owner: "開発", updatedAt: T, url: "", summary: "データの保管場所、アクセス制御、機密資料の取り扱い、AI学習への利用範囲を明記。", useCase: "大手メーカーの購買審査。ここで詰まると数ヶ月止まるので先回りして出す。" },
      { id: "mt7", title: "導入フロー説明資料（4ステップ）", type: "onepager", audience: "現場責任者", version: "v1.0", status: "review", owner: "ワタル", updatedAt: "2026-08-31", url: "", summary: "①資料をご提供 → ②AIが分析・整理 → ③トラブルシューティング生成 → ④アプリ完成。導入初日から「空の状態」ではなく完成された知恵が入った状態でログインできることを図解。", useCase: "「導入が大変そう」という不安が出たときに即出す。" },
      { id: "mt8", title: "想定問答集（オブジェクションハンドリング）", type: "faq", audience: "社内（営業用）", version: "v1.0", status: "published", owner: "ワタル", updatedAt: T, url: "", summary: "価格・セキュリティ・AI精度・導入負荷・競合比較の5カテゴリ。本ツールの『トークスクリプト』タブに収録。", useCase: "商談前の5分で目を通す。" },
    ],

    // ================================================================ トークスクリプト
    scripts: [
      {
        id: "sc1",
        scene: "展示会ブース（3分アプローチ）",
        target: "産業機械メーカーの技術者・サービス部門",
        goal: "名刺交換と、後日のオンライン商談アポ取得",
        durationMin: 3,
        lines: [
          { id: "sc1l1", speaker: "self", text: "こんにちは。御社では機械が止まったとき、原因を突き止めるまでにどのくらい時間がかかっていますか？", tip: "商品説明から入らない。相手の現場の話から入ると足が止まる。" },
          { id: "sc1l2", speaker: "customer", text: "（例）そうですね、簡単なものなら30分、厄介なやつだと半日〜数日ですね。", tip: "「2時間くらい」「ベテランに聞く」という答えが出たら本命。" },
          { id: "sc1l3", speaker: "self", text: "やはりそうですよね。実は業界平均で約2時間と言われていて、その大半が『原因を探す』のではなく『資料を探す・詳しい人を探す』時間なんです。TOMARUNは、その部分を最短5分にします。", tip: "「2時間 → 5分」の数字を必ず声に出す。ここが唯一覚えて帰ってもらう情報。" },
          { id: "sc1l4", speaker: "customer", text: "（例）AIですか。うちは資料がバラバラなので、そういうのは無理だと思いますが。", tip: "最頻出の反応。ここで引かない。" },
          { id: "sc1l5", speaker: "self", text: "そこが一番よく言われるところなんですが、逆なんです。バラバラの資料をこちらでお預かりして、AIが先に分析・整理してからお渡しします。だから導入初日から、空っぽではなく御社の知識が入った状態で使えます。", tip: "「導入初日から使える」は最大の差別化。ここを外すと普通のAIツールに見える。" },
          { id: "sc1l6", speaker: "self", text: "30秒だけ実際の画面をお見せしてもいいですか？御社と同じような射出成形機の事例です。", tip: "デモは短く。長く説明するほど離脱する。" },
          { id: "sc1l7", speaker: "self", text: "もしよろしければ、御社の機械だと実際どのくらい効果が出るか、数字で出せる試算表があります。後日15分だけオンラインでお時間いただけませんか？", tip: "その場で契約は狙わない。次のアポだけを確実に取る。" },
        ],
      },
      {
        id: "sc2",
        scene: "初回オンライン商談（30分）",
        target: "サービス本部長・技術部長クラス",
        goal: "課題の定量化と、次回の経営層同席商談の設定",
        durationMin: 30,
        lines: [
          { id: "sc2l1", speaker: "self", text: "本日は30分お時間いただきありがとうございます。前半10分で御社の状況をお伺いして、後半で御社に合わせた形でご説明します。それでよろしいでしょうか。", tip: "冒頭でアジェンダ合意。一方的な説明会にしない。" },
          { id: "sc2l2", speaker: "self", text: "まず、サービスエンジニアの方は何名いらっしゃいますか？年間の問い合わせ・トラブル対応は何件くらいでしょうか。", tip: "ROI計算に必要な数字を自然に集める。①人数 ②年間件数 ③平均対応時間 ④時間単価 ⑤現地出向率。" },
          { id: "sc2l3", speaker: "self", text: "その中で、ベテランの方に聞かないと解決できない案件はどのくらいの割合ですか？", tip: "属人化の度合いを数値化する。ここが高いほど刺さる。" },
          { id: "sc2l4", speaker: "self", text: "失礼な質問かもしれませんが、そのベテランの方は、あと何年くらい現役でいらっしゃいますか？", tip: "技能継承の期限を相手の口から言わせる。ここが最大の危機感スイッチ。" },
          { id: "sc2l5", speaker: "customer", text: "（例）2〜3年でしょうね。後任が育っていないのが正直なところです。", tip: "" },
          { id: "sc2l6", speaker: "self", text: "ありがとうございます。今お伺いした数字を入れると、御社の場合、年間で約◯◯万円の削減になります。この試算表、そのままお渡しします。", tip: "ROIシミュレーターを画面共有してその場で入力。数字を『こちらが作った』ではなく『一緒に作った』状態にする。" },
          { id: "sc2l7", speaker: "self", text: "TOMARUNの一番の特徴は、導入初日から使えることです。御社の機械台帳・マニュアル・トラブル事例・過去動画をお預かりして、AIが先に分析・整理します。御社側の入力作業はありません。", tip: "IT導入の最大の障壁である『データ整理の数ヶ月』が無いことを強調。" },
          { id: "sc2l8", speaker: "self", text: "プランは3つあります。まずは検証としてスターター、社内定着ならスタンダード、そして自社ブランドで顧客に提供して収益化するプレミアムOEM。御社ですと、どの段階からお考えでしょうか。", tip: "3択にすると『やるかやらないか』ではなく『どれにするか』の議論になる。" },
          { id: "sc2l9", speaker: "self", text: "次のステップとして、この試算をぜひ役員の方にもご覧いただきたいです。私から15分でご説明する場を作らせていただけませんか。", tip: "必ず決裁者に会う。担当者止まりの案件は8割落ちる。" },
        ],
      },
      {
        id: "sc3",
        scene: "経営層向けプレゼン（15分）",
        target: "取締役・事業部長・経営企画",
        goal: "予算化の意思決定を引き出す",
        durationMin: 15,
        lines: [
          { id: "sc3l1", speaker: "self", text: "本日は、コスト削減のお話ではなく、御社の保守部門を『利益を生む部門』に変えるご提案をさせてください。", tip: "経営層にコスト削減だけを話すと、他の削減案と並べられて後回しになる。" },
          { id: "sc3l2", speaker: "self", text: "現在、御社の技術者の方が長年蓄積してきた知識は、マニュアルや個人の記憶の中に眠っています。会計上は資産に計上されていませんが、これは本来、御社最大の無形資産です。", tip: "『技術資産の流動化』という言葉で経営アジェンダに引き上げる。" },
          { id: "sc3l3", speaker: "self", text: "この資産が今、退職とともに社外に流出しつつあります。TOMARUNは、それをデジタル資産に変換して社内に固定します。", tip: "" },
          { id: "sc3l4", speaker: "self", text: "定量効果は年間約◯◯万円。初期投資は最大180万円ですので、中規模なライン停止を1回防ぐだけで回収できます。", tip: "『たった1回のトラブルで回収』は経営層に最も刺さる一言。" },
          { id: "sc3l5", speaker: "self", text: "さらに踏み込むと、このアプリを御社ブランドで顧客50社に月1万円で提供した場合、月間50万円の経常収益になります。4ヶ月で初期投資を回収し、以降は利益です。", tip: "コストセンター → プロフィットセンターへの転換。ここでプレミアムOEMプランの価値が確定する。" },
          { id: "sc3l6", speaker: "self", text: "自社開発ですと数千万円と1年かかります。1年待つことは、その間のダウンタイム損失を放置することを意味します。", tip: "機会損失の観点。『持たざる経営』というキーワードが響く層がいる。" },
          { id: "sc3l7", speaker: "self", text: "まずはスタータープラン50万円で、御社の実際の資料を使って効果を検証しませんか。3ヶ月で判断いただける形にします。", tip: "最後は必ず小さく閉じる。大きい金額でクロージングしようとして流れる案件が多い。" },
        ],
      },
      {
        id: "sc4",
        scene: "電話アポイント（60秒）",
        target: "サービス部門・技術部門の代表番号",
        goal: "担当者への取次と15分アポの獲得",
        durationMin: 1,
        lines: [
          { id: "sc4l1", speaker: "self", text: "お世話になります。TOMARUNと申します。御社のサービス部門で、機械トラブルの原因調査に関するご担当の方はいらっしゃいますでしょうか。", tip: "売り込みではなく『担当部署を探している』トーンで入る。" },
          { id: "sc4l2", speaker: "self", text: "産業機械メーカー様向けに、トラブル対応の原因調査時間を平均2時間から最短5分に短縮する仕組みをご提供しております。", tip: "1文で価値を言い切る。修飾語は削る。" },
          { id: "sc4l3", speaker: "self", text: "同業の企業様で、ベテランの方の退職に伴う技術継承のご相談が増えておりまして、御社の状況を15分だけお伺いできればと思っております。", tip: "『同業でも起きている』という社会的証明。" },
          { id: "sc4l4", speaker: "self", text: "資料だけでもお送りできますので、ご担当の方のお名前をお伺いしてもよろしいでしょうか。", tip: "断られても必ず担当者名を取る。次回のアプローチ精度が変わる。" },
        ],
      },
    ],

    objections: [
      { id: "ob1", category: "価格", question: "価格が高い。もっと安くならないか。", answer: "スタータープランでしたら初期50万円・月額5万円です。御社の場合、中規模なライン停止を1回防ぐだけで回収できる金額です。逆にお伺いしたいのですが、現在1回のダウンタイムでどのくらいの損失が出ていますか？", evidence: "初期費用180万円のプレミアムプランでも、1回の中規模トラブルの防止・短縮で即座に回収可能（ROI提案書）。" },
      { id: "ob2", category: "価格", question: "自社で作れないか。エンジニアもいる。", answer: "もちろん可能です。ただスクラッチですと数千万円と6ヶ月〜1年が目安です。加えてAI精度の維持を自社で続ける必要があります。TOMARUNは50万〜180万円、最短即日〜数週間です。1年待つ間のダウンタイム損失を考えると、こちらの方が経済合理性があると考えています。", evidence: "スクラッチ開発比較表（新価格体系・プラン提案書 第4章）。" },
      { id: "ob3", category: "導入負荷", question: "資料がバラバラで整理されていない。うちでは無理だと思う。", answer: "むしろそれが前提です。整理されていない資料をお預かりして、AIが先に分析・構造化してからお渡しします。御社側でのタグ付けやデータ入力作業は発生しません。だから『導入初日から現場の知識が使える』とお伝えしています。", evidence: "導入フロー4ステップ（資料提供→AI分析→トラブルシューティング生成→アプリ完成）。" },
      { id: "ob4", category: "導入負荷", question: "現場が新しいツールを使いこなせるか不安。", answer: "操作は『トラブルを選ぶ → 手順と動画を見る』の2ステップだけです。検索窓に入力する必要すらありません。むしろ今の『分厚いマニュアルを探す』より簡単です。", evidence: "従来プロセス（原因を探す→マニュアルを探す→ベテランに確認→動画を探す）との対比。" },
      { id: "ob5", category: "AI精度", question: "AIの回答が間違っていたら、事故につながる。", answer: "TOMARUNは自由回答を生成するのではなく、御社の既存資料に紐づいた手順を提示し、必ず出典元のマニュアル・動画を併記します。判断するのは人です。またスタンダードプラン以上では現場のフィードバックを学習し、精度が継続的に上がる仕組みを備えています。", evidence: "AI学習フィードバックループ（スタンダードプラン機能）。" },
      { id: "ob6", category: "セキュリティ", question: "図面やノウハウは社外に出せない。", answer: "ご懸念はもっともです。データの保管場所・アクセス制御・AI学習への利用範囲について、専用の説明資料をご用意しています。御社の情シス・購買部門のご担当者を交えて、審査基準に沿ってご説明させてください。", evidence: "セキュリティ・情報管理に関する説明資料。" },
      { id: "ob7", category: "タイミング", question: "今期の予算がない。", answer: "承知しました。であれば、次期予算の検討タイミングに合わせてご提案させてください。それまでに、御社の数字でROI試算だけ作っておきます。稟議の際にそのまま使える形でお渡しします。", evidence: "" },
      { id: "ob8", category: "競合", question: "他社のマニュアル検索システムと何が違うのか。", answer: "多くのシステムは『資料を保存して検索できる』までです。TOMARUNは、AIが事前に分析してトラブルシューティング手順そのものを生成します。検索結果としてマニュアルの該当ページが出るのではなく、『次に何をするか』が出ます。ここが決定的な違いです。", evidence: "「資料を保存するだけの管理」から「即戦力の知識」へのシフト（新価格体系・プラン提案書）。" },
      { id: "ob9", category: "効果", question: "本当に5分になるのか。", answer: "すべてのトラブルが5分とは申し上げません。『最短5分』です。ただし現状の2時間の大半は、原因究明そのものではなく資料と人を探す時間です。そこが消えるだけで効果は出ます。まずはスタータープランで御社の実データを使って検証しませんか。", evidence: "従来の主要アクションの内訳（原因特定・資料探索・人的確認・視覚情報の探索）。" },
      { id: "ob10", category: "社内政治", question: "ベテランが反対しそうだ。自分の存在価値がなくなると。", answer: "実際によくあるご懸念です。お伝えしているのは、ベテランの方を置き換えるのではなく、簡単な問い合わせを引き受けて、その方が本当に難しい案件に集中できるようにする、という位置付けです。むしろ『自分の知識が会社に残る』ことを前向きに捉えていただけるケースが多いです。", evidence: "工数解放（Opportunity Gain）の考え方。" },
      { id: "ob11", category: "収益化", question: "OEMで顧客に売れと言われても、営業リソースがない。", answer: "新規で売る必要はありません。既存の有償保守契約のプレミアムオプションとして追加する形が最も現実的です。既に契約関係がある顧客に、月1万円のデジタルサポートを上乗せするイメージです。", evidence: "収益化モデル①：有償保守契約のサブスクリプション化（OEM戦略デック）。" },
      { id: "ob12", category: "タイミング", question: "他社の導入事例を見てから判断したい。", answer: "承知しました。ただ、この領域は先に入れた企業が『顧客とのデジタル接点』を押さえます。御社の顧客が競合他社のアプリを毎日開く状態になってからでは、取り返すのが難しくなります。まずは小さく検証だけでも始めませんか。", evidence: "デジタル接点の占有＝戦略的不動産の確保（ROI提案書 第5章）。" },
    ],

    battlecards: [
      { id: "bc1", competitor: "大手SIerのカスタム開発", category: "スクラッチ開発", theirStrength: "自社要件に完全に合わせられる。既存基幹システムとの連携が得意。大手ブランドの安心感。", theirWeakness: "数千万円規模・6ヶ月〜1年。AI精度の維持コストを顧客が負担し続ける。動画対応は追加費用が高額。", ourAngle: "50万円から最短即日〜数週間。1年待つ間のダウンタイム損失こそが最大のコスト、という機会損失の観点で戦う。", killerQuestion: "そのシステムが完成する1年後まで、現在のダウンタイム損失はどなたが負担される想定でしょうか？" },
      { id: "bc2", competitor: "文書管理・ナレッジ検索ツール", category: "既存カテゴリ", theirStrength: "安価。導入実績が多い。全文検索が高速。", theirWeakness: "資料を保存・検索できるだけで、手順は生成しない。結局『どのページを見るか』は人が判断する。タグ付けなど初期整備の工数が顧客側に発生する。", ourAngle: "検索結果ではなく『次に何をするか』が出る。導入初日から使える状態でお渡しする。", killerQuestion: "そのツールを導入されてから、実際に現場の方が使っている頻度はどのくらいでしょうか？" },
      { id: "bc3", competitor: "汎用の生成AIチャット（社内RAG）", category: "AI一般", theirStrength: "安価で導入が速い。何でも聞ける。", theirWeakness: "回答の根拠が不明瞭で、現場の安全判断には使いにくい。資料の前処理を自社でやる必要があり、精度が出るまで時間がかかる。", ourAngle: "製造現場のトラブルシューティングに特化。出典（マニュアル・動画）を必ず併記。事前のAI分析込みで提供。", killerQuestion: "AIの回答をそのまま信じて機械を操作する、という判断を現場の方に任せられますか？" },
      { id: "bc4", competitor: "何もしない（現状維持）", category: "最大の競合", theirStrength: "コストゼロ。今日も何とか回っている。", theirWeakness: "ベテランの退職は確実に来る。そのときには手遅れで、対策に数年かかる。", ourAngle: "『いつやるか』の議論にする。期限は相手のベテランの定年で、こちらが決めるものではない。", killerQuestion: "そのベテランの方が退職された翌週、同じ品質の対応ができる体制は今ありますか？" },
    ],

    // ================================================================ 資金調達
    investors: [
      { id: "iv1", name: "産業DXベンチャーズ", type: "vc", personName: "—", status: "longlist", ticketMin: 30_000_000, ticketMax: 100_000_000, thesis: "製造業向けSaaS・ディープテックのシード〜シリーズA", intro: "未取得。共通の投資先経由でのリファラルを探す", nextAction: "紹介ルートの調査", nextActionDate: "2026-09-30", memo: "" },
      { id: "iv2", name: "ものづくり系CVC（大手機械メーカー系）", type: "cvc", personName: "—", status: "longlist", ticketMin: 20_000_000, ticketMax: 50_000_000, thesis: "自社顧客基盤とのシナジーがある領域", intro: "未取得", nextAction: "候補3社の絞り込み", nextActionDate: "2026-10-09", memo: "出資と同時にOEM第1号顧客になり得る。資本業務提携が理想形。" },
      { id: "iv3", name: "エンジェル（製造業出身の経営者）", type: "angel", personName: "—", status: "longlist", ticketMin: 3_000_000, ticketMax: 10_000_000, thesis: "業界人脈を持ち込めるエンジェル", intro: "未取得", nextAction: "候補リストアップ", nextActionDate: "2026-09-25", memo: "金額よりも紹介力を重視。最初の10社の顧客紹介が実質的なバリュー。" },
      { id: "iv4", name: "日本政策金融公庫（新規開業資金）", type: "bank", personName: "—", status: "longlist", ticketMin: 5_000_000, ticketMax: 30_000_000, thesis: "創業融資", intro: "直接申込可", nextAction: "必要書類の確認と事業計画書の様式合わせ", nextActionDate: "2026-09-18", memo: "エクイティより先に、希薄化しない資金として検討する価値が高い。" },
      { id: "iv5", name: "ものづくり補助金 / IT導入補助金", type: "grant", personName: "—", status: "longlist", ticketMin: 1_000_000, ticketMax: 10_000_000, thesis: "設備・システム投資への補助", intro: "—", nextAction: "顧客側が使える枠と、自社が使える枠の両方を整理", nextActionDate: "2026-10-02", memo: "顧客が補助金を使えると営業の価格障壁が一気に下がる。営業トークにも組み込む。" },
    ],

    fundingDocs: [
      { id: "fd1", name: "事業計画書（3ヵ年）", category: "必須", status: "doing", owner: "ワタル", due: "2026-09-26", memo: "ARRベース。OEM再販の上振れシナリオを別建てで。" },
      { id: "fd2", name: "財務モデル（月次36ヶ月）", category: "必須", status: "doing", owner: "ワタル", due: "2026-09-26", memo: "顧客数・ARPU・チャーン・CAC・LTVを可変にする。" },
      { id: "fd3", name: "ピッチデック（10枚）", category: "必須", status: "doing", owner: "ワタル", due: "2026-09-30", memo: "" },
      { id: "fd4", name: "会社登記簿謄本・定款", category: "必須", status: "todo", owner: "ワタル", due: "2026-10-09", memo: "" },
      { id: "fd5", name: "株主名簿・資本政策表", category: "必須", status: "todo", owner: "ワタル", due: "2026-10-09", memo: "" },
      { id: "fd6", name: "トラクション資料（商談数・パイロット結果）", category: "重要", status: "todo", owner: "ワタル", due: "2026-11-27", memo: "パイロット1社の定量結果が出てから作る。ここが調達の説得力の中心。" },
      { id: "fd7", name: "市場規模（TAM/SAM/SOM）算定資料", category: "重要", status: "todo", owner: "ワタル", due: "2026-10-16", memo: "国内の産業機械メーカー数 × 保守部門の予算規模から積み上げる。" },
      { id: "fd8", name: "競合分析マップ", category: "重要", status: "todo", owner: "ワタル", due: "2026-10-16", memo: "バトルカードの内容を投資家向けに再編集。" },
      { id: "fd9", name: "知財・特許の状況整理", category: "推奨", status: "todo", owner: "ワタル", due: "2026-10-30", memo: "" },
      { id: "fd10", name: "セキュリティ・コンプライアンス方針", category: "推奨", status: "todo", owner: "開発", due: "2026-11-28", memo: "" },
    ],

    fundingRounds: [
      { id: "fr1", name: "シードラウンド", targetAmount: 50_000_000, committedAmount: 0, preMoney: 250_000_000, targetClose: "2027-01-29", useOfFunds: "開発体制の強化（エンジニア2名）、営業・マーケ投資（展示会3回・広告）、運転資金18ヶ月分", status: "準備中" },
    ],

    // ================================================================ マーケ
    campaigns: [
      { id: "cp1", name: "コーポレートサイト / LP 公開", channel: "web", goal: "問い合わせ導線の確立", kpiName: "月間問い合わせ数", kpiTarget: 10, kpiActual: 0, budget: 800_000, spent: 450_000, start: "2026-08-18", end: "2026-09-26", status: "running", owner: "ワタル", learning: "" },
      { id: "cp2", name: "M-Tech 出展", channel: "expo", goal: "見込み顧客の一括獲得", kpiName: "獲得リード数", kpiTarget: 150, kpiActual: 0, budget: 1_600_000, spent: 400_000, start: "2026-11-18", end: "2026-11-20", status: "planning", owner: "ワタル", learning: "" },
      { id: "cp3", name: "ホワイトペーパー配信（技能継承2027年問題）", channel: "seo", goal: "リード獲得とナーチャリング", kpiName: "ダウンロード数", kpiTarget: 100, kpiActual: 0, budget: 200_000, spent: 0, start: "2026-10-26", end: "2026-12-25", status: "planning", owner: "ワタル", learning: "" },
      { id: "cp4", name: "ウェビナー「ダウンタイムを5分で止める」", channel: "seminar", goal: "検討層の商談化", kpiName: "申込数", kpiTarget: 50, kpiActual: 0, budget: 150_000, spent: 0, start: "2026-11-16", end: "2026-11-13", status: "planning", owner: "ワタル", learning: "" },
      { id: "cp5", name: "アウトバウンド（産業機械メーカー100社）", channel: "outbound", goal: "初期商談の創出", kpiName: "アポ獲得数", kpiTarget: 15, kpiActual: 4, budget: 0, spent: 0, start: "2026-08-25", end: "2026-10-31", status: "running", owner: "ワタル", learning: "サービス本部長宛の方が技術部長宛より反応率が高い。件名に『最短5分』を入れると開封率が上がる。" },
      { id: "cp6", name: "リスティング広告（予知保全・技能継承）", channel: "ads", goal: "顕在層の刈り取り", kpiName: "問い合わせ数", kpiTarget: 8, kpiActual: 0, budget: 300_000, spent: 0, start: "2026-10-01", end: "2026-12-26", status: "planning", owner: "ワタル", learning: "" },
    ],

    contents: [
      { id: "ct1", title: "なぜ原因調査に2時間もかかるのか — 現場の情報探索コストを分解する", channel: "seo", format: "記事", publishDate: "2026-09-19", status: "writing", owner: "ワタル", keyword: "トラブルシューティング 時間短縮", url: "" },
      { id: "ct2", title: "技能継承2027年問題：ベテラン退職前にやるべき3つのこと", channel: "seo", format: "ホワイトペーパー", publishDate: "2026-10-23", status: "idea", owner: "ワタル", keyword: "技能継承 製造業", url: "" },
      { id: "ct3", title: "保守部門をコストセンターからプロフィットセンターへ", channel: "seo", format: "記事", publishDate: "2026-10-10", status: "idea", owner: "ワタル", keyword: "アフターサービス 収益化", url: "" },
      { id: "ct4", title: "【事例】射出成形機メーカーが原因調査を5分にした話", channel: "web", format: "導入事例", publishDate: "2026-12-19", status: "idea", owner: "ワタル", keyword: "導入事例", url: "" },
      { id: "ct5", title: "M-Tech 出展のお知らせ", channel: "pr", format: "プレスリリース", publishDate: "2026-11-11", status: "idea", owner: "ワタル", keyword: "", url: "" },
      { id: "ct6", title: "OEMで自社ブランドの保守アプリを持つという選択", channel: "seo", format: "記事", publishDate: "2026-11-07", status: "idea", owner: "ワタル", keyword: "OEM 保守アプリ", url: "" },
    ],

    // ================================================================ OKR
    objectives: [
      {
        id: "ok1",
        title: "パイロット導入を成立させ、再現可能な営業プロセスを確立する",
        quarter: "2026 Q4",
        owner: "ワタル",
        dept: "sales",
        keyResults: [
          { id: "kr1", title: "有効商談数", unit: "件", startValue: 0, targetValue: 20, currentValue: 6 },
          { id: "kr2", title: "受注社数", unit: "社", startValue: 0, targetValue: 3, currentValue: 0 },
          { id: "kr3", title: "受注 ARR", unit: "円", startValue: 0, targetValue: 3_600_000, currentValue: 0 },
          { id: "kr4", title: "経営層同席商談の割合", unit: "%", startValue: 0, targetValue: 60, currentValue: 17 },
        ],
      },
      {
        id: "ok2",
        title: "TOMARUNを製造業界で「知られている名前」にする",
        quarter: "2026 Q4",
        owner: "ワタル",
        dept: "marketing",
        keyResults: [
          { id: "kr5", title: "展示会での獲得リード数", unit: "件", startValue: 0, targetValue: 150, currentValue: 0 },
          { id: "kr6", title: "サイト月間セッション数", unit: "件", startValue: 0, targetValue: 3000, currentValue: 0 },
          { id: "kr7", title: "ホワイトペーパーDL数", unit: "件", startValue: 0, targetValue: 100, currentValue: 0 },
        ],
      },
      {
        id: "ok3",
        title: "「導入初日から使える」を製品として完成させる",
        quarter: "2026 Q4",
        owner: "開発",
        dept: "product",
        keyResults: [
          { id: "kr8", title: "AI生成トラブルシューティングの正答率", unit: "%", startValue: 60, targetValue: 90, currentValue: 72 },
          { id: "kr9", title: "資料受領からリリースまでの日数", unit: "日", startValue: 30, targetValue: 10, currentValue: 21 },
          { id: "kr10", title: "OEMホワイトラベル機能の完成度", unit: "%", startValue: 0, targetValue: 100, currentValue: 25 },
        ],
      },
      {
        id: "ok4",
        title: "18ヶ月の事業継続資金を確保する",
        quarter: "2027 Q1",
        owner: "ワタル",
        dept: "funding",
        keyResults: [
          { id: "kr11", title: "投資家との面談数", unit: "件", startValue: 0, targetValue: 20, currentValue: 0 },
          { id: "kr12", title: "調達額", unit: "円", startValue: 0, targetValue: 50_000_000, currentValue: 0 },
        ],
      },
    ],

    // ================================================================ ナレッジ / リスク
    notes: [
      { id: "n1", title: "メッセージの優先順位を確定", type: "decision", date: "2026-08-20", owner: "ワタル", tags: ["メッセージ", "パンフレット"], body: "パンフレット改善提案書に基づき、伝える順番を確定した。\n\n① 原因調査を、最短5分へ。\n② 導入初日から使える。\n③ AIが過去資料を分析・整理し、トラブルシューティングを自動生成。\n④ ベテランの知識を資産化し、誰でも活用できる。\n⑤ 貴社ブランドアプリとしてリリース可能（OEM対応）。\n\n重要：「AIアプリであること」を主役にしない。AIは手段であり、伝えるべきは『長年蓄積してきた技術資産を、導入初日から誰でも活用できる仕組み』であること。", impact: "high", likelihood: "high", mitigation: "", status: "closed" },
      { id: "n2", title: "3プラン体系への移行を決定", type: "decision", date: "2026-08-28", owner: "ワタル", tags: ["価格"], body: "単一価格から3プラン体系へ移行。各プランは機能差ではなく、顧客のビジネスフェーズに紐付ける。\n\n・スターター（50万/5万）＝ 検証フェーズ\n・スタンダード（100万/10万）＝ 定着フェーズ\n・プレミアムOEM（180万/18万）＝ 収益化フェーズ\n\n狙い：『やるかやらないか』ではなく『どれにするか』の議論に持ち込む。また、スターターの50万円という金額は、多くの企業で部長決裁の範囲に収まる。", impact: "high", likelihood: "high", mitigation: "", status: "closed" },
      { id: "n3", title: "OEMプランを最重要プロダクトに位置付ける", type: "decision", date: "2026-08-30", owner: "ワタル", tags: ["戦略", "OEM"], body: "OEM戦略デックの検討結果。プレミアムOEMプランは単価が高いだけでなく、顧客にとって『コストではなく収益源』になるため、意思決定のロジックが根本的に変わる。\n\nメーカーが自社ブランドで顧客50社に月1万円で提供 → 月50万円のARR。4ヶ月で初期投資180万円を回収。\n\nこれは値引き交渉になりにくい構造でもある。営業では、可能な限りプレミアムOEMの世界観を先に見せる。", impact: "high", likelihood: "high", mitigation: "", status: "closed" },
      { id: "n4", title: "パイロット1社目が取れないリスク", type: "risk", date: T, owner: "ワタル", tags: ["営業"], body: "現在の商談6件のうち、確度が高いのは東海食品機械（PoC中）と信州工作機械（最終条件詰め）の2件。この2件が両方流れると、Q4の実績がゼロになり、資金調達のトラクション資料が作れなくなる。", impact: "high", likelihood: "mid", mitigation: "①アウトバウンドを止めずに継続し、常に商談を10件以上維持する。②東海食品機械のPoC結果レビューには必ず現場の方に同席いただき、社内推進者を作る。③信州工作機械は契約書の論点のみなので、リーガル対応を最優先で片付ける。", status: "open" },
      { id: "n5", title: "AI精度が顧客期待に届かないリスク", type: "risk", date: T, owner: "開発", tags: ["プロダクト"], body: "「最短5分」を掲げている以上、AI生成のトラブルシューティングが的外れだと信頼を一度で失う。現在の正答率は72%で、目標の90%に届いていない。", impact: "high", likelihood: "mid", mitigation: "①出典（マニュアル該当ページ・動画）を必ず併記し、人が最終判断する設計を崩さない。②PoC段階では必ず人がレビューしてから納品する。③スタンダードプランのフィードバックループを最優先で実装する。", status: "open" },
      { id: "n6", title: "セキュリティ審査で数ヶ月止まるリスク", type: "risk", date: T, owner: "開発", tags: ["プロダクト", "営業"], body: "大手メーカーの購買審査では、図面・ノウハウの取り扱いについて必ず詳細な確認が入る。ここで資料が用意できていないと、案件が数ヶ月停滞する。", impact: "mid", likelihood: "high", mitigation: "商談が提案フェーズに入った時点で、こちらから先にセキュリティ説明資料を出す。ISMS準拠チェックリストを10月中に整備する。", status: "open" },
      { id: "n7", title: "一人体制のリソース制約", type: "risk", date: T, owner: "ワタル", tags: ["組織"], body: "営業・マーケ・資金調達・CSをすべて一人で回している。展示会準備と資金調達準備が11月〜1月に重なると破綻する。", impact: "high", likelihood: "high", mitigation: "①展示会の設営・オペレーションは外部に委託する前提で予算を組む。②資金調達の書類作成は10月中に前倒しで終わらせる。③シード調達の使途に採用費を明記する。", status: "open" },
      { id: "n8", title: "商談で最も反応が良かった質問", type: "insight", date: "2026-08-26", owner: "ワタル", tags: ["営業", "ヒアリング"], body: "「そのベテランの方は、あと何年くらい現役でいらっしゃいますか？」\n\nこの質問を投げると、相手が自分の口から期限を言うことになる。こちらが危機感を煽るのではなく、相手が自分で気づく構造になるため、その後の話が一気に進む。初回商談の必須質問として全スクリプトに組み込んだ。", impact: "mid", likelihood: "mid", mitigation: "", status: "closed" },
      { id: "n9", title: "失注分析：中部樹脂機械", type: "insight", date: "2026-08-31", owner: "ワタル", tags: ["営業", "失注"], body: "失注理由は「今期の予算枠を使い切った」。ニーズ自体は明確にあり、製造部長は前向きだった。\n\n学び：予算サイクルを初回ヒアリングで必ず確認する。多くの製造業は4月始まりで、予算取りは前年11月〜1月。この時期に提案が間に合わないと1年待ちになる。\n\n対策：ヒアリング項目に「予算の検討時期」を追加。11月〜1月は既存パイプラインへの提案を最優先にする。", impact: "mid", likelihood: "mid", mitigation: "", status: "closed" },
    ],

    // ================================================================ ROI
    roiScenarios: [
      { id: "rs1", name: "標準モデル（提案書ベース）", dealId: "", inputs: { ...DEFAULT_ROI_INPUTS }, createdAt: "2026-08-30", memo: "ROI提案書に記載した標準前提。" },
      { id: "rs2", name: "山陽精機工業（OEM収益込み）", dealId: "d1", inputs: { ...DEFAULT_ROI_INPUTS, plan: "premium", monthlyCases: 85, hourlyCost: 5500, downtimeEventsPerYear: 40, oemCustomers: 50, oemMonthlyPerCustomer: 10_000 }, createdAt: "2026-08-30", memo: "顧客50社に月1万円で再販するシナリオ。経営層プレゼンで使用。" },
      { id: "rs3", name: "東海食品機械（PoC前提）", dealId: "d3", inputs: { ...DEFAULT_ROI_INPUTS, plan: "starter", monthlyCases: 40, hourlyCost: 4800, downtimeEventsPerYear: 24, downtimeCostPerEvent: 80_000, annualPartsOrders: 30 }, createdAt: "2026-08-30", memo: "24時間稼働ラインのためダウンタイム損失が大きい。" },
    ],

    // ================================================================ ニュース
    news: [],
    newsSources: [
      { id: "ns1", name: "製造業DX", url: "https://news.google.com/rss/search?q=%E8%A3%BD%E9%80%A0%E6%A5%AD+DX&hl=ja&gl=JP&ceid=JP:ja", category: "製造業DX", enabled: true },
      { id: "ns2", name: "予知保全・設備保全", url: "https://news.google.com/rss/search?q=%E4%BA%88%E7%9F%A5%E4%BF%9D%E5%85%A8+OR+%E8%A8%AD%E5%82%99%E4%BF%9D%E5%85%A8&hl=ja&gl=JP&ceid=JP:ja", category: "保全・ダウンタイム", enabled: true },
      { id: "ns3", name: "技能継承・人手不足", url: "https://news.google.com/rss/search?q=%E6%8A%80%E8%83%BD%E7%B6%99%E6%89%BF+OR+%E8%A3%BD%E9%80%A0%E6%A5%AD+%E4%BA%BA%E6%89%8B%E4%B8%8D%E8%B6%B3&hl=ja&gl=JP&ceid=JP:ja", category: "技能継承", enabled: true },
      { id: "ns4", name: "産業機械メーカー動向", url: "https://news.google.com/rss/search?q=%E7%94%A3%E6%A5%AD%E6%A9%9F%E6%A2%B0+%E3%83%A1%E3%83%BC%E3%82%AB%E3%83%BC&hl=ja&gl=JP&ceid=JP:ja", category: "業界動向", enabled: true },
      { id: "ns5", name: "生成AI × 製造業", url: "https://news.google.com/rss/search?q=%E7%94%9F%E6%88%90AI+%E8%A3%BD%E9%80%A0%E6%A5%AD&hl=ja&gl=JP&ceid=JP:ja", category: "AI活用", enabled: true },
      { id: "ns6", name: "ITmedia MONOist", url: "https://rss.itmedia.co.jp/rss/2.0/monoist.xml", category: "業界メディア", enabled: true },
      { id: "ns7", name: "スマートファクトリー", url: "https://news.google.com/rss/search?q=%E3%82%B9%E3%83%9E%E3%83%BC%E3%83%88%E3%83%95%E3%82%A1%E3%82%AF%E3%83%88%E3%83%AA%E3%83%BC+OR+%E5%B7%A5%E5%A0%B4+IoT&hl=ja&gl=JP&ceid=JP:ja", category: "スマート工場", enabled: true },
      { id: "ns8", name: "補助金・支援制度", url: "https://news.google.com/rss/search?q=%E3%82%82%E3%81%AE%E3%81%A5%E3%81%8F%E3%82%8A%E8%A3%9C%E5%8A%A9%E9%87%91+OR+IT%E5%B0%8E%E5%85%A5%E8%A3%9C%E5%8A%A9%E9%87%91&hl=ja&gl=JP&ceid=JP:ja", category: "補助金", enabled: true },
    ],
    newsMeta: {
      lastFetchedAt: "",
      lastResult: "未取得",
      slots: ["08:00", "18:00"],
    },
  };
}
