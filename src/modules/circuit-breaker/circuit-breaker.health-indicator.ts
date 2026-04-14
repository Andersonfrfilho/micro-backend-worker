import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

import { CircuitBreakerService } from './circuit-breaker.service';

@Injectable()
export class CircuitBreakerHealthIndicator extends HealthIndicator {
  constructor(private readonly circuitBreakerService: CircuitBreakerService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const stats = this.circuitBreakerService.getAllStats();
      const unhealthyBreakers = stats.filter((stat) => stat.state === 'open');

      const isHealthy = unhealthyBreakers.length === 0;

      return this.getStatus(key, isHealthy, {
        totalBreakers: stats.length,
        openBreakers: unhealthyBreakers.length,
        breakers: stats.map((stat) => ({
          name: stat.name,
          state: stat.state,
          errorRate: stat.errorRate,
          failures: stat.failures,
          successes: stat.successes,
        })),
        message: isHealthy
          ? 'All circuit breakers are healthy'
          : `${unhealthyBreakers.length} circuit breaker(s) are open`,
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error.message,
        message: 'Failed to check circuit breakers',
      });
    }
  }

  async checkBreaker(key: string, breakerName: string): Promise<HealthIndicatorResult> {
    try {
      const stats = this.circuitBreakerService.getStats(breakerName);

      if (!stats) {
        return this.getStatus(key, false, {
          message: `Circuit breaker '${breakerName}' not found`,
        });
      }

      const isHealthy = stats.state !== 'open';

      return this.getStatus(key, isHealthy, {
        name: stats.name,
        state: stats.state,
        errorRate: stats.errorRate,
        failures: stats.failures,
        successes: stats.successes,
        timeouts: stats.timeouts,
        fallbacks: stats.fallbacks,
        message: isHealthy
          ? `Circuit breaker '${breakerName}' is healthy`
          : `Circuit breaker '${breakerName}' is open`,
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error.message,
        message: `Failed to check circuit breaker '${breakerName}'`,
      });
    }
  }
}
