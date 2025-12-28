# リポジトリ構造定義書

## 1. フォルダ・ファイル構成

```
weather-line-bot/
├── .github/                          # GitHub関連設定
│   └── workflows/
│       └── deploy.yml                # GitHub Actionsワークフロー（CI/CD）
│
├── .steering/                        # 作業単位のステアリングファイル
│   └── YYYYMMDD-initial-implementation/
│       ├── requirements.md           # 作業要求
│       ├── design.md                 # 作業設計
│       └── tasklist.md              # タスクリスト
│
├── docs/                             # 永続的ドキュメント
│   ├── product-requirements.md       # プロダクト要求定義書
│   ├── functional-design.md          # 機能設計書
│   ├── architecture.md               # 技術仕様書
│   └── repository-structure.md       # リポジトリ構造定義書（本ファイル）
│
├── src/                              # ソースコード
│   ├── index.ts                      # Lambda関数エントリーポイント
│   │
│   ├── handlers/                     # Lambda ハンドラー
│   │   └── weatherNotification.ts   # 天気通知ハンドラー
│   │
│   ├── services/                     # ビジネスロジック
│   │   ├── weatherService.ts        # OpenWeather API連携
│   │   ├── lineService.ts           # LINE Messaging API連携
│   │   └── secretsService.ts        # Parameter Store操作
│   │
│   ├── utils/                        # ユーティリティ
│   │   ├── logger.ts                # 構造化ログ
│   │   └── retry.ts                 # リトライロジック
│   │
│   └── types/                        # 型定義
│       └── index.ts                  # 共通型定義
│
├── tests/                            # テストコード
│   ├── unit/                         # ユニットテスト
│   │   ├── weatherService.test.ts
│   │   ├── lineService.test.ts
│   │   └── secretsService.test.ts
│   │
│   ├── integration/                  # 統合テスト
│   │   └── weatherNotification.test.ts
│   │
│   └── fixtures/                     # テストデータ
│       ├── weather-api-response.json
│       └── line-api-response.json
│
├── events/                           # SAM Localテスト用イベント
│   └── eventbridge-event.json        # EventBridgeイベントサンプル
│
├── dist/                             # ビルド成果物（.gitignoreで除外）
│   └── index.js                      # esbuildでバンドルされたコード
│
├── template.yaml                     # AWS SAMテンプレート
├── samconfig.toml                    # SAM設定ファイル
│
├── package.json                      # npm設定、依存関係定義
├── package-lock.json                 # 依存関係ロックファイル
│
├── tsconfig.json                     # TypeScript設定
├── vitest.config.ts                  # Vitestテスト設定
├── .eslintrc.json                    # ESLint設定
├── .prettierrc                       # Prettier設定
│
├── .gitignore                        # Git除外設定
├── .env.example                      # 環境変数のサンプル（ローカル開発用）
│
├── README.md                         # プロジェクト概要、セットアップ手順
└── CLAUDE.md                         # 開発標準ルール（AI用）
```

---

## 2. ディレクトリの役割

### 2.1 `.github/`
**目的**: GitHub関連の設定ファイル

| ファイル | 役割 |
|---------|------|
| `workflows/deploy.yml` | CI/CDパイプライン定義（ビルド・テスト・デプロイ） |

**管理ルール**:
- GitHub Actionsのワークフローファイルのみ配置
- 環境変数はGitHub Secretsで管理

---

### 2.2 `.steering/`
**目的**: 作業単位のステアリングファイル管理

**命名規則**: `YYYYMMDD-[開発タイトル]/`
- 例: `20250103-initial-implementation/`
- 例: `20250115-add-user-settings/`

**配置ファイル**:
| ファイル | 役割 |
|---------|------|
| `requirements.md` | 作業の要求内容 |
| `design.md` | 実装設計 |
| `tasklist.md` | タスクリスト |

**管理ルール**:
- 作業ごとに新しいディレクトリを作成
- 作業完了後も履歴として保持
- 永続的ドキュメント（`docs/`）への影響を記録

---

### 2.3 `docs/`
**目的**: アプリケーション全体の永続的ドキュメント

| ファイル | 役割 | 更新頻度 |
|---------|------|---------|
| `product-requirements.md` | プロダクト要求定義 | 低（基本設計変更時） |
| `functional-design.md` | 機能設計 | 低（アーキテクチャ変更時） |
| `architecture.md` | 技術仕様 | 低（技術スタック変更時） |
| `repository-structure.md` | リポジトリ構造 | 低（構造変更時） |

**管理ルール**:
- 基本設計が変わらない限り更新しない
- 図表は各ドキュメント内に直接記載（Mermaid記法）
- プロジェクトの「北極星」として機能

---

### 2.4 `src/`
**目的**: アプリケーションのソースコード

#### `src/index.ts`
- **役割**: Lambda関数のエントリーポイント
- **責務**: EventBridgeイベントを受け取り、ハンドラーに委譲

