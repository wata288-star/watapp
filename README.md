# Watapp

このリポジトリには 2 つのアプリが入っています。

| パス | アプリ | 説明 |
| --- | --- | --- |
| `/` | Watapp | プライベートメッセンジャー（チャット・通話） |
| `/pm` | **TOMARUN コマンドセンター** | 事業推進のための統合管理ツール |

## TOMARUN コマンドセンター（`/pm`）

TOMARUN の営業・展示会・マーケティング・資金調達・プロダクト開発を
1つの画面で管理するツールです。13 のモジュールで構成されています。

ダッシュボード / ガントチャート / タスクボード / OKR・KPI / 商談パイプライン /
トークスクリプト / 営業資料ライブラリ / ROIシミュレーター / 展示会マネジメント /
マーケ施策・記事 / 業界ニュース（1日2回自動収集） / 資金調達 / ナレッジ・リスク

**→ 詳しい使い方は [docs/TOMARUN-COMMAND-CENTER.md](docs/TOMARUN-COMMAND-CENTER.md) を参照してください。**

### 起動

```bash
npm install
npm run build
npm start
```

- チャットアプリ: http://localhost:3000
- コマンドセンター: http://localhost:3000/pm

データは `data/pm-state.json` に保存されます（Git 管理外）。

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
