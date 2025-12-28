# 技術仕様書

## 1. テクノロジースタック

### 1.1 ランタイム環境

| 技術 | バージョン | 用途 | 選定理由 |
|------|-----------|------|---------|
| **Node.js** | 20.x | Lambda実行環境 | 最新LTS、AWS Lambda標準サポート |
| **TypeScript** | 5.x | 開発言語 | 型安全性、開発効率向上 |
| **esbuild** | 最新 | ビルドツール | 高速ビルド、TypeScriptネイティブサポート |

### 1.2 AWSサービス

| サービス | 用途 | 料金モデル |
|---------|------|-----------|
| **AWS Lambda** | 天気通知処理の実行 | 実行時間課金（月100万リクエスト無料） |
| **Amazon EventBridge** | スケジュール実行（09:00 JST） | ルールごとに課金（月間100万イベント無料） |
| **AWS Systems Manager Parameter Store** | API Key/Tokenの安全な保管 | SecureString: 10,000パラメータまで無料 |
| **Amazon CloudWatch Logs** | ログ保存・監視 | データ量課金（5GB/月まで無料） |
| **Amazon CloudWatch Alarms** | エラー通知 | アラームごとに課金（10アラームまで無料） |
| **Amazon SNS** | メール通知 | 通知数課金（月1,000件まで無料） |

### 1.3 外部API

| API | 用途 | 料金プラン | 制限 |
|-----|------|-----------|------|
| **OpenWeather API** | 天気データ取得 | Free Tier | 60回/分、1,000回/日 |
| **LINE Messaging API** | メッセージ配信 | Free Tier | 500通/月（Broadcast） |

### 1.4 IaC（Infrastructure as Code）

| 技術 | 用途 | 選定理由 |
|------|------|---------|
| **AWS SAM** | インフラ定義・デプロイ | Serverless特化、Lambda/EventBridge統合 |
| **CloudFormation** | AWSリソース管理 | SAMの内部実装、スタック管理 |

### 1.5 CI/CD

| 技術 | 用途 | 選定理由 |
|------|------|---------|
| **GitHub Actions** | ビルド・テスト・デプロイ自動化 | GitHub統合、無料枠が豊富 |
| **SAM CLI** | ローカルテスト・デプロイ | SAMテンプレートの検証・デプロイ |

### 1.6 テスト・品質管理

| 技術 | 用途 | 選定理由 |
|------|------|---------|
| **Vitest** | ユニットテスト | 高速、TypeScriptネイティブ、Jest互換 |
| **ESLint** | 静的解析 | TypeScript対応、カスタマイズ可能 |
| **Prettier** | コードフォーマット | 一貫性のあるコードスタイル |

---

## 2. 開発ツールと手法

### 2.1 開発環境

#### 必須ツール
```bash
- Node.js 20.x
- npm または yarn
- AWS CLI v2
- SAM CLI
- Git
```

#### 推奨IDE
- **Visual Studio Code**
  - 拡張機能: ESLint, Prettier, TypeScript, AWS Toolkit

### 2.2 パッケージ管理

```json
{
  "packageManager": "npm",
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

**主要な依存パッケージ**:
| パッケージ | 用途 |
|-----------|------|
| `@aws-sdk/client-ssm` | Parameter Store操作 |
| `axios` | HTTP通信（OpenWeather/LINE API） |
| `zod` | ランタイム型検証 |

**開発依存パッケージ**:
| パッケージ | 用途 |
|-----------|------|
| `typescript` | TypeScript変換 |
| `vitest` | テスト実行 |
| `eslint` | コード品質チェック |
| `prettier` | コードフォーマット |
| `@types/node` | Node.js型定義 |

### 2.3 コーディング規約

#### TypeScript設定（tsconfig.json）
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist"
  }
}
```

#### ESLint設定
- **ベース**: `@typescript-eslint/recommended`
- **ルール**:
  - `no-console`: off（Lambda環境ではconsole.logを使用）
  - `@typescript-eslint/no-unused-vars`: error
  - `@typescript-eslint/explicit-function-return-type`: warn

#### Prettier設定
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 2.4 Git戦略

#### ブランチ戦略: GitHub Flow

```
main (本番環境)
  ↑
  └── feature/add-xxx (機能追加)
  └── fix/bug-xxx (バグ修正)
```

#### コミットメッセージ規約
```
<type>: <subject>

<body>
```

