import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { CircuitBreakerModule } from '../circuit-breaker/circuit-breaker.module';

import { DatabaseHealthIndicator } from './health-indicators/database.health-indicator';
import { RabbitMQHealthIndicator } from './health-indicators/rabbitmq.health-indicator';
import { RedisHealthIndicator } from './health-indicators/redis.health-indicator';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, CircuitBreakerModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator, RabbitMQHealthIndicator, RedisHealthIndicator],
  exports: [DatabaseHealthIndicator, RabbitMQHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
