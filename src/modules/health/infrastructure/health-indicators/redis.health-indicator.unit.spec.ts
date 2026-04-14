import { Test, TestingModule } from '@nestjs/testing';
import { RedisHealthIndicator } from './redis.health-indicator';
import { Redis } from 'ioredis';

describe('RedisHealthIndicator', () => {
  let service: RedisHealthIndicator;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockRedisClient = {
      ping: jest.fn(),
      info: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisHealthIndicator,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<RedisHealthIndicator>(RedisHealthIndicator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isHealthy', () => {
    it('should return healthy status when Redis is connected', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');
      mockRedisClient.info.mockResolvedValue(
        'uptime_in_seconds:3600\nused_memory:1048576\nconnected_clients:5',
      );

      const result = await service.isHealthy('redis');

      expect(result).toEqual({
        redis: {
          status: 'up',
          ping: 'PONG',
          uptime: '3600 seconds',
          memoryUsage: 1,
          connectedClients: 5,
          message: 'Redis connection is healthy',
        },
      });
    });

    it('should return unhealthy status when ping fails', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Connection refused'));

      const result = await service.isHealthy('redis');

      expect(result).toEqual({
        redis: {
          status: 'down',
          error: 'Connection refused',
          message: 'Failed to check Redis connection',
        },
      });
    });

    it('should handle missing info data gracefully', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');
      mockRedisClient.info.mockResolvedValue('some_other_info:123');

      const result = await service.isHealthy('redis');

      expect(result).toEqual({
        redis: {
          status: 'up',
          ping: 'PONG',
          uptime: 'unknown',
          memoryUsage: 'unknown',
          connectedClients: 'unknown',
          message: 'Redis connection is healthy',
        },
      });
    });
  });

  describe('checkMemory', () => {
    it('should return healthy status when memory usage is within limits', async () => {
      mockRedisClient.info.mockResolvedValue('used_memory:524288000'); // 500MB

      const result = await service.checkMemory('memory', 1024); // 1GB limit

      expect(result).toEqual({
        memory: {
          status: 'up',
          memoryUsageMB: 500,
          maxMemoryMB: 1024,
          usagePercentage: '48.83%',
          message: 'Memory usage (500 MB) is within limits',
        },
      });
    });

    it('should return unhealthy status when memory usage exceeds limits', async () => {
      mockRedisClient.info.mockResolvedValue('used_memory:1073741824'); // 1GB

      const result = await service.checkMemory('memory', 512); // 512MB limit

      expect(result).toEqual({
        memory: {
          status: 'down',
          memoryUsageMB: 1024,
          maxMemoryMB: 512,
          usagePercentage: '200.00%',
          message: 'Memory usage (1024 MB) exceeds limit (512 MB)',
        },
      });
    });

    it('should return unhealthy status when unable to retrieve memory usage', async () => {
      mockRedisClient.info.mockResolvedValue('some_other_info:123');

      const result = await service.checkMemory('memory', 1024);

      expect(result).toEqual({
        memory: {
          status: 'down',
          message: 'Unable to retrieve memory usage',
        },
      });
    });

    it('should return unhealthy status when error occurs', async () => {
      mockRedisClient.info.mockRejectedValue(new Error('Connection failed'));

      const result = await service.checkMemory('memory', 1024);

      expect(result).toEqual({
        memory: {
          status: 'down',
          error: 'Connection failed',
          message: 'Failed to check Redis memory usage',
        },
      });
    });
  });
});
