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
 * Weather API設定
 */
export const WEATHERAPI_CONFIG = {
  baseUrl: 'https://api.weatherapi.com/v1',
  endpoint: '/forecast.json',
  location: 'Kawasaki,Japan',
  days: 1,
  lang: 'ja',
} as const;

/**
 * 気象庁API設定
 */
export const JMA_CONFIG = {
  baseUrl: 'https://www.jma.go.jp/bosai/forecast/data',
  endpoint: '/forecast/140000.json', // 神奈川県
  areaCode: '140010', // 東部（川崎市を含む）
} as const;

/**
 * Parameter Store設定
 */
export const PARAMETER_STORE = {
  openWeatherApiKey: '/weather-bot/openweather-api-key',
  weatherApiKey: '/weather-bot/weatherapi-key',
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
 * 天気アイコンマッピング (OpenWeather用)
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

/**
 * Weather API 天気コードマッピング
 */
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

/**
 * Weather API 天気コードを日本語に変換
 */
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
