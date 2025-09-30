# Discord Emoji Bot

GitHub Actionsで30分ごとに自動実行され、Discordの新着メッセージにGemini AIが選んだ最適な絵文字でリアクションするボットです。

## 特徴

- **完全サーバーレス**: GitHub Actions cron で定期実行
- **超低コスト**: Gemini API（無料枠）+ Discord REST API
- **ミニマル設計**: 状態管理は `.state.json` のみ
- **全チャンネル自動対応**: Botが参加している全サーバーの全テキストチャンネルを自動監視
- **リアルタイム不要**: 30分ごとのポーリングで十分な場合に最適

## セットアップ（所要時間: 約10分）

### ステップ1: Discord Bot作成とトークン取得

1. **[Discord Developer Portal](https://discord.com/developers/applications) にアクセス**
   - Discordアカウントでログイン

2. **New Application をクリック**
   - 名前を入力（例: `Emoji Bot`）
   - Create をクリック

3. **Bot タブに移動**
   - 左メニューから **Bot** をクリック
   - **Add Bot** → **Yes, do it!** で確認

4. **Bot トークンを取得**
   - **Reset Token** をクリック
   - **Copy** でトークンをコピー（後で使用）
   - ⚠️ **重要**: トークンは一度しか表示されないので、安全な場所に保存してください
   - 形式例: `MTQyMjY...（長い文字列）...li58`

5. **Bot の権限設定**
   - 左メニューから **OAuth2** → **URL Generator** をクリック
   - **SCOPES** セクション:
     - ✅ `bot` にチェック
   - **BOT PERMISSIONS** セクション:
     - ✅ `View Channels`（チャンネルを閲覧）
     - ✅ `Read Message History`（メッセージ履歴を読む）
     - ✅ `Add Reactions`（リアクションの追加）

6. **Bot を Discord サーバーに招待**
   - 画面下部に生成された URL をコピー
   - ブラウザで URL を開く
   - 招待先のサーバーを選択
   - **認証** をクリック

### ステップ2: Gemini API キー取得

1. **[Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス**
   - Googleアカウントでログイン

2. **API キーを作成**
   - **Get API key** をクリック
   - **Create API key** をクリック
   - 既存のプロジェクトを選択 or **Create new project** で新規作成

3. **API キーをコピー**
   - 表示されたキーをコピー（後で使用）
   - 形式例: `AIzaSy...（長い文字列）...cYA`

4. **無料枠の確認**
   - 無料枠: 1日1500リクエスト、月100万トークン
   - このBotの使用量: 30分ごと × 48回/日 × 5メッセージ = 240リクエスト/日（余裕）

### ステップ3: GitHub リポジトリ設定

#### 3-1. リポジトリの準備

このリポジトリをフォークまたはクローン:

```bash
# フォークする場合
1. 画面右上の Fork ボタンをクリック

# または、新規リポジトリとして作成する場合
git clone https://github.com/maplefukku/discord-reaction.git
cd discord-reaction
# 自分のGitHubアカウントに新規リポジトリを作成してpush
```

#### 3-2. GitHub Secrets の設定

リポジトリページで:

1. **Settings** タブをクリック
2. 左メニュー **Secrets and variables** → **Actions** をクリック
3. **Secrets** タブを選択
4. **New repository secret** をクリック

以下の2つのSecretを追加:

**Secret 1: Discord Bot Token**
```
Name: DISCORD_BOT_TOKEN
Secret: （ステップ1でコピーしたBotトークン）
```

**Secret 2: Gemini API Key**
```
Name: GEMINI_API_KEY
Secret: （ステップ2でコピーしたAPIキー）
```

##### コマンドラインで設定する場合（GitHub CLI使用）

```bash
cd discord-reaction
gh secret set DISCORD_BOT_TOKEN -b "あなたのBotトークン"
gh secret set GEMINI_API_KEY -b "あなたのGemini APIキー"
```

#### 3-3. GitHub Actions の有効化

1. リポジトリの **Actions** タブを開く
2. 初回の場合: **"I understand my workflows, go ahead and enable them"** をクリック
3. **Discord Emoji Bot** ワークフローを選択
4. **Run workflow** → **Run workflow** で手動実行してテスト

### ステップ4: 動作確認

1. **Discord サーバーでメッセージを投稿**
   - Botが招待されているチャンネルで何かメッセージを送信

2. **GitHub Actions を手動実行**
   - リポジトリの **Actions** タブ
   - **Discord Emoji Bot** を選択
   - **Run workflow** をクリック

3. **実行ログを確認**
   - ワークフロー実行をクリック
   - **run** ジョブをクリック
   - `Monitoring X channels` と表示されればチャンネル取得成功
   - `Processing: メッセージ内容...` が表示されれば処理成功

4. **Discord で確認**
   - 投稿したメッセージに絵文字リアクションが付いていれば完了✅

## 自動実行の仕組み

- **定期実行**: 30分ごとに自動実行（GitHub Actions cron）
- **対象**: Botが参加している全サーバーの全テキストチャンネル
- **処理内容**:
  1. 各チャンネルの新着メッセージを最大5件取得
  2. Botのメッセージはスキップ
  3. Gemini AIに文章を送信して最適な絵文字を取得
  4. メッセージにリアクションを追加
  5. 処理済みメッセージIDを `.state.json` に保存（重複防止）

## カスタマイズ

### 実行頻度を変更

`.github/workflows/bot.yml` の cron を編集:

```yaml
- cron: "*/15 * * * *"  # 15分ごと
- cron: "0 * * * *"     # 1時間ごと
```

### 取得メッセージ数を変更

`bot.js` の `limit=5` を変更:

```javascript
let url = `https://discord.com/api/v10/channels/${ch}/messages?limit=10`;
```

### プロンプト調整

`askGemini` 関数内のプロンプトを変更:

```javascript
text: `この文章の雰囲気に合う絵文字を1つ返して: ${msg}`
```

## トラブルシューティング

### リアクションが付かない

**確認1: GitHub Actions の実行ログ**
```
1. リポジトリ → Actions タブ
2. 最新のワークフロー実行をクリック
3. run ジョブをクリック
4. エラーメッセージを確認
```

**確認2: Bot 権限**
- Discord Developer Portal → Bot タブ
- 以下の権限が有効か確認:
  - `View Channels`
  - `Read Message History`
  - `Add Reactions`

**確認3: Bot がサーバーに招待されているか**
- Discord サーバーのメンバーリストに Bot が表示されているか確認
- 表示されていない場合は、ステップ1-6 の招待URLから再招待

**確認4: チャンネル権限**
- Botがメッセージを読めるチャンネルか確認
- プライベートチャンネルの場合、Botを明示的に追加

### GitHub Actions が実行されない

**確認1: Actions が有効か**
```
リポジトリ → Actions タブ → 「I understand...」をクリック
```

**確認2: Secrets が設定されているか**
```
Settings → Secrets and variables → Actions → Secrets
以下が存在するか確認:
- DISCORD_BOT_TOKEN
- GEMINI_API_KEY
```

**確認3: 手動実行でテスト**
```
Actions → Discord Emoji Bot → Run workflow
```

### Gemini API エラー

**エラー: API key not valid**
- API キーが正しく設定されているか確認
- [Google AI Studio](https://makersuite.google.com/app/apikey) で新しいキーを発行

**エラー: Quota exceeded**
- 無料枠を超過（1日1500リクエスト）
- 翌日まで待つか、実行頻度を下げる（cron を `0 * * * *` に変更）

### Discord API エラー

**エラー: 401 Unauthorized**
- Bot トークンが間違っている
- Discord Developer Portal でトークンを再発行

**エラー: 403 Forbidden**
- Bot に必要な権限がない
- OAuth2 URL Generator で権限を再確認して招待し直す

**エラー: 429 Too Many Requests**
- レート制限に到達
- 監視チャンネル数を減らすか、実行頻度を下げる

### `.state.json` が更新されない

**原因: GitHub Actions の書き込み権限**
```
Settings → Actions → General → Workflow permissions
→ 「Read and write permissions」を選択
```

## ライセンス

MIT