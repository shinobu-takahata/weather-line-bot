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
