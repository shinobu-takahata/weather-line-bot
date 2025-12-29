# 初回実装設計書（基盤構築）

## 1. 実装アプローチ

基盤構築に焦点を当て、以下の順序で実装する：

1. 開発環境のセットアップ（mise、npm、TypeScript）
2. ディレクトリ構造の作成
3. 設定ファイルの作成
4. AWS SAMテンプレートの作成
5. 最小限のLambda関数実装（ダミーハンドラー）
6. ローカル実行環境の構築
7. ビルド・デプロイの確認

## 2. ディレクトリ構造

### 今回作成するファイル・ディレクトリ

```
weather-line-bot/
├── src/
│   └── index.ts                      # Lambda関数エントリーポイント（ダミー実装）
│
├── events/
│   └── eventbridge-event.json        # EventBridgeイベントサンプル
│
├── template.yaml                     # AWS SAMテンプレート
├── samconfig.toml                    # SAM CLI設定
│
├── package.json                      # npm設定、依存関係
├── package-lock.json                 # 依存関係ロックファイル（npm installで自動生成）
│
├── tsconfig.json                     # TypeScript設定
├── .eslintrc.json                    # ESLint設定
├── .prettierrc                       # Prettier設定
│
├── .mise.toml                        # miseツールバージョン管理
├── .gitignore                        # Git除外設定
│
└── dist/                             # ビルド成果物（.gitignoreで除外）
    └── index.js                      # esbuildでバンドルされたコード
```

## 3. 開発環境セットアップ

### 3.1 mise設定（.mise.toml）

```toml
[tools]
# Node.js - Lambda nodejs20.x ランタイムに対応
node = "20.11.0"

# AWS CLI - AWSリソース管理
awscli = "2.15.0"

# 注: SAM CLIは pip install aws-sam-cli で別途インストール
```

### 3.2 npm設定（package.json）

```json
{
  "name": "weather-line-bot",
  "version": "1.0.0",
  "description": "川崎市の天気を毎朝LINEで通知するBot",
  "main": "dist/index.js",
  "scripts": {
    "build": "esbuild src/index.ts --bundle --platform=node --target=node20 --outdir=dist --external:@aws-sdk/*",
    "lint": "eslint src",
    "format": "prettier --write \"src/**/*.ts\""
  },
  "keywords": ["weather", "line", "bot", "aws", "lambda"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@aws-sdk/client-ssm": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "esbuild": "^0.19.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=20.11.0",
    "npm": ">=10.0.0"
  }
}
```

**ポイント**:
- `@aws-sdk/client-ssm`: Parameter Store読み取り用（今回は使用しないが、将来のために追加）
- `esbuild`: 高速ビルド、バンドル
- `--external:@aws-sdk/*`: AWS SDKは外部化（Lambdaランタイムに含まれる）

### 3.3 TypeScript設定（tsconfig.json）

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
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2022"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", ".aws-sam"]
}
```

### 3.4 ESLint設定（.eslintrc.json）

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "no-console": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  },
  "env": {
    "node": true,
    "es2022": true
  }
}
```

### 3.5 Prettier設定（.prettierrc）

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 3.6 .gitignore

```
# Dependencies
node_modules/

# Build output
dist/
.aws-sam/

# SAM config (contains deployment parameters)
samconfig.toml

# Environment variables
.env
.env.local

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# Test coverage
coverage/
```

## 4. AWS SAMテンプレート設計

### 4.1 template.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Description: Weather LINE Bot - Kawasaki City Weather Notification

Globals:
  Function:
    Timeout: 30
    MemorySize: 256
    Runtime: nodejs20.x
    Architectures:
      - arm64

Resources:
  WeatherNotificationFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ./
      Handler: dist/index.handler
      Description: 川崎市の天気を毎朝LINEで通知するLambda関数
      Environment:
        Variables:
          NODE_ENV: production
      Events:
        DailySchedule:
          Type: Schedule
          Properties:
            Schedule: cron(0 0 * * ? *)  # 毎日00:00 UTC = 09:00 JST
            Description: 毎日09:00 JSTに天気通知を実行
            Enabled: true
      Policies:
        - SSMParameterReadPolicy:
            ParameterName: weather-bot/*
        - Statement:
            - Effect: Allow
              Action:
                - logs:CreateLogGroup
                - logs:CreateLogStream
                - logs:PutLogEvents
              Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
      LoggingConfig:
        LogFormat: JSON
        LogGroup: !Ref WeatherNotificationLogGroup

  WeatherNotificationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${WeatherNotificationFunction}'
      RetentionInDays: 7

Outputs:
  WeatherNotificationFunctionArn:
    Description: Lambda Function ARN
    Value: !GetAtt WeatherNotificationFunction.Arn

  WeatherNotificationFunctionName:
    Description: Lambda Function Name
    Value: !Ref WeatherNotificationFunction
```

**ポイント**:
- `Runtime: nodejs20.x`: Node.js 20ランタイム
- `Architectures: arm64`: Graviton2（コスト削減）
- `Schedule: cron(0 0 * * ? *)`: 毎日00:00 UTC = 09:00 JST
- `SSMParameterReadPolicy`: Parameter Store読み取り権限
- `LogRetentionInDays: 7`: ログ保持期間7日間

### 4.2 samconfig.toml

```toml
version = 0.1

[default.deploy.parameters]
stack_name = "weather-line-bot"
resolve_s3 = true
s3_prefix = "weather-line-bot"
region = "ap-northeast-1"
capabilities = "CAPABILITY_IAM"
confirm_changeset = false
```

**ポイント**:
- `stack_name`: CloudFormationスタック名
- `region`: ap-northeast-1（東京リージョン）
- `capabilities`: IAMロール作成を許可

## 5. Lambda関数実装

### 5.1 ダミーハンドラー（src/index.ts）

```typescript
import { EventBridgeEvent } from 'aws-lambda';

/**
 * Lambda関数のハンドラー
 * EventBridgeからのスケジュールイベントを受け取る
 */
