# Próximos Passos - Implementação de Observabilidade e Resiliência

## Visão Geral

Este documento descreve os próximos passos para implementar recursos avançados de observabilidade e resiliência no backend-worker, seguindo as melhores práticas de sistemas distribuídos.

## 1. Alerting - Configurar alertas no Prometheus

### 1.1 Configurar Alertmanager

- [ ] Instalar e configurar Alertmanager no docker-compose
- [ ] Criar regras de alerta para métricas críticas:
  - Taxa de erro > 5%
  - Latência > 500ms (p95)
  - Uso de CPU/Memória > 80%
  - Conexões RabbitMQ perdidas
- [ ] Configurar integração com Slack/Teams para notificações

### 1.2 Regras de Alerta Específicas

- [ ] `HighErrorRate`: Alertar quando taxa de erro > 5% por 5 minutos
- [ ] `HighLatency`: Alertar quando latência p95 > 500ms por 10 minutos
- [ ] `QueueConsumerDown`: Alertar quando consumer para por 2 minutos
- [ ] `RabbitMQConnectionLost`: Alertar quando conexão com RabbitMQ cai

### 1.3 Dashboard de Alertas

- [ ] Criar dashboard no Grafana para visualizar alertas ativos
- [ ] Configurar alertas silenciáveis por ambiente (dev/staging/prod)

## 2. Tracing - Adicionar OpenTelemetry + Jaeger

### 2.1 Instalar Jaeger

- [ ] Adicionar Jaeger ao docker-compose.yml
- [ ] Configurar collector OpenTelemetry
- [ ] Instalar dependências: `@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/exporter-jaeger`

### 2.2 Instrumentação Automática

- [ ] Configurar auto-instrumentação do NestJS
- [ ] Instrumentar chamadas HTTP (axios)
- [ ] Instrumentar conexões RabbitMQ
- [ ] Instrumentar queries de banco de dados

### 2.3 Tracing Manual

- [ ] Criar spans customizados para:
  - Processamento de mensagens RabbitMQ
  - Validação de mensagens
  - Chamadas para serviços externos
  - Operações de banco de dados
- [ ] Adicionar baggage para propagação de contexto
- [ ] Configurar sampling (1% em prod, 100% em dev)

### 2.4 Visualização

- [ ] Configurar Jaeger UI no docker-compose
- [ ] Criar dashboard no Grafana para métricas de tracing
- [ ] Documentar como usar Jaeger UI para debugging

## 3. Logs Centralizados - ELK Stack ou Loki

### 3.1 Escolher Stack

- [ ] Decidir entre ELK (Elasticsearch + Logstash + Kibana) ou Loki + Promtail + Grafana
- [ ] Para simplicidade: Loki + Promtail (mais leve)

### 3.2 Configurar Loki Stack

- [ ] Adicionar Loki, Promtail e Grafana ao docker-compose
- [ ] Configurar Promtail para coletar logs dos containers
- [ ] Criar pipeline de logs estruturados

### 3.3 Estruturar Logs

- [ ] Padronizar formato de logs JSON
- [ ] Adicionar campos obrigatórios:
  - `timestamp`
  - `level`
  - `service`
  - `correlationId`
  - `userId` (quando aplicável)
  - `operation`
  - `duration` (para operações)
- [ ] Criar labels para filtros: `environment`, `version`, `queue_name`

### 3.4 Dashboards e Alertas

- [ ] Criar dashboards no Grafana para logs
- [ ] Configurar alertas baseados em logs (ex: "ERROR" frequente)
- [ ] Implementar busca avançada por correlationId

## 4. Health Checks - Endpoints de saúde detalhados

### 4.1 Endpoint Básico

- [x] Criar endpoint `/health` que retorna status geral
- [x] Verificar conectividade básica (banco, RabbitMQ)

### 4.2 Health Checks Detalhados

- [ ] Endpoint `/health/ready` - aplicação pronta para receber tráfego
- [ ] Endpoint `/health/live` - aplicação viva (liveness probe)
- [ ] Endpoint `/health/deep` - verificações profundas:
  - Conectividade com dependências externas
  - Status das filas RabbitMQ
  - Performance das queries de banco

### 4.3 Métricas de Health

- [ ] Expor métricas Prometheus para health checks
- [ ] Tempo de resposta dos health checks
- [ ] Status histórico dos componentes

### 4.4 Integração com K8s/Docker

- [ ] Configurar liveness e readiness probes
- [ ] Usar health checks para rolling updates seguros

## 5. Circuit Breaker - Resilience4j

### 5.1 Instalar Resilience4j

- [ ] Adicionar dependências: `resilience4j-spring-boot2` ou biblioteca Node.js equivalente
- [ ] Para Node.js: usar `opossum` ou implementar circuit breaker customizado

### 5.2 Configurar Circuit Breakers

- [ ] Para chamadas HTTP externas (se houver)
- [ ] Para conexões RabbitMQ
- [ ] Para queries de banco de dados críticas

### 5.3 Estratégias de Fallback

- [ ] Implementar fallbacks para operações críticas:
  - Cache local para dados frequentemente acessados
  - Modo degradado para funcionalidades não-essenciais
  - Queue de retry para operações falhadas

### 5.4 Monitoramento

- [ ] Métricas de circuit breaker no Prometheus
- [ ] Estados: CLOSED, OPEN, HALF_OPEN
- [ ] Dashboard no Grafana para visualizar circuit breakers

## 6. Ordem de Implementação Recomendada

1. **Semana 1-2**: Alerting (Prometheus + Alertmanager)
2. **Semana 3**: Health Checks detalhados
3. **Semana 4**: Logs Centralizados (Loki)
4. **Semana 5**: Tracing (OpenTelemetry + Jaeger)
5. **Semana 6**: Circuit Breaker

## 7. Critérios de Aceitação

- [ ] Todos os componentes têm métricas e alertas configurados
- [ ] Tracing cobre 100% das operações críticas
- [ ] Logs são estruturados e centralizados
- [ ] Health checks permitem deployment zero-downtime
- [ ] Circuit breakers previnem cascata de falhas
- [ ] Dashboards fornecem visibilidade completa do sistema

## 8. Dependências e Versionamento

- Prometheus: v2.40+
- Grafana: v9.0+
- Jaeger: v1.40+
- Loki: v2.7+
- OpenTelemetry: v1.15+
- Resilience4j/Opossom: versões estáveis mais recentes

## 9. Documentação

- [ ] README atualizado com instruções de uso
- [ ] Runbook para troubleshooting com tracing
- [ ] Guia de configuração para diferentes ambientes</content>
      <parameter name="filePath">/Users/user/Documents/personal/backend-worker/ROADMAP_IMPLEMENTATION.md
