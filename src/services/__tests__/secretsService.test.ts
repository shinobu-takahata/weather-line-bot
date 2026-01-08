import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import {
  getOpenWeatherApiKey,
  getWeatherApiKey,
  getLineChannelAccessToken,
} from '../secretsService';

const ssmMock = mockClient(SSMClient);

describe('secretsService', () => {
  beforeEach(() => {
    ssmMock.reset();
  });

  describe('getOpenWeatherApiKey', () => {
    it('should fetch OpenWeather API key from Parameter Store', async () => {
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {
          Value: 'test-api-key-12345',
        },
      });

      const apiKey = await getOpenWeatherApiKey();

      expect(apiKey).toBe('test-api-key-12345');
      expect(ssmMock.calls()).toHaveLength(1);
      expect(ssmMock.call(0).args[0].input).toEqual({
        Name: '/weather-bot/openweather-api-key',
        WithDecryption: true,
      });
    });

    it('should throw error if parameter not found', async () => {
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {},
      });

      await expect(getOpenWeatherApiKey()).rejects.toThrow(
        'Parameter /weather-bot/openweather-api-key not found'
      );
    });

    it('should throw error if Parameter is undefined', async () => {
      ssmMock.on(GetParameterCommand).resolves({});

      await expect(getOpenWeatherApiKey()).rejects.toThrow(
        'Parameter /weather-bot/openweather-api-key not found'
      );
    });

    it('should retry on failure', async () => {
      const error = new Error('Service unavailable');
      (error as any).response = { status: 500 };

      ssmMock
        .on(GetParameterCommand)
        .rejectsOnce(error)
        .resolves({
          Parameter: {
            Value: 'test-api-key-retry',
          },
        });

      const apiKey = await getOpenWeatherApiKey();

      expect(apiKey).toBe('test-api-key-retry');
      expect(ssmMock.calls()).toHaveLength(2);
    });
  });

  describe('getWeatherApiKey', () => {
    it('should fetch Weather API key from Parameter Store', async () => {
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {
          Value: 'test-weather-api-key-12345',
        },
      });

      const apiKey = await getWeatherApiKey();

      expect(apiKey).toBe('test-weather-api-key-12345');
      expect(ssmMock.calls()).toHaveLength(1);
      expect(ssmMock.call(0).args[0].input).toEqual({
        Name: '/weather-bot/weatherapi-key',
        WithDecryption: true,
      });
    });

    it('should throw error if parameter not found', async () => {
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {},
      });

      await expect(getWeatherApiKey()).rejects.toThrow(
        'Parameter /weather-bot/weatherapi-key not found'
      );
    });

    it('should throw error if Parameter is undefined', async () => {
      ssmMock.on(GetParameterCommand).resolves({});

      await expect(getWeatherApiKey()).rejects.toThrow(
        'Parameter /weather-bot/weatherapi-key not found'
      );
    });

    it('should retry on failure', async () => {
      const error = new Error('Service unavailable');
      (error as any).response = { status: 500 };

      ssmMock
        .on(GetParameterCommand)
        .rejectsOnce(error)
        .resolves({
          Parameter: {
            Value: 'test-weather-api-key-retry',
          },
        });

      const apiKey = await getWeatherApiKey();

      expect(apiKey).toBe('test-weather-api-key-retry');
      expect(ssmMock.calls()).toHaveLength(2);
    });
  });

  describe('getLineChannelAccessToken', () => {
    it('should fetch LINE Channel Access Token from Parameter Store', async () => {
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {
          Value: 'test-line-token-67890',
        },
      });

      const token = await getLineChannelAccessToken();

      expect(token).toBe('test-line-token-67890');
      expect(ssmMock.calls()).toHaveLength(1);
      expect(ssmMock.call(0).args[0].input).toEqual({
        Name: '/weather-bot/line-channel-access-token',
        WithDecryption: true,
      });
    });

    it('should throw error if parameter not found', async () => {
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {},
      });

      await expect(getLineChannelAccessToken()).rejects.toThrow(
        'Parameter /weather-bot/line-channel-access-token not found'
      );
    });

    it('should throw error if Parameter is undefined', async () => {
      ssmMock.on(GetParameterCommand).resolves({});

      await expect(getLineChannelAccessToken()).rejects.toThrow(
        'Parameter /weather-bot/line-channel-access-token not found'
      );
    });

    it('should retry on failure', async () => {
      const error = new Error('Service unavailable');
      (error as any).response = { status: 500 };

      ssmMock
        .on(GetParameterCommand)
        .rejectsOnce(error)
        .resolves({
          Parameter: {
            Value: 'test-line-token-retry',
          },
        });

      const token = await getLineChannelAccessToken();

      expect(token).toBe('test-line-token-retry');
      expect(ssmMock.calls()).toHaveLength(2);
    });
  });
});
