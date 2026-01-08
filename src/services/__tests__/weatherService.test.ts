import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { getWeather } from '../weatherService';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('weatherService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and combine data from Weather API and JMA API', async () => {
    // Mock Weather API response
    const weatherApiResponse = {
      data: {
        location: {
          name: 'Kawasaki',
          region: 'Kanagawa',
          country: 'Japan',
          lat: 35.53,
          lon: 139.7,
          localtime: '2026-01-08 12:00',
        },
        current: {
          temp_c: 8.5,
          condition: {
            text: '晴れ',
            code: 1000,
          },
        },
        forecast: {
          forecastday: [
            {
              date: '2026-01-08',
              day: {
                maxtemp_c: 12.0,
                mintemp_c: 5.0,
                daily_chance_of_rain: 10,
                condition: {
                  text: '晴れ',
                  code: 1000,
                },
              },
              hour: [
                { time: '2026-01-08 09:00', temp_c: 6.0, chance_of_rain: 0, condition: { text: '晴れ', code: 1000 } },
                { time: '2026-01-08 12:00', temp_c: 10.0, chance_of_rain: 0, condition: { text: '晴れ', code: 1000 } },
                { time: '2026-01-08 15:00', temp_c: 12.0, chance_of_rain: 10, condition: { text: '晴れ', code: 1000 } },
                { time: '2026-01-08 18:00', temp_c: 9.0, chance_of_rain: 5, condition: { text: '晴れ', code: 1000 } },
                { time: '2026-01-08 21:00', temp_c: 7.0, chance_of_rain: 0, condition: { text: '晴れ', code: 1000 } },
                { time: '2026-01-08 23:00', temp_c: 6.5, chance_of_rain: 0, condition: { text: '晴れ', code: 1000 } },
              ],
            },
          ],
        },
      },
    };

    // Mock JMA API response
    const jmaApiResponse = {
      data: [
        {
          publishingOffice: '横浜地方気象台',
          reportDatetime: '2026-01-08T11:00:00+09:00',
          timeSeries: [
            {
              timeDefines: ['2026-01-08T00:00:00+09:00'],
              areas: [
                {
                  area: { name: '東部', code: '140010' },
                  weathers: ['晴れ'],
                  weatherCodes: ['100'],
                },
              ],
            },
            {
              timeDefines: [
                '2026-01-08T00:00:00+09:00',
                '2026-01-08T06:00:00+09:00',
                '2026-01-08T12:00:00+09:00',
                '2026-01-08T18:00:00+09:00',
              ],
              areas: [
                {
                  area: { name: '東部', code: '140010' },
                  pops: ['--', '10', '0', '0'],
                },
              ],
            },
          ],
        },
      ],
    };

    mockedAxios.get.mockResolvedValueOnce(weatherApiResponse);
    mockedAxios.get.mockResolvedValueOnce(jmaApiResponse);

    const result = await getWeather('test-api-key');

    expect(result.temperature.current).toBe(9); // Math.round(8.5)
    expect(result.temperature.min).toBe(6); // min of 09:00-23:00
    expect(result.temperature.max).toBe(12); // max of 09:00-23:00
    expect(result.precipitation).toBe(10); // max from JMA [10, 0, 0]
    expect(result.description).toBe('晴れ');
    expect(result.emoji).toBe('☀️'); // weather code 1000
  });

  it('should call Weather API with correct parameters', async () => {
    const weatherApiResponse = {
      data: {
        location: {
          name: 'Kawasaki',
          region: 'Kanagawa',
          country: 'Japan',
          lat: 35.53,
          lon: 139.7,
          localtime: '2026-01-08 12:00',
        },
        current: {
          temp_c: 10.0,
          condition: { text: '晴れ', code: 1000 },
        },
        forecast: {
          forecastday: [
            {
              date: '2026-01-08',
              day: {
                maxtemp_c: 12.0,
                mintemp_c: 8.0,
                daily_chance_of_rain: 0,
                condition: { text: '晴れ', code: 1000 },
              },
              hour: [
                { time: '2026-01-08 09:00', temp_c: 8.0, chance_of_rain: 0, condition: { text: '晴れ', code: 1000 } },
              ],
            },
          ],
        },
      },
    };

    const jmaApiResponse = {
      data: [
        {
          publishingOffice: '横浜地方気象台',
          reportDatetime: '2026-01-08T11:00:00+09:00',
          timeSeries: [
            { timeDefines: [], areas: [] },
            {
              timeDefines: [],
              areas: [
                {
                  area: { name: '東部', code: '140010' },
                  pops: ['--', '0', '0', '0'],
                },
              ],
            },
          ],
        },
      ],
    };

    mockedAxios.get.mockResolvedValueOnce(weatherApiResponse);
    mockedAxios.get.mockResolvedValueOnce(jmaApiResponse);

    await getWeather('my-api-key');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.weatherapi.com/v1/forecast.json',
      {
        params: {
          key: 'my-api-key',
          q: 'Kawasaki,Japan',
          days: 1,
          lang: 'ja',
          aqi: 'no',
          alerts: 'no',
        },
      }
    );
  });

  it('should call JMA API with correct endpoint', async () => {
    const weatherApiResponse = {
      data: {
        location: {
          name: 'Kawasaki',
          region: 'Kanagawa',
          country: 'Japan',
          lat: 35.53,
          lon: 139.7,
          localtime: '2026-01-08 12:00',
        },
        current: {
          temp_c: 10.0,
          condition: { text: '晴れ', code: 1000 },
        },
        forecast: {
          forecastday: [
            {
              date: '2026-01-08',
              day: {
                maxtemp_c: 12.0,
                mintemp_c: 8.0,
                daily_chance_of_rain: 0,
                condition: { text: '晴れ', code: 1000 },
              },
              hour: [
                { time: '2026-01-08 09:00', temp_c: 8.0, chance_of_rain: 0, condition: { text: '晴れ', code: 1000 } },
              ],
            },
          ],
        },
      },
    };

    const jmaApiResponse = {
      data: [
        {
          publishingOffice: '横浜地方気象台',
          reportDatetime: '2026-01-08T11:00:00+09:00',
          timeSeries: [
            { timeDefines: [], areas: [] },
            {
              timeDefines: [],
              areas: [
                {
                  area: { name: '東部', code: '140010' },
                  pops: ['--', '0', '0', '0'],
                },
              ],
            },
          ],
        },
      ],
    };

    mockedAxios.get.mockResolvedValueOnce(weatherApiResponse);
    mockedAxios.get.mockResolvedValueOnce(jmaApiResponse);

    await getWeather('test-api-key');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://www.jma.go.jp/bosai/forecast/data/forecast/140000.json'
    );
  });

  it('should handle cloudy weather with correct emoji', async () => {
    const weatherApiResponse = {
      data: {
        location: {
          name: 'Kawasaki',
          region: 'Kanagawa',
          country: 'Japan',
          lat: 35.53,
          lon: 139.7,
          localtime: '2026-01-08 12:00',
        },
        current: {
          temp_c: 12.0,
          condition: { text: '曇り', code: 1006 },
        },
        forecast: {
          forecastday: [
            {
              date: '2026-01-08',
              day: {
                maxtemp_c: 15.0,
                mintemp_c: 10.0,
                daily_chance_of_rain: 20,
                condition: { text: '曇り', code: 1006 },
              },
              hour: [
                { time: '2026-01-08 09:00', temp_c: 10.0, chance_of_rain: 20, condition: { text: '曇り', code: 1006 } },
              ],
            },
          ],
        },
      },
    };

    const jmaApiResponse = {
      data: [
        {
          publishingOffice: '横浜地方気象台',
          reportDatetime: '2026-01-08T11:00:00+09:00',
          timeSeries: [
            { timeDefines: [], areas: [] },
            {
              timeDefines: [],
              areas: [
                {
                  area: { name: '東部', code: '140010' },
                  pops: ['--', '30', '20', '10'],
                },
              ],
            },
          ],
        },
      ],
    };

    mockedAxios.get.mockResolvedValueOnce(weatherApiResponse);
    mockedAxios.get.mockResolvedValueOnce(jmaApiResponse);

    const result = await getWeather('test-api-key');

    expect(result.emoji).toBe('☁️');
    expect(result.description).toBe('曇り');
    expect(result.precipitation).toBe(30); // max from JMA [30, 20, 10]
  });

  it('should handle rainy weather with correct emoji', async () => {
    const weatherApiResponse = {
      data: {
        location: {
          name: 'Kawasaki',
          region: 'Kanagawa',
          country: 'Japan',
          lat: 35.53,
          lon: 139.7,
          localtime: '2026-01-08 12:00',
        },
        current: {
          temp_c: 10.0,
          condition: { text: '雨', code: 1063 },
        },
        forecast: {
          forecastday: [
            {
              date: '2026-01-08',
              day: {
                maxtemp_c: 12.0,
                mintemp_c: 8.0,
                daily_chance_of_rain: 80,
                condition: { text: '雨', code: 1063 },
              },
              hour: [
                { time: '2026-01-08 09:00', temp_c: 8.0, chance_of_rain: 80, condition: { text: '雨', code: 1063 } },
              ],
            },
          ],
        },
      },
    };

    const jmaApiResponse = {
      data: [
        {
          publishingOffice: '横浜地方気象台',
          reportDatetime: '2026-01-08T11:00:00+09:00',
          timeSeries: [
            { timeDefines: [], areas: [] },
            {
              timeDefines: [],
              areas: [
                {
                  area: { name: '東部', code: '140010' },
                  pops: ['--', '70', '80', '60'],
                },
              ],
            },
          ],
        },
      ],
    };

    mockedAxios.get.mockResolvedValueOnce(weatherApiResponse);
    mockedAxios.get.mockResolvedValueOnce(jmaApiResponse);

    const result = await getWeather('test-api-key');

    expect(result.emoji).toBe('🌦️');
    expect(result.description).toBe('雨の可能性');
    expect(result.precipitation).toBe(80);
  });

  it('should round temperature values', async () => {
    const weatherApiResponse = {
      data: {
        location: {
          name: 'Kawasaki',
          region: 'Kanagawa',
          country: 'Japan',
          lat: 35.53,
          lon: 139.7,
          localtime: '2026-01-08 12:00',
        },
        current: {
          temp_c: 15.7,
          condition: { text: '晴れ', code: 1000 },
        },
        forecast: {
          forecastday: [
            {
              date: '2026-01-08',
              day: {
                maxtemp_c: 20.4,
                mintemp_c: 10.2,
                daily_chance_of_rain: 0,
                condition: { text: '晴れ', code: 1000 },
              },
              hour: [
                { time: '2026-01-08 09:00', temp_c: 10.2, chance_of_rain: 0, condition: { text: '晴れ', code: 1000 } },
                { time: '2026-01-08 12:00', temp_c: 15.7, chance_of_rain: 0, condition: { text: '晴れ', code: 1000 } },
                { time: '2026-01-08 18:00', temp_c: 20.4, chance_of_rain: 0, condition: { text: '晴れ', code: 1000 } },
              ],
            },
          ],
        },
      },
    };

    const jmaApiResponse = {
      data: [
        {
          publishingOffice: '横浜地方気象台',
          reportDatetime: '2026-01-08T11:00:00+09:00',
          timeSeries: [
            { timeDefines: [], areas: [] },
            {
              timeDefines: [],
              areas: [
                {
                  area: { name: '東部', code: '140010' },
                  pops: ['--', '0', '0', '0'],
                },
              ],
            },
          ],
        },
      ],
    };

    mockedAxios.get.mockResolvedValueOnce(weatherApiResponse);
    mockedAxios.get.mockResolvedValueOnce(jmaApiResponse);

    const result = await getWeather('test-api-key');

    expect(result.temperature.current).toBe(16); // Math.round(15.7)
    expect(result.temperature.min).toBe(10); // Math.round(10.2)
    expect(result.temperature.max).toBe(20); // Math.round(20.4)
  });

  it('should filter out hours outside 09:00-23:00 range', async () => {
    const weatherApiResponse = {
      data: {
        location: {
          name: 'Kawasaki',
          region: 'Kanagawa',
          country: 'Japan',
          lat: 35.53,
          lon: 139.7,
          localtime: '2026-01-08 12:00',
        },
        current: {
          temp_c: 15.0,
          condition: { text: '晴れ', code: 1000 },
        },
        forecast: {
          forecastday: [
            {
              date: '2026-01-08',
              day: {
                maxtemp_c: 20.0,
                mintemp_c: 5.0,
                daily_chance_of_rain: 0,
                condition: { text: '晴れ', code: 1000 },
              },
              hour: [
                // 00:00 - should be filtered out
                { time: '2026-01-08 00:00', temp_c: 5.0, chance_of_rain: 0, condition: { text: '晴れ', code: 1000 } },
                // 09:00 - should be included
                { time: '2026-01-08 09:00', temp_c: 10.0, chance_of_rain: 0, condition: { text: '晴れ', code: 1000 } },
                // 23:00 - should be included
                { time: '2026-01-08 23:00', temp_c: 12.0, chance_of_rain: 0, condition: { text: '晴れ', code: 1000 } },
              ],
            },
          ],
        },
      },
    };

    const jmaApiResponse = {
      data: [
        {
          publishingOffice: '横浜地方気象台',
          reportDatetime: '2026-01-08T11:00:00+09:00',
          timeSeries: [
            { timeDefines: [], areas: [] },
            {
              timeDefines: [],
              areas: [
                {
                  area: { name: '東部', code: '140010' },
                  pops: ['--', '0', '0', '0'],
                },
              ],
            },
          ],
        },
      ],
    };

    mockedAxios.get.mockResolvedValueOnce(weatherApiResponse);
    mockedAxios.get.mockResolvedValueOnce(jmaApiResponse);

    const result = await getWeather('test-api-key');

    // 00:00 (temp=5.0) should be excluded, only 09:00 and 23:00 used
    expect(result.temperature.min).toBe(10); // min of [10.0, 12.0]
    expect(result.temperature.max).toBe(12); // max of [10.0, 12.0]
  });

  it('should handle JMA API failure gracefully with default precipitation', async () => {
    const weatherApiResponse = {
      data: {
        location: {
          name: 'Kawasaki',
          region: 'Kanagawa',
          country: 'Japan',
          lat: 35.53,
          lon: 139.7,
          localtime: '2026-01-08 12:00',
        },
        current: {
          temp_c: 10.0,
          condition: { text: '晴れ', code: 1000 },
        },
        forecast: {
          forecastday: [
            {
              date: '2026-01-08',
              day: {
                maxtemp_c: 12.0,
                mintemp_c: 8.0,
                daily_chance_of_rain: 0,
                condition: { text: '晴れ', code: 1000 },
              },
              hour: [
                { time: '2026-01-08 09:00', temp_c: 8.0, chance_of_rain: 0, condition: { text: '晴れ', code: 1000 } },
              ],
            },
          ],
        },
      },
    };

    mockedAxios.get.mockResolvedValueOnce(weatherApiResponse);
    mockedAxios.get.mockRejectedValueOnce(new Error('JMA API error'));

    const result = await getWeather('test-api-key');

    expect(result.temperature.current).toBe(10);
    expect(result.precipitation).toBe(0); // default value when JMA fails
    expect(result.description).toBe('晴れ');
  });

  it('should throw error when Weather API fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Weather API error'));

    await expect(getWeather('test-api-key')).rejects.toThrow();
  });

  it('should handle various Weather API condition codes', async () => {
    const weatherTypes = [
      { code: 1000, description: '晴れ', emoji: '☀️' },
      { code: 1003, description: '晴れ時々曇り', emoji: '⛅' },
      { code: 1006, description: '曇り', emoji: '☁️' },
      { code: 1030, description: '霧', emoji: '🌫️' },
      { code: 1063, description: '雨の可能性', emoji: '🌦️' },
      { code: 1183, description: '小雨', emoji: '🌧️' },
      { code: 1195, description: '強い雨', emoji: '🌧️' },
      { code: 1087, description: '雷雨の可能性', emoji: '⛈️' },
      { code: 1210, description: '小雪', emoji: '🌨️' },
      { code: 1225, description: '大雪', emoji: '❄️' },
    ];

    const jmaApiResponse = {
      data: [
        {
          publishingOffice: '横浜地方気象台',
          reportDatetime: '2026-01-08T11:00:00+09:00',
          timeSeries: [
            { timeDefines: [], areas: [] },
            {
              timeDefines: [],
              areas: [
                {
                  area: { name: '東部', code: '140010' },
                  pops: ['--', '0', '0', '0'],
                },
              ],
            },
          ],
        },
      ],
    };

    for (const { code, description, emoji } of weatherTypes) {
      const weatherApiResponse = {
        data: {
          location: {
            name: 'Kawasaki',
            region: 'Kanagawa',
            country: 'Japan',
            lat: 35.53,
            lon: 139.7,
            localtime: '2026-01-08 12:00',
          },
          current: {
            temp_c: 10.0,
            condition: { text: description, code },
          },
          forecast: {
            forecastday: [
              {
                date: '2026-01-08',
                day: {
                  maxtemp_c: 12.0,
                  mintemp_c: 8.0,
                  daily_chance_of_rain: 0,
                  condition: { text: description, code },
                },
                hour: [
                  { time: '2026-01-08 09:00', temp_c: 8.0, chance_of_rain: 0, condition: { text: description, code } },
                ],
              },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(weatherApiResponse);
      mockedAxios.get.mockResolvedValueOnce(jmaApiResponse);

      const result = await getWeather('test-api-key');
      expect(result.emoji).toBe(emoji);
      expect(result.description).toBe(description);

      vi.clearAllMocks();
    }
  });
});
