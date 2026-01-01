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

  describe('info', () => {
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
      expect(logOutput.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should log info message without metadata', () => {
      Logger.info('Simple message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput).toMatchObject({
        level: 'INFO',
        message: 'Simple message',
      });
      expect(logOutput.timestamp).toBeDefined();
    });
  });

  describe('warn', () => {
    it('should log warning message in JSON format', () => {
      Logger.warn('Warning message', { code: 'WARN_001' });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput).toMatchObject({
        level: 'WARN',
        message: 'Warning message',
        code: 'WARN_001',
      });
      expect(logOutput.timestamp).toBeDefined();
    });
  });

  describe('error', () => {
    it('should log error message with Error object', () => {
      const error = new Error('Test error');
      Logger.error('Error occurred', error, { context: 'test' });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.level).toBe('ERROR');
      expect(logOutput.message).toBe('Error occurred');
      expect(logOutput.error).toBe('Test error');
      expect(logOutput.stack).toBeDefined();
      expect(logOutput.context).toBe('test');
      expect(logOutput.timestamp).toBeDefined();
    });

    it('should log error message without Error object', () => {
      Logger.error('Error without exception');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput).toMatchObject({
        level: 'ERROR',
        message: 'Error without exception',
      });
      expect(logOutput.timestamp).toBeDefined();
    });
  });
});
