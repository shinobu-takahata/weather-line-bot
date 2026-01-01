import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../index';
import * as secretsService from '../services/secretsService';
import * as weatherService from '../services/weatherService';
import * as lineService from '../services/lineService';
import { WeatherData } from '../types/weather';

vi.mock('../services/secretsService');
vi.mock('../services/weatherService');
vi.mock('../services/lineService');

describe('Lambda Handler', () => {
  const mockWeatherData: WeatherData = {
    temperature: {
      current: 15,
      min: 10,
      max: 20,
    },
    description: '晴れ',
    precipitation: 30,
    emoji: '☀️',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should execute successfully with all services working', async () => {
      vi.spyOn(secretsService, 'getOpenWeatherApiKey').mockResolvedValue(
        'test-api-key'
      );
      vi.spyOn(secretsService, 'getLineChannelAccessToken').mockResolvedValue(
        'test-line-token'
      );
      vi.spyOn(weatherService, 'getWeather').mockResolvedValue(
        mockWeatherData
      );
      vi.spyOn(lineService, 'sendBroadcastMessage').mockResolvedValue();

      await expect(handler({} as any)).resolves.toBeUndefined();

      expect(secretsService.getOpenWeatherApiKey).toHaveBeenCalledTimes(1);
      expect(secretsService.getLineChannelAccessToken).toHaveBeenCalledTimes(
        1
      );
      expect(weatherService.getWeather).toHaveBeenCalledWith('test-api-key');
      expect(lineService.sendBroadcastMessage).toHaveBeenCalledTimes(1);
    });

    it('should call services in correct order', async () => {
      const callOrder: string[] = [];

      vi.spyOn(secretsService, 'getOpenWeatherApiKey').mockImplementation(
        async () => {
          callOrder.push('getOpenWeatherApiKey');
          return 'test-api-key';
        }
      );
      vi.spyOn(secretsService, 'getLineChannelAccessToken').mockImplementation(
        async () => {
          callOrder.push('getLineChannelAccessToken');
          return 'test-line-token';
        }
      );
      vi.spyOn(weatherService, 'getWeather').mockImplementation(async () => {
        callOrder.push('getWeather');
        return mockWeatherData;
      });
      vi.spyOn(lineService, 'sendBroadcastMessage').mockImplementation(
        async () => {
          callOrder.push('sendBroadcastMessage');
        }
      );

      await handler({} as any);

      // Parameter Store取得は並列、その後天気取得、最後にLINE送信
      expect(callOrder).toContain('getOpenWeatherApiKey');
      expect(callOrder).toContain('getLineChannelAccessToken');
      expect(callOrder).toContain('getWeather');
      expect(callOrder).toContain('sendBroadcastMessage');

      // 天気取得はParameter Store取得の後
      const weatherIndex = callOrder.indexOf('getWeather');
      const apiKeyIndex = callOrder.indexOf('getOpenWeatherApiKey');
      expect(weatherIndex).toBeGreaterThan(apiKeyIndex);

      // LINE送信は全ての後
      const lineIndex = callOrder.indexOf('sendBroadcastMessage');
      expect(lineIndex).toBe(callOrder.length - 1);
    });

    it('should pass correct weather message to LINE service', async () => {
      vi.spyOn(secretsService, 'getOpenWeatherApiKey').mockResolvedValue(
        'test-api-key'
      );
      vi.spyOn(secretsService, 'getLineChannelAccessToken').mockResolvedValue(
        'test-line-token'
      );
      vi.spyOn(weatherService, 'getWeather').mockResolvedValue(
        mockWeatherData
      );
      const sendBroadcastSpy = vi
        .spyOn(lineService, 'sendBroadcastMessage')
        .mockResolvedValue();

      await handler({} as any);

      expect(sendBroadcastSpy).toHaveBeenCalledWith(
        'test-line-token',
        expect.stringContaining('☀️ 川崎市の天気')
      );
      expect(sendBroadcastSpy).toHaveBeenCalledWith(
        'test-line-token',
        expect.stringContaining('今日の天気: 晴れ')
      );
      expect(sendBroadcastSpy).toHaveBeenCalledWith(
        'test-line-token',
        expect.stringContaining('🌡️ 気温（9時〜23時）')
      );
    });
  });

  describe('Error Handling - Parameter Store', () => {
    it('should throw error when OpenWeather API key fetch fails', async () => {
      vi.spyOn(secretsService, 'getOpenWeatherApiKey').mockRejectedValue(
        new Error('Parameter not found: openweather-api-key')
      );
      vi.spyOn(secretsService, 'getLineChannelAccessToken').mockResolvedValue(
        'test-line-token'
      );

      await expect(handler({} as any)).rejects.toThrow(
        'Parameter not found: openweather-api-key'
      );

      expect(secretsService.getOpenWeatherApiKey).toHaveBeenCalled();
      expect(weatherService.getWeather).not.toHaveBeenCalled();
      expect(lineService.sendBroadcastMessage).not.toHaveBeenCalled();
    });

    it('should throw error when LINE token fetch fails', async () => {
      vi.spyOn(secretsService, 'getOpenWeatherApiKey').mockResolvedValue(
        'test-api-key'
      );
      vi.spyOn(secretsService, 'getLineChannelAccessToken').mockRejectedValue(
        new Error('Parameter not found: line-channel-access-token')
      );

      await expect(handler({} as any)).rejects.toThrow(
        'Parameter not found: line-channel-access-token'
      );

      expect(secretsService.getLineChannelAccessToken).toHaveBeenCalled();
      expect(weatherService.getWeather).not.toHaveBeenCalled();
      expect(lineService.sendBroadcastMessage).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling - Weather Service', () => {
    it('should throw error when weather API fails', async () => {
      vi.spyOn(secretsService, 'getOpenWeatherApiKey').mockResolvedValue(
        'test-api-key'
      );
      vi.spyOn(secretsService, 'getLineChannelAccessToken').mockResolvedValue(
        'test-line-token'
      );
      vi.spyOn(weatherService, 'getWeather').mockRejectedValue(
        new Error('OpenWeather API error')
      );

      await expect(handler({} as any)).rejects.toThrow(
        'OpenWeather API error'
      );

      expect(weatherService.getWeather).toHaveBeenCalledWith('test-api-key');
      expect(lineService.sendBroadcastMessage).not.toHaveBeenCalled();
    });

    it('should throw error on network timeout', async () => {
      vi.spyOn(secretsService, 'getOpenWeatherApiKey').mockResolvedValue(
        'test-api-key'
      );
      vi.spyOn(secretsService, 'getLineChannelAccessToken').mockResolvedValue(
        'test-line-token'
      );
      vi.spyOn(weatherService, 'getWeather').mockRejectedValue(
        new Error('ETIMEDOUT')
      );

      await expect(handler({} as any)).rejects.toThrow('ETIMEDOUT');

      expect(weatherService.getWeather).toHaveBeenCalled();
      expect(lineService.sendBroadcastMessage).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling - LINE Service', () => {
    it('should throw error when LINE broadcast fails', async () => {
      vi.spyOn(secretsService, 'getOpenWeatherApiKey').mockResolvedValue(
        'test-api-key'
      );
      vi.spyOn(secretsService, 'getLineChannelAccessToken').mockResolvedValue(
        'test-line-token'
      );
      vi.spyOn(weatherService, 'getWeather').mockResolvedValue(
        mockWeatherData
      );
      vi.spyOn(lineService, 'sendBroadcastMessage').mockRejectedValue(
        new Error('LINE API error')
      );

      await expect(handler({} as any)).rejects.toThrow('LINE API error');

      expect(lineService.sendBroadcastMessage).toHaveBeenCalled();
    });

    it('should throw error on LINE authentication failure', async () => {
      vi.spyOn(secretsService, 'getOpenWeatherApiKey').mockResolvedValue(
        'test-api-key'
      );
      vi.spyOn(secretsService, 'getLineChannelAccessToken').mockResolvedValue(
        'invalid-token'
      );
      vi.spyOn(weatherService, 'getWeather').mockResolvedValue(
        mockWeatherData
      );
      vi.spyOn(lineService, 'sendBroadcastMessage').mockRejectedValue({
        response: { status: 401, data: 'Unauthorized' },
      });

      await expect(handler({} as any)).rejects.toEqual({
        response: { status: 401, data: 'Unauthorized' },
      });
    });
  });

  describe('Logging', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should log function invocation', async () => {
      vi.spyOn(secretsService, 'getOpenWeatherApiKey').mockResolvedValue(
        'test-api-key'
      );
      vi.spyOn(secretsService, 'getLineChannelAccessToken').mockResolvedValue(
        'test-line-token'
      );
      vi.spyOn(weatherService, 'getWeather').mockResolvedValue(
        mockWeatherData
      );
      vi.spyOn(lineService, 'sendBroadcastMessage').mockResolvedValue();

      await handler({} as any);

      const logs = consoleLogSpy.mock.calls.map((call) =>
        JSON.parse(call[0] as string)
      );

      expect(logs.some((log) => log.message === 'Lambda function invoked')).toBe(
        true
      );
    });

    it('should log successful completion', async () => {
      vi.spyOn(secretsService, 'getOpenWeatherApiKey').mockResolvedValue(
        'test-api-key'
      );
      vi.spyOn(secretsService, 'getLineChannelAccessToken').mockResolvedValue(
        'test-line-token'
      );
      vi.spyOn(weatherService, 'getWeather').mockResolvedValue(
        mockWeatherData
      );
      vi.spyOn(lineService, 'sendBroadcastMessage').mockResolvedValue();

      await handler({} as any);

      const logs = consoleLogSpy.mock.calls.map((call) =>
        JSON.parse(call[0] as string)
      );

      expect(
        logs.some(
          (log) => log.message === 'Weather notification completed successfully'
        )
      ).toBe(true);
    });

    it('should log errors with stack trace', async () => {
      const testError = new Error('Test error');
      vi.spyOn(secretsService, 'getOpenWeatherApiKey').mockRejectedValue(
        testError
      );

      await expect(handler({} as any)).rejects.toThrow('Test error');

      const logs = consoleLogSpy.mock.calls.map((call) =>
        JSON.parse(call[0] as string)
      );

      const errorLog = logs.find(
        (log) => log.message === 'Weather notification failed'
      );
      expect(errorLog).toBeDefined();
      expect(errorLog?.level).toBe('ERROR');
      expect(errorLog?.error).toBe('Test error');
      expect(errorLog?.stack).toBeDefined();
    });
  });
});
