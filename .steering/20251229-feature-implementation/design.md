# 機能実装設計書

## 1. 実装アプローチ

以下の順序で実装を進めます：

1. **型定義とインターフェース作成**
2. **ユーティリティ実装**（Logger, Retry）
3. **Parameter Store連携実装**
4. **OpenWeather API連携実装**
5. **LINE Messaging API連携実装**
6. **メッセージフォーマット実装**
7. **Lambdaハンドラー更新**
8. **ローカルテスト**
9. **AWSデプロイと動作確認**

## 2. ディレクトリ構造

### 新しく作成するファイル

```
weather-line-bot/
├── src/
│   ├── index.ts                      # Lambda関数エントリーポイント（更新）
│   │
│   ├── types/
│   │   ├── weather.ts                # 天気データの型定義
│   │   └── line.ts                   # LINEメッセージの型定義
│   │
│   ├── services/
│   │   ├── secretsService.ts         # Parameter Store連携
│   │   ├── weatherService.ts         # OpenWeather API連携
│   │   └── lineService.ts            # LINE Messaging API連携
│   │
│   ├── utils/
│   │   ├── logger.ts                 # 構造化ログ出力
│   │   ├── retry.ts                  # リトライロジック
│   │   └── formatter.ts              # メッセージフォーマット
│   │
│   └── config/
│       └── constants.ts              # 定数定義
│
└── package.json                      # 依存関係追加（axios）
```

## 3. 型定義

### 3.1 天気データ型定義 (src/types/weather.ts)

```typescript
/**
 * OpenWeather APIレスポンス型
 */
export interface OpenWeatherResponse {
  main: {
    temp: number;       // 現在の気温（ケルビン）
    temp_min: number;   // 最低気温（ケルビン）
    temp_max: number;   // 最高気温（ケルビン）
  };
  weather: Array<{
    main: string;       // 天気概況（英語）
    description: string; // 天気詳細（英語）
  }>;
  pop?: number;         // 降水確率（0.0-1.0）
}

/**
 * 天気データ（加工済み）
 */
export interface WeatherData {
  temperature: {
    current: number;    // 現在の気温（℃）
    min: number;        // 最低気温（℃）
    max: number;        // 最高気温（℃）
  };
  description: string;  // 天気概況（日本語）
  precipitation: number; // 降水確率（%）
  emoji: string;        // 天気絵文字
}
```

### 3.2 LINEメッセージ型定義 (src/types/line.ts)

```typescript
/**
 * LINEメッセージ
 */
export interface LineMessage {
  type: 'text';
  text: string;
}

/**
 * LINE Broadcast APIリクエスト
 */
export interface LineBroadcastRequest {
  messages: LineMessage[];
}

/**
 * LINE Broadcast APIレスポンス
 */
export interface LineBroadcastResponse {
  // 空オブジェクト（成功時は204 No Content）
}
```

## 4. 定数定義 (src/config/constants.ts)

```typescript
/**
 * 川崎市の座標
 */
export const KAWASAKI_LOCATION = {
  lat: 35.5309,
  lon: 139.7028,
} as const;

/**
 * OpenWeather API設定
 */
export const OPENWEATHER_CONFIG = {
  baseUrl: 'https://api.openweathermap.org/data/2.5',
  endpoint: '/weather',
  units: 'metric', // 摂氏
  lang: 'ja',      // 日本語
} as const;

/**
 * LINE Messaging API設定
 */
export const LINE_CONFIG = {
  baseUrl: 'https://api.line.me/v2',
  endpoint: '/bot/message/broadcast',
} as const;

/**
 * Parameter Store設定
 */
export const PARAMETER_STORE = {
  openWeatherApiKey: '/weather-bot/openweather-api-key',
  lineChannelAccessToken: '/weather-bot/line-channel-access-token',
} as const;

/**
 * リトライ設定
 */
export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
} as const;

/**
 * 天気アイコンマッピング
 */
export const WEATHER_EMOJI: Record<string, string> = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '🌧️',
  Drizzle: '🌦️',
  Thunderstorm: '⛈️',
  Snow: '❄️',
  Mist: '🌫️',
  Fog: '🌫️',
} as const;
```

## 5. ユーティリティ実装

### 5.1 Logger (src/utils/logger.ts)

