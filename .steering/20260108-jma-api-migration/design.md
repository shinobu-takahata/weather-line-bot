# Phase 5: Weather API + 気象庁API ハイブリッド移行 - 設計書

## 1. アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────┐
│ Lambda Function: WeatherNotificationFunction            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ index.ts                                          │  │
│  │  1. Parameter Storeから Weather API Key 取得     │  │
│  │  2. getWeather() 呼び出し                         │  │
│  │  3. formatWeatherMessage() でメッセージ生成       │  │
│  │  4. sendBroadcastMessage() でLINE送信            │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ weatherService.ts                                 │  │
│  │                                                    │  │
│  │  getWeather(apiKey: string): Promise<WeatherData> │  │
│  │    ├─ getWeatherFromWeatherAPI() [並列実行]      │  │
│  │    ├─ getPrecipitationFromJMA() [並列実行]       │  │
│  │    └─ データ統合                                 │  │
│  └──────────────────────────────────────────────────┘  │
│         ↓                        ↓                       │
│  ┌──────────────┐        ┌───────────────────┐         │
│  │ Weather API  │        │ 気象庁API         │         │
│  │ (気温・天気) │        │ (降水確率)        │         │
│  └──────────────┘        └───────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

## 2. 型定義

### 2.1 Weather API型定義

`src/types/weather.ts`に追加:

```typescript
// Weather API レスポンス型
export interface WeatherAPIResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    localtime: string;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      code: number;
    };
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        daily_chance_of_rain: number;
        condition: {
          text: string;
          code: number;
        };
      };
      hour: Array<{
        time: string;
        temp_c: number;
        chance_of_rain: number;
        condition: {
          text: string;
          code: number;
        };
      }>;
    }>;
  };
}

// Weather API から抽出したデータ
export interface WeatherAPIData {
  currentTemp: number;
  maxTemp: number;
  minTemp: number;
  condition: string;
  conditionCode: number;
  emoji: string;
}
```

### 2.2 気象庁API型定義

```typescript
// 気象庁API レスポンス型
export interface JmaForecastResponse {
  publishingOffice: string;
  reportDatetime: string;
  timeSeries: JmaTimeSeries[];
}

export interface JmaTimeSeries {
  timeDefines: string[];
  areas: JmaArea[];
}

export interface JmaArea {
  area: {
    name: string;
    code: string;
  };
  weathers?: string[];
  weatherCodes?: string[];
  pops?: string[];
}

// 気象庁APIから抽出したデータ
export interface JmaPrecipitationData {
  precipitation: number; // 09:00-23:00の最大降水確率
}
```

### 2.3 既存のWeatherData型（変更なし）

```typescript
export interface WeatherData {
  temperature: {
    current: number;
    min: number;
    max: number;
  };
  description: string;
  precipitation: number;
  emoji: string;
}
```

## 3. 定数設定

`src/config/constants.ts`を更新:

