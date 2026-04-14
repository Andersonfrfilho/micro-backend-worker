import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as CircuitBreaker from 'opossum';

import { CircuitBreakerMetricsService } from '../infrastructure/circuit-breaker.metrics.service';

export interface CircuitBreakerOptions {
  timeout?: number; // milliseconds
  errorThresholdPercentage?: number; // percentage
  resetTimeout?: number; // milliseconds
  name?: string;
}

export interface CircuitBreakerStats {
  name: string;
  state: 'closed' | 'open' | 'halfOpen';
  failures: number;
  successes: number;
  timeouts: number;
  fallbacks: number;
  errorRate: number;
  isEnabled: boolean;
}

@Injectable()
export class CircuitBreakerService implements OnModuleInit {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuitBreakers = new Map<string, CircuitBreaker>();

  private readonly defaultOptions: CircuitBreakerOptions = {
    timeout: 5000, // 5 seconds
    errorThresholdPercentage: 50, // 50% error rate
    resetTimeout: 30000, // 30 seconds
  };

  constructor(private readonly metricsService: CircuitBreakerMetricsService) {}

  onModuleInit() {
    this.logger.log('Circuit Breaker Service initialized');
  }

  /**
   * Create or get a circuit breaker for a specific service
   */
  getCircuitBreaker(
    name: string,
    action: (...args: any[]) => Promise<any>,
    options: CircuitBreakerOptions = {},
  ): CircuitBreaker {
    if (this.circuitBreakers.has(name)) {
      return this.circuitBreakers.get(name)!;
    }

    const mergedOptions = { ...this.defaultOptions, ...options, name };

    const breaker = new CircuitBreaker(action, mergedOptions);

    // Event listeners for monitoring
    breaker.on('open', () => {
      this.logger.warn(`Circuit breaker '${name}' opened`);
      this.metricsService.updateStateMetrics(name, 'open');
    });

    breaker.on('close', () => {
      this.logger.log(`Circuit breaker '${name}' closed`);
      this.metricsService.updateStateMetrics(name, 'closed');
    });

    breaker.on('halfOpen', () => {
      this.logger.log(`Circuit breaker '${name}' half-opened`);
      this.metricsService.updateStateMetrics(name, 'halfOpen');
    });

    breaker.on('success', (result, runTime) => {
      this.metricsService.recordSuccess(name, runTime);
    });

    breaker.on('failure', (error, runTime) => {
      this.metricsService.recordError(name, runTime);
    });

    breaker.on('timeout', (runTime) => {
      this.metricsService.recordTimeout(name, runTime);
    });

    breaker.on('fallback', (result, runTime) => {
      this.metricsService.recordFallback(name, runTime);
    });

    this.circuitBreakers.set(name, breaker);

    // Initialize metrics for new circuit breaker
    this.metricsService.updateStateMetrics(name, 'closed');

    return breaker;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    name: string,
    action: (...args: any[]) => Promise<T>,
    args: any[] = [],
    options: CircuitBreakerOptions = {},
    fallback?: (...args: any[]) => Promise<T> | T,
  ): Promise<T> {
    const breaker = this.getCircuitBreaker(name, action, options);

    if (fallback) {
      breaker.fallback(fallback);
    }

    try {
      return await breaker.fire(...args);
    } catch (error) {
      this.logger.error(`Circuit breaker '${name}' execution failed:`, error);
      throw error;
    }
  }

  /**
   * Get statistics for all circuit breakers
   */
  getAllStats(): CircuitBreakerStats[] {
    const stats: CircuitBreakerStats[] = [];

    for (const [name, breaker] of this.circuitBreakers) {
      stats.push({
        name,
        state: breaker.opened ? 'open' : breaker.halfOpen ? 'halfOpen' : 'closed',
        failures: breaker.stats.failures,
        successes: breaker.stats.successes,
        timeouts: breaker.stats.timeouts,
        fallbacks: breaker.stats.fallbacks,
        errorRate: this.calculateErrorRate(breaker.stats),
        isEnabled: true,
      });
    }

    return stats;
  }

  /**
   * Get statistics for a specific circuit breaker
   */
  getStats(name: string): CircuitBreakerStats | null {
    const breaker = this.circuitBreakers.get(name);
    if (!breaker) {
      return null;
    }

    return {
      name,
      state: breaker.opened ? 'open' : breaker.halfOpen ? 'halfOpen' : 'closed',
      failures: breaker.stats.failures,
      successes: breaker.stats.successes,
      timeouts: breaker.stats.timeouts,
      fallbacks: breaker.stats.fallbacks,
      errorRate: this.calculateErrorRate(breaker.stats),
      isEnabled: true,
    };
  }

  /**
   * Manually open a circuit breaker
   */
  openCircuit(name: string): boolean {
    const breaker = this.circuitBreakers.get(name);
    if (breaker) {
      breaker.open();
      this.logger.warn(`Circuit breaker '${name}' manually opened`);
      return true;
    }
    return false;
  }

  /**
   * Manually close a circuit breaker
   */
  closeCircuit(name: string): boolean {
    const breaker = this.circuitBreakers.get(name);
    if (breaker) {
      breaker.close();
      this.logger.log(`Circuit breaker '${name}' manually closed`);
      return true;
    }
    return false;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const [name, breaker] of this.circuitBreakers) {
      breaker.reset();
      this.logger.log(`Circuit breaker '${name}' reset`);
    }
  }

  /**
   * Check if a circuit breaker is open
   */
  isOpen(name: string): boolean {
    const breaker = this.circuitBreakers.get(name);
    return breaker ? breaker.opened : false;
  }

  private calculateErrorRate(stats: any): number {
    const total = stats.failures + stats.successes;
    return total > 0 ? (stats.failures / total) * 100 : 0;
  }
}
