import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { getWeather } from '../weatherService';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('weatherService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and filter weather data for 09:00-23:00', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    mockedAxios.get.mockResolvedValue({
      data: {
        list: [
          {
            dt: Math.floor(new Date(`${todayStr}T09:00:00`).getTime() / 1000),
            dt_txt: `${todayStr} 09:00:00`,
            main: { temp: 15, temp_min: 15, temp_max: 15 },
            weather: [{ main: 'Clear', description: '晴れ' }],
            pop: 0.1,
          },
          {
            dt: Math.floor(new Date(`${todayStr}T12:00:00`).getTime() / 1000),
            dt_txt: `${todayStr} 12:00:00`,
            main: { temp: 20, temp_min: 20, temp_max: 20 },
            weather: [{ main: 'Clear', description: '晴れ' }],
            pop: 0.0,
          },
          {
            dt: Math.floor(new Date(`${todayStr}T21:00:00`).getTime() / 1000),
            dt_txt: `${todayStr} 21:00:00`,
            main: { temp: 12, temp_min: 12, temp_max: 12 },
            weather: [{ main: 'Clear', description: '晴れ' }],
            pop: 0.2,
          },
        ],
      },
    });

    const result = await getWeather('test-api-key');

    expect(result.temperature.min).toBe(12);
    expect(result.temperature.max).toBe(20);
    expect(result.temperature.current).toBe(15);
    expect(result.precipitation).toBe(20); // max 0.2 * 100
    expect(result.description).toBe('晴れ');
    expect(result.emoji).toBe('☀️');
  });

  it('should call Forecast API with correct parameters', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    mockedAxios.get.mockResolvedValue({
      data: {
        list: [
          {
            dt: Math.floor(new Date(`${todayStr}T09:00:00`).getTime() / 1000),
            dt_txt: `${todayStr} 09:00:00`,
            main: { temp: 18, temp_min: 18, temp_max: 18 },
            weather: [{ main: 'Clouds', description: '曇り' }],
            pop: 0.3,
          },
        ],
      },
    });

    await getWeather('my-api-key');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.openweathermap.org/data/2.5/forecast',
      {
        params: {
          lat: 35.5309,
          lon: 139.7028,
          appid: 'my-api-key',
          units: 'metric',
          lang: 'ja',
        },
      }
    );
  });

  it('should handle rainy weather', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    mockedAxios.get.mockResolvedValue({
      data: {
        list: [
          {
            dt: Math.floor(new Date(`${todayStr}T09:00:00`).getTime() / 1000),
            dt_txt: `${todayStr} 09:00:00`,
            main: { temp: 12, temp_min: 12, temp_max: 12 },
            weather: [{ main: 'Rain', description: '雨' }],
            pop: 0.9,
          },
        ],
      },
    });

    const result = await getWeather('test-api-key');

    expect(result.emoji).toBe('🌧️');
    expect(result.description).toBe('雨');
    expect(result.precipitation).toBe(90);
  });

  it('should handle various weather types', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const weatherTypes = [
      { main: 'Clouds', emoji: '☁️' },
      { main: 'Drizzle', emoji: '🌦️' },
      { main: 'Thunderstorm', emoji: '⛈️' },
      { main: 'Snow', emoji: '❄️' },
      { main: 'Mist', emoji: '🌫️' },
      { main: 'Fog', emoji: '🌫️' },
      { main: 'Unknown', emoji: '🌤️' }, // default
    ];

    for (const { main, emoji } of weatherTypes) {
      mockedAxios.get.mockResolvedValue({
        data: {
          list: [
            {
              dt: Math.floor(new Date(`${todayStr}T09:00:00`).getTime() / 1000),
              dt_txt: `${todayStr} 09:00:00`,
              main: { temp: 15, temp_min: 15, temp_max: 15 },
              weather: [{ main, description: 'test' }],
              pop: 0.5,
            },
          ],
        },
      });

      const result = await getWeather('test-api-key');
      expect(result.emoji).toBe(emoji);
    }
  });

  it('should round temperature values', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    mockedAxios.get.mockResolvedValue({
      data: {
        list: [
          {
            dt: Math.floor(new Date(`${todayStr}T09:00:00`).getTime() / 1000),
            dt_txt: `${todayStr} 09:00:00`,
            main: { temp: 15.7, temp_min: 15.7, temp_max: 15.7 },
            weather: [{ main: 'Clear', description: '晴れ' }],
            pop: 0.1,
          },
          {
            dt: Math.floor(new Date(`${todayStr}T12:00:00`).getTime() / 1000),
            dt_txt: `${todayStr} 12:00:00`,
            main: { temp: 20.4, temp_min: 20.4, temp_max: 20.4 },
            weather: [{ main: 'Clear', description: '晴れ' }],
            pop: 0.0,
          },
          {
            dt: Math.floor(new Date(`${todayStr}T18:00:00`).getTime() / 1000),
            dt_txt: `${todayStr} 18:00:00`,
            main: { temp: 10.2, temp_min: 10.2, temp_max: 10.2 },
            weather: [{ main: 'Clear', description: '晴れ' }],
            pop: 0.0,
          },
        ],
      },
    });

    const result = await getWeather('test-api-key');

    expect(result.temperature.current).toBe(16); // Math.round(15.7)
    expect(result.temperature.min).toBe(10); // Math.round(10.2)
    expect(result.temperature.max).toBe(20); // Math.round(20.4)
  });

  it('should convert precipitation to percentage', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    mockedAxios.get.mockResolvedValue({
      data: {
        list: [
          {
            dt: Math.floor(new Date(`${todayStr}T09:00:00`).getTime() / 1000),
            dt_txt: `${todayStr} 09:00:00`,
            main: { temp: 15, temp_min: 15, temp_max: 15 },
            weather: [{ main: 'Clear', description: '晴れ' }],
            pop: 0.456,
          },
        ],
      },
    });

    const result = await getWeather('test-api-key');

    expect(result.precipitation).toBe(46); // Math.round(0.456 * 100)
  });

  it('should use first data if no forecast for today 09:00-23:00', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    mockedAxios.get.mockResolvedValue({
      data: {
        list: [
          {
            dt: Math.floor(
              new Date(`${yesterdayStr}T09:00:00`).getTime() / 1000
            ),
            dt_txt: `${yesterdayStr} 09:00:00`,
            main: { temp: 10, temp_min: 10, temp_max: 10 },
            weather: [{ main: 'Clouds', description: '曇り' }],
            pop: 0.4,
          },
        ],
      },
    });

    const result = await getWeather('test-api-key');

    // 昨日のデータだが、フォールバックとして使用される
    expect(result.temperature.current).toBe(10);
    expect(result.description).toBe('曇り');
  });

  it('should filter out forecasts outside 09:00-23:00 range', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    mockedAxios.get.mockResolvedValue({
      data: {
        list: [
          // 00:00 - should be filtered out
          {
            dt: Math.floor(new Date(`${todayStr}T00:00:00`).getTime() / 1000),
            dt_txt: `${todayStr} 00:00:00`,
            main: { temp: 5, temp_min: 5, temp_max: 5 },
            weather: [{ main: 'Clear', description: '晴れ' }],
            pop: 0.0,
          },
          // 09:00 - should be included
          {
            dt: Math.floor(new Date(`${todayStr}T09:00:00`).getTime() / 1000),
            dt_txt: `${todayStr} 09:00:00`,
            main: { temp: 15, temp_min: 15, temp_max: 15 },
            weather: [{ main: 'Clear', description: '晴れ' }],
            pop: 0.1,
          },
          // 23:00 - should be included
          {
            dt: Math.floor(new Date(`${todayStr}T23:00:00`).getTime() / 1000),
            dt_txt: `${todayStr} 23:00:00`,
            main: { temp: 10, temp_min: 10, temp_max: 10 },
            weather: [{ main: 'Clear', description: '晴れ' }],
            pop: 0.2,
          },
        ],
      },
    });

    const result = await getWeather('test-api-key');

    // 00:00のデータ（temp=5）は除外され、09:00と23:00のみが使用される
    expect(result.temperature.min).toBe(10); // min of [15, 10]
    expect(result.temperature.max).toBe(15); // max of [15, 10]
  });
});
