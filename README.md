# Weather LINE Bot

川崎市の天気を毎朝LINEで通知するBot

## 開発背景
川崎市の実質の天気予報を知る必要があったため作成
通常、天気予報のアプリを閲覧すると、0:00-24:00までの気温が表示されるが、
人間が行動している時間はおよそ09:00-23:00くらいと見込まれるため、それ以外の時間を除去した、「実質の気温」を知る必要があった。
（冬場等、前日が気温が高く今日が気温が低い、という場合、0:00が最高気温になってしまったりするのが良くなかった）

## 機能

- 毎日09:00（JST）に川崎市の天気情報を配信
- 最高気温、最低気温、降水確率（9時〜23時）を通知
- LINE Broadcast APIで友達全員に自動配信

## 技術スタック

- **Runtime**: Node.js 20.x + TypeScript
- **Infrastructure**: AWS Lambda + EventBridge
- **IaC**: AWS SAM
- **CI/CD**: GitHub Actions
- **Tool Management**: mise
- **Testing**: Vitest
- **Code Quality**: ESLint, Prettier

## 開発環境セットアップ

### 前提条件

- **mise**: ツールバージョン管理（Node.js、AWS CLIをインストール）
- **Python 3.x**: SAM CLIのインストールに必要
- **OpenWeather API Key**: [OpenWeather](https://openweathermap.org/api)で取得
- **LINE Messaging API Token**: [LINE Developers](https://developers.line.biz/)で取得

### セットアップ手順

#### 1. リポジトリをクローン

```bash
git clone <repository-url>
cd weather-line-bot
```

#### 2. miseをインストール（初回のみ）

```bash
# macOS (Homebrew)
brew install mise

# シェル設定に追加（zshの場合）
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
source ~/.zshrc

# bashの場合
echo 'eval "$(mise activate bash)"' >> ~/.bashrc
source ~/.bashrc
```

#### 3. 開発ツールをインストール

```bash
# Node.js 20.11.0、AWS CLI 2.15.0を自動インストール
mise install

# バージョン確認
node -v    # v20.11.0
aws --version  # aws-cli/2.15.0
```

#### 4. SAM CLIをインストール

```bash
pip install aws-sam-cli==1.108.0

# バージョン確認
sam --version  # SAM CLI, version 1.108.0
```

#### 5. 依存関係をインストール

```bash
npm install
```

これで開発環境のセットアップは完了です。

## ローカル開発

### テスト実行

```bash
# ユニットテスト
npm test

# テストウォッチモード
npm run test:watch

# カバレッジ付きテスト
npm test -- --coverage
```

### ローカルでLambda関数を実行

```bash
# EventBridgeイベントでLambda関数を実行
sam local invoke WeatherNotificationFunction \
  --event events/eventbridge-event.json
```

## デプロイ

### 自動デプロイ（推奨）

**mainブランチへのpushで自動デプロイされます。**

```bash
# 1. feature ブランチで開発
git checkout -b feature/your-feature

# 2. コミット
git add .
git commit -m "feat: Add your feature"

# 3. プッシュ
git push origin feature/your-feature

# 4. プルリクエストを作成してmainにマージ
# → GitHub Actionsが自動でビルド・テスト・デプロイを実行
```

### 初回デプロイ（管理者のみ）

初回のみ、以下の手順で手動デプロイが必要です：

#### 1. Parameter Storeにシークレットを設定

```bash
# OpenWeather API Key
aws ssm put-parameter \
  --name /weather-bot/openweather-api-key \
  --value "YOUR_OPENWEATHER_API_KEY" \
  --type SecureString \
  --region ap-northeast-1

# LINE Channel Access Token
aws ssm put-parameter \
  --name /weather-bot/line-channel-access-token \
  --value "YOUR_LINE_CHANNEL_ACCESS_TOKEN" \
  --type SecureString \
  --region ap-northeast-1
```

#### 2. GitHub Secretsを設定

GitHubリポジトリの Settings > Secrets and variables > Actions で以下を設定：

- `AWS_ACCESS_KEY_ID`: AWSアクセスキーID
- `AWS_SECRET_ACCESS_KEY`: AWSシークレットアクセスキー

#### 3. 初回デプロイ実行

```bash
npm run build
sam build
sam deploy --guided
```

以降は、mainブランチへのpushで自動デプロイされます。

## プロジェクト構成

```
weather-line-bot/
├── .github/workflows/    # GitHub Actions CI/CD
├── .steering/            # 作業単位のステアリングファイル
├── docs/                 # 永続的ドキュメント
├── src/                  # ソースコード
│   ├── handlers/         # Lambda ハンドラー
│   ├── services/         # ビジネスロジック
│   ├── utils/            # ユーティリティ
│   └── types/            # 型定義
├── tests/                # テストコード
├── events/               # SAM Localテスト用イベント
├── template.yaml         # AWS SAMテンプレート
├── .mise.toml            # miseツールバージョン管理
└── package.json          # npm設定
```

## ドキュメント

詳細なドキュメントは `docs/` ディレクトリを参照してください：

- [プロダクト要求定義書](docs/product-requirements.md)
- [機能設計書](docs/functional-design.md)
- [技術仕様書](docs/architecture.md)
- [リポジトリ構造定義書](docs/repository-structure.md)

## 開発ワークフロー

### ブランチ戦略

GitHub Flowを採用：

```
main (本番環境)
  ↑
  └── feature/add-xxx (機能追加)
  └── fix/bug-xxx (バグ修正)
```

### コミットメッセージ規約

```
<type>: <subject>

<body>
```

**Type**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `test`: テスト追加・修正
- `refactor`: リファクタリング
- `chore`: ビルド・設定変更

### CI/CDパイプライン

mainブランチへのpush時に以下が自動実行されます：

1. 依存関係のインストール（`npm ci`）
2. Lintチェック（`npm run lint`）
3. テスト実行（`npm test`）
4. ビルド（`npm run build`）
5. SAMビルド（`sam build`）
6. デプロイ（`sam deploy`）

## トラブルシューティング

### miseでNode.jsがインストールできない

```bash
# mise診断
mise doctor

# 手動でNode.jsをインストール
mise install node@20.11.0
```

### SAM CLIが見つからない

```bash
# pipでインストールされているか確認
pip list | grep aws-sam-cli

# 再インストール
pip install --upgrade aws-sam-cli
```

### Parameter Storeからシークレットが取得できない

```bash
# Parameter Storeの値を確認
aws ssm get-parameter \
  --name /weather-bot/openweather-api-key \
  --with-decryption \
  --region ap-northeast-1

# Lambda実行ロールにSSM権限があるか確認
aws iam get-role-policy \
  --role-name <lambda-execution-role-name> \
  --policy-name <policy-name>
```

