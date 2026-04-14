import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { CircuitBreakerService } from '../application/circuit-breaker.service';

export interface CircuitBreakerOptions {
  name: string;
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  fallback?: (...args: any[]) => any;
}

@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CircuitBreakerInterceptor.name);

  constructor(private readonly circuitBreakerService: CircuitBreakerService) {}

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
          this.logger.error(`Circuit breaker '${name}' failed:`, error);
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