#### `src/handlers/`
- **役割**: Lambda ハンドラーロジック
- **命名規則**: `[機能名]Handler.ts`
- **責務**: リクエスト受信、サービス呼び出し、レスポンス返却

#### `src/services/`
- **役割**: ビジネスロジック、外部API連携
- **命名規則**: `[サービス名]Service.ts`
- **責務**:
  - `weatherService.ts`: OpenWeather APIからの天気データ取得
  - `lineService.ts`: LINE Messaging APIへのメッセージ送信
  - `secretsService.ts`: AWS Parameter Storeからのシークレット取得

#### `src/utils/`
- **役割**: 汎用ユーティリティ関数
- **配置基準**: 複数の場所で使われる共通処理
- **例**:
  - `logger.ts`: 構造化ログ出力
  - `retry.ts`: リトライロジック

#### `src/types/`
- **役割**: TypeScript型定義
- **配置基準**:
  - 複数ファイルで共有する型
  - 外部APIのレスポンス型
  - アプリケーション全体で使う型

**管理ルール**:
- 1ファイル1責務（Single Responsibility）
- 循環依存を避ける
- `index.ts`でエクスポートをまとめる

---

### 2.5 `tests/`
**目的**: テストコード

#### `tests/unit/`
- **役割**: ユニットテスト（関数・モジュール単位）
- **命名規則**: `[テスト対象ファイル名].test.ts`
- **対象**: `src/services/`, `src/utils/`

#### `tests/integration/`
- **役割**: 統合テスト（複数モジュール連携）
- **命名規則**: `[機能名].test.ts`
- **対象**: `src/handlers/`

#### `tests/fixtures/`
- **役割**: テストデータ（モックレスポンス等）
- **命名規則**: `[データ種別]-[説明].json`

**管理ルール**:
- テストファイルはソースコードと同じディレクトリ構造
- モックは`vitest`の`vi.fn()`を使用
- フィクスチャはJSON形式で保存

---

### 2.6 `events/`
**目的**: SAM Localテスト用のイベントJSON

| ファイル | 役割 |
|---------|------|
| `eventbridge-event.json` | EventBridgeスケジュールイベントのサンプル |

**使用例**:
```bash
sam local invoke WeatherNotificationFunction --event events/eventbridge-event.json
```

**管理ルール**:
- テスト実行に必要な最小限のイベントのみ保存
- 実際のAWSイベント形式に準拠

---

### 2.7 `dist/`
**目的**: ビルド成果物の出力先

**内容**:
- TypeScriptからトランスパイルされたJavaScript
- esbuildでバンドルされた単一ファイル

**管理ルール**:
- `.gitignore`で除外
- `sam build`実行時に自動生成
- 手動編集禁止

---

## 3. ファイル配置ルール

### 3.1 新規ファイル追加時の判断基準

| 種類 | 配置先 | 例 |
|------|--------|---|
| **Lambda ハンドラー** | `src/handlers/` | `weatherNotification.ts` |
| **外部API連携** | `src/services/` | `weatherService.ts` |
| **汎用処理** | `src/utils/` | `logger.ts` |
| **型定義** | `src/types/` | `index.ts` |
| **ユニットテスト** | `tests/unit/` | `weatherService.test.ts` |
| **統合テスト** | `tests/integration/` | `weatherNotification.test.ts` |
| **永続的ドキュメント** | `docs/` | `new-feature.md` |
| **作業単位ドキュメント** | `.steering/YYYYMMDD-xxx/` | `requirements.md` |

### 3.2 ファイル命名規則

| ファイル種別 | 命名規則 | 例 |
|------------|---------|---|
| **TypeScriptソース** | camelCase + `.ts` | `weatherService.ts` |
| **テストファイル** | `[対象].test.ts` | `weatherService.test.ts` |
| **型定義** | `index.ts` または `types.ts` | `src/types/index.ts` |
| **設定ファイル** | ツール固有の命名 | `tsconfig.json` |
| **ドキュメント** | kebab-case + `.md` | `product-requirements.md` |
| **イベントJSON** | kebab-case + `.json` | `eventbridge-event.json` |

### 3.3 インポートパス規則

```typescript
// ✅ 相対パスを使用（短いパス）
import { fetchWeather } from './weatherService';

// ✅ utilsは相対パスで
import { logger } from '../utils/logger';

// ✅ 型定義は絶対パスも可
import type { WeatherData } from '../types';

// ❌ 絶対パスは避ける（エイリアス未設定の場合）
import { logger } from 'src/utils/logger'; // NG
```

---

## 4. 設定ファイル

### 4.1 `template.yaml`
**目的**: AWS SAMテンプレート（インフラ定義）

**内容**:
- Lambda関数定義
- EventBridgeルール定義
- IAMロール・ポリシー定義

**管理ルール**:
- CloudFormation構文に準拠
- `sam validate`でバリデーション

### 4.2 `samconfig.toml`
**目的**: SAM CLI設定

**内容**:
- デフォルトのデプロイパラメータ
- スタック名、リージョン、S3バケット

**管理ルール**:
- 環境ごとの設定を分離（`[default.deploy.parameters]`）
- シークレット情報は含めない

