import { Injectable, Logger } from '@nestjs/common';

import { CircuitBreakerService } from '../../circuit-breaker/application/circuit-breaker.service';
import { CircuitBreaker } from '../../circuit-breaker/domain/circuit-breaker.decorator';

@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger(ExternalApiService.name);

  constructor(private readonly circuitBreakerService: CircuitBreakerService) {}

  /**
   * Example of using circuit breaker with manual execution
   */
  async callExternalApiWithCircuitBreaker(apiUrl: string, data: any): Promise<any> {
    return this.circuitBreakerService.execute(
      'external-api',
      async () => {
        // Simulate external API call
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
        timeout: 3000, // 3 seconds timeout
        errorThresholdPercentage: 50,
        resetTimeout: 10000, // 10 seconds reset
      },
      // Fallback function
      async () => {
        this.logger.warn('External API circuit breaker fallback triggered');
        return { status: 'fallback', message: 'Service temporarily unavailable' };
      },
    );
  }

  /**
   * Example of using circuit breaker with decorator
   */
  @CircuitBreaker('payment-service', 5000)
  async processPayment(paymentData: any): Promise<any> {
    // Simulate payment processing
    this.logger.log('Processing payment...');

    // Simulate random failure for demonstration
    if (Math.random() < 0.3) {
      throw new Error('Payment service unavailable');
    }

    return {
      transactionId: `txn_${Date.now()}`,
      status: 'success',
      amount: paymentData.amount,
    };
  }

  /**
   * Example of using circuit breaker for database operations
   */
  @CircuitBreaker('database-sync', 10000)
  async syncWithExternalDatabase(userData: any): Promise<any> {
    // Simulate database sync operation
    this.logger.log('Syncing with external database...');

    // Simulate potential failure
    if (Math.random() < 0.2) {
      throw new Error('Database sync failed');
    }

    return {
      synced: true,
      recordsProcessed: userData.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get circuit breaker statistics
   */
  getCircuitBreakerStats() {
    return {
      'external-api': this.circuitBreakerService.getStats('external-api'),
      'payment-service': this.circuitBreakerService.getStats('payment-service'),
      'database-sync': this.circuitBreakerService.getStats('database-sync'),
    };
  }
}
