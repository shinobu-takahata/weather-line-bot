import { EventBridgeEvent } from 'aws-lambda';
import {
  getWeatherApiKey,
  getLineChannelAccessToken,
} from './services/secretsService';
import { getWeather } from './services/weatherService';
import { sendBroadcastMessage } from './services/lineService';
import { formatWeatherMessage } from './utils/formatter';
import { Logger } from './utils/logger';

/**
 * Lambda関数のハンドラー
 * EventBridgeからのスケジュールイベントを受け取る
 */
export const handler = async (
  event: EventBridgeEvent<'Scheduled Event', never>
): Promise<void> => {
  Logger.info('Lambda function invoked', { event });

  try {
    // 1. Parameter Storeから設定値を取得
    const [apiKey, accessToken] = await Promise.all([
      getWeatherApiKey(),
      getLineChannelAccessToken(),
    ]);

    // 2. Weather API + 気象庁APIから天気データを取得
    const weatherData = await getWeather(apiKey);

    // 3. メッセージをフォーマット
    const message = formatWeatherMessage(weatherData);

    // 4. LINE Broadcast APIでメッセージを送信
    await sendBroadcastMessage(accessToken, message);

    Logger.info('Weather notification completed successfully');
  } catch (error) {
    Logger.error('Weather notification failed', error as Error);
    throw error;
  }
};