```typescript
// OpenWeather設定（フォールバック用に保持）
export const OPENWEATHER_CONFIG = {
  baseUrl: 'https://api.openweathermap.org/data/2.5',
  endpoint: '/forecast',
  units: 'metric',
  lang: 'ja',
} as const;

// Weather API設定（新規追加）
export const WEATHERAPI_CONFIG = {
  baseUrl: 'https://api.weatherapi.com/v1',
  endpoint: '/forecast.json',
  location: 'Kawasaki,Japan',
  days: 1,
  lang: 'ja',
} as const;

// 気象庁API設定（新規追加）
export const JMA_CONFIG = {
  baseUrl: 'https://www.jma.go.jp/bosai/forecast/data',
  endpoint: '/forecast/140000.json', // 神奈川県
  areaCode: '140010', // 東部（川崎市を含む）
} as const;

// Parameter Store設定（更新）
export const PARAMETER_STORE = {
  openWeatherApiKey: '/weather-bot/openweather-api-key',
  weatherApiKey: '/weather-bot/weatherapi-key', // 新規追加
  lineChannelAccessToken: '/weather-bot/line-channel-access-token',
} as const;

// Weather API 天気コードマッピング（新規追加）
export const WEATHERAPI_EMOJI: Record<number, string> = {
  1000: '☀️',   // Sunny
  1003: '⛅',   // Partly cloudy
  1006: '☁️',   // Cloudy
  1009: '☁️',   // Overcast
  1030: '🌫️',  // Mist
  1063: '🌦️',  // Patchy rain possible
  1066: '🌨️',  // Patchy snow possible
  1069: '🌨️',  // Patchy sleet possible
  1072: '🌨️',  // Patchy freezing drizzle possible
  1087: '⛈️',  // Thundery outbreaks possible
  1114: '❄️',   // Blowing snow
  1117: '❄️',   // Blizzard
  1135: '🌫️',  // Fog
  1147: '🌫️',  // Freezing fog
  1150: '🌦️',  // Patchy light drizzle
  1153: '🌦️',  // Light drizzle
  1168: '🌧️',  // Freezing drizzle
  1171: '🌧️',  // Heavy freezing drizzle
  1180: '🌦️',  // Patchy light rain
  1183: '🌧️',  // Light rain
  1186: '🌧️',  // Moderate rain at times
  1189: '🌧️',  // Moderate rain
  1192: '🌧️',  // Heavy rain at times
  1195: '🌧️',  // Heavy rain
  1198: '🌧️',  // Light freezing rain
  1201: '🌧️',  // Moderate or heavy freezing rain
  1204: '🌨️',  // Light sleet
  1207: '🌨️',  // Moderate or heavy sleet
  1210: '🌨️',  // Patchy light snow
  1213: '❄️',   // Light snow
  1216: '❄️',   // Patchy moderate snow
  1219: '❄️',   // Moderate snow
  1222: '❄️',   // Patchy heavy snow
  1225: '❄️',   // Heavy snow
  1237: '❄️',   // Ice pellets
  1240: '🌦️',  // Light rain shower
  1243: '🌧️',  // Moderate or heavy rain shower
  1246: '🌧️',  // Torrential rain shower
  1249: '🌨️',  // Light sleet showers
  1252: '🌨️',  // Moderate or heavy sleet showers
  1255: '🌨️',  // Light snow showers
  1258: '❄️',   // Moderate or heavy snow showers
  1261: '❄️',   // Light showers of ice pellets
  1264: '❄️',   // Moderate or heavy showers of ice pellets
  1273: '⛈️',  // Patchy light rain with thunder
  1276: '⛈️',  // Moderate or heavy rain with thunder
  1279: '⛈️',  // Patchy light snow with thunder
  1282: '⛈️',  // Moderate or heavy snow with thunder
} as const;

// Weather API 天気コードを日本語に変換
export const WEATHERAPI_CONDITION_JA: Record<number, string> = {
  1000: '晴れ',
  1003: '晴れ時々曇り',
  1006: '曇り',
  1009: '曇り',
  1030: '霧',
  1063: '雨の可能性',
  1066: '雪の可能性',
  1069: 'みぞれの可能性',
  1072: '凍雨の可能性',
  1087: '雷雨の可能性',
  1114: '吹雪',
  1117: '猛吹雪',
  1135: '霧',
  1147: '凍霧',
  1150: '小雨',
  1153: '小雨',
  1168: '凍雨',
  1171: '強い凍雨',
  1180: '小雨',
  1183: '小雨',
  1186: '雨',
  1189: '雨',
  1192: '強い雨',
  1195: '強い雨',
  1198: '凍雨',
  1201: '強い凍雨',
  1204: 'みぞれ',
  1207: '強いみぞれ',
  1210: '小雪',
  1213: '小雪',
  1216: '雪',
  1219: '雪',
  1222: '大雪',
  1225: '大雪',
  1237: '霰',
  1240: 'にわか雨',
  1243: '強いにわか雨',
  1246: '豪雨',
  1249: 'みぞれ',
  1252: '強いみぞれ',
  1255: 'にわか雪',
  1258: '強いにわか雪',
  1261: '霰',
  1264: '強い霰',
  1273: '雷雨',
  1276: '強い雷雨',
  1279: '雷雪',
  1282: '強い雷雪',
} as const;
```

## 4. weatherService.ts 実装

### 4.1 全体構造

