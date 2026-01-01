# Phase 3: Test Implementation - 設計書

## 1. テスト環境のセットアップ

### 1.1 依存パッケージ
```json
{
  "devDependencies": {
    "vitest": "^1.1.0",
    "@vitest/coverage-v8": "^1.1.0"
  }
}
```

### 1.2 Vitest設定ファイル（vitest.config.ts）
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/types/',
        'src/config/',
        '**/*.test.ts',
        'vitest.config.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### 1.3 package.jsonスクリプト
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

## 2. モック設計

### 2.1 AWS SDK モック
**ファイル**: `src/services/__tests__/secretsService.test.ts`

```typescript
import { mockClient } from 'aws-sdk-client-mock';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmMock = mockClient(SSMClient);

// テストごとにリセット
beforeEach(() => {
  ssmMock.reset();
});

// 成功パターン
ssmMock.on(GetParameterCommand).resolves({
  Parameter: {
    Value: 'test-api-key',
  },
});

// 失敗パターン
ssmMock.on(GetParameterCommand).rejects(new Error('Parameter not found'));
```

### 2.2 Axios モック
**パターン1**: vi.mock()を使用

```typescript
import { vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// 成功レスポンス
mockedAxios.get.mockResolvedValue({
  data: { /* レスポンスデータ */ },
});

// エラーレスポンス
mockedAxios.get.mockRejectedValue({
  response: { status: 500 },
  message: 'Internal Server Error',
});
```

### 2.3 タイマーモック（リトライテスト用）
```typescript
import { vi } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// テスト内で時間を進める
await vi.advanceTimersByTimeAsync(1000);
```

## 3. テストファイル設計

### 3.1 utils/logger.test.ts
**目的**: ログ出力の形式を検証

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '../logger';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should log info message in JSON format', () => {
    Logger.info('Test message', { key: 'value' });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

    expect(logOutput).toMatchObject({
      level: 'INFO',
      message: 'Test message',
      key: 'value',
    });
    expect(logOutput.timestamp).toBeDefined();
  });

  // 他のテストケース...
});
```

### 3.2 utils/retry.test.ts
**目的**: リトライロジックの検証

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retryWithBackoff } from '../retry';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(fn, 'Test operation');

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error (5xx)', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockResolvedValue('success');

    const promise = retryWithBackoff(fn, 'Test operation');

    // 各リトライの遅延を進める
    await vi.advanceTimersByTimeAsync(1000); // 1st retry
    await vi.advanceTimersByTimeAsync(2000); // 2nd retry

    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  // 他のテストケース...
});
```

### 3.3 utils/formatter.test.ts
**目的**: メッセージフォーマットの検証

```typescript
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
  });
});
```

### 3.4 services/secretsService.test.ts
**目的**: Parameter Store取得の検証

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { getOpenWeatherApiKey, getLineChannelAccessToken } from '../secretsService';

const ssmMock = mockClient(SSMClient);

describe('secretsService', () => {
  beforeEach(() => {
    ssmMock.reset();
  });

  describe('getOpenWeatherApiKey', () => {
    it('should fetch OpenWeather API key from Parameter Store', async () => {
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {
          Value: 'test-api-key',
        },
      });

      const apiKey = await getOpenWeatherApiKey();

      expect(apiKey).toBe('test-api-key');
      expect(ssmMock.calls()).toHaveLength(1);
    });

    it('should throw error if parameter not found', async () => {
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {},
      });

      await expect(getOpenWeatherApiKey()).rejects.toThrow();
    });
  });

  // 同様の構造でgetLineChannelAccessTokenもテスト
});
```

### 3.5 services/weatherService.test.ts
**目的**: 天気データ取得とフィルタリングの検証

```typescript
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

  // エッジケースのテスト...
});
```

### 3.6 services/lineService.test.ts
**目的**: LINE API呼び出しの検証

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { sendBroadcastMessage } from '../lineService';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('lineService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send broadcast message with correct headers', async () => {
    mockedAxios.post.mockResolvedValue({ data: {} });

    await sendBroadcastMessage('test-token', 'Test message');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.line.me/v2/bot/message/broadcast',
      {
        messages: [
          {
            type: 'text',
            text: 'Test message',
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      }
    );
  });

  // エラーケースのテスト...
});
```

### 3.7 src/__tests__/index.test.ts
**目的**: Lambda Handler全体の統合テスト

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../index';
import * as secretsService from '../services/secretsService';
import * as weatherService from '../services/weatherService';
import * as lineService from '../services/lineService';

vi.mock('../services/secretsService');
vi.mock('../services/weatherService');
vi.mock('../services/lineService');

describe('Lambda Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute successfully on happy path', async () => {
    vi.spyOn(secretsService, 'getOpenWeatherApiKey').mockResolvedValue('api-key');
    vi.spyOn(secretsService, 'getLineChannelAccessToken').mockResolvedValue('token');
    vi.spyOn(weatherService, 'getWeather').mockResolvedValue({
      temperature: { current: 15, min: 10, max: 20 },
      description: '晴れ',
      precipitation: 30,
      emoji: '☀️',
    });
    vi.spyOn(lineService, 'sendBroadcastMessage').mockResolvedValue();

    await expect(handler({} as any)).resolves.toBeUndefined();

    expect(secretsService.getOpenWeatherApiKey).toHaveBeenCalledTimes(1);
    expect(secretsService.getLineChannelAccessToken).toHaveBeenCalledTimes(1);
    expect(weatherService.getWeather).toHaveBeenCalledWith('api-key');
    expect(lineService.sendBroadcastMessage).toHaveBeenCalled();
  });

  it('should throw error if Parameter Store fails', async () => {
    vi.spyOn(secretsService, 'getOpenWeatherApiKey').mockRejectedValue(
      new Error('Parameter not found')
    );

    await expect(handler({} as any)).rejects.toThrow('Parameter not found');
  });

  // 他のエラーケース...
});
```

## 4. テスト実行フロー

### 4.1 ローカルでのテスト実行
```bash
# 全テスト実行
npm test

# ウォッチモード（開発中）
npm run test:watch

# カバレッジ付き実行
npm run test:coverage
```

### 4.2 カバレッジ確認
```bash
npm run test:coverage

# HTMLレポート確認
open coverage/index.html
```

## 5. 追加依存パッケージ

### aws-sdk-client-mock
AWS SDKのモック用ライブラリ

```bash
npm install -D aws-sdk-client-mock
```

## 6. 実装順序

1. Vitestセットアップ（vitest.config.ts、package.json）
2. utils/のテスト（logger, retry, formatter）
3. services/のテスト（secretsService, weatherService, lineService）
4. 統合テスト（index.ts）
5. カバレッジ確認・調整

## 7. 成功基準

- [ ] 全テストがパスする
- [ ] カバレッジが80%以上
- [ ] `npm test` でCIのようにテストが実行できる
- [ ] モックが正しく機能し、外部APIを呼ばない
