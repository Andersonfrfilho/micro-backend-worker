import { SetMetadata } from '@nestjs/common';

import { CircuitBreakerOptions } from './circuit-breaker.interceptor';

export const CIRCUIT_BREAKER_KEY = 'circuitBreaker';

/**
 * Decorator to apply circuit breaker protection to a method
 * @param options Circuit breaker configuration options
 */
export function UseCircuitBreaker(options: CircuitBreakerOptions) {
  return SetMetadata(CIRCUIT_BREAKER_KEY, options);
}

/**
 * Decorator for external API calls with circuit breaker
 * @param serviceName Name of the external service
 * @param timeout Timeout in milliseconds (default: 5000)
 */
export function CircuitBreaker(serviceName: string, timeout: number = 5000) {
  return SetMetadata(CIRCUIT_BREAKER_KEY, {
    name: serviceName,
    timeout,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  });
}
