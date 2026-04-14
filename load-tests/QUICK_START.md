# Exemplo: Executando Teste de Carga dos Circuit Breakers

## 🎯 Objetivo
Demonstrar que os circuit breakers funcionam corretamente, garantindo que usuários sejam sempre criados mesmo com falhas em serviços externos.

## 🚀 Execução Rápida

### **1. Verificar Setup**
```bash
# Verificar se aplicação está rodando
curl http://localhost:3000/health

# Se não estiver, iniciar
docker-compose up -d
sleep 30
```

### **2. Executar Teste Simples**
```bash
# Teste de 2 minutos com 5 requests simultâneos
./test.sh quick

# Ou manualmente:
./load-tests/simple-load-test.sh 120 5
```

### **3. Ver Resultados**
```bash
# Ver métricas finais
tail -20 load-tests/results/simple-test-*.csv

# Exemplo de output:
# timestamp,request_id,status_code,response_time,warnings_count,user_created,success
# 2024-01-15 14:30:15,1,201,245ms,0,true,true
# 2024-01-15 14:30:16,2,201,198ms,0,true,true
# 2024-01-15 14:30:17,3,201,312ms,0,true,true
```

### **4. Simular Falhas**
```bash
# Em outro terminal, simular falhas
./load-tests/simulate-service-failures.sh
```

### **5. Ver Circuit Breakers**
```bash
# Durante as falhas, ver estado dos circuit breakers
curl http://localhost:3000/circuit-breaker/stats

# Resultado esperado:
{
  "email-service": {
    "state": 2,  // OPEN
    "errors": 5,
    "errorRate": 100.0
  },
  "audit-service": {
    "state": 2,  // OPEN
    "errors": 5,
    "errorRate": 100.0
  }
  // ... outros serviços
}
```

### **6. Verificar Criação de Usuários**
Mesmo com circuit breakers abertos, usuários continuam sendo criados:

```bash
# Criar usuário manualmente durante falhas
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+5511999999999",
    "address": {
      "street": "Rua Teste",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567"
    }
  }'

# ✅ Resposta: 201 Created com warnings
{
  "success": true,
  "data": {
    "id": "user-123",
    "name": "Test User",
    "email": "test@example.com"
  },
  "warnings": [
    "email service temporarily unavailable",
    "audit service temporarily unavailable",
    "crm service temporarily unavailable",
    "risk-analysis service temporarily unavailable"
  ],
  "message": "User created, but some services unavailable"
}
```

## 📊 Análise dos Resultados

### **✅ Sucesso**
- **100% dos usuários criados** mesmo com falhas externas
- **Circuit breakers abriram** protegendo contra cascata
- **Warnings informativos** sobre serviços indisponíveis
- **Sistema resiliente** e fault-tolerant

### **📈 Métricas Chave**
- **Success Rate**: 100% (sempre cria usuário)
- **Warnings/Request**: 0 (normal) → 4 (com falhas)
- **Circuit Breaker States**: CLOSED (normal) → OPEN (falhas)
- **Response Time**: < 500ms (consistente)

## 🎉 Conclusão

**Os circuit breakers estão funcionando perfeitamente!**

- ✅ **Proteção**: Evitam cascata de falhas
- ✅ **Resiliência**: Usuários sempre criados
- ✅ **Recuperação**: Automática quando serviços voltam
- ✅ **Observabilidade**: Monitoramento em tempo real

**Sistema production-ready!** 🚀

---

## 🛠️ Próximos Passos

1. **Teste Completo**: `./test.sh full` (10 minutos)
2. **Dashboard**: Abrir `load-tests/dashboard.html`
3. **Monitoramento**: Configurar alertas em produção
4. **Deploy**: Implementar em staging/production