<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FLYHEIT 人生管理システム

株式会社FLYHEIT のパーソナル経営/資産ダッシュボード。資産・株式・案件・資産推移を1か所で管理する。

## スタック
- Next.js (App Router) / React / TypeScript / Tailwind v4
- DB: **`node:sqlite`（Node 22+ 組み込み）**。追加のORM/ドライバ無し。DBファイルは `data/flyheit.db`（gitignore済・要バックアップ）
- すべてのデータ操作は `app/api/**` の Route Handler 経由。クライアントは fetch でアクセス

## 構成
- `lib/db.ts` … SQLite接続・スキーマ migration・settings ヘルパー（`server-only`）
- `lib/queries.ts` … 純資産・株式評価額(JPY換算)・スナップショット集計
- `lib/types.ts` `lib/format.ts` … 型と表示整形
- `app/` … `/`(ダッシュボード) `/assets` `/stocks` `/projects` `/trends`
- `components/` … `Nav` `Modal` `Charts`(依存なしのSVGチャート)
- API連携: `app/api/stocks/refresh` が Stooq の無料CSVで株価・USDJPYを取得（ネットワーク制限時は手動入力にフォールバック）

## 注意
- `node:sqlite` は Node 22 必須。Dockerfile は `node:22-alpine`
- 動的ルートの `params` は Promise。`const { id } = await params` で受ける
