# Phase 4: CI/CD構築 - タスクリスト

## 進捗状況

- **開始日**: 2026-01-01
- **完了予定日**: 未定
- **進捗率**: 0%

---

## Phase 1: GitHub Actionsディレクトリ作成

### 1.1 ディレクトリ構造作成
- [ ] `.github/workflows/`ディレクトリを作成
  ```bash
  mkdir -p .github/workflows
  ```
- [ ] ディレクトリが作成されたことを確認

---

## Phase 2: CIワークフロー作成

### 2.1 ci.ymlファイル作成
- [ ] `.github/workflows/ci.yml`を作成
- [ ] ワークフロー名を定義: `name: CI`
- [ ] トリガー条件を定義: `pull_request`（mainブランチ）
- [ ] ジョブ定義: `test`
  - [ ] 実行環境: `ubuntu-latest`
  - [ ] ステップ1: リポジトリチェックアウト（`actions/checkout@v4`）
  - [ ] ステップ2: Node.jsセットアップ（`actions/setup-node@v4`, version 20.11.0）
  - [ ] ステップ3: 依存関係インストール（`npm ci`）
  - [ ] ステップ4: Lintチェック（`npm run lint`）
  - [ ] ステップ5: ビルド（`npm run build`）
  - [ ] ステップ6: テスト実行（`npm test`）
  - [ ] ステップ7: カバレッジ測定（`npm run test:coverage`）
  - [ ] ステップ8: カバレッジレポートアップロード（`actions/upload-artifact@v4`）

### 2.2 ci.yml構文チェック
- [ ] YAMLファイルの構文が正しいことを確認
- [ ] インデントが正しいことを確認
- [ ] 各ステップが正しく定義されていることを確認

---

## Phase 3: CDワークフロー作成

### 3.1 cd.ymlファイル作成
- [ ] `.github/workflows/cd.yml`を作成
- [ ] ワークフロー名を定義: `name: CD`
- [ ] トリガー条件を定義: `push`（mainブランチ）

### 3.2 testジョブ定義
- [ ] ジョブ定義: `test`
  - [ ] 実行環境: `ubuntu-latest`
  - [ ] ステップ1: リポジトリチェックアウト
  - [ ] ステップ2: Node.jsセットアップ
  - [ ] ステップ3: 依存関係インストール
  - [ ] ステップ4: Lintチェック
  - [ ] ステップ5: ビルド
  - [ ] ステップ6: テスト実行
  - [ ] ステップ7: カバレッジ測定

### 3.3 deployジョブ定義
- [ ] ジョブ定義: `deploy`
  - [ ] 実行環境: `ubuntu-latest`
  - [ ] 依存関係: `needs: test`
  - [ ] ステップ1: リポジトリチェックアウト
  - [ ] ステップ2: Node.jsセットアップ
  - [ ] ステップ3: 依存関係インストール
  - [ ] ステップ4: Pythonセットアップ（`actions/setup-python@v5`, version 3.9）
  - [ ] ステップ5: AWS SAM CLIインストール（`pip install aws-sam-cli`）
  - [ ] ステップ6: AWS認証設定（`aws-actions/configure-aws-credentials@v4`）
  - [ ] ステップ7: SAMビルド（`sam build`）
  - [ ] ステップ8: SAMデプロイ
  - [ ] ステップ9: デプロイ検証（Lambda関数存在確認）

### 3.4 cd.yml構文チェック
- [ ] YAMLファイルの構文が正しいことを確認
- [ ] インデントが正しいことを確認
- [ ] 各ステップが正しく定義されていることを確認
- [ ] Secrets参照が正しいことを確認

---

## Phase 4: GitHub Secrets設定

### 4.1 IAMユーザー作成（まだ作成していない場合）
- [ ] AWSマネジメントコンソールにログイン
- [ ] IAMサービスに移動
- [ ] 新しいIAMユーザーを作成（例: `github-actions-deployer`）
- [ ] プログラマティックアクセスを有効化
- [ ] 必要なポリシーをアタッチ（PowerUserAccessまたは個別権限）
- [ ] アクセスキーIDとシークレットアクセスキーを保存

