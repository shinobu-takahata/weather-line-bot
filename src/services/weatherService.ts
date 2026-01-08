import axios from 'axios';
import {
  KAWASAKI_LOCATION,
  OPENWEATHER_CONFIG,
  WEATHER_EMOJI,
  WEATHERAPI_CONFIG,
  JMA_CONFIG,
  WEATHERAPI_EMOJI,
  WEATHERAPI_CONDITION_JA,
} from '../config/constants';
import {
  OpenWeatherForecastResponse,
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

/**
 * OpenWeather APIから天気データを取得（フォールバック用に保持）
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
 * OpenWeather APIから天気データを取得（フォールバック用）
 */
export async function getWeatherFromOpenWeather(
  apiKey: string
): Promise<WeatherData> {
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