**Type一覧**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `test`: テスト追加・修正
- `refactor`: リファクタリング
- `chore`: ビルド・設定変更

**例**:
```
feat: Add weather notification Lambda function

- Implement OpenWeather API integration
- Add LINE Broadcast message formatting
- Add error handling and retry logic
```

### 2.5 バージョン管理

#### セマンティックバージョニング
```
v<major>.<minor>.<patch>
```

- **major**: 破壊的変更
- **minor**: 新機能追加（互換性あり）
- **patch**: バグ修正

**例**: `v1.0.0` → `v1.1.0` → `v1.1.1`

---

## 3. 技術的制約と要件

### 3.1 AWS Lambda制約

| 項目 | 制限値 | 本アプリ設定値 |
|------|--------|--------------|
| **最大メモリ** | 10,240 MB | 256 MB |
| **最大タイムアウト** | 15分 | 30秒 |
| **デプロイパッケージサイズ** | 50 MB (zip圧縮) | ~5 MB |
| **環境変数サイズ** | 4 KB | ~1 KB |
| **同時実行数** | 1,000（デフォルト） | 1 |

### 3.2 API制限

#### OpenWeather API（Free Tier）
| 項目 | 制限 | 本アプリ使用量 |
|------|------|--------------|
| **呼び出し頻度** | 60回/分 | 1回/日 |
| **1日の呼び出し数** | 1,000回 | 1回/日 |
| **データ保持期間** | リアルタイムのみ | N/A |

#### LINE Messaging API（Free Tier）
| 項目 | 制限 | 本アプリ使用量 |
|------|------|--------------|
| **月間メッセージ数** | 500通 | 30通/月（友達数に依存） |
| **Broadcast送信頻度** | 制限なし | 1回/日 |
| **メッセージサイズ** | 5,000文字 | ~100文字 |

### 3.3 コスト制約

#### 月間コスト見積もり（友達100人想定）

| サービス | 使用量 | 料金 |
|---------|--------|------|
| **AWS Lambda** | 30回/月 × 5秒 | $0.00（無料枠内） |
| **EventBridge** | 30イベント/月 | $0.00（無料枠内） |
| **CloudWatch Logs** | ~100 MB/月 | $0.00（無料枠内） |
| **Parameter Store** | 2パラメータ | $0.00（無料枠内） |
| **SNS** | ~10通知/月 | $0.00（無料枠内） |
| **OpenWeather API** | 30回/月 | $0.00（無料枠内） |
| **LINE Messaging API** | 100通/月 | $0.00（無料枠内） |
| **合計** | - | **$0.00/月** |

**注意**: 友達数が500人を超えるとLINE無料枠を超過する可能性あり

### 3.4 セキュリティ要件

| 要件 | 実装方法 |
|------|---------|
| **シークレット保護** | AWS Systems Manager Parameter Store（SecureString） |
| **最小権限の原則** | Lambda IAMロールに必要最小限の権限のみ付与 |
| **通信の暗号化** | HTTPS通信のみ（OpenWeather/LINE API） |
| **ログのマスキング** | API Key/Tokenをログに出力しない |
| **依存パッケージ監査** | `npm audit`で脆弱性チェック |

### 3.5 可用性要件

| 項目 | 目標値 | 測定方法 |
|------|--------|---------|
| **配信成功率** | 99%以上 | CloudWatch Metricsで成功/失敗をカウント |
| **Lambda実行成功率** | 95%以上 | CloudWatch Logsでエラー率を監視 |
| **復旧時間（RTO）** | 24時間以内 | 手動での再デプロイ・修正 |
| **データ損失許容（RPO）** | 1日 | 配信失敗時は翌日再配信 |

---

## 4. パフォーマンス要件

### 4.1 レスポンスタイム

| 処理 | 目標値 | 測定方法 |
|------|--------|---------|
| **Lambda全体実行時間** | 10秒以内 | CloudWatch Metricsの`Duration` |
| **OpenWeather API呼び出し** | 3秒以内 | カスタムメトリクス |
| **LINE API呼び出し** | 5秒以内 | カスタムメトリクス |

### 4.2 スループット

| 項目 | 目標値 |
|------|--------|
| **1日あたりの処理件数** | 1件（09:00実行） |
| **最大同時実行数** | 1 |

### 4.3 リソース使用量

