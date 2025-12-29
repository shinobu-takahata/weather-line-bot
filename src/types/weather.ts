/**
 * OpenWeather APIレスポンス型
 */
export interface OpenWeatherResponse {
  main: {
    temp: number; // 現在の気温（ケルビンまたはメートル法の場合は摂氏）
    temp_min: number; // 最低気温
    temp_max: number; // 最高気温
  };
  weather: Array<{
    main: string; // 天気概況（英語）
    description: string; // 天気詳細（日本語 if lang=ja）
  }>;
  pop?: number; // 降水確率（0.0-1.0）※無料プランでは含まれない
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
