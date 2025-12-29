# タスクリスト（基盤構築）

## 進捗状況

- **開始日**: 2025-12-28
- **完了予定日**: 未定
- **進捗率**: 0%

---

## Phase 0: 環境確認

### 0.1 必須ツールの確認
- [ ] `mise --version`でmiseがインストールされているか確認
  - インストールされていない場合: `brew install mise`を実行
- [ ] `git --version`でGitがインストールされているか確認
  - インストールされていない場合: OSのパッケージマネージャーでインストール
- [ ] `python3 --version`でPython 3がインストールされているか確認
  - インストールされていない場合: `brew install python3`を実行
- [ ] `docker --version`でDockerがインストールされているか確認
  - インストールされていない場合: Docker Desktopをインストール
- [ ] Dockerが起動しているか確認（`docker ps`が成功するか）
  - 起動していない場合: Docker Desktopを起動

---

## Phase 1: 開発環境セットアップ

### 1.1 mise設定
- [ ] `.mise.toml`を作成
- [ ] Node.js 20.11.0を指定
- [ ] AWS CLI 2.15.0を指定
- [ ] `mise install`を実行
- [ ] `node -v`で v20.11.0 が表示されることを確認
- [ ] `aws --version`で aws-cli/2.15.0 が表示されることを確認

### 1.2 SAM CLI確認・インストール
- [ ] `sam --version`でSAM CLIがインストールされているか確認
  - インストールされていない場合: `pip install aws-sam-cli==1.108.0`を実行
- [ ] `sam --version`で SAM CLI, version 1.108.0 が表示されることを確認

### 1.3 npm環境構築
- [ ] `package.json`を作成
- [ ] 依存関係を定義
  - [ ] `@aws-sdk/client-ssm`を追加
  - [ ] `@types/node`を追加
  - [ ] `typescript`を追加
  - [ ] `esbuild`を追加
  - [ ] `eslint`関連パッケージを追加
  - [ ] `prettier`を追加
- [ ] npm scriptsを定義
  - [ ] `build`: esbuildでバンドル
  - [ ] `lint`: ESLintチェック
  - [ ] `format`: Prettierフォーマット
- [ ] `npm install`を実行
- [ ] `node_modules/`が生成されることを確認
- [ ] `package-lock.json`が生成されることを確認

### 1.4 TypeScript設定
- [ ] `tsconfig.json`を作成
- [ ] `target: ES2022`を設定
- [ ] `module: ESNext`を設定
- [ ] `strict: true`を設定
- [ ] `outDir: ./dist`を設定
- [ ] `include: ["src/**/*"]`を設定
- [ ] `exclude: ["node_modules", "dist", ".aws-sam"]`を設定

### 1.5 ESLint設定
- [ ] `.eslintrc.json`を作成
- [ ] `@typescript-eslint/recommended`を拡張
- [ ] `no-console: off`を設定（Lambda環境用）
- [ ] `@typescript-eslint/no-unused-vars: error`を設定

### 1.6 Prettier設定
- [ ] `.prettierrc`を作成
- [ ] `semi: true`を設定
- [ ] `singleQuote: true`を設定
- [ ] `printWidth: 100`を設定
- [ ] `tabWidth: 2`を設定

### 1.7 .gitignore設定
- [ ] `.gitignore`を作成
- [ ] `node_modules/`を除外
- [ ] `dist/`を除外
- [ ] `.aws-sam/`を除外
- [ ] `samconfig.toml`を除外
- [ ] `.env`を除外
- [ ] `*.log`を除外
- [ ] `coverage/`を除外

---

## Phase 2: ディレクトリ構造作成

### 2.1 ソースコードディレクトリ
- [ ] `src/`ディレクトリを作成

### 2.2 イベントディレクトリ
- [ ] `events/`ディレクトリを作成

---

## Phase 3: Lambda関数実装

### 3.1 エントリーポイント作成
- [ ] `src/index.ts`を作成
- [ ] `handler`関数を実装
- [ ] EventBridgeイベントの型定義をインポート
- [ ] イベントログ出力を実装
- [ ] メッセージログ出力を実装
- [ ] 正常終了を実装

