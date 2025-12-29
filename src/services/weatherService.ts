import axios from 'axios';
import {
  KAWASAKI_LOCATION,
  OPENWEATHER_CONFIG,
  WEATHER_EMOJI,
} from '../config/constants';
import { OpenWeatherResponse, WeatherData } from '../types/weather';
import { Logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/retry';

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
