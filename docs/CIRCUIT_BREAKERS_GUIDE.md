# Circuit Breakers - Guia de Implementação

## Visão Geral

Os Circuit Breakers implementados neste projeto fornecem resiliência contra falhas em cascata, protegendo chamadas para serviços externos e garantindo que o sistema continue funcionando mesmo quando dependências falham.

## Funcionalidades Implementadas

### ✅ Circuit Breaker Service

- Gerenciamento automático de estados (Closed/Open/Half-Open)
- Configuração flexível por serviço
- Métricas integradas com Prometheus
- Fallbacks automáticos

### ✅ Health Checks

- Verificação de saúde dos circuit breakers
- Integração com `/health/deep`
- Detecção automática de circuit breakers abertos

### ✅ Métricas Prometheus

- `circuit_breaker_state` - Estado atual (0=closed, 1=open, 2=half-open)
- `circuit_breaker_successes_total` - Total de sucessos
- `circuit_breaker_errors_total` - Total de erros
- `circuit_breaker_timeouts_total` - Total de timeouts
- `circuit_breaker_fallbacks_total` - Total de fallbacks
- `circuit_breaker_execution_duration_seconds` - Tempo de execução

### ✅ Dashboard Grafana

- Visualização em tempo real dos estados
- Taxas de sucesso/erro
- Histogramas de latência
- Tabela de eventos

## Como Usar

### 1. Usando Decorators (Recomendado)

```typescript
import { CircuitBreaker } from './circuit-breaker.decorator';

export class PaymentService {
  @CircuitBreaker('payment-api', 5000) // 5s timeout
  async processPayment(data: any) {
    return await this.externalPaymentAPI.charge(data);
  }
}
```

### 2. Usando Service Diretamente

```typescript
import { CircuitBreakerService } from './circuit-breaker.service';

export class ApiService {
  constructor(private circuitBreaker: CircuitBreakerService) {}

  async callExternalApi() {
    return this.circuitBreaker.execute(
      'external-api',
      async () => await fetch('https://api.example.com'),
      [],
      { timeout: 3000 },
      async () => ({ status: 'fallback' }), // Fallback
    );
  }
}
```

### 3. Verificando Status

```bash
# Status dos circuit breakers
curl http://localhost:3000/circuit-breaker/stats

# Métricas Prometheus
curl http://localhost:3000/circuit-breaker/metrics

# Health check incluindo circuit breakers
curl http://localhost:3000/health/deep
```

### 4. Testando Circuit Breakers

```bash
# Testar API externa
make circuit-breaker-test-external-api

# Testar pagamentos
make circuit-breaker-test-payment

# Resetar todos os circuit breakers
make circuit-breaker-reset
```

## Configuração

### Parâmetros Padrão

```typescript
{
  timeout: 5000,           // 5 segundos
  errorThresholdPercentage: 50,  // 50% de erro abre o circuit
  resetTimeout: 30000,     // 30 segundos para tentar fechar
}
```

### Configuração Personalizada

```typescript
@CircuitBreaker('critical-service', 10000) // 10s timeout
async criticalOperation() {
  // Operação crítica com timeout maior
}
```

## Estados do Circuit Breaker

### 🔒 CLOSED (Fechado)

- Estado normal de operação
- Todas as chamadas passam normalmente
- Contagem de erros é monitorada

### 🔓 OPEN (Aberto)

- Muitos erros detectados
- Chamadas falham imediatamente (fast-fail)
- Fallback é executado se configurado

### 🔄 HALF-OPEN (Meio-Aberto)

- Testando se o serviço voltou
- Permite algumas chamadas passarem
- Se sucesso → volta para CLOSED
- Se falha → volta para OPEN

## Estratégias de Fallback

### Fallback Simples

```typescript
async () => ({ status: 'service-unavailable', data: null });
```

### Fallback com Cache

```typescript
async () => {
  return await this.cache.get('fallback-data');
};
```

### Fallback em Cascata

```typescript
async () => {
  return await this.secondaryService.getData();
};
```

## Monitoramento

### Métricas Principais

1. **Taxa de Erro**: `rate(circuit_breaker_errors_total[5m])`
2. **Taxa de Sucesso**: `rate(circuit_breaker_successes_total[5m])`
3. **Latência P95**: `histogram_quantile(0.95, rate(circuit_breaker_execution_duration_seconds_bucket[5m]))`
4. **Estado Atual**: `circuit_breaker_state`

### Alertas Recomendados

```yaml
# Circuit breaker aberto por muito tempo
- alert: CircuitBreakerOpen
  expr: circuit_breaker_state == 1
  for: 5m
  labels:
    severity: warning

# Alta taxa de erro
- alert: CircuitBreakerHighErrorRate
  expr: rate(circuit_breaker_errors_total[5m]) / rate(circuit_breaker_successes_total[5m]) > 0.5
  for: 2m
  labels:
    severity: warning
```

## Boas Práticas

### ✅ FAÇA

- Use circuit breakers para APIs externas
- Configure timeouts apropriados
- Implemente fallbacks significativos
- Monitore métricas regularmente
- Teste cenários de falha

### ❌ NÃO FAÇA

- Use circuit breakers para operações locais rápidas
- Configure timeouts muito altos
- Ignore métricas de monitoramento
- Use circuit breakers sem fallbacks
- Configure thresholds muito baixos

## Exemplos de Uso no Projeto

### External API Service

```typescript
@CircuitBreaker('payment-service')
async processPayment(data) {
  return await paymentAPI.charge(data);
}

@CircuitBreaker('email-service')
async sendWelcomeEmail(user) {
  return await emailAPI.send(user.email, 'Welcome!');
}
```

### Database Operations

```typescript
@CircuitBreaker('database-sync', 10000)
async syncWithExternalDB(data) {
  return await externalDB.sync(data);
}
```

## Troubleshooting

### Circuit Breaker Sempre Aberto

- Verifique conectividade com o serviço
- Ajuste `errorThresholdPercentage`
- Verifique se o serviço está realmente indisponível

### Alto Tempo de Resposta

- Ajuste `timeout` para valores mais realistas
- Considere implementar cache
- Verifique se há gargalos na rede

### Fallbacks Não Funcionam

- Certifique-se de que o fallback retorna o mesmo tipo
- Verifique se há erros no código do fallback
- Use logs para debug

## Próximos Passos

- [ ] Implementar circuit breakers distribuídos (Redis)
- [ ] Adicionar configuração dinâmica via API
- [ ] Implementar bulkhead pattern
- [ ] Adicionar testes de carga
- [ ] Documentação avançada

---

**Circuit Breakers**: A diferença entre um sistema que quebra e um que se adapta! 🔌✨
