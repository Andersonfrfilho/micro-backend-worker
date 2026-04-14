import { Inject, Injectable } from '@nestjs/common';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import type { LogProviderInterface } from '@app/modules/shared/domain';
import { CircuitBreakerService } from '../../circuit-breaker/application/circuit-breaker.service';
import { CircuitBreaker } from '../../circuit-breaker/domain/circuit-breaker.decorator';

@Injectable()
export class ExternalApiService {
  constructor(
    private readonly circuitBreakerService: CircuitBreakerService,
    @Inject(LOGGER_PROVIDER) private readonly logger: LogProviderInterface,
  ) {}

  async callExternalApiWithCircuitBreaker(apiUrl: string, data: any): Promise<any> {
    return this.circuitBreakerService.execute(
      'external-api',
      async () => {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`External API error: ${response.status}`);
        }

        return response.json();
      },
      [apiUrl, data],
      {
        timeout: 3000,
        errorThresholdPercentage: 50,
        resetTimeout: 10000,
      },
      async () => {
        this.logger.warn({ message: 'External API circuit breaker fallback triggered', context: 'ExternalApiService' });
        return { status: 'fallback', message: 'Service temporarily unavailable' };
      },
    );
  }

  @CircuitBreaker('payment-service', 5000)
  async processPayment(paymentData: any): Promise<any> {
    this.logger.info({ message: 'Processing payment', context: 'ExternalApiService' });

    if (Math.random() < 0.3) {
      throw new Error('Payment service unavailable');
    }

    return {
      transactionId: `txn_${Date.now()}`,
      status: 'success',
      amount: paymentData.amount,
    };
  }

  @CircuitBreaker('database-sync', 10000)
  async syncWithExternalDatabase(userData: any): Promise<any> {
    this.logger.info({ message: 'Syncing with external database', context: 'ExternalApiService' });

    if (Math.random() < 0.2) {
      throw new Error('Database sync failed');
    }

    return {
      synced: true,
      recordsProcessed: userData.length,
      timestamp: new Date().toISOString(),
    };
  }

  getCircuitBreakerStats() {
    return {
      'external-api': this.circuitBreakerService.getStats('external-api'),
      'payment-service': this.circuitBreakerService.getStats('payment-service'),
      'database-sync': this.circuitBreakerService.getStats('database-sync'),
    };
  }
}
