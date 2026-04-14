import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQHealthIndicator } from './rabbitmq.health-indicator';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

describe('RabbitMQHealthIndicator', () => {
  let service: RabbitMQHealthIndicator;
  let mockAmqpConnection: jest.Mocked<AmqpConnection>;

  beforeEach(async () => {
    const mockConnection = {
      stream: { readable: true },
      connection: { serverProperties: {} },
    };

    mockAmqpConnection = {
      connection: mockConnection,
      channel: {
        assertQueue: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMQHealthIndicator,
        {
          provide: AmqpConnection,
          useValue: mockAmqpConnection,
        },
      ],
    }).compile();

    service = module.get<RabbitMQHealthIndicator>(RabbitMQHealthIndicator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isHealthy', () => {
    it('should return healthy status when connection is established', async () => {
      const result = await service.isHealthy('rabbitmq');

      expect(result).toEqual({
        rabbitmq: {
          status: 'up',
          connected: true,
          connectionState: 'connected',
          message: 'RabbitMQ connection is healthy',
        },
      });
    });

    it('should return unhealthy status when connection is not established', async () => {
      mockAmqpConnection.connection = null as any;

      const result = await service.isHealthy('rabbitmq');

      expect(result).toEqual({
        rabbitmq: {
          status: 'down',
          connected: false,
          connectionState: 'disconnected',
          message: 'RabbitMQ connection is down',
        },
      });
    });

    it('should return unhealthy status when error occurs', async () => {
      mockAmqpConnection.connection.stream.readable = false;

      const result = await service.isHealthy('rabbitmq');

      expect(result).toEqual({
        rabbitmq: {
          status: 'down',
          connected: false,
          connectionState: 'disconnected',
          message: 'RabbitMQ connection is down',
        },
      });
    });
  });

  describe('checkQueues', () => {
    it('should return healthy status when all queues are healthy', async () => {
      mockAmqpConnection.channel.assertQueue
        .mockResolvedValueOnce({ messageCount: 0, consumerCount: 1 } as any)
        .mockResolvedValueOnce({ messageCount: 5, consumerCount: 2 } as any)
        .mockResolvedValueOnce({ messageCount: 0, consumerCount: 1 } as any);

      const result = await service.checkQueues('queues');

      expect(result).toEqual({
        queues: {
          status: 'up',
          totalQueues: 3,
          healthyQueues: 3,
          queues: [
            { name: 'email.notifications', messageCount: 0, consumerCount: 1, status: 'ok' },
            { name: 'crm.sync', messageCount: 5, consumerCount: 2, status: 'ok' },
            { name: 'audit.events', messageCount: 0, consumerCount: 1, status: 'ok' },
          ],
          message: 'All queues are healthy',
        },
      });
    });

    it('should return unhealthy status when some queues are not healthy', async () => {
      mockAmqpConnection.channel.assertQueue
        .mockResolvedValueOnce({ messageCount: 0, consumerCount: 1 } as any)
        .mockRejectedValueOnce(new Error('Queue not found'))
        .mockResolvedValueOnce({ messageCount: 0, consumerCount: 1 } as any);

      const result = await service.checkQueues('queues');

      expect(result).toEqual({
        queues: {
          status: 'down',
          totalQueues: 3,
          healthyQueues: 2,
          queues: [
            { name: 'email.notifications', messageCount: 0, consumerCount: 1, status: 'ok' },
            { name: 'crm.sync', status: 'error', error: 'Queue not found' },
            { name: 'audit.events', messageCount: 0, consumerCount: 1, status: 'ok' },
          ],
          message: '2/3 queues are healthy',
        },
      });
    });

    it('should return unhealthy status when channel is not available', async () => {
      mockAmqpConnection.channel = null as any;

      const result = await service.checkQueues('queues');

      expect(result).toEqual({
        queues: {
          status: 'down',
          message: 'RabbitMQ channel not available',
        },
      });
    });

    it('should return unhealthy status when error occurs', async () => {
      mockAmqpConnection.channel.assertQueue.mockRejectedValue(new Error('Connection failed'));

      const result = await service.checkQueues('queues');

      expect(result).toEqual({
        queues: {
          status: 'down',
          error: 'Connection failed',
          message: 'Failed to check RabbitMQ queues',
        },
      });
    });
  });
});
