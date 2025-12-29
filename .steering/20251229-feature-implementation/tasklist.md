# タスクリスト（機能実装）

## 進捗状況

- **開始日**: 2025-12-29
- **完了予定日**: 未定
- **進捗率**: 0%

---

## Phase 0: 依存関係のインストール

### 0.1 axios追加
- [ ] `package.json`に`axios`を追加
- [ ] `npm install axios`を実行
- [ ] `package-lock.json`が更新されることを確認

---

## Phase 1: ディレクトリ構造作成

### 1.1 ディレクトリ作成
- [ ] `src/types/`ディレクトリを作成
- [ ] `src/services/`ディレクトリを作成
- [ ] `src/utils/`ディレクトリを作成
- [ ] `src/config/`ディレクトリを作成

---

## Phase 2: 型定義作成

### 2.1 天気データ型定義
- [ ] `src/types/weather.ts`を作成
- [ ] `OpenWeatherResponse`インターフェースを定義
- [ ] `WeatherData`インターフェースを定義

### 2.2 LINEメッセージ型定義
- [ ] `src/types/line.ts`を作成
- [ ] `LineMessage`インターフェースを定義
- [ ] `LineBroadcastRequest`インターフェースを定義
- [ ] `LineBroadcastResponse`インターフェースを定義

---

## Phase 3: 定数定義作成

### 3.1 定数ファイル作成
- [ ] `src/config/constants.ts`を作成
- [ ] `KAWASAKI_LOCATION`を定義
- [ ] `OPENWEATHER_CONFIG`を定義
- [ ] `LINE_CONFIG`を定義
- [ ] `PARAMETER_STORE`を定義
- [ ] `RETRY_CONFIG`を定義
- [ ] `WEATHER_EMOJI`を定義

---

## Phase 4: ユーティリティ実装

### 4.1 Logger実装
- [ ] `src/utils/logger.ts`を作成
- [ ] `LogLevel`列挙型を定義
- [ ] `Logger`クラスを実装
  - [ ] `log`メソッド（private）
  - [ ] `info`メソッド
  - [ ] `warn`メソッド
  - [ ] `error`メソッド
- [ ] ログが構造化JSON形式で出力されることを確認

### 4.2 Retry実装
- [ ] `src/utils/retry.ts`を作成
- [ ] `isRetryableError`関数を実装
  - [ ] ネットワークエラー判定
  - [ ] 5xx系HTTPステータス判定
- [ ] `retryWithBackoff`関数を実装
  - [ ] 指数バックオフロジック
  - [ ] 最大リトライ回数チェック
  - [ ] リトライ可能エラー判定
  - [ ] ログ出力

### 4.3 Formatter実装
- [ ] `src/utils/formatter.ts`を作成
- [ ] `formatWeatherMessage`関数を実装
  - [ ] 絵文字を含むメッセージ生成
  - [ ] 気温、降水確率、天気概況を含む
- [ ] `kelvinToCelsius`関数を実装
  - [ ] ケルビンから摂氏への変換
  - [ ] 四捨五入

---

## Phase 5: サービス実装

### 5.1 SecretsService実装
- [ ] `src/services/secretsService.ts`を作成
- [ ] `SSMClient`をインポート
- [ ] `getParameter`関数を実装（private）
  - [ ] `GetParameterCommand`実行
  - [ ] `WithDecryption: true`設定
  - [ ] エラーハンドリング
- [ ] `getOpenWeatherApiKey`関数を実装
  - [ ] ログ出力
  - [ ] リトライロジック適用
- [ ] `getLineChannelAccessToken`関数を実装
  - [ ] ログ出力
  - [ ] リトライロジック適用

### 5.2 WeatherService実装
- [ ] `src/services/weatherService.ts`を作成
- [ ] `axios`をインポート
- [ ] `getWeather`関数を実装
  - [ ] OpenWeather API URLを構築
  - [ ] axiosでGETリクエスト送信
  - [ ] パラメータ設定（lat, lon, appid, units, lang）
  - [ ] リトライロジック適用
  - [ ] レスポンスデータを`WeatherData`型に変換
  - [ ] 天気絵文字を選択
  - [ ] ログ出力

