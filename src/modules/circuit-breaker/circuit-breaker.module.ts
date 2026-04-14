import { Module } from '@nestjs/common';

import { CircuitBreakerController } from './circuit-breaker.controller';
import { CircuitBreakerHealthIndicator } from './circuit-breaker.health-indicator';
import { CircuitBreakerInterceptor } from './circuit-breaker.interceptor';
import { CircuitBreakerMetricsService } from './circuit-breaker.metrics.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { ExternalApiService } from './external-api.service';

@Module({
  imports: [],
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
