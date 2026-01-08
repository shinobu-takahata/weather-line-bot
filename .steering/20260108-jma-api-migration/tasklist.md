# Phase 5: Weather API + 気象庁API ハイブリッド移行 - タスクリスト

## フェーズ1: Parameter Store設定
- [ ] Weather API KeyをParameter Storeに追加
  - パラメータ名: `/weather-bot/weatherapi-key`
  - タイプ: SecureString

## フェーズ2: 型定義の追加
- [ ] `src/types/weather.ts` にWeather API型定義を追加
  - `WeatherAPIResponse`
  - `WeatherAPIData`
- [ ] `src/types/weather.ts` に気象庁API型定義を追加
  - `JmaForecastResponse`
  - `JmaTimeSeries`
  - `JmaArea`
  - `JmaPrecipitationData`

## フェーズ3: 定数設定の追加
- [ ] `src/config/constants.ts` にWeather API設定を追加
  - `WEATHERAPI_CONFIG`
  - `WEATHERAPI_EMOJI`
  - `WEATHERAPI_CONDITION_JA`
- [ ] `src/config/constants.ts` に気象庁API設定を追加
  - `JMA_CONFIG`
- [ ] `PARAMETER_STORE` に `weatherApiKey` を追加

## フェーズ4: weatherService.ts 実装
- [ ] `getWeatherFromWeatherAPI()` 関数を実装
  - Weather API呼び出し
  - 09:00~23:00のデータフィルタリング
  - 最高・最低気温計算
  - 天気コードから日本語変換
  - 絵文字マッピング
- [ ] `getPrecipitationFromJMA()` 関数を実装
  - 気象庁API呼び出し
  - 神奈川県東部データ抽出
  - 06-12, 12-18, 18-24時の降水確率取得
  - 最大値計算
- [ ] `getWeather()` 関数を更新
  - Weather APIとJMA APIを並列呼び出し
  - データ統合
  - エラーハンドリング（JMA失敗時はデフォルト値0%）

## フェーズ5: index.ts 更新
- [ ] Parameter Store取得処理を更新
  - `weatherApiKey` を取得
  - `getWeather(weatherApiKey)` 呼び出し

## フェーズ6: ユニットテスト更新
- [ ] `tests/unit/weatherService.test.ts` 更新
  - Weather APIモックデータ作成
  - 気象庁APIモックデータ作成
  - `getWeather()` のテストケース追加
    - 正常系: 両APIが成功
    - 異常系: JMA APIが失敗（デフォルト値0%を使用）
    - 異常系: Weather APIが失敗（エラーをthrow）
  - `getWeatherFromWeatherAPI()` のテストケース追加
  - `getPrecipitationFromJMA()` のテストケース追加

## フェーズ7: 統合テスト更新
- [ ] `tests/integration/weather.test.ts` 更新
  - 実際のWeather APIを呼び出すテスト
  - 実際の気象庁APIを呼び出すテスト
  - データ統合のテスト

## フェーズ8: ローカルテスト
- [ ] ローカル環境でユニットテスト実行
  ```bash
  npm test
  ```
- [ ] ローカル環境でカバレッジテスト実行
  ```bash
  npm run test:coverage
  ```
- [ ] 80%以上のカバレッジを確認

## フェーズ9: ローカルビルド・デプロイテスト
- [ ] TypeScriptビルド実行
  ```bash
  npm run build
  ```
- [ ] SAMビルド実行
  ```bash
  sam build
  ```
- [ ] SAMローカルテスト（任意）
  ```bash
  sam local invoke
  ```
- [ ] SAMデプロイ実行
  ```bash
  sam deploy --profile takahata
  ```

## フェーズ10: Lambda動作確認
- [ ] Lambda関数を手動実行
  ```bash
  aws lambda invoke \
    --function-name weather-line-bot-WeatherNotificationFunction \
    --region ap-northeast-1 \
    --profile takahata \
    --log-type Tail \
    /tmp/lambda-response.json
  ```
- [ ] ログを確認
  - Weather API呼び出し成功
  - 気象庁API呼び出し成功
  - データ統合成功
  - LINE送信成功
- [ ] LINEで通知を確認
  - 気温が正確
  - 降水確率が気象庁のデータ
  - 絵文字・天気が適切

## フェーズ11: Git コミット・プッシュ
- [ ] 変更をコミット
  ```bash
  git add .
  git commit -m "feat: Weather API + 気象庁API ハイブリッド実装"
  ```
- [ ] GitHub にプッシュ
  ```bash
  git push origin main
  ```

## フェーズ12: CI/CD動作確認
- [ ] GitHub Actions CI ワークフロー確認
  - Lint成功
  - Build成功
  - Test成功
  - Coverage成功
- [ ] GitHub Actions CD ワークフロー確認
  - Test job成功
  - Deploy job成功
  - SAM deploy成功
  - Verify deployment成功

## フェーズ13: 本番動作確認
- [ ] デプロイ後のLambda関数を手動実行
- [ ] CloudWatch Logsでログ確認
  - エラーがないこと
  - Weather APIとJMA APIの両方が呼ばれていること
  - データが正しく統合されていること
- [ ] LINEで通知を確認
  - 正確な気温
  - 正確な降水確率（気象庁データ）
  - 適切な天気表現

## フェーズ14: ドキュメント更新
- [ ] `README.md` 更新（必要に応じて）
  - 使用API情報の更新
  - Parameter Store設定手順の更新
- [ ] `docs/architecture.md` 更新（必要に応じて）
  - アーキテクチャ図の更新
  - API仕様の更新

## フェーズ15: クリーンアップ
- [ ] 不要なコメントやコンソールログの削除
- [ ] コードフォーマット実行
  ```bash
  npm run format
  ```
- [ ] Lint実行
  ```bash
  npm run lint
  ```

## 完了条件
- [ ] すべてのユニットテストが成功
- [ ] カバレッジが80%以上
- [ ] CI/CDパイプラインが成功
- [ ] Lambda関数が正常に実行され、LINEで通知が届く
- [ ] 気温がWeather APIから取得され、実測値に近い
- [ ] 降水確率が気象庁APIから取得され、公式データと一致
- [ ] エラーハンドリングが正常に動作（JMA失敗時もアプリは動作）