### 5.3 LineService実装
- [ ] `src/services/lineService.ts`を作成
- [ ] `axios`をインポート
- [ ] `sendBroadcastMessage`関数を実装
  - [ ] LINE Broadcast API URLを構築
  - [ ] リクエストボディを作成
  - [ ] axiosでPOSTリクエスト送信
  - [ ] Authorizationヘッダー設定
  - [ ] リトライロジック適用
  - [ ] ログ出力

---

## Phase 6: Lambdaハンドラー更新

### 6.1 index.ts更新
- [ ] `src/index.ts`を更新
- [ ] 必要なインポートを追加
  - [ ] `getOpenWeatherApiKey`, `getLineChannelAccessToken`
  - [ ] `getWeather`
  - [ ] `sendBroadcastMessage`
  - [ ] `formatWeatherMessage`
  - [ ] `Logger`
- [ ] `handler`関数を更新
  - [ ] Parameter Storeから設定値を取得（並列実行）
  - [ ] OpenWeather APIから天気データを取得
  - [ ] メッセージをフォーマット
  - [ ] LINE Broadcast APIでメッセージを送信
  - [ ] エラーハンドリング
  - [ ] ログ出力

---

## Phase 7: ビルドと型チェック

### 7.1 TypeScriptビルド
- [ ] `npm run build`を実行
- [ ] TypeScript型エラーがゼロであることを確認
- [ ] `dist/`ディレクトリが生成されることを確認

### 7.2 Lintチェック
- [ ] `npm run lint`を実行
- [ ] ESLintエラーがゼロであることを確認

---

## Phase 8: Parameter Store設定（本番値）

### 8.1 OpenWeather API Key設定
- [ ] OpenWeather APIでアカウント作成（未作成の場合）
- [ ] API Keyを取得
- [ ] Parameter Storeに実際のAPI Keyを設定
  ```bash
  aws ssm put-parameter \
    --name "/weather-bot/openweather-api-key" \
    --type "SecureString" \
    --value "ACTUAL_API_KEY" \
    --overwrite \
    --region ap-northeast-1 \
    --profile takahata
  ```
- [ ] Parameter Storeから取得できることを確認

### 8.2 LINE Channel Access Token設定
- [ ] LINE Developersコンソールでチャネル作成（未作成の場合）
- [ ] Channel Access Tokenを取得
- [ ] Parameter Storeに実際のTokenを設定
  ```bash
  aws ssm put-parameter \
    --name "/weather-bot/line-channel-access-token" \
    --type "SecureString" \
    --value "ACTUAL_TOKEN" \
    --overwrite \
    --region ap-northeast-1 \
    --profile takahata
  ```
- [ ] Parameter Storeから取得できることを確認

---

## Phase 9: ローカルテスト

### 9.1 SAMビルド
- [ ] `sam build`を実行
- [ ] ビルドが成功することを確認
- [ ] `.aws-sam/build/`ディレクトリが生成されることを確認

### 9.2 SAMローカル実行
- [ ] `sam local invoke`を実行
- [ ] Lambda関数が正常に実行されることを確認
- [ ] OpenWeather APIからデータを取得できることを確認
- [ ] LINE Broadcast APIでメッセージを送信できることを確認
- [ ] CloudWatch Logsにログが出力されることを確認
- [ ] エラーが発生しないことを確認

### 9.3 エラーケーステスト（オプション）
- [ ] Parameter Storeが存在しない場合のテスト
- [ ] OpenWeather API呼び出しエラーのテスト
- [ ] LINE Broadcast API呼び出しエラーのテスト

---

## Phase 10: AWSデプロイ

### 10.1 SAMビルド
- [ ] `sam build`を実行
- [ ] ビルドが成功することを確認

