# 初回実装要求定義書（基盤構築）

## 作業概要

川崎市の天気を毎朝LINEで通知するBotの**基盤構築**を行う。

実際の機能実装（OpenWeather API、LINE API連携）は後続の作業で実装する。

## 実装範囲

### 実装する機能

1. **開発環境セットアップ**
   - `.mise.toml` 作成（Node.js 20.11.0、AWS CLI 2.15.0）
   - `package.json` 作成
   - TypeScript設定（`tsconfig.json`）
   - ESLint/Prettier設定
   - ビルドスクリプト設定（esbuild）

2. **AWS SAMテンプレート作成**
   - Lambda関数定義
   - EventBridgeスケジュールルール定義（毎日09:00 JST）
   - IAMロール・ポリシー定義
   - Parameter Store読み取り権限設定

3. **最小限のLambda関数実装**
   - ダミーのハンドラー関数（Hello World レベル）
   - EventBridgeイベントを受け取って正常終了
   - CloudWatch Logsへのログ出力

4. **ローカル実行環境**
   - SAM Localでのテスト実行確認
   - EventBridgeイベントJSONサンプル作成

5. **設定ファイル**
   - `.gitignore` 作成
   - `samconfig.toml` 作成
   - `events/eventbridge-event.json` 作成

## 除外事項（今回は実装しない）

### 後続の作業で実装するもの

- OpenWeather API連携
- LINE Messaging API連携
- メッセージフォーマット処理
- エラーハンドリング
- リトライロジック
- ユニットテスト
- 統合テスト
- CI/CD（GitHub Actions）

### スコープ外（Phase 2以降）

- ユーザー個別設定
- 複数都市対応
- Webhook実装
- DynamoDBによるユーザー管理

## 受け入れ条件

### 開発環境

- [ ] `.mise.toml`が作成されている
- [ ] `mise install`でNode.js 20.11.0、AWS CLI 2.15.0がインストールされる
- [ ] `package.json`が作成されている
- [ ] `npm install`で依存関係がインストールされる
- [ ] `tsconfig.json`が作成されている
- [ ] `.eslintrc.json`、`.prettierrc`が作成されている
- [ ] `npm run build`でTypeScriptがビルドされる

### AWS SAMテンプレート

- [ ] `template.yaml`が作成されている
- [ ] Lambda関数が定義されている
- [ ] EventBridgeスケジュールルールが定義されている（cron: 0 0 * * ? *）
- [ ] IAMロールが定義されている
- [ ] Parameter Store読み取り権限が付与されている
- [ ] `sam validate`でエラーが出ない

### Lambda関数

- [ ] `src/index.ts`が作成されている
- [ ] ハンドラー関数が実装されている
- [ ] EventBridgeイベントを受け取れる
- [ ] CloudWatch Logsにログが出力される
- [ ] 正常終了する（エラーが発生しない）

### ローカル実行

- [ ] `sam build`が成功する
- [ ] `events/eventbridge-event.json`が作成されている
- [ ] `sam local invoke`でLambda関数が実行される
- [ ] ローカル実行でログが出力される
- [ ] エラーが発生しない

### 設定ファイル

- [ ] `.gitignore`が作成されている
- [ ] `node_modules/`、`dist/`、`.aws-sam/`が除外されている
- [ ] `samconfig.toml`が作成されている

## ユーザーストーリー

### ストーリー1: 開発環境構築

```
As a 開発者
I want miseとnpmで開発環境を構築したい
So that チーム全体で同じバージョンのツールを使用できる
```

**受け入れ条件**:
- `mise install`でNode.js、AWS CLIがインストールされる
- `npm install`で依存関係がインストールされる
- `npm run build`でビルドが成功する

### ストーリー2: SAMテンプレート作成

```
As a 開発者
I want AWS SAMテンプレートを作成したい
So that Lambda関数とEventBridgeをIaCで管理できる
```

**受け入れ条件**:
- `template.yaml`が作成されている
- `sam validate`でエラーが出ない
- `sam build`が成功する

### ストーリー3: ダミーLambda関数実装

```
As a 開発者
I want 最小限のLambda関数を実装したい
So that SAM Localでローカル実行できることを確認できる
```

**受け入れ条件**:
- `src/index.ts`が作成されている
- `sam local invoke`でLambda関数が実行される
- ログが出力される

### ストーリー4: ローカル実行確認

```
As a 開発者
I want SAM Localでローカル実行したい
So that AWSにデプロイする前に動作確認できる
```

**受け入れ条件**:
- `sam local invoke`でLambda関数が実行される
- EventBridgeイベントJSONが読み込まれる
- エラーが発生しない

## 制約事項

### 技術的制約

- Node.js 20.11.0を使用（Lambda nodejs20.x）
- TypeScript 5.x以上を使用
- AWS SAM CLI 1.108.0を使用
- esbuildでバンドル

### 時間的制約

- 初回実装期限：なし（個人開発）
- 作業時間：適宜

### リソース制約

- AWS無料枠内での実装
- 月間コスト$0を目標

## 成功基準

### 必須条件

1. `mise install`でNode.js、AWS CLIがインストールされる
2. `npm install`で依存関係がインストールされる
3. `npm run build`でビルドが成功する
4. `sam validate`でエラーが出ない
5. `sam build`が成功する
6. `sam local invoke`でLambda関数が実行される

### 推奨条件

1. TypeScript型エラーゼロ
2. ESLintエラーゼロ
3. ローカル実行でログが正しく出力される

## 次のステップ（後続作業）

基盤構築完了後、以下の作業を実施：

1. **Phase 2: 機能実装**
   - OpenWeather API連携
   - LINE Messaging API連携
   - メッセージフォーマット処理
   - エラーハンドリング
   - リトライロジック

2. **Phase 3: テスト実装**
   - ユニットテスト作成
   - 統合テスト作成
   - テストカバレッジ80%以上

3. **Phase 4: CI/CD構築**
   - GitHub Actionsワークフロー作成
   - 自動ビルド・テスト・デプロイ

4. **Phase 5: デプロイ**
   - Parameter Storeにシークレット設定
   - AWS本番環境へのデプロイ
   - 動作確認

## 参考ドキュメント

- [docs/product-requirements.md](../../docs/product-requirements.md)
- [docs/functional-design.md](../../docs/functional-design.md)
- [docs/architecture.md](../../docs/architecture.md)
- [docs/repository-structure.md](../../docs/repository-structure.md)