### 4.2 GitHub Secretsに認証情報を追加
- [ ] GitHubリポジトリに移動
- [ ] Settings → Secrets and variables → Actions に移動
- [ ] `AWS_ACCESS_KEY_ID`を追加
  - [ ] 値: IAMユーザーのアクセスキーID
- [ ] `AWS_SECRET_ACCESS_KEY`を追加
  - [ ] 値: IAMユーザーのシークレットアクセスキー
- [ ] `AWS_REGION`を追加
  - [ ] 値: `ap-northeast-1`
- [ ] すべてのSecretsが正しく登録されたことを確認

---

## Phase 5: samconfig.tomlの更新（必要に応じて）

### 5.1 samconfig.toml確認
- [ ] `samconfig.toml`が存在することを確認
- [ ] スタック名が`weather-line-bot-stack`であることを確認
- [ ] リージョンが`ap-northeast-1`であることを確認
- [ ] 必要に応じて設定を調整

---

## Phase 6: ローカルでの事前確認

### 6.1 ワークフロー構文チェック
- [ ] GitHub CLIまたはオンラインツールでYAML構文チェック
- [ ] エラーがないことを確認

### 6.2 ローカルでのテスト実行
- [ ] `npm ci`が成功することを確認
- [ ] `npm run lint`が成功することを確認
- [ ] `npm run build`が成功することを確認
- [ ] `npm test`が成功することを確認
- [ ] `npm run test:coverage`が成功することを確認

---

## Phase 7: CIワークフロー動作確認

### 7.1 テスト用ブランチ作成
- [ ] 新しいブランチを作成（例: `test/ci-workflow`）
  ```bash
  git checkout -b test/ci-workflow
  ```

### 7.2 軽微な変更を加える
- [ ] READMEなどに軽微な変更を加える
- [ ] コミット・プッシュ
  ```bash
  git add .
  git commit -m "test: CI workflow test"
  git push origin test/ci-workflow
  ```

### 7.3 プルリクエスト作成
- [ ] GitHubでプルリクエストを作成
- [ ] ベースブランチ: `main`
- [ ] タイトル: `test: CI workflow test`

### 7.4 CIワークフロー実行確認
- [ ] GitHub ActionsでCIワークフローが自動実行されることを確認
- [ ] すべてのステップが成功することを確認
  - [ ] Checkout
  - [ ] Setup Node.js
  - [ ] Install dependencies
  - [ ] Run lint
  - [ ] Run build
  - [ ] Run tests
  - [ ] Run coverage
  - [ ] Upload coverage report
- [ ] プルリクエストに緑のチェックマークが表示されることを確認
- [ ] カバレッジレポートがArtifactsにアップロードされることを確認

### 7.5 失敗ケースのテスト（オプション）
- [ ] わざとLintエラーを発生させる変更をコミット
- [ ] CIワークフローが失敗することを確認
- [ ] プルリクエストに赤いバツマークが表示されることを確認
- [ ] エラーを修正してプッシュ
- [ ] CIワークフローが成功することを確認

---

## Phase 8: CDワークフロー動作確認

### 8.1 プルリクエストマージ
- [ ] テスト用プルリクエストをmainブランチにマージ
- [ ] マージ後、ブランチを削除

### 8.2 CDワークフロー実行確認
- [ ] GitHub ActionsでCDワークフローが自動実行されることを確認
- [ ] testジョブが成功することを確認
  - [ ] すべてのCIステップが成功
- [ ] deployジョブが成功することを確認
  - [ ] Checkout
  - [ ] Setup Node.js
  - [ ] Install dependencies
  - [ ] Setup Python
  - [ ] Install AWS SAM CLI
  - [ ] Configure AWS credentials
  - [ ] SAM build
  - [ ] SAM deploy
  - [ ] Verify deployment
- [ ] すべてのジョブに緑のチェックマークが表示されることを確認

### 8.3 AWS環境での確認
- [ ] AWSマネジメントコンソールでCloudFormationスタックを確認
  - [ ] スタック状態が`UPDATE_COMPLETE`であることを確認
- [ ] Lambda関数を確認
  - [ ] 関数が存在することを確認
  - [ ] 最終更新日時が最新であることを確認
  - [ ] コードサイズが適切であることを確認
