# Phase 4: CI/CD構築 - 設計書

## 1. アーキテクチャ概要

### 1.1 全体フロー

```
┌─────────────────┐
│ Developer       │
│ (Local)         │
└────────┬────────┘
         │ git push
         ▼
┌─────────────────────────────────────────┐
│ GitHub Repository                       │
│                                         │
│  ┌──────────────────┐                  │
│  │ Pull Request     │                  │
│  │ (feature branch) │                  │
│  └────────┬─────────┘                  │
│           │ trigger                     │
│           ▼                             │
│  ┌──────────────────┐                  │
│  │ CI Workflow      │                  │
│  │ (lint/test)      │                  │
│  └────────┬─────────┘                  │
│           │ merge to main               │
│           ▼                             │
│  ┌──────────────────┐                  │
│  │ main branch      │                  │
│  └────────┬─────────┘                  │
│           │ trigger                     │
│           ▼                             │
│  ┌──────────────────┐                  │
│  │ CD Workflow      │                  │
│  │ (deploy to AWS)  │                  │
│  └────────┬─────────┘                  │
└───────────┼─────────────────────────────┘
            │ sam deploy
            ▼
┌─────────────────────────────────────────┐
│ AWS (ap-northeast-1)                    │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ CloudFormation Stack             │  │
│  │ (weather-line-bot-stack)         │  │
│  │                                  │  │
│  │  ┌────────────────────────────┐ │  │
│  │  │ Lambda Function            │ │  │
│  │  │ (WeatherNotificationFunc)  │ │  │
│  │  └────────────────────────────┘ │  │
│  │                                  │  │
│  │  ┌────────────────────────────┐ │  │
│  │  │ EventBridge Rule           │ │  │
│  │  │ (Daily 09:00 JST)          │ │  │
│  │  └────────────────────────────┘ │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 2. ワークフロー設計

### 2.1 CIワークフロー（ci.yml）

**ファイルパス**: `.github/workflows/ci.yml`

**トリガー条件**:
```yaml
on:
  pull_request:
    branches:
      - main
```

**ジョブ構成**:

#### Job 1: test
**実行環境**: ubuntu-latest
**Node.jsバージョン**: 20.11.0

**ステップ**:
1. **リポジトリチェックアウト**
   - `actions/checkout@v4`を使用

2. **Node.jsセットアップ**
   - `actions/setup-node@v4`を使用
   - バージョン: 20.11.0
   - キャッシュ: npm

3. **依存関係インストール**
   ```bash
   npm ci
   ```
   - `package-lock.json`を元にクリーンインストール
   - 高速で再現性が高い

4. **Lintチェック**
   ```bash
   npm run lint
   ```
   - ESLintエラーが1件でもあれば失敗

5. **ビルド**
   ```bash
   npm run build
   ```
   - TypeScriptコンパイルエラーがあれば失敗

6. **テスト実行**
   ```bash
   npm test
   ```
   - 全テストが成功する必要がある

7. **カバレッジ測定**
   ```bash
   npm run test:coverage
   ```
   - カバレッジレポート生成
   - 80%未満の場合は警告（失敗はしない）

**成果物（Artifacts）**:
- テストカバレッジレポート（HTML形式）
- 保持期間: 7日間

### 2.2 CDワークフロー（cd.yml）

**ファイルパス**: `.github/workflows/cd.yml`

**トリガー条件**:
```yaml
on:
  push:
    branches:
      - main
