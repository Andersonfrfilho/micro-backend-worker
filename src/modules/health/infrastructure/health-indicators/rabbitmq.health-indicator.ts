import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class RabbitMQHealthIndicator extends HealthIndicator {
  constructor(private amqpConnection: AmqpConnection) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check if connection is established
      const connection = this.amqpConnection.connection;
      const isConnected = connection && connection.stream && connection.stream.readable;

      return this.getStatus(key, !!isConnected, {
        connected: !!isConnected,
        connectionState: connection?.connection?.serverProperties ? 'connected' : 'disconnected',
        message: isConnected ? 'RabbitMQ connection is healthy' : 'RabbitMQ connection is down',
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error.message,
        message: 'Failed to check RabbitMQ connection',
      });
    }
  }

  async checkQueues(key: string): Promise<HealthIndicatorResult> {
    try {
      const channel = this.amqpConnection.channel;

      if (!channel) {
        return this.getStatus(key, false, {
          message: 'RabbitMQ channel not available',
        });
      }

      // Check if our main queues exist and have consumers
      const queues = ['email.notifications', 'crm.sync', 'audit.events'];
      const queueStatuses: Array<{
        name: string;
        messageCount?: number;
        consumerCount?: number;
        status: string;
        error?: string;
      }> = [];

      for (const queueName of queues) {
        try {
          const queueInfo = await channel.assertQueue(queueName, { passive: true });
          queueStatuses.push({
            name: queueName,
            messageCount: queueInfo.messageCount,
            consumerCount: queueInfo.consumerCount,
            status: 'ok',
          });
        } catch (error) {
          queueStatuses.push({
            name: queueName,
            status: 'error',
            error: error.message,
          });
        }
      }

      const healthyQueues = queueStatuses.filter((q) => q.status === 'ok').length;
      const isHealthy = healthyQueues === queues.length;

      return this.getStatus(key, isHealthy, {
        totalQueues: queues.length,
        healthyQueues,
        queues: queueStatuses,
        message: isHealthy
          ? 'All queues are healthy'
          : `${healthyQueues}/${queues.length} queues are healthy`,
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error.message,
        message: 'Failed to check RabbitMQ queues',
      });
    }
  }
}
