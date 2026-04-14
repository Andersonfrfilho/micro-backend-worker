import { Controller, Get, Post, Body } from '@nestjs/common';

import { CircuitBreakerMetricsService } from './circuit-breaker.metrics.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { ExternalApiService } from './external-api.service';

@Controller('circuit-breaker')
export class CircuitBreakerController {
  constructor(
    private readonly externalApiService: ExternalApiService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly metricsService: CircuitBreakerMetricsService,
  ) {}

  @Get('stats')
  getStats() {
    return {
      timestamp: new Date().toISOString(),
      stats: this.circuitBreakerService.getAllStats(),
      externalApiStats: this.externalApiService.getCircuitBreakerStats(),
    };
  }

  @Post('test-external-api')
  async testExternalApi(@Body() body: { url: string; data: any }) {
    try {
      const result = await this.externalApiService.callExternalApiWithCircuitBreaker(
        body.url,
        body.data,
      );
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('test-payment')
  async testPayment(@Body() body: { amount: number; userId: string }) {
    try {
      const result = await this.externalApiService.processPayment(body);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('test-database-sync')
  async testDatabaseSync(@Body() body: { users: any[] }) {
    try {
      const result = await this.externalApiService.syncWithExternalDatabase(body.users);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('reset')
  resetCircuitBreakers() {
    this.circuitBreakerService.resetAll();
    return { message: 'All circuit breakers reset' };
  }

  @Post('open/:name')
  openCircuitBreaker(@Body('name') name: string) {
    const success = this.circuitBreakerService.openCircuit(name);
    return {
      success,
      message: success ? `Circuit breaker '${name}' opened` : `Circuit breaker '${name}' not found`,
    };
  }

  @Post('close/:name')
  closeCircuitBreaker(@Body('name') name: string) {
    const success = this.circuitBreakerService.closeCircuit(name);
    return {
      success,
      message: success ? `Circuit breaker '${name}' closed` : `Circuit breaker '${name}' not found`,
    };
  }

  @Get('metrics')
  async getMetrics() {
    return await this.metricsService.getMetrics();
  }
}
