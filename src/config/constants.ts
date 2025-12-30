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
  endpoint: '/forecast', // 5 day / 3 hour forecast
  units: 'metric', // 摂氏
  lang: 'ja', // 日本語
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