### 10.2 SAMデプロイ
- [ ] `sam deploy --profile takahata`を実行
- [ ] デプロイが成功することを確認
- [ ] CloudFormationスタックが`UPDATE_COMPLETE`状態になることを確認

### 10.3 デプロイ後の確認
- [ ] Lambda関数が更新されていることを確認
- [ ] Lambda関数のコードサイズを確認
- [ ] Lambda関数の環境変数を確認

---

## Phase 11: 本番動作確認

### 11.1 手動Lambda実行
- [ ] `aws lambda invoke`で手動実行
- [ ] Lambda関数が正常に実行されることを確認
- [ ] CloudWatch Logsでログを確認
  - [ ] Parameter Store取得ログ
  - [ ] OpenWeather API呼び出しログ
  - [ ] 天気データ取得ログ
  - [ ] LINE Broadcast API呼び出しログ
  - [ ] 完了ログ
- [ ] エラーが発生しないことを確認

### 11.2 LINE Bot動作確認
- [ ] LINE Botをフォロー（未フォローの場合）
- [ ] Lambda関数を手動実行
- [ ] LINEにメッセージが届くことを確認
- [ ] メッセージの内容を確認
  - [ ] 絵文字が表示される
  - [ ] 気温が正しく表示される
  - [ ] 降水確率が表示される
  - [ ] 天気概況が日本語で表示される

### 11.3 スケジュール実行確認
- [ ] EventBridgeルールが有効であることを確認
- [ ] 次回実行時刻を確認
- [ ] 翌日09:00 JSTにメッセージが届くことを確認（翌日確認）

---

## Phase 12: Gitコミット

### 12.1 変更ファイル確認
- [ ] `git status`で変更ファイルを確認
- [ ] 不要なファイルが含まれていないことを確認

### 12.2 コミット
- [ ] 変更ファイルをステージング
- [ ] コミットメッセージを作成
- [ ] コミット実行

### 12.3 リモートプッシュ
- [ ] `git push origin main`を実行
- [ ] リモートリポジトリに反映されることを確認

---

## 完了条件

以下がすべて満たされたら完了：

- [ ] すべての型定義が作成されている
- [ ] すべてのユーティリティが実装されている
- [ ] すべてのサービスが実装されている
- [ ] Lambdaハンドラーが更新されている
- [ ] `npm run build`が成功する
- [ ] `npm run lint`でエラーがゼロ
- [ ] Parameter Storeに本番API Key/Tokenが設定されている
- [ ] `sam build`が成功する
- [ ] `sam local invoke`でローカル実行できる
- [ ] AWSへのデプロイが成功する
- [ ] LINE Botにメッセージが届く
- [ ] CloudWatch Logsにログが出力される
- [ ] すべてのタスクが完了している

---

## 備考

### 実装時の注意事項
- 各Phaseは順番に実施すること
- TypeScript型エラーはゼロにすること
- ESLintエラーはゼロにすること
- すべてのAPI呼び出しにリトライロジックを適用すること
- すべての処理にログ出力を追加すること
- エラーハンドリングを適切に実装すること

### OpenWeather API設定
- API Key取得: https://openweathermap.org/api
- 無料プラン: 60 calls/分、1,000,000 calls/月
- 川崎市座標: 緯度35.5309、経度139.7028

### LINE Messaging API設定
- チャネル作成: https://developers.line.biz/console/
- Messaging API設定でBroadcastを有効化
- Channel Access Tokenを取得
- Bot Basic IDを確認してフォロー

### トラブルシューティング
- `npm install`でエラー → `npm cache clean --force`後に再試行
- `sam build`でエラー → `sam validate`でテンプレート検証
- `sam local invoke`でエラー → Dockerが起動しているか確認
- OpenWeather API 401エラー → API Keyを確認
- LINE Broadcast API 401エラー → Channel Access Tokenを確認
- メッセージが届かない → LINE Bot設定とフォロワー登録を確認

### 次のステップ
- Phase 3: テスト実装
- Phase 4: CI/CD構築
- Phase 5: 本番デプロイ（CI/CD経由）
