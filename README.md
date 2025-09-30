# Discord Emoji Bot

GitHub Actionsで30分ごとに自動実行され、Discordの新着メッセージにGemini AIが選んだ最適な絵文字でリアクションするボットです。

## 特徴

- **完全サーバーレス**: GitHub Actions cron で定期実行
- **超低コスト**: Gemini API（無料枠）+ Discord REST API
- **ミニマル設計**: 状態管理は `.state.json` のみ
- **リアルタイム不要**: 30分ごとのポーリングで十分な場合に最適

## セットアップ

### 1. Discord Bot作成

1. [Discord Developer Portal](https://discord.com/developers/applications) でアプリケーション作成
2. Bot タブで Bot を作成し、トークンをコピー
3. OAuth2 > URL Generator で以下を選択:
   - Scopes: `bot`
   - Bot Permissions: `Add Reactions`, `Read Messages/View Channels`
4. 生成されたURLでサーバーに招待

### 2. Gemini API キー取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) でAPIキーを取得

### 3. チャンネルID取得

1. Discord で開発者モードを有効化（設定 > 詳細設定 > 開発者モード）
2. 対象チャンネルを右クリック > IDをコピー

### 4. GitHub リポジトリ設定

このリポジトリを自分のGitHubアカウントにフォーク/アップロードし、以下を設定:

#### Secrets (Settings > Secrets and variables > Actions > New repository secret)

- `DISCORD_BOT_TOKEN`: Discord Bot のトークン
- `GEMINI_API_KEY`: Gemini API キー

#### Variables (Settings > Secrets and variables > Actions > Variables > New repository variable)

- `CHANNEL_IDS`: 監視するチャンネルID（複数の場合カンマ区切り）
  - 例: `1234567890123456789` または `1234567890123456789,9876543210987654321`

### 5. GitHub Actions有効化

1. リポジトリの Actions タブを開く
2. "I understand my workflows, go ahead and enable them" をクリック
3. 手動実行でテスト: `Discord Emoji Bot` > `Run workflow`

## 動作確認

1. 監視対象チャンネルにメッセージを投稿
2. 30分待つか、GitHub Actions から手動実行
3. メッセージに絵文字リアクションが付けば成功

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

- GitHub Actions の実行ログを確認
- Bot に `Add Reactions` 権限があるか確認
- チャンネルIDが正しいか確認

### API制限エラー

- Gemini API: 無料枠は1日1500リクエスト（30分ごと×5件=240件/日で余裕）
- Discord API: レート制限は自動的に考慮されるが、大量のチャンネルを監視する場合は要注意

## ライセンス

MIT