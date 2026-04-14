import { Injectable } from '@nestjs/common';
import { register, Gauge, Counter, Histogram } from 'prom-client';

@Injectable()
export class CircuitBreakerMetricsService {
  private readonly circuitBreakerStateGauge: Gauge<string>;
  private readonly circuitBreakerErrorsCounter: Counter<string>;
  private readonly circuitBreakerSuccessesCounter: Counter<string>;
  private readonly circuitBreakerTimeoutsCounter: Counter<string>;
  private readonly circuitBreakerFallbacksCounter: Counter<string>;
  private readonly circuitBreakerExecutionTimeHistogram: Histogram<string>;

  constructor() {
    // Gauge para estado do circuit breaker (0=closed, 1=open, 2=half-open)
    this.circuitBreakerStateGauge = new Gauge({
      name: 'circuit_breaker_state',
      help: 'Current state of circuit breaker (0=closed, 1=open, 2=half-open)',
      labelNames: ['name'],
    });

    // Counters para diferentes tipos de eventos
    this.circuitBreakerErrorsCounter = new Counter({
      name: 'circuit_breaker_errors_total',
      help: 'Total number of circuit breaker errors',
      labelNames: ['name'],
    });

    this.circuitBreakerSuccessesCounter = new Counter({
      name: 'circuit_breaker_successes_total',
      help: 'Total number of circuit breaker successes',
      labelNames: ['name'],
    });

    this.circuitBreakerTimeoutsCounter = new Counter({
      name: 'circuit_breaker_timeouts_total',
      help: 'Total number of circuit breaker timeouts',
      labelNames: ['name'],
    });

    this.circuitBreakerFallbacksCounter = new Counter({
      name: 'circuit_breaker_fallbacks_total',
      help: 'Total number of circuit breaker fallbacks executed',
      labelNames: ['name'],
    });

    // Histogram para tempo de execução
    this.circuitBreakerExecutionTimeHistogram = new Histogram({
      name: 'circuit_breaker_execution_duration_seconds',
      help: 'Duration of circuit breaker executions in seconds',
      labelNames: ['name', 'result'], // result: 'success', 'error', 'timeout', 'fallback'
      buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30],
    });
  }

  /**
   * Atualiza métricas quando um circuit breaker muda de estado
   */
  updateStateMetrics(name: string, state: 'closed' | 'open' | 'halfOpen'): void {
    const stateValue = state === 'closed' ? 0 : state === 'open' ? 1 : 2;
    this.circuitBreakerStateGauge.set({ name }, stateValue);
  }

  /**
   * Registra uma execução bem-sucedida
   */
  recordSuccess(name: string, durationMs: number): void {
    this.circuitBreakerSuccessesCounter.inc({ name });
    this.circuitBreakerExecutionTimeHistogram.observe(
      { name, result: 'success' },
      durationMs / 1000,
    );
  }

  /**
   * Registra um erro
   */
  recordError(name: string, durationMs: number): void {
    this.circuitBreakerErrorsCounter.inc({ name });
    this.circuitBreakerExecutionTimeHistogram.observe({ name, result: 'error' }, durationMs / 1000);
  }

  /**
   * Registra um timeout
   */
  recordTimeout(name: string, durationMs: number): void {
    this.circuitBreakerTimeoutsCounter.inc({ name });
    this.circuitBreakerExecutionTimeHistogram.observe(
      { name, result: 'timeout' },
      durationMs / 1000,
    );
  }

  /**
   * Registra um fallback
   */
  recordFallback(name: string, durationMs: number): void {
    this.circuitBreakerFallbacksCounter.inc({ name });
    this.circuitBreakerExecutionTimeHistogram.observe(
      { name, result: 'fallback' },
      durationMs / 1000,
    );
  }

  /**
   * Atualiza todas as métricas baseado nas estatísticas atuais
   */
  updateMetricsFromStats(name: string, stats: any): void {
    // Estado atual
    const state = stats.opened ? 'open' : stats.halfOpen ? 'halfOpen' : 'closed';
    this.updateStateMetrics(name, state);

    // Nota: Counters são incrementais, então não podemos definir valores absolutos
    // As métricas de contadores são atualizadas em tempo real nos métodos acima
  }

  /**
   * Retorna as métricas no formato Prometheus
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Reseta todas as métricas (útil para testes)
   */
  resetMetrics(): void {
    register.resetMetrics();
    // Recriar as métricas após reset
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Re-inicializar métricas após reset
    this.circuitBreakerStateGauge.set({}, 0);
  }
}
