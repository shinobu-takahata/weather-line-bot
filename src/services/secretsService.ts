import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { PARAMETER_STORE } from '../config/constants';
import { Logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/retry';

const ssmClient = new SSMClient({ region: 'ap-northeast-1' });

/**
 * Parameter Storeから値を取得
 */
async function getParameter(name: string): Promise<string> {
  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: true, // SecureString復号化
  });

  const response = await ssmClient.send(command);

  if (!response.Parameter?.Value) {
    throw new Error(`Parameter ${name} not found`);
  }

  return response.Parameter.Value;
}

/**
 * OpenWeather API Keyを取得
 */
export async function getOpenWeatherApiKey(): Promise<string> {
  Logger.info('Fetching OpenWeather API Key from Parameter Store');

  return retryWithBackoff(
    () => getParameter(PARAMETER_STORE.openWeatherApiKey),
    'Get OpenWeather API Key'
  );
}

/**
 * Weather API Keyを取得
 */
export async function getWeatherApiKey(): Promise<string> {
  Logger.info('Fetching Weather API Key from Parameter Store');

  return retryWithBackoff(
    () => getParameter(PARAMETER_STORE.weatherApiKey),
    'Get Weather API Key'
  );
}

/**
 * LINE Channel Access Tokenを取得
 */
export async function getLineChannelAccessToken(): Promise<string> {
  Logger.info('Fetching LINE Channel Access Token from Parameter Store');

  return retryWithBackoff(
    () => getParameter(PARAMETER_STORE.lineChannelAccessToken),
    'Get LINE Channel Access Token'
  );
}
