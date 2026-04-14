# 🚀 Circuit Breaker Load Tests

Testes de carga completos para validar a implementação de circuit breakers na criação de usuário.

## 📋 Visão Geral

Este conjunto de testes valida que:

- ✅ Usuários são sempre criados, mesmo com falhas externas
- ✅ Circuit breakers protegem contra cascata de falhas
- ✅ Sistema se recupera automaticamente
- ✅ Monitoramento funciona corretamente

## 🛠️ Pré-requisitos

### 1. **Aplicação Rodando**

```bash
# Iniciar aplicação
docker-compose up -d

# Verificar se está saudável
curl http://localhost:3000/health
```

### 2. **Dependências (Opcional - para testes avançados)**

```bash
# Artillery (recomendado para testes avançados)
npm install -g artillery

# jq (para parsing JSON)
brew install jq  # macOS
# ou
sudo apt-get install jq  # Linux
```

## 🎯 Tipos de Teste

### **1. Teste Simples (Recomendado)**

- ✅ Não requer dependências extras
- ✅ Usa apenas curl
- ✅ Fácil de executar
- ✅ Resultados em CSV

### **2. Teste Avançado (Artillery)**

- ✅ Cenários complexos
- ✅ Relatórios HTML
- ✅ Métricas detalhadas
- ✅ Simulação de usuários reais

## 🚀 Como Executar

### **Teste Simples**

```bash
# Teste básico: 5 minutos, 10 requests simultâneos
./load-tests/simple-load-test.sh

# Teste personalizado: 10 minutos, 20 requests simultâneos
./load-tests/simple-load-test.sh 600 20

# Teste rápido: 1 minuto, 5 requests simultâneos
./load-tests/simple-load-test.sh 60 5
```

**Resultado**: Arquivo CSV com métricas detalhadas

### **Teste Avançado (Artillery)**

```bash
# Executar teste completo com simulação de falhas
./load-tests/run-load-test.sh
```

**Resultado**: Relatório HTML completo + dados detalhados

## 📊 Visualizar Resultados

### **Dashboard Interativo**

```bash
# Abrir dashboard no navegador
open load-tests/dashboard.html
# ou
# python3 -m http.server 8000
# Abrir http://localhost:8000/load-tests/dashboard.html
```

### **Arquivos de Resultado**

```
load-tests/results/
├── simple-test-20240115-143022.csv    # Resultados simples
├── simple-test-20240115-143022.log    # Log detalhado
├── report.json                        # Dados Artillery
├── report.html                        # Relatório HTML
├── circuit_breaker_monitor.csv        # Estados CB
└── summary.txt                        # Resumo executivo
```

## 🎭 Cenários de Teste

### **Cenário 1: Funcionamento Normal**

```
Fase: Baseline (2 min)
- Todos os serviços funcionando
- Carga: 10 requests/min
✅ Esperado: 100% sucesso, 0 warnings
```

### **Cenário 2: Falha Parcial**

```
Fase: RabbitMQ down (3 min)
- Message queue indisponível
- Carga: 10 requests/min
✅ Esperado: 100% usuários criados, warnings de email/audit/CRM
```

### **Cenário 3: Falha Total**

```
Fase: Todos os serviços down (3 min)
- Todos os serviços externos falhando
- Carga: 10 requests/min
✅ Esperado: 100% usuários criados, 4 warnings por request
```

### **Cenário 4: Recuperação**

```
Fase: Serviços voltam (2 min)
- Serviços restaurados
- Carga: 10 requests/min
✅ Esperado: Warnings diminuem, circuit breakers fecham
```

## 📈 Métricas Principais

### **Taxa de Sucesso**

```bash
# Deve ser sempre 100%
Success Rate = (Successful Requests / Total Requests) × 100
```

### **Circuit Breakers**

```bash
# Ver estados em tempo real
curl http://localhost:3000/circuit-breaker/stats

# Estados possíveis:
# 0 = CLOSED (funcionando)
# 1 = HALF-OPEN (testando)
# 2 = OPEN (falhando)
```

### **Warnings por Request**

```bash
# Durante falhas, deve ser > 0
# Durante normal, deve ser = 0
Warnings per Request = Total Warnings / Successful Requests
```

## 🔍 Análise de Resultados

### **✅ Sucesso do Teste**

- [ ] **100% dos usuários criados** em todos os cenários
- [ ] **Circuit breakers abrem** quando serviços falham
- [ ] **Circuit breakers fecham** quando serviços recuperam
- [ ] **Warnings informativos** sobre falhas
- [ ] **Latência controlada** (< 2s mesmo com falhas)

### **🚨 Sinais de Problema**

- Usuários não sendo criados (success rate < 100%)
- Circuit breakers não abrem com falhas
- Latência muito alta (> 5s)
- Sem warnings quando deveriam existir

## 🐛 Troubleshooting

### **Aplicação não responde**

```bash
# Verificar se está rodando
docker-compose ps

# Ver logs
docker-compose logs app

# Reiniciar
docker-compose restart app
```

### **Circuit breakers não funcionam**

```bash
# Verificar endpoint
curl http://localhost:3000/circuit-breaker/stats

# Ver logs da aplicação
docker-compose logs app | grep -i circuit
```

### **Teste falha**

```bash
# Verificar conectividade
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'

# Verificar serviços externos
docker-compose ps
```

## 📝 Scripts Disponíveis

| Script                         | Descrição                    | Uso                                              |
| ------------------------------ | ---------------------------- | ------------------------------------------------ |
| `simple-load-test.sh`          | Teste simples com curl       | `./simple-load-test.sh [duration] [concurrency]` |
| `run-load-test.sh`             | Teste completo com Artillery | `./run-load-test.sh`                             |
| `simulate-service-failures.sh` | Simula falhas manuais        | `./simulate-service-failures.sh`                 |
| `dashboard.html`               | Dashboard interativo         | Abrir no navegador                               |

## 🎯 Exemplo Completo

```bash
# 1. Iniciar aplicação
docker-compose up -d

# 2. Aguardar inicialização
sleep 30

# 3. Executar teste simples
chmod +x load-tests/simple-load-test.sh
./load-tests/simple-load-test.sh 300 10

# 4. Ver resultados
cat load-tests/results/simple-test-*.csv | tail -10

# 5. Ver estado dos circuit breakers
curl http://localhost:3000/circuit-breaker/stats

# 6. Abrir dashboard
open load-tests/dashboard.html
```

## 📊 Métricas de Qualidade

### **Performance**

- **Throughput**: 10+ requests/min sob carga
- **Latência**: < 500ms (normal), < 2s (com falhas)
- **Disponibilidade**: 100% (sempre cria usuário)

### **Resiliência**

- **Circuit Breakers**: Funcionam corretamente
- **Recuperação**: Automática em < 1 min
- **Degradação**: Graceful com warnings

### **Observabilidade**

- **Métricas**: Tempo real via API
- **Logs**: Estruturados e informativos
- **Alertas**: Warnings no response

---

## 🎉 Conclusão

Com estes testes, você valida que sua implementação de circuit breakers:

- ✅ **Protege** contra falhas em cascata
- ✅ **Garante** criação de usuários mesmo com problemas externos
- ✅ **Recupera** automaticamente quando serviços voltam
- ✅ **Fornece** visibilidade completa do sistema

**Sistema resiliente e production-ready!** 🚀
