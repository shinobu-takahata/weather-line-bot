# Phase 5: Weather API + 気象庁API ハイブリッド移行

## 背景
現在使用しているOpenWeather APIは予報データのため、実際の気温と数度のズレが生じています。より正確な天気情報を提供するため、以下のハイブリッドアプローチを採用します：

- **Weather API**: 気温・天気（実測値に近く、1時間ごとのデータ）
- **気象庁API**: 降水確率（日本の公式データで最も信頼性が高い）

## 目的
- より正確な気温情報の提供（実測値に近いデータ）
- 信頼性の高い降水確率の提供（気象庁の公式データ）
- 1時間ごとの詳細なデータ活用

## データソース

### 1. Weather API (weatherapi.com)
**エンドポイント**: `https://api.weatherapi.com/v1/forecast.json`

**取得データ**:
- 現在の気温（実測値）
- 09:00~23:00の1時間ごとの気温
- 最高気温・最低気温
- 天気（英語 → 日本語変換）
- 天気コード（絵文字マッピング用）

**無料プラン**:
- 1,000,000 リクエスト/月
- APIキー必要

### 2. 気象庁API
**エンドポイント**: `https://www.jma.go.jp/bosai/forecast/data/forecast/140000.json`

**取得データ**:
- 降水確率（時間帯別: 00-06, 06-12, 12-18, 18-24）
- 対象地域: 神奈川県東部（コード: 140010）

**特徴**:
- 完全無料
- APIキー不要
- 日本の公式気象データ

## データ取得方法

### Weather API
```
GET https://api.weatherapi.com/v1/forecast.json?key={API_KEY}&q=Kawasaki,Japan&days=1&lang=ja
```

**レスポンス例**:
```json
{
  "current": {
    "temp_c": 7.6,
    "condition": { "text": "Sunny", "code": 1000 }
  },
  "forecast": {
    "forecastday": [{
      "date": "2026-01-08",
      "day": {
        "maxtemp_c": 10.1,
        "mintemp_c": 4.6
      },
      "hour": [
        { "time": "2026-01-08 09:00", "temp_c": 6.9 },
        { "time": "2026-01-08 10:00", "temp_c": 7.6 },
        ...
      ]
    }]
  }
}
```

### 気象庁API
```
GET https://www.jma.go.jp/bosai/forecast/data/forecast/140000.json
```

**レスポンス構造**:
```json
[{
  "timeSeries": [
    {...},  // 天気・風・波
    {       // 降水確率
      "timeDefines": [
        "2026-01-08T06:00:00+09:00",   // 00-06時
        "2026-01-08T12:00:00+09:00",   // 06-12時
        "2026-01-08T18:00:00+09:00",   // 12-18時
        "2026-01-09T00:00:00+09:00"    // 18-24時
      ],
      "areas": [{
        "area": { "name": "東部", "code": "140010" },
        "pops": ["0", "10", "0", "0"]
      }]
    }
  ]
}]
```

## 降水確率の計算方法

09:00~23:00の降水確率は、以下の時間帯の最大値を使用：
- 06-12時（pops[1]）← 09:00-12:00を含む
- 12-18時（pops[2]）← 12:00-18:00を含む
- 18-24時（pops[3]）← 18:00-23:00を含む

```typescript
const relevantPops = [
  parseInt(pops[1]),  // 06-12時
  parseInt(pops[2]),  // 12-18時
  parseInt(pops[3]),  // 18-24時
];
const maxPrecipitation = Math.max(...relevantPops);
```

## 受け入れ条件

1. Weather APIから川崎市の気温データを取得できること
2. 09:00~23:00の1時間ごとの気温から最高・最低を計算できること
3. 気象庁APIから神奈川県東部の降水確率を取得できること
4. 2つのAPIのデータを統合してWeatherData型を生成できること
5. Weather API Keyが環境変数またはParameter Storeから取得できること
6. APIエラー時に適切なリトライ処理が動作すること
7. 既存のLINEメッセージフォーマットを維持すること
8. すべてのテストが成功すること
9. CI/CDパイプラインが正常に動作すること

## 制約事項

1. Weather API Keyの管理が必要
2. 2つのAPIを呼び出すため、レスポンス時間が若干増加する可能性
3. どちらかのAPIが失敗した場合のフォールバック戦略が必要
4. OpenWeather API Keyは削除せず保持（緊急時のフォールバック用）

## 影響範囲

### 変更ファイル
- `src/types/weather.ts` - Weather API、気象庁APIの型定義追加
- `src/config/constants.ts` - Weather API、気象庁API設定追加
- `src/services/weatherService.ts` - 2つのAPIを統合する実装
- `src/index.ts` - Parameter Storeから新しいAPIキー取得
- `tests/unit/weatherService.test.ts` - テスト更新
- `tests/integration/weather.test.ts` - 統合テスト更新

### Parameter Store
新規パラメータ追加:
- `/weather-bot/weatherapi-key` - Weather API Key

既存パラメータ（保持）:
- `/weather-bot/openweather-api-key` - OpenWeather API Key（フォールバック用）
- `/weather-bot/line-channel-access-token` - LINE Channel Access Token

## メッセージフォーマット

### 現在
```
☁️ 今日の川崎市の天気

気温: 6°C
最高: 6°C / 最低: 4°C
降水確率: 20%
天気: 曇りがち
```

### 変更後
```
☀️ 今日の川崎市の天気

気温: 8°C
最高: 10°C / 最低: 5°C
降水確率: 10%
天気: 晴れ
```
※絵文字・天気はWeather APIのデータ
※降水確率は気象庁APIのデータ

## エラーハンドリング戦略

### Weather API失敗時
1. リトライ（最大3回）
2. それでも失敗の場合、OpenWeather APIにフォールバック
3. ログに警告を出力

### 気象庁API失敗時
1. リトライ（最大3回）
2. それでも失敗の場合、降水確率を「取得できませんでした」と表示
3. 気温・天気データは正常に送信

### 両方失敗時
1. OpenWeather APIにフォールバック
2. エラーログを出力

## リスク

1. Weather APIの無料枠制限（100万リクエスト/月）
   - 対策: 現在の使用頻度（1日1回）では問題なし
2. 気象庁APIの非公式性
   - 対策: 定期的な動作確認、エラー時のフォールバック実装
3. 2つのAPIの呼び出しによる遅延
   - 対策: 並列リクエストで最小化

## 成功の定義

- Weather APIから正確な気温データを取得し、LINEで通知できること
- 気象庁APIから降水確率を取得し、統合して表示できること
- 全テストが成功すること
- CI/CDパイプラインでデプロイが成功すること
- Lambda関数が正常に実行され、天気通知が送信されること
- エラー時のフォールバック処理が正常に動作すること