```typescript
import axios from 'axios';
import {
  WEATHERAPI_CONFIG,
  JMA_CONFIG,
  WEATHERAPI_EMOJI,
  WEATHERAPI_CONDITION_JA,
} from '../config/constants';
import {
  WeatherAPIResponse,
  JmaForecastResponse,
  WeatherData,
  WeatherAPIData,
  JmaPrecipitationData,
} from '../types/weather';
import { Logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/retry';

/**
 * メイン関数: 天気データを取得
 */
export async function getWeather(apiKey: string): Promise<WeatherData> {
  Logger.info('Fetching weather data from Weather API and JMA API');

  try {
    // Weather APIと気象庁APIを並列で呼び出し
    const [weatherApiData, jmaPrecipitation] = await Promise.all([
      getWeatherFromWeatherAPI(apiKey),
      getPrecipitationFromJMA(),
    ]);

    // データ統合
    const weatherData: WeatherData = {
      temperature: {
        current: weatherApiData.currentTemp,
        min: weatherApiData.minTemp,
        max: weatherApiData.maxTemp,
      },
      description: weatherApiData.condition,
      precipitation: jmaPrecipitation.precipitation,
      emoji: weatherApiData.emoji,
    };

    Logger.info('Weather data fetched successfully', { weatherData });
    return weatherData;
  } catch (error) {
    Logger.error('Failed to fetch weather data', { error });
    throw error;
  }
}

/**
 * Weather APIから気温・天気データを取得
 */
async function getWeatherFromWeatherAPI(
  apiKey: string
): Promise<WeatherAPIData> {
  Logger.info('Fetching weather from Weather API');

  const url = `${WEATHERAPI_CONFIG.baseUrl}${WEATHERAPI_CONFIG.endpoint}`;

  const response = await retryWithBackoff(async () => {
    return axios.get<WeatherAPIResponse>(url, {
      params: {
        key: apiKey,
        q: WEATHERAPI_CONFIG.location,
        days: WEATHERAPI_CONFIG.days,
        lang: WEATHERAPI_CONFIG.lang,
        aqi: 'no',
        alerts: 'no',
      },
    });
  }, 'Fetch weather from Weather API');

  const data = response.data;

  // 現在の気温
  const currentTemp = data.current.temp_c;

  // 今日の予報
  const today = data.forecast.forecastday[0];

  // 09:00~23:00の時間帯のデータをフィルタリング
  const todayHours = today.hour.filter((hour) => {
    const hourTime = new Date(hour.time).getHours();
    return hourTime >= 9 && hourTime <= 23;
  });

  Logger.info('Filtered today hours (09:00-23:00)', {
    count: todayHours.length,
    times: todayHours.map((h) => h.time),
  });

  // 09:00~23:00の最高・最低気温
  const temperatures = todayHours.map((h) => h.temp_c);
  const maxTemp = Math.max(...temperatures);
  const minTemp = Math.min(...temperatures);

  // 天気コード
  const conditionCode = data.current.condition.code;

  // 絵文字マッピング
  const emoji = WEATHERAPI_EMOJI[conditionCode] || '🌤️';

  // 日本語天気
  const condition = WEATHERAPI_CONDITION_JA[conditionCode] || data.current.condition.text;

  const weatherApiData: WeatherAPIData = {
    currentTemp: Math.round(currentTemp),
    maxTemp: Math.round(maxTemp),
    minTemp: Math.round(minTemp),
    condition,
    conditionCode,
    emoji,
  };

  Logger.info('Weather API data retrieved', { weatherApiData });

  return weatherApiData;
}

/**
 * 気象庁APIから降水確率を取得
 */
async function getPrecipitationFromJMA(): Promise<JmaPrecipitationData> {
  Logger.info('Fetching precipitation from JMA API');

  const url = `${JMA_CONFIG.baseUrl}${JMA_CONFIG.endpoint}`;

  const response = await retryWithBackoff(async () => {
    return axios.get<JmaForecastResponse[]>(url);
  }, 'Fetch precipitation from JMA API');

  const data = response.data;

  // 短期予報（今日・明日）
  const shortTerm = data[0];

  // 降水確率データ（timeSeries[1]）
  const popTimeSeries = shortTerm.timeSeries[1];

  // 神奈川県東部のデータを取得
  const popArea = popTimeSeries.areas.find(
    (a) => a.area.code === JMA_CONFIG.areaCode
  );

  if (!popArea || !popArea.pops) {
    throw new Error(`Precipitation data not found for area: ${JMA_CONFIG.areaCode}`);
  }

  // pops[1]: 06-12時, pops[2]: 12-18時, pops[3]: 18-24時
  const relevantPops = [
    parseInt(popArea.pops[1] || '0'),
    parseInt(popArea.pops[2] || '0'),
    parseInt(popArea.pops[3] || '0'),
  ];

  const maxPrecipitation = Math.max(...relevantPops);

  Logger.info('JMA precipitation data retrieved', {
    pops: relevantPops,
    max: maxPrecipitation,
  });

  return {
    precipitation: maxPrecipitation,
  };
}
```