export const handler = async (
  event: EventBridgeEvent<'Scheduled Event', never>
): Promise<void> => {
  console.log('Lambda function invoked');
  console.log('Event:', JSON.stringify(event, null, 2));

  // ダミー実装：メッセージをログ出力
  const message = {
    timestamp: new Date().toISOString(),
    source: event.source,
    time: event.time,
    message: 'Weather notification handler invoked successfully',
  };

  console.log('Output:', JSON.stringify(message, null, 2));

  // 正常終了
  console.log('Lambda function completed successfully');
};
```

**ポイント**:
- EventBridgeイベントの型定義
- ログ出力の構造化
- 正常終了の確認

## 6. EventBridgeイベントサンプル

### 6.1 events/eventbridge-event.json

```json
{
  "version": "0",
  "id": "test-event-id",
  "detail-type": "Scheduled Event",
  "source": "aws.events",
  "account": "123456789012",
  "time": "2025-12-28T00:00:00Z",
  "region": "ap-northeast-1",
  "resources": [
    "arn:aws:events:ap-northeast-1:123456789012:rule/weather-notification-daily"
  ],
  "detail": {}
}
```

**ポイント**:
- EventBridgeの実際のイベント形式に準拠
- `sam local invoke`でテスト実行時に使用

## 7. ビルド・デプロイフロー

### 7.1 ローカルビルド

```bash
# 1. 依存関係インストール
npm install

# 2. TypeScriptビルド
npm run build

# 3. SAMビルド
sam build

# 4. ローカル実行
sam local invoke WeatherNotificationFunction \
  --event events/eventbridge-event.json
```

### 7.2 デプロイフロー

```bash
# 1. SAMビルド
sam build

# 2. 初回デプロイ（対話形式）
sam deploy --guided

# 3. 2回目以降のデプロイ
sam deploy
```

## 8. 確認項目

### 8.1 開発環境

- [ ] `mise install`でNode.js 20.11.0、AWS CLI 2.15.0がインストールされる
- [ ] `node -v`で`v20.11.0`が表示される
- [ ] `aws --version`で`aws-cli/2.15.0`が表示される

### 8.2 npm環境

- [ ] `npm install`が成功する
- [ ] `npm run build`が成功する
- [ ] `dist/index.js`が生成される

### 8.3 SAM環境

- [ ] `sam validate`でエラーが出ない
- [ ] `sam build`が成功する
- [ ] `.aws-sam/build/`ディレクトリが生成される

### 8.4 ローカル実行

- [ ] `sam local invoke`でLambda関数が実行される
- [ ] ログが出力される
- [ ] エラーが発生しない

## 9. トラブルシューティング

### 問題1: `npm run build`でエラーが出る

**原因**: TypeScript型エラー

**対応**:
```bash
# 型エラーを確認
npx tsc --noEmit

# エラー箇所を修正
```

### 問題2: `sam build`でエラーが出る

**原因**: template.yamlの構文エラー

**対応**:
```bash
# テンプレート検証
sam validate

# エラー箇所を修正
```

### 問題3: `sam local invoke`でエラーが出る

**原因**: Dockerが起動していない

**対応**:
```bash
# Dockerを起動
# macOS: Docker Desktopを起動
# Linux: sudo systemctl start docker
```

## 10. 次のステップ

基盤構築完了後、以下を実装：

1. **OpenWeather API連携**
   - `src/services/weatherService.ts`作成
   - API呼び出しロジック実装

2. **LINE Messaging API連携**
   - `src/services/lineService.ts`作成
   - Broadcast API呼び出しロジック実装

3. **Parameter Store連携**
   - `src/services/secretsService.ts`作成
   - API Key/Token取得ロジック実装

4. **エラーハンドリング**
   - `src/utils/logger.ts`作成
   - `src/utils/retry.ts`作成

5. **テスト実装**
   - `tests/unit/`にユニットテスト作成
   - Vitestセットアップ

6. **CI/CD構築**
   - `.github/workflows/deploy.yml`作成
   - GitHub Secretsの設定

## 11. 参考資料

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [esbuild Documentation](https://esbuild.github.io/)
- [mise Documentation](https://mise.jdx.dev/)
