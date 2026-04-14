import { Module } from '@nestjs/common';

import { CircuitBreakerService } from './application/circuit-breaker.service';
import { ExternalApiService } from './application/external-api.service';
import { CircuitBreakerController } from './infrastructure/circuit-breaker.controller';
import { CircuitBreakerHealthIndicator } from './infrastructure/circuit-breaker.health-indicator';
import { CircuitBreakerInterceptor } from './infrastructure/circuit-breaker.interceptor';
import { CircuitBreakerMetricsService } from './infrastructure/circuit-breaker.metrics.service';

@Module({
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
