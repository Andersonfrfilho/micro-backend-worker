import { Module } from '@nestjs/common';
import { LoggerModule } from '@adatechnology/logger';

import { CircuitBreakerService } from './application/circuit-breaker.service';
import { ExternalApiService } from './application/external-api.service';
import { CircuitBreakerController } from './circuit-breaker.controller';
import { CircuitBreakerHealthIndicator } from './circuit-breaker.health-indicator';
import { CircuitBreakerInterceptor } from './circuit-breaker.interceptor';
import { CircuitBreakerMetricsService } from './circuit-breaker.metrics.service';

@Module({
  imports: [LoggerModule],
  controllers: [CircuitBreakerController],
  providers: [
    CircuitBreakerService,
    ExternalApiService,
    CircuitBreakerInterceptor,
    CircuitBreakerHealthIndicator,
    CircuitBreakerMetricsService,
  ],
  exports: [
    CircuitBreakerService,
    ExternalApiService,
    CircuitBreakerInterceptor,
    CircuitBreakerHealthIndicator,
    CircuitBreakerMetricsService,
  ],
})
export class CircuitBreakerModule {}
