import axios from 'axios';
import {
  WEATHERAPI_CONFIG,
  JMA_CONFIG,
  WEATHERAPI_EMOJI,
  WEATHERAPI_CONDITION_JA,
} from '../config/constants';
import {
  WeatherData,
  WeatherAPIResponse,
  WeatherAPIData,
  JmaForecastResponse,
  JmaPrecipitationData,
} from '../types/weather';
import { Logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/retry';

/**
 * メイン関数: Weather API + 気象庁APIから天気データを取得
 */
export async function getWeather(apiKey: string): Promise<WeatherData> {
  Logger.info('Fetching weather data from Weather API and JMA API');

  try {
    // Weather APIと気象庁APIを並列で呼び出し
    const [weatherApiData, jmaPrecipitation] = await Promise.all([
      getWeatherFromWeatherAPI(apiKey),
      getPrecipitationFromJMA().catch((error) => {
        Logger.warn('Failed to fetch JMA precipitation, using 0%', { error });
        return { precipitation: 0 }; // デフォルト値
      }),
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
    Logger.error(
      'Failed to fetch weather data from hybrid APIs',
      error instanceof Error ? error : new Error(String(error))
    );
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
  const condition =
    WEATHERAPI_CONDITION_JA[conditionCode] || data.current.condition.text;

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
    throw new Error(
      `Precipitation data not found for area: ${JMA_CONFIG.areaCode}`
    );
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
