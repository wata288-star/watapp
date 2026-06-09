# FLYHEIT 人生管理システム

株式会社FLYHEIT のための、ワイ専用パーソナル経営ダッシュボード。
資産・株式・案件・資産推移を1か所で統合管理する。

## モジュール

| ページ | 内容 |
| --- | --- |
| ダッシュボード `/` | 純資産サマリー・資産内訳ドーナツ・推移グラフ・案件パイプライン |
| 資産管理 `/assets` | 現金・預貯金・不動産・車両・暗号資産・保険・負債などの登録/評価 |
| 株式管理 `/stocks` | 保有銘柄・取得単価・損益・現在値の自動取得(API連携)・USDJPY換算 |
| 案件管理 `/projects` | FLYHEIT案件のステータス別パイプライン・金額・進捗・納期 |
| 資産推移 `/trends` | 純資産スナップショットの履歴とグラフ |

## 技術構成

- **Next.js (App Router) + React + TypeScript + Tailwind v4**
- **DB: `node:sqlite`**（Node 22 組み込みSQLite、追加依存ゼロ）
  - データは `data/flyheit.db` に保存（`.gitignore` 済み）
- データ操作はすべて `app/api/**` の Route Handler 経由
- 株価/為替は [Stooq](https://stooq.com) の無料CSVから取得（APIキー不要）

## 開発

```bash
npm install      # Node 22 以上が必要
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm start   # 本番
```

## 注意

- `node:sqlite` のため **Node.js 22 以上が必須**
- 株価の「現在値を更新」はインターネット接続が必要。制限環境では各銘柄の現在値を手動入力できる
- `data/` は永続データ。バックアップ・本番ではボリュームマウント推奨

---

> このプロジェクトは元はメッセンジャー「Watapp」だったリポジトリを、
> ブランチ単位で人生管理システムに作り替えたもの。`main` には Watapp が残っている。
