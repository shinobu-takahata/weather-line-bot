/**
 * OpenWeather Forecast API - 3時間ごとの予報データ
 */
export interface ForecastItem {
  dt: number; // 予報時刻（Unix timestamp）
  main: {
    temp: number; // 気温（摂氏）
    temp_min: number; // 最低気温
    temp_max: number; // 最高気温
  };
  weather: Array<{
    main: string; // 天気概況（英語）
    description: string; // 天気詳細（日本語 if lang=ja）
  }>;
  pop: number; // 降水確率（0.0-1.0）
  dt_txt: string; // 予報時刻（テキスト形式）
}

/**
 * OpenWeather Forecast APIレスポンス型
 */
export interface OpenWeatherForecastResponse {
  list: ForecastItem[]; // 予報データリスト（3時間ごと、40件=5日分）
}

/**
 * 天気データ（加工済み）
 */
export interface WeatherData {
  temperature: {
    current: number; // 現在の気温（℃）
    min: number; // 最低気温（℃）
    max: number; // 最高気温（℃）
  };
  description: string; // 天気概況（日本語）
  precipitation: number; // 降水確率（%）
  emoji: string; // 天気絵文字
}