### 3.2 動作確認
- [ ] `npm run build`でビルド成功を確認
- [ ] `dist/index.js`が生成されることを確認
- [ ] `npm run lint`でLintエラーがゼロであることを確認

---

## Phase 4: AWS SAM設定

### 4.1 SAMテンプレート作成
- [ ] `template.yaml`を作成
- [ ] `AWSTemplateFormatVersion`を指定
- [ ] `Transform: AWS::Serverless-2016-10-31`を指定
- [ ] `Globals`セクションを定義
  - [ ] `Timeout: 30`を設定
  - [ ] `MemorySize: 256`を設定
  - [ ] `Runtime: nodejs20.x`を設定
  - [ ] `Architectures: arm64`を設定

### 4.2 Lambda関数リソース定義
- [ ] `WeatherNotificationFunction`リソースを定義
- [ ] `CodeUri: ./`を設定
- [ ] `Handler: dist/index.handler`を設定
- [ ] `Description`を設定
- [ ] `Environment.Variables.NODE_ENV`を設定

### 4.3 EventBridgeスケジュール定義
- [ ] `Events.DailySchedule`を定義
- [ ] `Type: Schedule`を設定
- [ ] `Schedule: cron(0 0 * * ? *)`を設定（09:00 JST）
- [ ] `Description`を設定
- [ ] `Enabled: true`を設定

### 4.4 IAMポリシー定義
- [ ] `SSMParameterReadPolicy`を追加
- [ ] `ParameterName: weather-bot/*`を設定
- [ ] CloudWatch Logsへの書き込み権限を追加

### 4.5 CloudWatch Logs定義
- [ ] `WeatherNotificationLogGroup`リソースを定義
- [ ] `RetentionInDays: 7`を設定

### 4.6 Outputs定義
- [ ] `WeatherNotificationFunctionArn`を定義
- [ ] `WeatherNotificationFunctionName`を定義

### 4.7 SAM検証
- [ ] `sam validate`でエラーがゼロであることを確認

### 4.8 SAM設定ファイル作成
- [ ] `samconfig.toml`を作成
- [ ] `stack_name: weather-line-bot`を設定
- [ ] `region: ap-northeast-1`を設定
- [ ] `capabilities: CAPABILITY_IAM`を設定

---

## Phase 5: ローカル実行環境構築

### 5.1 EventBridgeイベントサンプル作成
- [ ] `events/eventbridge-event.json`を作成
- [ ] `version: "0"`を設定
- [ ] `detail-type: "Scheduled Event"`を設定
- [ ] `source: "aws.events"`を設定
- [ ] `time`を設定（ISO 8601形式）

### 5.2 SAMビルド
- [ ] `sam build`を実行
- [ ] `.aws-sam/build/`ディレクトリが生成されることを確認
- [ ] ビルドエラーがゼロであることを確認

### 5.3 Docker確認
- [ ] Dockerが起動しているか確認（`docker ps`が成功するか）
  - 起動していない場合: Docker Desktopを起動

### 5.4 SAMローカル実行
- [ ] `sam local invoke WeatherNotificationFunction --event events/eventbridge-event.json`を実行
- [ ] Lambda関数が実行されることを確認
- [ ] ログが出力されることを確認
- [ ] エラーが発生しないことを確認

---

## Phase 6: 最終確認

### 6.1 ビルド・実行確認
- [ ] `npm install`が成功する
- [ ] `npm run build`が成功する
- [ ] `npm run lint`でエラーゼロ
- [ ] `sam validate`でエラーゼロ
- [ ] `sam build`が成功する
- [ ] `sam local invoke`でローカル実行成功

### 6.2 ファイル確認
- [ ] `.mise.toml`が存在する
- [ ] `package.json`が存在する
- [ ] `tsconfig.json`が存在する
- [ ] `.eslintrc.json`が存在する
- [ ] `.prettierrc`が存在する
- [ ] `.gitignore`が存在する
- [ ] `src/index.ts`が存在する
- [ ] `events/eventbridge-event.json`が存在する
- [ ] `template.yaml`が存在する
- [ ] `samconfig.toml`が存在する

