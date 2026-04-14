import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Redis } from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject('REDIS_CLIENT') private redisClient: Redis) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Test basic connectivity with PING
      const pingResult = await this.redisClient.ping();

      // Get some basic info
      const info = await this.redisClient.info();
      const uptime = this.extractUptime(info);
      const memoryUsage = this.extractMemoryUsage(info);
      const connectedClients = this.extractConnectedClients(info);

      const isHealthy = pingResult === 'PONG';

      return this.getStatus(key, isHealthy, {
        ping: pingResult,
        uptime: uptime ? `${uptime} seconds` : 'unknown',
        memoryUsage: memoryUsage ? `${memoryUsage} MB` : 'unknown',
        connectedClients: connectedClients || 'unknown',
        message: isHealthy ? 'Redis connection is healthy' : 'Redis connection failed',
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error.message,
        message: 'Failed to check Redis connection',
      });
    }
  }

  async checkMemory(key: string, maxMemoryMB: number = 1024): Promise<HealthIndicatorResult> {
    try {
      const info = await this.redisClient.info();
      const memoryUsage = this.extractMemoryUsage(info);

      if (!memoryUsage) {
        return this.getStatus(key, false, {
          message: 'Unable to retrieve memory usage',
        });
      }

      const isHealthy = memoryUsage < maxMemoryMB;

      return this.getStatus(key, isHealthy, {
        memoryUsageMB: memoryUsage,
        maxMemoryMB,
        usagePercentage: ((memoryUsage / maxMemoryMB) * 100).toFixed(2) + '%',
        message: isHealthy
          ? `Memory usage (${memoryUsage} MB) is within limits`
          : `Memory usage (${memoryUsage} MB) exceeds limit (${maxMemoryMB} MB)`,
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error.message,
        message: 'Failed to check Redis memory usage',
      });
    }
  }

  private extractUptime(info: string): number | null {
    const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);
    return uptimeMatch ? parseInt(uptimeMatch[1], 10) : null;
  }

  private extractMemoryUsage(info: string): number | null {
    const memoryMatch = info.match(/used_memory:(\d+)/);
    if (memoryMatch) {
      // Convert bytes to MB
      return Math.round(parseInt(memoryMatch[1], 10) / (1024 * 1024));
    }
    return null;
  }

  private extractConnectedClients(info: string): number | null {
    const clientsMatch = info.match(/connected_clients:(\d+)/);
    return clientsMatch ? parseInt(clientsMatch[1], 10) : null;
  }
}
