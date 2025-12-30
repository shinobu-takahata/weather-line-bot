import axios from 'axios';
import {
  KAWASAKI_LOCATION,
  OPENWEATHER_CONFIG,
  WEATHER_EMOJI,
} from '../config/constants';
import {
  OpenWeatherForecastResponse,
  WeatherData,
} from '../types/weather';
import { Logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/retry';

/**
 * 今日の09:00~23:00の時間帯かどうか判定
 */
function isTodayBetween9And23(timestamp: number): boolean {
  const date = new Date(timestamp * 1000);
  const today = new Date();

  // 日付が今日かチェック
  if (
    date.getFullYear() !== today.getFullYear() ||
    date.getMonth() !== today.getMonth() ||
    date.getDate() !== today.getDate()
  ) {
    return false;
  }

  // 時刻が09:00~23:00の範囲かチェック
  const hour = date.getHours();
  return hour >= 9 && hour <= 23;
}

/**
 * OpenWeather APIから天気データを取得
 */
export async function getWeather(apiKey: string): Promise<WeatherData> {
  Logger.info('Fetching weather data from OpenWeather API', {
    location: KAWASAKI_LOCATION,
  });

  const url = `${OPENWEATHER_CONFIG.baseUrl}${OPENWEATHER_CONFIG.endpoint}`;

  const response = await retryWithBackoff(async () => {
    return axios.get<OpenWeatherForecastResponse>(url, {
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

  // 今日の09:00~23:00の時間帯のデータをフィルタリング
  const todayForecasts = data.list.filter((item) =>
    isTodayBetween9And23(item.dt)
  );

  Logger.info('Filtered today forecasts (09:00-23:00)', {
    count: todayForecasts.length,
    times: todayForecasts.map((f) => f.dt_txt),
  });

  // データが取得できない場合は最初のデータを使用
  if (todayForecasts.length === 0) {
    Logger.warn('No forecast data for today 09:00-23:00, using first item');
    todayForecasts.push(data.list[0]);
  }

  // 09:00~23:00の時間帯の最高・最低気温を計算
  const temperatures = todayForecasts.map((f) => f.main.temp);
  const maxTemp = Math.max(...temperatures);
  const minTemp = Math.min(...temperatures);

  // 現在に最も近い予報の気温を「現在の気温」とする
  const currentTemp = todayForecasts[0].main.temp;

  // 降水確率の最大値を取得
  const precipitations = todayForecasts.map((f) => f.pop);
  const maxPrecipitation = Math.max(...precipitations);

  // 天気概況は現在に最も近い予報のものを使用
  const weatherMain = todayForecasts[0]?.weather[0]?.main || 'Unknown';
  const weatherDescription =
    todayForecasts[0]?.weather[0]?.description || '不明';

  const weatherData: WeatherData = {
    temperature: {
      current: Math.round(currentTemp),
      min: Math.round(minTemp),
      max: Math.round(maxTemp),
    },
    description: weatherDescription,
    precipitation: Math.round(maxPrecipitation * 100),
    emoji: WEATHER_EMOJI[weatherMain] || '🌤️',
  };

  Logger.info('Weather data fetched successfully', { weatherData });

  return weatherData;
}