| リソース | 目標値 | 理由 |
|---------|--------|------|
| **Lambda メモリ使用量** | 128 MB以下 | 軽量な処理のため |
| **デプロイパッケージサイズ** | 5 MB以下 | 依存関係最小化 |
| **CloudWatch Logs** | 10 MB/月以下 | ログ量を抑える |

### 4.4 最適化戦略

#### コールドスタート対策
- **アーキテクチャ**: arm64（Graviton2）を使用してコスト削減
- **依存関係**: 最小限のパッケージのみ使用
- **バンドル**: esbuildでツリーシェイキング

#### メモリ使用量削減
- **ストリーミング処理**: 大量データは扱わないため不要
- **変数のスコープ管理**: 不要なオブジェクトは早期解放

#### ネットワーク最適化
- **リトライ戦略**: 指数バックオフではなく固定間隔（1秒）
- **タイムアウト設定**: 10秒でタイムアウト（デフォルトより短縮）

---

## 5. デプロイメント戦略

### 5.1 環境構成

| 環境 | 用途 | デプロイタイミング |
|------|------|--------------------|
| **prod** | 本番環境 | main ブランチへのpushで自動デプロイ |

**注**: 開発環境は設けず、ローカル環境（SAM Local）でテスト後、本番環境に直接デプロイ

### 5.2 SAMテンプレート構成

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Description: Weather LINE Bot - Kawasaki City Weather Notification