### 4.3 `package.json`
**目的**: npm設定、依存関係管理

**主要セクション**:
```json
{
  "scripts": {
    "build": "esbuild src/index.ts --bundle --platform=node --target=node20 --outdir=dist",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src tests",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\""
  },
  "dependencies": {
    "@aws-sdk/client-ssm": "^3.x",
    "axios": "^1.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vitest": "^1.x",
    "eslint": "^8.x"
  }
}
```

### 4.4 `tsconfig.json`
**目的**: TypeScript設定

**重要な設定**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 4.5 `vitest.config.ts`
**目的**: Vitestテスト設定

**内容**:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['dist', 'tests'],
    },
  },
});
```

### 4.6 `.eslintrc.json`
**目的**: ESLint設定

**内容**:
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "rules": {
    "no-console": "off",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### 4.7 `.prettierrc`
**目的**: Prettier設定

**内容**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 4.8 `.gitignore`
**目的**: Git除外設定

**主要な除外対象**:
```
node_modules/
dist/
.aws-sam/
samconfig.toml
.env
.DS_Store
*.log
coverage/
```

### 4.9 `.env.example`
**目的**: 環境変数のサンプル（ローカル開発用）

**内容**:
```bash
# ローカル開発用の環境変数サンプル
# 実際の値は .env ファイルに記載（.gitignoreで除外）

# OpenWeather API
OPENWEATHER_API_KEY=your_api_key_here

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_token_here

# AWS Region
AWS_REGION=ap-northeast-1
```

**管理ルール**:
- 実際の値は`.env`ファイルに記載（Git除外）
- 本番環境ではParameter Storeを使用

---

## 5. README.md

### 必須セクション

```markdown
# Weather LINE Bot

川崎市の天気を毎朝LINEで通知するBot

## 機能
- 毎日09:00に川崎市の天気情報を配信
- 最高気温、最低気温、降水確率を通知

## セットアップ

### 前提条件
- Node.js 20.x
- AWS CLI v2
- SAM CLI
- OpenWeather API Key
- LINE Messaging API Token

### インストール
1. リポジトリをクローン
2. 依存関係をインストール: `npm install`
3. Parameter Storeにシークレットを設定
4. デプロイ: `sam build && sam deploy --guided`

### ローカルテスト
```bash
npm test
sam local invoke WeatherNotificationFunction --event events/eventbridge-event.json
```

## 技術スタック
- Runtime: Node.js 20.x + TypeScript
- Infrastructure: AWS Lambda + EventBridge
- IaC: AWS SAM
- CI/CD: GitHub Actions

## ドキュメント
詳細は `docs/` ディレクトリを参照

## ライセンス
MIT
```

---

## 6. 拡張時の追加ルール

### 6.1 新機能追加時

1. `.steering/YYYYMMDD-[機能名]/` を作成
2. `requirements.md`, `design.md`, `tasklist.md` を作成
3. 必要に応じて `docs/` を更新
4. `src/` にコードを追加
5. `tests/` にテストを追加

### 6.2 新しいサービス追加時

```
src/services/
  └── newService.ts

tests/unit/
  └── newService.test.ts
```

### 6.3 新しいLambda関数追加時

```
src/handlers/
  └── newHandler.ts

tests/integration/
  └── newHandler.test.ts

template.yaml  # 新しいLambda関数を定義
```

---

## 7. 禁止事項

### 7.1 配置禁止

| 禁止事項 | 理由 |
|---------|------|
| `src/`直下に複数のtsファイル | モジュール整理が困難 |
| `dist/`の手動編集 | ビルド時に上書きされる |
| `.env`のコミット | シークレット漏洩リスク |
| `node_modules/`のコミット | 不要なファイル増加 |

### 7.2 命名禁止

| 禁止事項 | 理由 |
|---------|------|
| 日本語ファイル名 | 互換性問題 |
| スペースを含むファイル名 | スクリプト実行エラー |
| 大文字始まりのファイル名（設定ファイル除く） | 命名規則の一貫性 |

---

## 8. まとめ

### ディレクトリ構造の原則

1. **責務の分離**: `handlers/`, `services/`, `utils/`で明確に分離
2. **テストの並行配置**: `tests/`以下でソースコードと同じ構造
3. **ドキュメントの分類**: 永続的（`docs/`）と作業単位（`.steering/`）
4. **設定の集約**: ルートディレクトリに設定ファイルを配置
5. **ビルド成果物の分離**: `dist/`に出力、Git除外

### ファイル配置の判断基準

```
新しいファイルを追加する際の質問:
1. Lambda ハンドラー？ → src/handlers/
2. 外部API連携？ → src/services/
3. 汎用処理？ → src/utils/
4. 型定義？ → src/types/
5. テスト？ → tests/unit/ または tests/integration/
6. 永続的ドキュメント？ → docs/
7. 作業ドキュメント？ → .steering/YYYYMMDD-xxx/
```

この構造を維持することで、コードの保守性、拡張性、可読性を確保します。
