import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { sendBroadcastMessage } from '../lineService';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('lineService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send broadcast message with correct URL', async () => {
    mockedAxios.post.mockResolvedValue({ data: {} });

    await sendBroadcastMessage('test-token', 'Test message');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.line.me/v2/bot/message/broadcast',
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('should send broadcast message with correct request body', async () => {
    mockedAxios.post.mockResolvedValue({ data: {} });

    await sendBroadcastMessage('test-token', 'Hello, World!');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      {
        messages: [
          {
            type: 'text',
            text: 'Hello, World!',
          },
        ],
      },
      expect.any(Object)
    );
  });

  it('should send broadcast message with correct headers', async () => {
    mockedAxios.post.mockResolvedValue({ data: {} });

    await sendBroadcastMessage('my-access-token', 'Test message');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer my-access-token',
        },
      }
    );
  });

  it('should send complete broadcast message', async () => {
    mockedAxios.post.mockResolvedValue({ data: {} });

    await sendBroadcastMessage(
      'complete-token',
      '☀️ 川崎市の天気\n\n今日の天気: 晴れ'
    );

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.line.me/v2/bot/message/broadcast',
      {
        messages: [
          {
            type: 'text',
            text: '☀️ 川崎市の天気\n\n今日の天気: 晴れ',
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer complete-token',
        },
      }
    );
  });

  it('should complete successfully without throwing error', async () => {
    mockedAxios.post.mockResolvedValue({ data: {} });

    await expect(
      sendBroadcastMessage('test-token', 'Test message')
    ).resolves.toBeUndefined();
  });

  it('should throw error when API fails', async () => {
    mockedAxios.post.mockRejectedValue(new Error('API Error'));

    await expect(
      sendBroadcastMessage('test-token', 'Test message')
    ).rejects.toThrow('API Error');
  });

  it('should retry on failure', async () => {
    mockedAxios.post
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValue({ data: {} });

    await sendBroadcastMessage('test-token', 'Test message');

    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  it('should handle 4xx errors without retry', async () => {
    mockedAxios.post.mockRejectedValue({ response: { status: 400 } });

    await expect(
      sendBroadcastMessage('test-token', 'Test message')
    ).rejects.toEqual({ response: { status: 400 } });

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should handle empty message', async () => {
    mockedAxios.post.mockResolvedValue({ data: {} });

    await sendBroadcastMessage('test-token', '');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      {
        messages: [
          {
            type: 'text',
            text: '',
          },
        ],
      },
      expect.any(Object)
    );
  });

  it('should handle multiline message', async () => {
    mockedAxios.post.mockResolvedValue({ data: {} });

    const multilineMessage = `Line 1
Line 2
Line 3`;

    await sendBroadcastMessage('test-token', multilineMessage);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      {
        messages: [
          {
            type: 'text',
            text: multilineMessage,
          },
        ],
      },
      expect.any(Object)
    );
  });
});
