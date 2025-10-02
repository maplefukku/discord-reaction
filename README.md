# Discord Emoji Bot

GitHub Actionsで30分ごとに自動実行され、Discordの新着メッセージにGemini AIが選んだ最適な絵文字でリアクションするボットです。

## 特徴

- **完全サーバーレス**: GitHub Actions cron で定期実行
- **超低コスト**: Gemini 2.0 Flash API（無料枠）+ Discord REST API
- **スマート設計**: GitHub Actions Cacheで状態管理、リポジトリを汚さない
- **全チャンネル自動対応**: Botが参加している全サーバーの全テキストチャンネルを自動監視
- **24時間以内のメッセージに対応**: 古いメッセージは自動スキップ
- **重複防止**: 既にリアクション済みのメッセージはスキップ
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

4. **Privileged Gateway Intents を有効化（重要）**
   - Bot タブの下部にある **Privileged Gateway Intents** セクション
   - ✅ **MESSAGE CONTENT INTENT** をONにする
   - ⚠️ これを有効にしないとメッセージ内容が取得できません

5. **Bot トークンを取得**
   - **Reset Token** をクリック
   - **Copy** でトークンをコピー（後で使用）
   - ⚠️ **重要**: トークンは一度しか表示されないので、安全な場所に保存してください
   - 形式例: `MTQyMjY...（長い文字列）...li58`

6. **Bot の権限設定**
   - 左メニューから **OAuth2** → **URL Generator** をクリック
   - **SCOPES** セクション:
     - ✅ `bot` にチェック
   - **BOT PERMISSIONS** セクション:
     - ✅ `View Channels`（チャンネルを閲覧）
     - ✅ `Read Message History`（メッセージ履歴を読む）
     - ✅ `Add Reactions`（リアクションの追加）

7. **Bot を Discord サーバーに招待**
   - 画面下部に生成された URL をコピー
   - ブラウザで URL を開く
   - 招待先のサーバーを選択
   - **認証** をクリック

8. **プライベートチャンネルの設定（必要に応じて）**
   - Discordサーバーで、プライベートチャンネルの設定を開く
   - **権限** → **メンバー/ロールを追加**
   - Bot を追加して以下の権限を付与:
     - ✅ チャンネルを見る
     - ✅ メッセージを読む
     - ✅ メッセージ履歴を読む
     - ✅ リアクションを追加

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

### 実行フロー
1. **30分ごとに自動実行**（GitHub Actions cron）
2. **GitHub Actions Cacheから状態を復元**（処理済みメッセージID）
3. **全チャンネルをスキャン**（Botが参加している全テキストチャンネル）
4. **フィルタリング**:
   - ✅ Botのメッセージはスキップ
   - ✅ 既にリアクション済みのメッセージはスキップ
   - ✅ 24時間より古いメッセージはスキップ
   - ✅ 空のメッセージはスキップ
5. **Gemini 2.0 Flash AIで絵文字を選択**
   - メッセージ内容と感情を分析
   - 最適な絵文字を1つ選択
6. **リアクションを追加**
7. **状態をキャッシュに保存**（次回実行で使用）

### 状態管理
- **保存先**: GitHub Actions Cache（リポジトリに残らない）
- **保存内容**: 各チャンネルの最終処理メッセージID
- **キャッシュ戦略**: 実行ごとに新しいキー、restore-keysで最新を自動復元
- **自動削除**: 使われなくなった古いキャッシュはGitHub Actionsが自動削除

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

### Gemini モデルを変更

`bot.js` のモデル名を変更:

```javascript
// 現在: gemini-2.0-flash（バランス型）
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`

// 最安: gemini-2.0-flash-lite（高速・低コスト）
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`
```

### プロンプト調整

`bot.js` の `askGemini` 関数内のプロンプトを変更:

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

**エラー: models/gemini-xxx is not found**
- モデル名が古い可能性があります
- `bot.js` を最新バージョンに更新してください
- 現在のモデル: `gemini-2.0-flash`

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

### 絵文字が全て ❓ になる

**原因1: Gemini APIモデルエラー**
- ログで `Gemini API Error` を確認
- モデル名が古い可能性 → `gemini-2.0-flash` に更新

**原因2: APIキーの問題**
- Secretsが正しく設定されているか確認
- APIキーを再発行して設定し直す

### フォークしたリポジトリで動かない

**必須設定**:
1. **Secrets** に `DISCORD_BOT_TOKEN` と `GEMINI_API_KEY` を追加
2. **Actions** タブで "I understand my workflows, go ahead and enable them" をクリック
3. 自分のDiscord BotとGemini APIキーを使用する

## 技術スタック

- **実行環境**: GitHub Actions (Ubuntu latest)
- **言語**: Node.js 20
- **AI**: Gemini 2.0 Flash API
- **Discord**: Discord REST API v10
- **状態管理**: GitHub Actions Cache
- **依存関係**: node-fetch のみ

## ライセンス

MIT