### 6.3 Git確認
- [ ] `git status`で不要なファイルが追跡されていないことを確認
- [ ] `node_modules/`が除外されていることを確認
- [ ] `dist/`が除外されていることを確認
- [ ] `.aws-sam/`が除外されていることを確認

---

## Phase 7: AWSへの初回デプロイ

### 7.1 AWS認証情報の確認
- [ ] `aws configure list-profiles`で利用可能なプロファイルを確認
- [ ] `export AWS_PROFILE=your-profile-name`でプロファイルを設定
- [ ] `aws sts get-caller-identity --profile $AWS_PROFILE`で認証情報を確認

### 7.2 Parameter Store設定
- [ ] OpenWeather API Key（ダミー値）をParameter Storeに登録
  - [ ] Parameter名: `/weather-bot/openweather-api-key`
  - [ ] Type: `SecureString`
  - [ ] Value: `DUMMY_API_KEY_REPLACE_LATER`
- [ ] LINE Channel Access Token（ダミー値）をParameter Storeに登録
  - [ ] Parameter名: `/weather-bot/line-channel-access-token`
  - [ ] Type: `SecureString`
  - [ ] Value: `DUMMY_TOKEN_REPLACE_LATER`
- [ ] `aws ssm get-parameters`で登録内容を確認

### 7.3 初回デプロイ
- [ ] `sam build`を実行
- [ ] `sam deploy --guided --profile $AWS_PROFILE`を実行
- [ ] 対話的な質問に回答
  - [ ] Stack Name: `weather-line-bot`
  - [ ] AWS Region: `ap-northeast-1`
  - [ ] Confirm changes: `N`
  - [ ] Allow IAM role creation: `Y`
  - [ ] Disable rollback: `N`
  - [ ] Authorization: `Y`
  - [ ] Save configuration: `Y`
- [ ] デプロイが成功することを確認

### 7.4 デプロイ後の確認
- [ ] CloudFormationスタックの状態が`CREATE_COMPLETE`であることを確認
- [ ] Lambda関数が作成されていることを確認
- [ ] EventBridgeルールが作成されていることを確認

### 7.5 手動Lambda実行テスト
- [ ] Lambda関数名を取得
- [ ] `aws lambda invoke`で手動実行
- [ ] `response.json`で実行結果を確認
- [ ] CloudWatch Logsでログを確認
- [ ] エラーが発生しないことを確認

---

## Phase 8: ドキュメント更新（オプション）

### 8.1 CLAUDE.md確認
- [ ] CLAUDE.mdの開発ルールに準拠していることを確認

### 8.2 README.md確認
- [ ] README.mdのセットアップ手順が正しいことを確認

---

## 完了条件

以下がすべて満たされたら完了：

- [ ] 開発環境がセットアップされている（mise、npm）
- [ ] TypeScript、ESLint、Prettierが設定されている
- [ ] AWS SAMテンプレートが作成されている
- [ ] 最小限のLambda関数が実装されている
- [ ] `sam local invoke`でローカル実行できる
- [ ] Parameter Storeにダミー値が設定されている
- [ ] AWSへのデプロイが成功している
- [ ] Lambda関数がAWS上で実行できる
- [ ] CloudWatch Logsにログが出力される
- [ ] すべてのタスクが完了している

---

## 備考

### 実装時の注意事項
- 各Phaseは順番に実施すること
- Phase 0で必須ツールがすべてインストールされていることを確認してから次に進むこと
- エラーが発生したら即座に解決すること
- Lintエラーはゼロにすること
- TypeScript型エラーはゼロにすること

### トラブルシューティング
- `npm install`でエラー → `npm cache clean --force`後に再試行
- `sam build`でエラー → `sam validate`でテンプレート検証
- `sam local invoke`でエラー → Dockerが起動しているか確認（`docker ps`）
- miseでツールがインストールできない → `mise doctor`で診断

### 次のステップ
- Phase 2: 機能実装（OpenWeather/LINE API連携）
- Phase 3: テスト実装
- Phase 4: CI/CD構築
- Phase 5: デプロイ