```typescript
/**
 * ログレベル
 */
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * 構造化ログ出力
 */
export class Logger {
  private static log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };
    console.log(JSON.stringify(logEntry));
  }

  static info(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  static warn(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  static error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, {
      error: error?.message,
      stack: error?.stack,
      ...meta,
    });
  }
}
```

### 5.2 Retry (src/utils/retry.ts)

```typescript
import { RETRY_CONFIG } from '../config/constants';
import { Logger } from './logger';

/**
 * リトライ可能なエラーかどうか判定
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // ネットワークエラー
    if (error.message.includes('ECONNRESET') || error.message.includes('ETIMEDOUT')) {
      return true;
    }
  }

  // axios エラーの場合
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status: number } }).response;
    if (response && response.status >= 500 && response.status < 600) {
      return true;
    }
  }

  return false;
}

/**
 * 指数バックオフでリトライ
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  operation: string
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === RETRY_CONFIG.maxRetries || !isRetryableError(error)) {
        throw error;
      }

      const delay = Math.min(
        RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
        RETRY_CONFIG.maxDelayMs
      );

      Logger.warn(`${operation} failed, retrying in ${delay}ms`, {
        attempt: attempt + 1,
        maxRetries: RETRY_CONFIG.maxRetries,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

### 5.3 Formatter (src/utils/formatter.ts)

```typescript
import { WeatherData } from '../types/weather';

/**
 * 天気データを人間が読める形式にフォーマット
 */
export function formatWeatherMessage(weather: WeatherData): string {
  const { temperature, description, precipitation, emoji } = weather;

  return `${emoji} 川崎市の天気

今日の天気: ${description}

🌡️ 気温
・現在: ${temperature.current}℃
・最低: ${temperature.min}℃
・最高: ${temperature.max}℃

☔ 降水確率: ${precipitation}%

良い一日をお過ごしください！`;
}

/**
 * ケルビンを摂氏に変換
 */
export function kelvinToCelsius(kelvin: number): number {
  return Math.round(kelvin - 273.15);
}
```

## 6. サービス実装

### 6.1 SecretsService (src/services/secretsService.ts)

```typescript
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { PARAMETER_STORE } from '../config/constants';
import { Logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/retry';

const ssmClient = new SSMClient({ region: 'ap-northeast-1' });

/**
 * Parameter Storeから値を取得
 */
async function getParameter(name: string): Promise<string> {
  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: true, // SecureString復号化
  });

  const response = await ssmClient.send(command);

  if (!response.Parameter?.Value) {
    throw new Error(`Parameter ${name} not found`);
  }

  return response.Parameter.Value;
}

/**
 * OpenWeather API Keyを取得
 */
export async function getOpenWeatherApiKey(): Promise<string> {
  Logger.info('Fetching OpenWeather API Key from Parameter Store');

  return retryWithBackoff(
    () => getParameter(PARAMETER_STORE.openWeatherApiKey),
    'Get OpenWeather API Key'
  );
}

/**
 * LINE Channel Access Tokenを取得
 */
