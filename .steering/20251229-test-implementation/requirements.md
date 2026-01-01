# Phase 3: Test Implementation - 要求定義

## 1. 概要
実装した機能の品質を保証するため、包括的なテストスイートを構築します。

## 2. テストの目的
- コードの正確性を保証
- リグレッションの防止
- リファクタリング時の安全性確保
- ドキュメントとしての役割（テストコードで仕様を表現）

## 3. テストフレームワーク
**Vitest**を採用
- 理由:
  - Viteベースで高速
  - TypeScript完全サポート
  - Jest互換API（学習コストが低い）
  - ESM対応
  - スナップショットテスト対応

## 4. テストカバレッジ目標
- **全体カバレッジ: 80%以上**
- 特に重要な箇所:
  - services/: 90%以上（ビジネスロジックのコア）
  - utils/: 90%以上（再利用性の高いユーティリティ）
  - types/: 型定義のため除外
  - config/: 定数のため除外

## 5. テスト対象

### 5.1 ユニットテスト

#### utils/logger.ts
- ✅ `Logger.info()` が正しいJSON形式でログ出力
- ✅ `Logger.warn()` が正しいJSON形式でログ出力
- ✅ `Logger.error()` がエラー情報を含めて出力

#### utils/retry.ts
- ✅ 成功時は1回目で結果を返す
- ✅ リトライ可能エラー（5xx, ECONNRESET等）で再試行
- ✅ リトライ不可エラー（4xx等）で即座に失敗
- ✅ 最大リトライ回数に達したら失敗
- ✅ バックオフ遅延が正しく計算される

#### utils/formatter.ts
- ✅ 天気データが正しくフォーマットされる
- ✅ 各フィールド（気温、降水確率、絵文字等）が含まれる
- ✅ 時間範囲（9時〜23時）が表示される

#### services/secretsService.ts
- ✅ `getOpenWeatherApiKey()` がParameter Storeから取得
- ✅ `getLineChannelAccessToken()` がParameter Storeから取得
- ✅ パラメータが見つからない場合はエラー
- ✅ リトライロジックが動作

#### services/weatherService.ts
- ✅ `getWeather()` がForecast APIを呼び出し
- ✅ 今日の09:00-23:00のデータをフィルタリング
- ✅ フィルタ後のデータから最高・最低気温を計算
- ✅ 降水確率の最大値を取得
- ✅ 天気概況と絵文字を設定
- ✅ データが0件の場合は最初のデータを使用
- ✅ リトライロジックが動作

#### services/lineService.ts
- ✅ `sendBroadcastMessage()` がLINE APIを呼び出し
- ✅ 正しいリクエストボディを送信
- ✅ 正しいヘッダー（Authorization, Content-Type）を設定
- ✅ リトライロジックが動作

### 5.2 統合テスト

#### src/index.ts（Lambda Handler）
- ✅ 正常系: 全ての処理が成功する
- ✅ エラー系: Parameter Store取得失敗
- ✅ エラー系: OpenWeather API呼び出し失敗
- ✅ エラー系: LINE API呼び出し失敗
- ✅ ログが正しく出力される

## 6. モック戦略

### 6.1 AWS SDK
- `@aws-sdk/client-ssm` のモック
- `GetParameterCommand` の結果をモック

### 6.2 Axios
- `axios.get()` と `axios.post()` をモック
- 成功レスポンス・エラーレスポンスの両方をシミュレート

### 6.3 タイマー
- `setTimeout` をモック（リトライのテスト用）

## 7. テストファイル構成
```
src/
  utils/
    __tests__/
      logger.test.ts
      retry.test.ts
      formatter.test.ts
  services/
    __tests__/
      secretsService.test.ts
      weatherService.test.ts
      lineService.test.ts
  __tests__/
    index.test.ts
```

## 8. 制約事項
- テストは実際のAWS環境やAPIを呼び出さない（完全モック）
- CI環境でも実行可能（外部依存なし）
- 高速実行（全テストが10秒以内）

## 9. 受け入れ条件
- [ ] Vitestのセットアップ完了
- [ ] 全ユニットテストが実装され、パスする
- [ ] 全統合テストが実装され、パスする
- [ ] テストカバレッジが80%以上
- [ ] `npm test` でテストが実行できる
- [ ] `npm run test:coverage` でカバレッジレポートが表示される
