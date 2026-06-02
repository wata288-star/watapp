# デプロイ手順（ネットで常時使う）

FLYHEIT は `node:sqlite`（ファイルDB）を使うため、**永続ディスク(ボリューム)を積めるホスティング**が必要です。
Vercel/Netlify などのサーバーレスはデータが消えるので不可。以下のどちらかを使ってください。

> ⚠️ **公開前に必ずパスコードを設定**（環境変数 `FLYHEIT_PASSCODE`）。
> 未設定だとURLを知る人は誰でも資産データを見られます。設定すると全ページがログイン必須になります。

---

## 方法A: Fly.io（推奨・設定がリポジトリに同梱済み）

1. CLIを入れてログイン
   ```bash
   # macOS
   brew install flyctl
   # Windows (PowerShell)
   # iwr https://fly.io/install.ps1 -useb | iex

   fly auth signup   # または fly auth login
   ```

2. このブランチをローカルに取得
   ```bash
   git clone -b claude/fervent-pasteur-JSVyx https://github.com/wata288-star/watapp.git flyheit
   cd flyheit
   ```

3. アプリ作成（`fly.toml` 同梱済みなのでデプロイはしない）
   ```bash
   fly launch --copy-config --no-deploy
   # アプリ名・リージョンを聞かれたら任意で。Postgres等は「No」でOK
   ```

4. 永続ボリュームを作成（DB保存先）
   ```bash
   fly volumes create flyheit_data --size 1   # 1GBで十分
   ```

5. パスコードを設定（ログイン用）
   ```bash
   fly secrets set FLYHEIT_PASSCODE=あなたの好きなパスコード
   ```

6. デプロイ
   ```bash
   fly deploy
   ```
   完了後 `https://<アプリ名>.fly.dev` で常時アクセスできます。スマホからもOK。

---

## 方法B: Railway（GUI中心で簡単）

1. https://railway.app にGitHubでログイン
2. **New Project → Deploy from GitHub repo** → `wata288-star/watapp` を選択
   - ブランチを `claude/fervent-pasteur-JSVyx` に設定
   - Dockerfile を自動検出してビルドされます
3. **Variables** に `FLYHEIT_PASSCODE = 好きなパスコード` を追加
4. **Volume** を追加し、マウント先を **`/app/data`** に設定（これでDBが永続化）
5. デプロイ完了後、発行されたURLでアクセス

---

## データのバックアップ

DBは `data/flyheit.db`（ボリューム内）。
- Fly: `fly ssh console` → `/app/data/flyheit.db` を `fly sftp get` で取得
- Railway: ボリュームの内容をダウンロード

定期的に手元へ控えておくと安心です。

---

## ローカルで動かす場合（Node 22+ 必須）
```bash
npm install
FLYHEIT_PASSCODE=test npm run dev   # http://localhost:3000
```
`FLYHEIT_PASSCODE` を省くとログイン無しで開けます（開発用）。