## 5. index.ts の変更

```typescript
// 変更前
const openWeatherApiKey = await getParameter(
  PARAMETER_STORE.openWeatherApiKey
);
const weatherData = await getWeather(openWeatherApiKey);

// 変更後
const weatherApiKey = await getParameter(
  PARAMETER_STORE.weatherApiKey
);
const weatherData = await getWeather(weatherApiKey);
```

## 6. エラーハンドリングの実装

### 6.1 フォールバック関数の追加

`src/services/weatherService.ts`に追加:

```typescript
/**
 * OpenWeather APIへのフォールバック
 */
async function fallbackToOpenWeather(apiKey: string): Promise<WeatherData> {
  Logger.warn('Falling back to OpenWeather API');

  // 既存のOpenWeather実装を呼び出し
  // （別ファイルに分離するか、ここに実装）

  // 省略: 既存のOpenWeather実装
}

/**
 * エラーハンドリング付きgetWeather
 */
export async function getWeather(apiKey: string): Promise<WeatherData> {
  Logger.info('Fetching weather data from Weather API and JMA API');

  try {
    const [weatherApiData, jmaPrecipitation] = await Promise.all([
      getWeatherFromWeatherAPI(apiKey),
      getPrecipitationFromJMA().catch((error) => {
        Logger.warn('Failed to fetch JMA precipitation, using 0%', { error });
        return { precipitation: 0 }; // デフォルト値
      }),
    ]);

    const weatherData: WeatherData = {
      temperature: {
        current: weatherApiData.currentTemp,
        min: weatherApiData.minTemp,
        max: weatherApiData.maxTemp,
      },
      description: weatherApiData.condition,
      precipitation: jmaPrecipitation.precipitation,
      emoji: weatherApiData.emoji,
    };

    Logger.info('Weather data fetched successfully', { weatherData });
    return weatherData;
  } catch (error) {
    Logger.error('Failed to fetch weather data, falling back to OpenWeather', { error });

    // OpenWeather APIにフォールバック（要実装）
    throw error; // 実装時にfallbackToOpenWeather()を呼び出す
  }
}
```

## 7. テスト設計

### 7.1 ユニットテスト

`tests/unit/weatherService.test.ts`:

```typescript
describe('getWeather (Hybrid API)', () => {
  it('should fetch weather from Weather API and precipitation from JMA', async () => {
    // モック設定
    const weatherApiMock = {...};
    const jmaMock = {...};

    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: weatherApiMock }) // Weather API
      .mockResolvedValueOnce({ data: jmaMock });       // JMA API

    const result = await getWeather('test-api-key');

    expect(result).toEqual({
      temperature: {
        current: 8,
        min: 5,
        max: 10,
      },
      description: '晴れ',
      precipitation: 10,
      emoji: '☀️',
    });
  });

  it('should use default precipitation if JMA fails', async () => {
    // Weather API成功、JMA API失敗のテスト
  });

  it('should throw error if Weather API fails', async () => {
    // Weather API失敗のテスト
  });
});
```

## 8. デプロイ手順

### 8.1 Parameter Store設定

```bash
# Weather API Keyを追加
aws ssm put-parameter \
  --name "/weather-bot/weatherapi-key" \
  --value "YOUR_WEATHER_API_KEY" \
  --type "SecureString" \
  --region ap-northeast-1 \
  --profile takahata
```

### 8.2 既存パラメータの確認

```bash
# 既存のパラメータを確認
aws ssm get-parameter \
  --name "/weather-bot/openweather-api-key" \
  --with-decryption \
  --region ap-northeast-1 \
  --profile takahata
```

## 9. 変更ファイルまとめ

| ファイル | 変更内容 |
|---------|---------|
| `src/types/weather.ts` | Weather API、JMA API型定義追加 |
| `src/config/constants.ts` | WEATHERAPI_CONFIG、JMA_CONFIG追加 |
| `src/services/weatherService.ts` | ハイブリッドAPI実装 |
| `src/index.ts` | Parameter Store取得処理変更 |
| `tests/unit/weatherService.test.ts` | テスト更新 |
| `tests/integration/weather.test.ts` | 統合テスト更新 |

## 10. リリース計画

1. Parameter Storeに Weather API Key 追加
2. コード変更・テスト実行
3. GitHub へpush
4. CI/CDパイプライン実行
5. Lambda 動作確認
6. 本番運用開始