export async function getLineChannelAccessToken(): Promise<string> {
  Logger.info('Fetching LINE Channel Access Token from Parameter Store');

  return retryWithBackoff(
    () => getParameter(PARAMETER_STORE.lineChannelAccessToken),
    'Get LINE Channel Access Token'
  );
}
```

### 6.2 WeatherService (src/services/weatherService.ts)

```typescript
import axios from 'axios';
import { KAWASAKI_LOCATION, OPENWEATHER_CONFIG, WEATHER_EMOJI } from '../config/constants';
import { OpenWeatherResponse, WeatherData } from '../types/weather';
import { Logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/retry';
import { kelvinToCelsius } from '../utils/formatter';

/**
 * OpenWeather APIから天気データを取得
 */
export async function getWeather(apiKey: string): Promise<WeatherData> {
  Logger.info('Fetching weather data from OpenWeather API', {
    location: KAWASAKI_LOCATION,
  });

  const url = `${OPENWEATHER_CONFIG.baseUrl}${OPENWEATHER_CONFIG.endpoint}`;

  const response = await retryWithBackoff(async () => {
    return axios.get<OpenWeatherResponse>(url, {
      params: {
        lat: KAWASAKI_LOCATION.lat,
        lon: KAWASAKI_LOCATION.lon,
        appid: apiKey,
        units: OPENWEATHER_CONFIG.units,
        lang: OPENWEATHER_CONFIG.lang,
      },
    });
  }, 'Fetch weather data');

  const data = response.data;

  // 天気データを加工
  const weatherMain = data.weather[0]?.main || 'Unknown';
  const weatherData: WeatherData = {
    temperature: {
      current: Math.round(data.main.temp),
      min: Math.round(data.main.temp_min),
      max: Math.round(data.main.temp_max),
    },
    description: data.weather[0]?.description || '不明',
    precipitation: Math.round((data.pop || 0) * 100),
    emoji: WEATHER_EMOJI[weatherMain] || '🌤️',
  };

  Logger.info('Weather data fetched successfully', { weatherData });

  return weatherData;
}
```

**注意**: OpenWeather APIの無料プランでは `pop`（降水確率）が含まれないため、`pop`がない場合は0%とします。降水確率を取得するには、One Call API 3.0（有料）を使用する必要があります。

### 6.3 LineService (src/services/lineService.ts)

```typescript
import axios from 'axios';
import { LINE_CONFIG } from '../config/constants';
import { LineBroadcastRequest } from '../types/line';
import { Logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/retry';

/**
 * LINE Broadcast APIでメッセージを送信
 */
export async function sendBroadcastMessage(
  accessToken: string,
  message: string
): Promise<void> {
  Logger.info('Sending broadcast message via LINE Messaging API');

  const url = `${LINE_CONFIG.baseUrl}${LINE_CONFIG.endpoint}`;

  const requestBody: LineBroadcastRequest = {
    messages: [
      {
        type: 'text',
        text: message,
      },
    ],
  };

  await retryWithBackoff(async () => {
    return axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }, 'Send broadcast message');

  Logger.info('Broadcast message sent successfully');
}
```

## 7. Lambdaハンドラー更新 (src/index.ts)

```typescript
import { EventBridgeEvent } from 'aws-lambda';
import { getOpenWeatherApiKey, getLineChannelAccessToken } from './services/secretsService';
import { getWeather } from './services/weatherService';
import { sendBroadcastMessage } from './services/lineService';
import { formatWeatherMessage } from './utils/formatter';
import { Logger } from './utils/logger';

/**
 * Lambda関数のハンドラー
 * EventBridgeからのスケジュールイベントを受け取る
 */
export const handler = async (
  event: EventBridgeEvent<'Scheduled Event', never>
): Promise<void> => {
  Logger.info('Lambda function invoked', { event });

  try {
    // 1. Parameter Storeから設定値を取得
    const [apiKey, accessToken] = await Promise.all([
      getOpenWeatherApiKey(),
      getLineChannelAccessToken(),
    ]);

    // 2. OpenWeather APIから天気データを取得
    const weatherData = await getWeather(apiKey);

    // 3. メッセージをフォーマット
    const message = formatWeatherMessage(weatherData);

    // 4. LINE Broadcast APIでメッセージを送信
    await sendBroadcastMessage(accessToken, message);

    Logger.info('Weather notification completed successfully');
  } catch (error) {
    Logger.error('Weather notification failed', error as Error);
    throw error;
  }
};
```

## 8. 依存関係の追加

### package.json更新

```json
{
  "dependencies": {
    "@aws-sdk/client-ssm": "^3.0.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.159",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "esbuild": "^0.19.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
```

## 9. エラーハンドリング戦略

### 9.1 エラー分類

1. **リトライ可能なエラー**
   - ネットワークエラー（ECONNRESET, ETIMEDOUT）
   - 5xx系HTTPステータス（サーバーエラー）
   - 一時的なAPI障害

2. **リトライ不可能なエラー**
   - 4xx系HTTPステータス（クライアントエラー）
   - 認証エラー（401, 403）
   - パラメータエラー（Parameter Store未設定）
   - データ形式エラー

### 9.2 リトライ戦略

- **最大リトライ回数**: 3回
- **初期遅延**: 1秒
- **最大遅延**: 10秒
- **バックオフ係数**: 2（指数バックオフ）

### 9.3 ログ出力

すべてのエラーをCloudWatch Logsに構造化ログとして出力：

```json
{
  "timestamp": "2025-12-29T12:00:00.000Z",
  "level": "ERROR",
  "message": "Weather notification failed",
  "error": "Error message",
  "stack": "Stack trace..."
}
```

## 10. 確認項目

### 10.1 開発環境

- [ ] `axios`がインストールされている
- [ ] TypeScript型定義が追加されている
- [ ] `npm run build`が成功する
- [ ] `npm run lint`でエラーがゼロ

### 10.2 Parameter Store

- [ ] `/weather-bot/openweather-api-key`に実際のAPI Keyが設定されている
- [ ] `/weather-bot/line-channel-access-token`に実際のTokenが設定されている
- [ ] SecureStringで暗号化されている

### 10.3 ローカルテスト

- [ ] `sam build`が成功する
- [ ] `sam local invoke`でLambda関数が実行される
- [ ] OpenWeather APIからデータを取得できる
- [ ] LINE Broadcast APIでメッセージを送信できる
- [ ] CloudWatch Logsにログが出力される

### 10.4 AWSデプロイ

- [ ] `sam deploy`が成功する
- [ ] Lambda関数が正常に実行される
- [ ] LINE Botフォロワーにメッセージが届く
- [ ] CloudWatch Logsにログが記録される

## 11. トラブルシューティング

### 問題1: Parameter Storeから値が取得できない

**原因**: IAMポリシーの権限不足、またはパラメータ名の誤り

**対応**:
```bash
# パラメータの存在確認
aws ssm get-parameter \
  --name "/weather-bot/openweather-api-key" \
  --region ap-northeast-1 \
  --profile takahata

# Lambda関数のIAMロールを確認
aws iam get-role-policy \
  --role-name weather-line-bot-WeatherNotificationFunctionRole-XXXXX \
  --policy-name SSMParameterReadPolicy
```

### 問題2: OpenWeather APIから403エラー

**原因**: API Keyが無効、または無料枠の制限超過

**対応**:
```bash
# API Keyをテスト
curl "https://api.openweathermap.org/data/2.5/weather?lat=35.5309&lon=139.7028&appid=YOUR_API_KEY"

# Parameter Storeの値を更新
aws ssm put-parameter \
  --name "/weather-bot/openweather-api-key" \
  --type "SecureString" \
  --value "NEW_API_KEY" \
  --overwrite \
  --region ap-northeast-1 \
  --profile takahata
```

### 問題3: LINE Broadcast APIから401エラー

**原因**: Channel Access Tokenが無効

**対応**:
```bash
# Tokenをテスト
curl -X POST https://api.line.me/v2/bot/message/broadcast \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{"messages":[{"type":"text","text":"test"}]}'

# Parameter Storeの値を更新
aws ssm put-parameter \
  --name "/weather-bot/line-channel-access-token" \
  --type "SecureString" \
  --value "NEW_TOKEN" \
  --overwrite \
  --region ap-northeast-1 \
  --profile takahata
```

### 問題4: Lambda実行時にモジュールが見つからない

**原因**: `axios`がバンドルされていない、またはビルド設定の誤り

**対応**:
```bash
# 依存関係を再インストール
npm install

# ビルド
npm run build

# SAMビルド
sam build

# ローカルテスト
sam local invoke --event events/eventbridge-event.json
```

### 問題5: メッセージがLINEに届かない

**原因**: Broadcast APIは送信ステータスを返さないため、エラーが隠れている可能性

**対応**:
```bash
# CloudWatch Logsを確認
aws logs tail /aws/lambda/weather-line-bot-WeatherNotificationFunction \
  --region ap-northeast-1 \
  --profile takahata \
  --follow

# LINE Bot設定を確認
# - Messaging API設定でBroadcastが有効になっているか
# - Botにフォロワーが登録されているか
```

## 12. 次のステップ

機能実装完了後、以下を実施：

1. **ユニットテスト作成**
   - `services/`のテスト
   - `utils/`のテスト
   - モックを使用したAPI呼び出しのテスト

2. **統合テスト作成**
   - Lambda関数全体の動作テスト
   - エラーケースのテスト

3. **CI/CD構築**
   - GitHub Actionsワークフロー作成
   - 自動ビルド・テスト・デプロイ

## 13. 参考資料

- [OpenWeather API Documentation](https://openweathermap.org/current)
- [LINE Messaging API Reference](https://developers.line.biz/ja/reference/messaging-api/)
- [AWS SDK for JavaScript v3 - SSM Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/)
- [axios Documentation](https://axios-http.com/docs/intro)
