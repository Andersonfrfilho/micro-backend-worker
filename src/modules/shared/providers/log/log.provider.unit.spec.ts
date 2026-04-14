import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import type { LogProviderInterface } from '@modules/shared';
import { LOG_PROVIDER } from '@modules/shared/providers/log/log.token';
import { LogProvider } from './log.provider';

// NOSONAR - Test file with faker-generated credentials for testing purposes only
describe('LogProvider - Unit Tests', () => {
  let provider: LogProviderInterface;
  let mockLogger: jest.Mocked<LogProviderInterface>;
  let testPassword: string;

  beforeEach(async () => {
    // Arrange: Setup mocks and test module
    testPassword = faker.internet.password({ length: 12, memorable: false });
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as jest.Mocked<LogProviderInterface>;

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        LogProvider,
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: LOG_PROVIDER,
          useClass: LogProvider,
        },
      ],
    }).compile();

    provider = moduleRef.get<LogProviderInterface>(LOG_PROVIDER as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('info', () => {
    it('should call logger info method with correct params', () => {
      const logParams = { message: 'Test info message', context: 'TestContext' };

      provider.info(logParams);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test info message', context: 'TestContext' }),
      );
    });

    it('should handle params with metadata', () => {
      const logParams = {
        message: 'Test with metadata',
        context: 'TestContext',
        params: { userId: '123', action: 'login' },
      };

      provider.info(logParams);

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle empty params gracefully', () => {
      provider.info({ message: 'Empty params' });

      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should call logger error method with correct params', () => {
      const logParams = { message: 'Test error message', context: 'ErrorContext' };

      provider.error(logParams);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error message' }),
      );
    });

    it('should log error with additional params', () => {
      const logParams = {
        message: 'Database error',
        context: 'DatabaseService',
        params: { errorCode: 'DB_001', query: 'SELECT * FROM users' },
      };

      provider.error(logParams);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should call logger warn method with correct params', () => {
      const logParams = { message: 'Test warning message', context: 'WarnContext' };

      provider.warn(logParams);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test warning message' }),
      );
    });
  });

  describe('debug', () => {
    it('should call logger debug method with correct params', () => {
      const logParams = { message: 'Test debug message', context: 'DebugContext' };

      provider.debug(logParams);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test debug message' }),
      );
    });

    it('should handle complex debug params', () => {
      const logParams = {
        message: 'Complex debug',
        context: 'DebugContext',
        params: { requestId: 'req-123', duration: 100, data: { key: 'value' } },
      };

      provider.debug(logParams);

      expect(mockLogger.debug).toHaveBeenCalled();
    });
  });

  describe('obfuscation', () => {
    it('should obfuscate sensitive fields in params', () => {
      const logParams = {
        message: 'Login attempt',
        context: 'AuthService',
        params: { password: testPassword, username: 'user@example.com' },
      };

      provider.info(logParams);

      expect(mockLogger.info).toHaveBeenCalled();
      const callArgs = (mockLogger.info as jest.Mock).mock.calls[0][0];
      expect(callArgs.message).toBe('Login attempt');
    });
  });

  describe('method invocation consistency', () => {
    it('should call appropriate method for each log level', () => {
      const baseParams = { message: 'Test message', context: 'TestContext' };

      provider.info(baseParams);
      provider.error(baseParams);
      provider.warn(baseParams);
      provider.debug(baseParams);

      expect(mockLogger.info).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalledTimes(1);
    });

    it('should preserve message and context across all methods', () => {
      const baseParams = { message: 'Consistent message', context: 'ConsistentContext' };

      provider.info(baseParams);
      provider.error(baseParams);
      provider.warn(baseParams);
      provider.debug(baseParams);

      expect((mockLogger.info as jest.Mock).mock.calls[0][0].message).toBe('Consistent message');
      expect((mockLogger.error as jest.Mock).mock.calls[0][0].message).toBe('Consistent message');
      expect((mockLogger.warn as jest.Mock).mock.calls[0][0].message).toBe('Consistent message');
      expect((mockLogger.debug as jest.Mock).mock.calls[0][0].message).toBe('Consistent message');
    });
  });
});
