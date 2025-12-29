# 機能実装要求定義書

## 作業概要

川崎市の天気情報を取得してLINEで通知する機能を実装する。

基盤構築（Phase 1）で作成したインフラ上に、実際の天気通知機能を実装します。

## 実装範囲

### 実装する機能

1. **OpenWeather API連携**
   - Parameter StoreからAPI Keyを取得
   - OpenWeather API (Current Weather Data API) を呼び出し
   - 川崎市（緯度: 35.5309, 経度: 139.7028）の天気データを取得
   - 現在の気温、最高気温、最低気温、降水確率、天気概況を取得

2. **LINE Messaging API連携**
   - Parameter StoreからChannel Access Tokenを取得
   - LINE Messaging API Broadcast APIを呼び出し
   - フォロワー全員にメッセージを送信

3. **メッセージフォーマット処理**
   - 天気データをユーザーフレンドリーな形式に整形
   - 日本語で読みやすいメッセージを作成
   - 絵文字を使って視覚的にわかりやすく表示

4. **Parameter Store連携**
   - AWS Systems Manager Parameter Storeから設定値を取得
   - SecureStringの復号化
   - エラーハンドリング

5. **エラーハンドリング**
   - API呼び出しエラーのハンドリング
   - Parameter Store読み取りエラーのハンドリング
   - ネットワークエラーのハンドリング
   - Lambda実行ログへのエラー記録

6. **リトライロジック**
   - 一時的なエラーに対する自動リトライ
   - 指数バックオフ戦略
   - 最大リトライ回数の設定

## 除外事項（今回は実装しない）

### 後続の作業で実装するもの

- ユニットテスト
- 統合テスト
- CI/CD（GitHub Actions）
- 複数都市対応
- ユーザー個別設定
- Webhook実装
- DynamoDBによるユーザー管理

## 受け入れ条件

### OpenWeather API連携

- [ ] Parameter StoreからOpenWeather API Keyを取得できる
- [ ] OpenWeather APIを呼び出して川崎市の天気データを取得できる
- [ ] 気温（現在/最高/最低）を取得できる
- [ ] 降水確率を取得できる
- [ ] 天気概況（晴れ/曇り/雨など）を取得できる
- [ ] APIエラー時に適切なエラーハンドリングが行われる

### LINE Messaging API連携

- [ ] Parameter StoreからLINE Channel Access Tokenを取得できる
- [ ] LINE Broadcast APIを呼び出してメッセージを送信できる
- [ ] APIエラー時に適切なエラーハンドリングが行われる

### メッセージフォーマット処理

- [ ] 天気データが日本語で読みやすい形式に整形される
- [ ] 気温、降水確率、天気概況がメッセージに含まれる
- [ ] 絵文字が使用されて視覚的にわかりやすい

### Parameter Store連携

- [ ] `/weather-bot/openweather-api-key` から値を取得できる
- [ ] `/weather-bot/line-channel-access-token` から値を取得できる
- [ ] SecureStringが正しく復号化される
- [ ] 取得エラー時に適切なエラーハンドリングが行われる

### エラーハンドリング

- [ ] API呼び出しエラーがキャッチされる
- [ ] エラー内容がCloudWatch Logsに記録される
- [ ] Lambda関数がエラー終了する（リトライ可能な場合を除く）

### リトライロジック

- [ ] 一時的なエラー（5xx系）に対して自動リトライが行われる
- [ ] 指数バックオフでリトライ間隔が増加する
- [ ] 最大リトライ回数に達したらエラー終了する

## ユーザーストーリー

### ストーリー1: 天気データ取得

```
As a ユーザー
I want 川崎市の天気情報を取得したい
So that 毎日の天気を把握できる
```

**受け入れ条件**:
- OpenWeather APIから川崎市の天気データを取得できる
- 気温、降水確率、天気概況が取得できる
- APIエラー時にエラーログが出力される

### ストーリー2: LINEメッセージ送信

```
As a ユーザー
I want 天気情報がLINEで通知される
So that 毎朝天気をチェックできる
```

**受け入れ条件**:
- LINE Broadcast APIでメッセージが送信される
- フォロワー全員に届く
- 送信エラー時にエラーログが出力される

### ストーリー3: 読みやすいメッセージ

```
As a ユーザー
I want 天気情報が読みやすい形式で表示される
So that 一目で天気を理解できる
```

**受け入れ条件**:
- 日本語で表示される
- 絵文字が使用される
- 気温、降水確率、天気概況が含まれる

### ストーリー4: エラーハンドリング

```
As a 開発者
I want APIエラーが適切にハンドリングされる
So that 障害時に原因を特定できる
```

**受け入れ条件**:
- エラー内容がCloudWatch Logsに記録される
- 一時的なエラーは自動リトライされる
- 致命的なエラーはLambda関数がエラー終了する

## 制約事項

### 技術的制約

- Node.js 20.11.0を使用
- TypeScript 5.x以上を使用
- OpenWeather API無料枠（60 calls/分）
- LINE Messaging API無料枠（500 messages/月）
- Lambda実行時間30秒以内
- Lambda メモリ256MB

### API制約

- **OpenWeather API**
  - 無料枠: 60 calls/分、1,000,000 calls/月
  - レスポンス時間: 通常 < 1秒
  - データ更新頻度: 10分ごと

- **LINE Messaging API**
  - Broadcast API無料枠: 500 messages/月
  - レート制限: 100 requests/秒
  - メッセージ長: 最大5000文字

### 時間的制約

- 機能実装期限：なし（個人開発）
- 作業時間：適宜

### リソース制約

- AWS無料枠内での実装
- 月間コスト$0を目標

## 成功基準

### 必須条件

1. OpenWeather APIから川崎市の天気データを取得できる
2. LINE Broadcast APIでメッセージを送信できる
3. メッセージが読みやすい日本語で整形される
4. Parameter Storeから設定値を取得できる
5. APIエラーが適切にハンドリングされる
6. 一時的なエラーが自動リトライされる
7. CloudWatch Logsにログが出力される

### 推奨条件

1. メッセージに絵文字が使用される
2. エラーログが構造化されている
3. リトライロジックが指数バックオフを使用する

## 次のステップ（後続作業）

機能実装完了後、以下の作業を実施：

1. **Phase 3: テスト実装**
   - Vitestセットアップ
   - ユニットテスト作成
   - 統合テスト作成
   - テストカバレッジ80%以上

2. **Phase 4: CI/CD構築**
   - GitHub Actionsワークフロー作成
   - 自動ビルド・テスト・デプロイ

3. **Phase 5: 本番デプロイ**
   - Parameter Storeに本番API Key/Tokenを設定
   - CI/CDパイプラインを通したデプロイ
   - 本番環境での動作確認

## 参考ドキュメント

- [docs/product-requirements.md](../../docs/product-requirements.md)
- [docs/functional-design.md](../../docs/functional-design.md)
- [docs/architecture.md](../../docs/architecture.md)
- [OpenWeather API Documentation](https://openweathermap.org/api)
- [LINE Messaging API Documentation](https://developers.line.biz/ja/docs/messaging-api/)
