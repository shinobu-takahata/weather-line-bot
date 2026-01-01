import { describe, it, expect } from 'vitest';
import { formatWeatherMessage } from '../formatter';
import { WeatherData } from '../../types/weather';

describe('formatWeatherMessage', () => {
  it('should format weather data correctly', () => {
    const weatherData: WeatherData = {
      temperature: {
        current: 15,
        min: 10,
        max: 20,
      },
      description: '晴れ',
      precipitation: 30,
      emoji: '☀️',
    };

    const message = formatWeatherMessage(weatherData);

    expect(message).toContain('☀️ 川崎市の天気');
    expect(message).toContain('今日の天気: 晴れ');
    expect(message).toContain('🌡️ 気温（9時〜23時）');
    expect(message).toContain('・現在: 15℃');
    expect(message).toContain('・最低: 10℃');
    expect(message).toContain('・最高: 20℃');
    expect(message).toContain('☔ 降水確率: 30%');
    expect(message).toContain('良い一日をお過ごしください！');
  });

  it('should handle rainy weather with cloud emoji', () => {
    const weatherData: WeatherData = {
      temperature: {
        current: 12,
        min: 8,
        max: 15,
      },
      description: '雨',
      precipitation: 80,
      emoji: '🌧️',
    };

    const message = formatWeatherMessage(weatherData);

    expect(message).toContain('🌧️ 川崎市の天気');
    expect(message).toContain('今日の天気: 雨');
    expect(message).toContain('☔ 降水確率: 80%');
  });

  it('should handle zero precipitation', () => {
    const weatherData: WeatherData = {
      temperature: {
        current: 20,
        min: 15,
        max: 25,
      },
      description: '快晴',
      precipitation: 0,
      emoji: '☀️',
    };

    const message = formatWeatherMessage(weatherData);

    expect(message).toContain('☔ 降水確率: 0%');
  });

  it('should handle 100% precipitation', () => {
    const weatherData: WeatherData = {
      temperature: {
        current: 10,
        min: 8,
        max: 12,
      },
      description: '大雨',
      precipitation: 100,
      emoji: '🌧️',
    };

    const message = formatWeatherMessage(weatherData);

    expect(message).toContain('☔ 降水確率: 100%');
  });

  it('should include time range indicator (9時〜23時)', () => {
    const weatherData: WeatherData = {
      temperature: {
        current: 18,
        min: 14,
        max: 22,
      },
      description: '曇り',
      precipitation: 20,
      emoji: '☁️',
    };

    const message = formatWeatherMessage(weatherData);

    // 時間範囲が明示されていることを確認
    expect(message).toContain('🌡️ 気温（9時〜23時）');
    expect(message).not.toContain('🌡️ 気温\n');
  });

  it('should format message with all required sections', () => {
    const weatherData: WeatherData = {
      temperature: {
        current: 16,
        min: 12,
        max: 18,
      },
      description: '小雨',
      precipitation: 50,
      emoji: '🌦️',
    };

    const message = formatWeatherMessage(weatherData);

    // メッセージが必要なセクションをすべて含むことを確認
    const sections = [
      '🌦️ 川崎市の天気',
      '今日の天気:',
      '🌡️ 気温（9時〜23時）',
      '・現在:',
      '・最低:',
      '・最高:',
      '☔ 降水確率:',
      '良い一日をお過ごしください！',
    ];

    sections.forEach((section) => {
      expect(message).toContain(section);
    });
  });
});
