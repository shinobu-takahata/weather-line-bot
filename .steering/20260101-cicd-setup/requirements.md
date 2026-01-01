# Phase 4: CI/CD構築 - 要求定義

## 1. 概要
GitHub Actionsを使用したCI/CDパイプラインを構築し、コード品質の自動チェックと自動デプロイを実現します。

## 2. 目的
- コード品質の維持・向上
- デプロイの自動化による人的ミスの削減
- 開発スピードの向上
- テストカバレッジの可視化

## 3. 機能要件

### 3.1 プルリクエスト時のCI（継続的インテグレーション）
**トリガー**: プルリクエストの作成・更新時

**実行内容**:
1. **依存関係のインストール**: `npm ci`でクリーンインストール
2. **Lintチェック**: `npm run lint`でコード品質チェック
3. **型チェック・ビルド**: `npm run build`でTypeScriptコンパイル
4. **ユニット・統合テスト**: `npm test`で全テストを実行
5. **テストカバレッジ測定**: `npm run test:coverage`でカバレッジレポート生成

**成功条件**:
- すべてのステップがエラーなく完了すること
- テストカバレッジが80%以上であること
- Lintエラーが0件であること

### 3.2 mainブランチへのマージ時のCD（継続的デリバリー）
**トリガー**: mainブランチへのpush時（プルリクエストのマージ含む）

**実行内容**:
1. **CIと同じチェック**: Lint、ビルド、テスト実行
2. **SAMビルド**: `sam build`でデプロイ用パッケージ作成
3. **AWSデプロイ**: `sam deploy`でAWS環境にデプロイ
4. **デプロイ後の疎通確認**: Lambda関数の存在確認

**成功条件**:
- すべてのステップがエラーなく完了すること
- CloudFormationスタックが`UPDATE_COMPLETE`または`CREATE_COMPLETE`状態になること

## 4. 非機能要件

### 4.1 実行環境
- **GitHub Actions**: GitHub-hosted runner（ubuntu-latest）
- **Node.jsバージョン**: 20.11.0（miseで管理されているバージョンと一致）
- **AWS CLI**: 最新版
- **AWS SAM CLI**: 最新版

### 4.2 認証・認可
- **AWS認証**: GitHub Secrets経由でAWS認証情報を管理
  - `AWS_ACCESS_KEY_ID`: AWSアクセスキーID
  - `AWS_SECRET_ACCESS_KEY`: AWSシークレットアクセスキー
  - `AWS_REGION`: ap-northeast-1（東京リージョン）

### 4.3 実行時間
- **CIワークフロー**: 5分以内に完了
- **CDワークフロー**: 10分以内に完了

### 4.4 通知
- **プルリクエスト**: GitHub UIでステータスバッジ表示
- **mainブランチ**: デプロイ成功・失敗をGitHub UIで確認可能

## 5. 制約事項

### 5.1 技術的制約
- GitHub Actionsの無料枠を超えないこと（パブリックリポジトリは無制限、プライベートは月2,000分）
- AWS認証情報はGitHub Secretsで安全に管理すること
- デプロイは本番環境（weather-line-bot-stack）のみ実施

### 5.2 セキュリティ制約
- AWS認証情報をコードにハードコーディングしないこと
- Parameter Store（API Key、LINE Token）の値はCI/CD内で取得しないこと
- ログにセンシティブ情報を出力しないこと

## 6. 受け入れ条件

### 6.1 CI（プルリクエスト時）
- [ ] プルリクエスト作成時に自動でワークフローが実行される
- [ ] Lintチェックが実行される
- [ ] ビルドが実行される
- [ ] テストが実行される
- [ ] テストカバレッジが測定される
- [ ] すべてのチェックが成功した場合、プルリクエストにグリーンチェックマークが表示される
- [ ] チェックが失敗した場合、プルリクエストに赤いバツマークが表示される

### 6.2 CD（mainブランチへのマージ時）
- [ ] mainブランチへのpush時に自動でワークフローが実行される
- [ ] CIと同じチェックが実行される
- [ ] SAMビルドが実行される
- [ ] AWSへのデプロイが実行される
- [ ] デプロイが成功した場合、GitHub Actionsに緑のチェックマークが表示される
- [ ] デプロイ後、Lambda関数が更新されていることをAWS CLIで確認できる

### 6.3 ワークフロー全体
- [ ] `.github/workflows/`ディレクトリにYAMLファイルが配置されている
- [ ] ワークフローファイルが適切に構成されている
- [ ] GitHub Secretsに必要な認証情報が設定されている
- [ ] ワークフローログが読みやすく、エラー箇所が特定しやすい

## 7. 参考情報

### 7.1 GitHub Actions公式ドキュメント
- https://docs.github.com/en/actions

### 7.2 AWS SAM CLI公式ドキュメント
- https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/

### 7.3 既存の設定
- **AWSスタック名**: weather-line-bot-stack
- **AWSリージョン**: ap-northeast-1
- **Lambda関数名**: weather-line-bot-WeatherNotificationFunction
- **Node.jsバージョン**: 20.11.0

## 8. 今後の拡張予定（Phase 4では実装しない）
- ステージング環境へのデプロイ
- E2Eテストの自動実行
- パフォーマンステストの自動実行
- Slackへのデプロイ通知
- カバレッジレポートのPR自動コメント
