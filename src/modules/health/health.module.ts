import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { CircuitBreakerModule } from '../circuit-breaker/circuit-breaker.module';

import { DatabaseHealthIndicator } from './infrastructure/health-indicators/database.health-indicator';
import { RabbitMQHealthIndicator } from './infrastructure/health-indicators/rabbitmq.health-indicator';
import { RedisHealthIndicator } from './infrastructure/health-indicators/redis.health-indicator';
import { HealthController } from './infrastructure/health.controller';

@Module({
  imports: [TerminusModule, CircuitBreakerModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator, RabbitMQHealthIndicator, RedisHealthIndicator],
  exports: [DatabaseHealthIndicator, RabbitMQHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
