# Phase 3: Test Implementation - タスクリスト

## Phase 1: Vitestセットアップ ✅

### 1.1 依存パッケージのインストール
- [ ] `vitest`、`@vitest/coverage-v8`、`aws-sdk-client-mock`をインストール
  ```bash
  npm install -D vitest @vitest/coverage-v8 aws-sdk-client-mock
  ```

### 1.2 Vitest設定ファイル作成
- [ ] `vitest.config.ts`を作成
  - カバレッジプロバイダー: v8
  - カバレッジ閾値: 80%
  - 除外パス: node_modules/, dist/, src/types/, src/config/, **/*.test.ts

### 1.3 package.jsonスクリプト追加
- [ ] `test`: `vitest run`
- [ ] `test:watch`: `vitest`
- [ ] `test:coverage`: `vitest run --coverage`

### 1.4 初回テスト実行確認
- [ ] `npm test`が実行できることを確認（テストファイルがなくてもOK）

---

## Phase 2: ユニットテスト実装（utils/） ✅

### 2.1 logger.test.ts
- [ ] テストディレクトリ作成: `src/utils/__tests__/`
- [ ] `logger.test.ts`を作成
  - [ ] `Logger.info()` がJSON形式で出力
  - [ ] `Logger.warn()` がJSON形式で出力
  - [ ] `Logger.error()` がエラー情報を含む
  - [ ] timestampが含まれる
  - [ ] メタデータが正しく追加される

### 2.2 retry.test.ts
- [ ] `retry.test.ts`を作成
  - [ ] 成功時は1回で完了
  - [ ] リトライ可能エラー（5xx）で再試行
  - [ ] リトライ可能エラー（ECONNRESET）で再試行
  - [ ] リトライ不可エラー（4xx）で即座に失敗
  - [ ] 最大リトライ回数で失敗
  - [ ] バックオフ遅延が正しく計算される

### 2.3 formatter.test.ts
- [ ] `formatter.test.ts`を作成
  - [ ] 絵文字が含まれる
  - [ ] 「川崎市の天気」が含まれる
  - [ ] 天気概況が含まれる
  - [ ] 「気温（9時〜23時）」が含まれる
  - [ ] 現在・最低・最高気温が含まれる
  - [ ] 降水確率が含まれる

### 2.4 Phase 2テスト実行
- [ ] `npm test`で全テストがパス
- [ ] エラーがないことを確認

---

## Phase 3: ユニットテスト実装（services/） ✅

### 3.1 secretsService.test.ts
- [ ] テストディレクトリ作成: `src/services/__tests__/`
- [ ] `secretsService.test.ts`を作成
  - [ ] `getOpenWeatherApiKey()` が成功時にキーを返す
  - [ ] `getOpenWeatherApiKey()` がParameter未設定時にエラー
  - [ ] `getLineChannelAccessToken()` が成功時にトークンを返す
  - [ ] `getLineChannelAccessToken()` がParameter未設定時にエラー
  - [ ] SSMClientが正しく呼ばれる
  - [ ] WithDecryption=trueが設定される

### 3.2 weatherService.test.ts
- [ ] `weatherService.test.ts`を作成
  - [ ] Forecast APIが正しく呼ばれる（lat, lon, appid, units, lang）
  - [ ] 今日の09:00-23:00のデータをフィルタリング
  - [ ] フィルタ後のデータから最高・最低気温を計算
  - [ ] 現在気温が最初のデータから取得される
  - [ ] 降水確率の最大値を取得（0.0-1.0 → 0-100%変換）
  - [ ] 天気概況と絵文字が設定される
  - [ ] データが0件の場合は最初のデータを使用
  - [ ] 気温が丸められる（Math.round）
  - [ ] エッジケース: 未来の日付のデータのみの場合
  - [ ] エッジケース: 過去の日付のデータのみの場合

### 3.3 lineService.test.ts
- [ ] `lineService.test.ts`を作成
  - [ ] POST先URLが正しい
  - [ ] リクエストボディが正しい形式
  - [ ] Content-Typeヘッダーが設定される
  - [ ] Authorizationヘッダーが設定される（Bearer token）
  - [ ] 成功時にエラーを投げない
  - [ ] API失敗時にエラーを投げる

### 3.4 Phase 3テスト実行
- [ ] `npm test`で全テストがパス
- [ ] エラーがないことを確認

---

## Phase 4: 統合テスト実装 ✅

### 4.1 index.test.ts
- [ ] テストディレクトリ作成: `src/__tests__/`
- [ ] `index.test.ts`を作成
  - [ ] 正常系: 全処理が成功
    - [ ] `getOpenWeatherApiKey()` が呼ばれる
    - [ ] `getLineChannelAccessToken()` が呼ばれる
    - [ ] `getWeather()` が正しいAPIキーで呼ばれる
    - [ ] `sendBroadcastMessage()` が正しいトークンとメッセージで呼ばれる
    - [ ] エラーを投げない
  - [ ] エラー系: Parameter Store取得失敗
    - [ ] `getOpenWeatherApiKey()` が失敗したらエラーを投げる
    - [ ] `getLineChannelAccessToken()` が失敗したらエラーを投げる
  - [ ] エラー系: OpenWeather API失敗
    - [ ] `getWeather()` が失敗したらエラーを投げる
  - [ ] エラー系: LINE API失敗
    - [ ] `sendBroadcastMessage()` が失敗したらエラーを投げる
  - [ ] ログが正しく出力される

### 4.2 Phase 4テスト実行
- [ ] `npm test`で全テストがパス
- [ ] エラーがないことを確認

---

## Phase 5: カバレッジ確認と調整 ✅

### 5.1 カバレッジ測定
- [ ] `npm run test:coverage`を実行
- [ ] カバレッジレポートを確認（コンソール出力）
- [ ] HTMLレポートを確認: `open coverage/index.html`

### 5.2 カバレッジ改善（必要な場合）
- [ ] 80%未満のファイルを特定
- [ ] 不足しているテストケースを追加
- [ ] 再度カバレッジ測定

### 5.3 最終確認
- [ ] 全体カバレッジが80%以上
- [ ] services/が90%以上
- [ ] utils/が90%以上
- [ ] すべてのテストがパス

---

## Phase 6: ビルド・デプロイ前確認 ✅

### 6.1 既存スクリプトとの整合性確認
- [ ] `npm run build`が成功
- [ ] `npm run lint`が成功
- [ ] `npm test`が成功
- [ ] すべてのスクリプトがエラーなく完了

### 6.2 .gitignore更新
- [ ] `coverage/`を追加（カバレッジレポートを除外）

---

## Phase 7: Git管理 ✅

### 7.1 コミット
- [ ] テストファイルをステージング
- [ ] 設定ファイル（vitest.config.ts, package.json）をステージング
- [ ] コミット: `test: Vitest導入と全ユニット・統合テストの実装`

### 7.2 リモートプッシュ
- [ ] `git push origin main`

---

## 成功基準チェックリスト

- [ ] `npm test`で全テストがパス
- [ ] `npm run test:coverage`でカバレッジ80%以上
- [ ] すべてのテストが外部APIを呼ばない（完全モック）
- [ ] CIで実行可能（外部依存なし）
- [ ] テスト実行時間が10秒以内
- [ ] ビルド・リント・テストすべてが成功

---

## 注意事項

- テストはPhaseごとに実行し、段階的に進める
- 各Phaseで`npm test`を実行してエラーがないことを確認
- モックが正しく動作していることを確認（実際のAPI呼び出しが発生しないこと）
- タイマーモック使用時は`vi.useFakeTimers()`と`vi.restoreAllMocks()`を忘れない
