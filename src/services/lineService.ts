import axios from 'axios';
import { LINE_CONFIG } from '../config/constants';
import { LineBroadcastRequest } from '../types/line';
import { Logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/retry';

/**
 * LINE Broadcast APIでメッセージを送信
 */
export async function sendBroadcastMessage(
  accessToken: string,
  message: string
): Promise<void> {
  Logger.info('Sending broadcast message via LINE Messaging API');

  const url = `${LINE_CONFIG.baseUrl}${LINE_CONFIG.endpoint}`;

  const requestBody: LineBroadcastRequest = {
    messages: [
      {
        type: 'text',
        text: message,
      },
    ],
  };

  await retryWithBackoff(async () => {
    return axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }, 'Send broadcast message');

  Logger.info('Broadcast message sent successfully');
}