- [ ] AWS CLIでLambda関数を確認
  ```bash
  aws lambda get-function \
    --function-name weather-line-bot-WeatherNotificationFunction \
    --region ap-northeast-1 \
    --profile takahata
  ```
  - [ ] 関数情報が返されることを確認

### 8.4 Lambda関数の手動実行テスト
- [ ] AWS CLIまたはマネジメントコンソールでLambda関数を手動実行
- [ ] CloudWatch Logsでログを確認
- [ ] エラーが発生しないことを確認
- [ ] LINEにメッセージが届くことを確認（オプション）

---

## Phase 9: ドキュメント更新

### 9.1 README.md更新（オプション）
- [ ] CI/CDバッジを追加
- [ ] デプロイ方法を更新（自動デプロイに関する説明）
- [ ] 開発フローを更新（プルリクエスト → CI → マージ → CD）

---

## Phase 10: Gitコミット

### 10.1 変更ファイル確認
- [ ] `git status`で変更ファイルを確認
- [ ] `.github/workflows/ci.yml`
- [ ] `.github/workflows/cd.yml`
- [ ] `.steering/20260101-cicd-setup/`（ステアリングファイル）

### 10.2 コミット
- [ ] 変更ファイルをステージング
  ```bash
  git add .github/workflows/ .steering/20260101-cicd-setup/
  ```
- [ ] コミット
  ```bash
  git commit -m "ci: GitHub ActionsでCI/CDパイプラインを構築"
  ```

### 10.3 リモートプッシュ
- [ ] `git push origin main`を実行
- [ ] リモートリポジトリに反映されることを確認
- [ ] CDワークフローが自動実行されることを確認

---

## Phase 11: 継続的な動作確認

### 11.1 次回以降のプルリクエストで確認
- [ ] 新しいプルリクエスト作成時にCIが実行されることを確認
- [ ] mainマージ時にCDが実行されることを確認
- [ ] デプロイが成功することを確認

---

## 完了条件

以下がすべて満たされたら完了：

- [ ] `.github/workflows/ci.yml`が作成されている
- [ ] `.github/workflows/cd.yml`が作成されている
- [ ] GitHub Secretsに認証情報が設定されている
- [ ] プルリクエスト作成時にCIワークフローが自動実行される
- [ ] CIワークフローのすべてのステップが成功する
- [ ] mainブランチへのマージ時にCDワークフローが自動実行される
- [ ] CDワークフローのtestジョブが成功する
- [ ] CDワークフローのdeployジョブが成功する
- [ ] AWS環境でLambda関数が更新されている
- [ ] CloudFormationスタックが`UPDATE_COMPLETE`状態である
- [ ] Lambda関数の手動実行が成功する
- [ ] すべてのタスクが完了している

---

## 備考

### トラブルシューティング

#### CIワークフローが実行されない
- [ ] プルリクエストのターゲットがmainブランチであることを確認
- [ ] `.github/workflows/ci.yml`がmainブランチに存在することを確認
- [ ] YAML構文エラーがないことを確認

#### CDワークフローが実行されない
- [ ] pushがmainブランチに対して行われたことを確認
- [ ] `.github/workflows/cd.yml`がmainブランチに存在することを確認
- [ ] YAML構文エラーがないことを確認

#### AWS認証エラー
- [ ] GitHub Secretsが正しく設定されていることを確認
- [ ] IAMユーザーの権限が適切であることを確認
- [ ] アクセスキーが有効であることを確認

#### SAMデプロイエラー
- [ ] `samconfig.toml`が正しく設定されていることを確認
- [ ] CloudFormationテンプレート（`template.yaml`）が有効であることを確認
- [ ] IAMユーザーにCloudFormation権限があることを確認

#### Lambda関数が更新されない
- [ ] デプロイログを確認
- [ ] CloudFormationスタックのイベントを確認
- [ ] Lambda関数の最終更新日時を確認

### 次のステップ
- ブランチ保護ルールの設定（CI成功を必須にする）
- カバレッジレポートのPR自動コメント（将来の改善）
- Slackへのデプロイ通知（将来の改善）