```

**ジョブ構成**:

#### Job 1: test
**実行環境**: ubuntu-latest
**Node.jsバージョン**: 20.11.0

**ステップ**: CIワークフローと同じ（1-7）

#### Job 2: deploy
**実行環境**: ubuntu-latest
**依存関係**: Job 1 (test) の成功

**ステップ**:
1. **リポジトリチェックアウト**
   - `actions/checkout@v4`を使用

2. **Node.jsセットアップ**
   - `actions/setup-node@v4`を使用
   - バージョン: 20.11.0

3. **依存関係インストール**
   ```bash
   npm ci
   ```

4. **Python 3.9セットアップ**
   - `actions/setup-python@v5`を使用
   - SAM CLIの依存関係

5. **AWS SAM CLIインストール**
   ```bash
   pip install aws-sam-cli
   ```

6. **AWS認証設定**
   - `aws-actions/configure-aws-credentials@v4`を使用
   - Secrets:
     - `AWS_ACCESS_KEY_ID`
     - `AWS_SECRET_ACCESS_KEY`
     - `AWS_REGION`: ap-northeast-1

7. **SAMビルド**
   ```bash
   sam build
   ```
   - Lambda関数のパッケージ化

8. **SAMデプロイ**
   ```bash
   sam deploy \
     --stack-name weather-line-bot-stack \
     --region ap-northeast-1 \
     --capabilities CAPABILITY_IAM \
     --no-confirm-changeset \
     --no-fail-on-empty-changeset
   ```
   - CloudFormationスタック更新
   - IAM権限自動作成を許可
   - 変更がない場合もエラーにしない

9. **デプロイ検証**
   ```bash
   aws lambda get-function \
     --function-name weather-line-bot-WeatherNotificationFunction \
     --region ap-northeast-1
   ```
   - Lambda関数が存在することを確認

## 3. GitHub Secrets設定

### 3.1 必要なSecrets

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `AWS_ACCESS_KEY_ID` | AWSアクセスキーID | IAMユーザーから取得 |
| `AWS_SECRET_ACCESS_KEY` | AWSシークレットアクセスキー | IAMユーザーから取得 |
| `AWS_REGION` | AWSリージョン | `ap-northeast-1`（固定） |

### 3.2 IAMユーザー権限

**必要な権限ポリシー**:
- CloudFormation: 完全アクセス（スタック作成・更新・削除）
- Lambda: 完全アクセス（関数作成・更新・削除）
- IAM: 限定的アクセス（ロール作成・更新）
- EventBridge: 完全アクセス（ルール作成・更新）
- CloudWatch Logs: 完全アクセス（ロググループ作成）
- Parameter Store: 読み取りアクセス（デプロイ時の参照用）

**推奨ポリシー**: `PowerUserAccess`または個別に最小権限を設定

## 4. ワークフローファイル詳細

### 4.1 ci.yml完全版

```yaml
name: CI

on:
  pull_request:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.11.0'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Run build
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Run coverage
        run: npm run test:coverage

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7
```

### 4.2 cd.yml完全版

```yaml
name: CD

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.11.0'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Run build
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Run coverage
        run: npm run test:coverage

  deploy:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.11.0'

      - name: Install dependencies
        run: npm ci

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.9'

      - name: Install AWS SAM CLI
        run: pip install aws-sam-cli

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1

      - name: SAM build
        run: sam build

      - name: SAM deploy
        run: |
          sam deploy \
            --stack-name weather-line-bot-stack \
            --region ap-northeast-1 \
            --capabilities CAPABILITY_IAM \
            --no-confirm-changeset \
            --no-fail-on-empty-changeset

      - name: Verify deployment
        run: |
          aws lambda get-function \
            --function-name weather-line-bot-WeatherNotificationFunction \
            --region ap-northeast-1
```

## 5. エラーハンドリング

### 5.1 CIワークフロー

**失敗時の動作**:
- プルリクエストに赤いバツマークが表示される
- マージがブロックされる（ブランチ保護ルール設定時）
- 失敗したステップのログを確認可能

**リカバリー手順**:
1. ローカルで問題を修正
2. コミット・プッシュ
3. 自動で再実行される

### 5.2 CDワークフロー

**失敗時の動作**:
- GitHub Actionsに赤いバツマークが表示される
- デプロイは実行されない（または途中で停止）
- CloudFormationスタックはロールバックされる

**リカバリー手順**:
1. ワークフローログで失敗箇所を特定
2. 必要に応じてローカルで修正
3. 修正をmainブランチにマージ
4. 自動で再デプロイされる

## 6. 実装順序

1. `.github/workflows/`ディレクトリ作成
2. `ci.yml`ファイル作成
3. `cd.yml`ファイル作成
4. GitHub Secretsに認証情報設定
5. テスト用プルリクエスト作成（CI動作確認）
6. プルリクエストマージ（CD動作確認）
7. AWS環境でLambda関数更新を確認

## 7. 成功基準

- [ ] CIワークフローがプルリクエスト時に自動実行される
- [ ] CDワークフローがmainマージ時に自動実行される
- [ ] すべてのチェックが成功した場合、緑のチェックマークが表示される
- [ ] デプロイ後、Lambda関数が更新されている
- [ ] ワークフローログが読みやすく、エラー箇所が特定しやすい

## 8. 今後の改善案（Phase 4では実装しない）

- ステージング環境への自動デプロイ
- カバレッジレポートのPR自動コメント
- Slackへのデプロイ通知
- E2Eテストの追加
- ロールバック機能の実装
