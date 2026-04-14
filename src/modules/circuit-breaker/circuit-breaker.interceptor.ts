import { LOGGER_PROVIDER } from '@adatechnology/logger';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';

import type { LogProviderInterface } from '@app/modules/shared';

import { CircuitBreakerService } from './circuit-breaker.service';

export interface CircuitBreakerOptions {
  name: string;
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  fallback?: (...args: any[]) => any;
}

@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  constructor(
    private readonly circuitBreakerService: CircuitBreakerService,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const circuitBreakerOptions = this.getCircuitBreakerOptions(handler);

    if (!circuitBreakerOptions) {
      return next.handle();
    }

    const { name, timeout, errorThresholdPercentage, resetTimeout, fallback } =
      circuitBreakerOptions;

    return new Observable((subscriber) => {
      const executeWithCircuitBreaker = async () => {
        try {
          const result = await this.circuitBreakerService.execute(
            name,
            async () => {
              return new Promise((resolve, reject) => {
                next.handle().subscribe({
                  next: (value) => resolve(value),
                  error: (error) => reject(error),
                  complete: () => resolve(undefined),
                });
              });
            },
            [],
            { timeout, errorThresholdPercentage, resetTimeout },
            fallback,
          );

          subscriber.next(result);
          subscriber.complete();
        } catch (error) {
          this.logger.error({
            message: `Circuit breaker '${name}' failed`,
            context: 'CircuitBreakerInterceptor',
            params: { error },
          });
          subscriber.error(error);
        }
      };

      executeWithCircuitBreaker();
    });
  }

  private getCircuitBreakerOptions(handler: any): CircuitBreakerOptions | null {
    const circuitBreakerMetadata = Reflect.getMetadata('circuitBreaker', handler);
    return circuitBreakerMetadata || null;
  }
}