Resources:
  WeatherNotificationFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: dist/index.handler
      Runtime: nodejs20.x
      MemorySize: 256
      Timeout: 30
      Architectures:
        - arm64
      Events:
        DailySchedule:
          Type: Schedule
          Properties:
            Schedule: cron(0 0 * * ? *)  # 09:00 JST
            Description: Daily weather notification at 09:00 JST
      Policies:
        - SSMParameterReadPolicy:
            ParameterName: weather-bot/*
        - CloudWatchLogsFullAccess
```

### 5.3 GitHub Actions ワークフロー

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - uses: aws-actions/setup-sam@v2

      - name: SAM Build
        run: sam build

      - name: SAM Deploy
        run: sam deploy --no-confirm-changeset --no-fail-on-empty-changeset
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: ap-northeast-1
```

### 5.4 ロールバック戦略

| シナリオ | 対応 |
|---------|------|
| **デプロイ失敗** | CloudFormationが自動ロールバック |
| **実行時エラー** | 前バージョンへ手動ロールバック（`sam deploy`） |
| **データ不整合** | N/A（ステートレスなため） |

---

## 6. 監視・ログ戦略

### 6.1 CloudWatch Metrics

| メトリクス | 収集間隔 | アラーム閾値 |
|-----------|---------|-------------|
| **Lambda Invocations** | 1分 | < 1/日でアラーム |
| **Lambda Errors** | 1分 | > 1/日でアラーム |
| **Lambda Duration** | 1分 | > 20秒でアラーム |
| **Lambda Throttles** | 1分 | > 0でアラーム |

### 6.2 カスタムメトリクス

```typescript
// Lambda関数内でカスタムメトリクスを記録
console.log(JSON.stringify({
  metric: 'WeatherAPILatency',
  value: latency,
  unit: 'Milliseconds'
}));
```

### 6.3 ログ構造化

```typescript
// 構造化ログの例
interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  context?: Record<string, unknown>;
}

// 使用例
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  message: 'Weather data fetched successfully',
  context: { city: 'Kawasaki', temp: 15 }
}));
```

### 6.4 ログ保持ポリシー

| ロググループ | 保持期間 | 理由 |
|------------|---------|------|
| `/aws/lambda/weather-notification` | 7日間 | コスト削減、短期デバッグのみ |

---

## 7. ディザスタリカバリ

### 7.1 バックアップ戦略

| 対象 | バックアップ方法 | 復旧方法 |
|------|----------------|---------|
| **Lambdaコード** | GitHubリポジトリ | `sam deploy`で再デプロイ |
| **SAMテンプレート** | GitHubリポジトリ | `sam deploy`で再作成 |
| **Parameter Store** | 手動バックアップ（初期設定時のみ） | AWSコンソールで再作成 |

### 7.2 障害シナリオと対応

| 障害 | 影響 | 対応時間 | 復旧手順 |
|------|------|---------|---------|
| **Lambda関数削除** | 配信停止 | 30分 | `sam deploy`で再デプロイ |
| **EventBridgeルール削除** | 配信停止 | 30分 | `sam deploy`で再作成 |
| **Parameter Store削除** | 認証失敗 | 1時間 | AWSコンソールで再設定 |
| **OpenWeather API停止** | 配信失敗 | 24時間 | 外部サービス復旧待ち |
| **LINE API停止** | 配信失敗 | 24時間 | 外部サービス復旧待ち |

### 7.3 RTO/RPO

| 項目 | 目標値 | 説明 |
|------|--------|------|
| **RTO** (復旧時間目標) | 24時間 | 翌日の配信までに復旧 |
| **RPO** (データ損失許容) | 1日 | 配信失敗時は翌日再配信 |

---

## 8. 拡張性設計

### 8.1 スケーラビリティ

| 項目 | 現在 | Phase 2 | Phase 3 |
|------|------|---------|---------|
| **都市数** | 1都市 | 10都市 | 100都市 |
| **ユーザー数** | ~100人 | ~1,000人 | ~10,000人 |
| **配信頻度** | 1回/日 | 複数回/日 | リアルタイム |
| **Lambda同時実行数** | 1 | 10 | 100 |

### 8.2 アーキテクチャ進化

#### Phase 1（現在）: シンプルなBroadcast
```
EventBridge → Lambda → OpenWeather/LINE
```

#### Phase 2: ユーザー管理追加
```
EventBridge → Lambda → DynamoDB（ユーザー設定）
                     → OpenWeather/LINE
LINE Webhook → Lambda → DynamoDB（ユーザー登録）
```

#### Phase 3: マイクロサービス化
```
EventBridge → Lambda（Orchestrator）
                ↓
            Step Functions
                ↓
        ┌───────┼───────┐
   Lambda(天気) Lambda(配信) Lambda(分析)
        ↓       ↓           ↓
    OpenWeather LINE      S3/Athena
```

---

## 9. セキュリティベストプラクティス

### 9.1 コード品質

| 項目 | ツール | 実施タイミング |
|------|--------|--------------|
| **静的解析** | ESLint | コミット時、CI実行時 |
| **依存関係監査** | npm audit | CI実行時、週次 |
| **型チェック** | TypeScript | ビルド時 |
| **ユニットテスト** | Vitest | コミット時、CI実行時 |

### 9.2 シークレット管理

```typescript
// 環境変数ではなくParameter Storeから取得
// NG: 環境変数に直接設定
// Environment:
//   OPENWEATHER_API_KEY: "abc123"

// OK: Parameter Storeから取得
const ssmClient = new SSMClient({});
const response = await ssmClient.send(
  new GetParameterCommand({
    Name: '/weather-bot/openweather-api-key',
    WithDecryption: true
  })
);
```

### 9.3 アクセス制御

```yaml
# Lambda実行ロール（最小権限）
Policies:
  - Statement:
    - Effect: Allow
      Action:
        - ssm:GetParameter
      Resource:
        - arn:aws:ssm:*:*:parameter/weather-bot/*
  - CloudWatchLogsFullAccess
```

---

## 10. 技術的負債管理

### 10.1 定期的なメンテナンス

| タスク | 頻度 | 担当 |
|--------|------|------|
| **依存関係更新** | 月次 | 開発者 |
| **Node.jsバージョンアップ** | 年次 | 開発者 |
| **AWS SAM更新** | 四半期 | 開発者 |
| **セキュリティパッチ適用** | 週次 | 自動（Dependabot） |

### 10.2 技術選定の見直し

| 項目 | 見直しタイミング | 判断基準 |
|------|----------------|---------|
| **OpenWeather API** | 年次 | 精度、コスト、サポート |
| **LINE Messaging API** | 年次 | 機能、コスト、制限 |
| **AWS Lambda** | 年次 | パフォーマンス、コスト |
| **TypeScript** | 年次 | 新機能、エコシステム |

---

## 11. 制約事項のまとめ

### 11.1 技術的制約
- Node.js 20.xに依存（Lambda環境）
- TypeScript 5.x以上が必要
- AWS Lambda実行時間は最大30秒
- OpenWeather API無料枠: 1,000回/日
- LINE Messaging API無料枠: 500通/月

### 11.2 ビジネス制約
- 初期バージョンは川崎市のみ対応
- 配信時刻は固定（09:00 JST）
- ユーザー個別設定は未対応

### 11.3 運用制約
- 手動デプロイメントは不可（GitHub Actions必須）
- ログ保持期間は7日間のみ
- 障害時の復旧は24時間以内
