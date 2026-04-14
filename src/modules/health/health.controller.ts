import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

import { CircuitBreakerHealthIndicator } from '../../circuit-breaker/circuit-breaker.health-indicator';

import { DatabaseHealthIndicator } from './health-indicators/database.health-indicator';
import { RabbitMQHealthIndicator } from './health-indicators/rabbitmq.health-indicator';
import { RedisHealthIndicator } from './health-indicators/redis.health-indicator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private databaseHealth: DatabaseHealthIndicator,
    private rabbitMQHealth: RabbitMQHealthIndicator,
    private redisHealth: RedisHealthIndicator,
    private circuitBreakerHealth: CircuitBreakerHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.rabbitMQHealth.isHealthy('rabbitmq'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.rabbitMQHealth.isHealthy('rabbitmq'),
      () => this.redisHealth.isHealthy('redis'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB
    ]);
  }

  @Get('live')
  @HealthCheck()
  liveness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // 200MB
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
    ]);
  }

  @Get('deep')
  @HealthCheck()
  deep() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.databaseHealth.checkMigrations('migrations'),
      () => this.rabbitMQHealth.isHealthy('rabbitmq'),
      () => this.rabbitMQHealth.checkQueues('queues'),
      () => this.redisHealth.isHealthy('redis'),
      () => this.circuitBreakerHealth.isHealthy('circuit-breakers'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
    ]);
  }
}
