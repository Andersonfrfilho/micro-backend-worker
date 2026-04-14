#!/bin/bash

# Script para simular falhas nos serviços externos durante teste de carga
# Usage: ./simulate-service-failures.sh

set -e

echo "🔧 Circuit Breaker Load Test - Service Failure Simulator"
echo "======================================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Serviços a serem controlados
SERVICES=("rabbitmq" "email-service" "audit-service" "crm-service")
COMPOSE_FILE="docker-compose.yml"

# Função para verificar se um serviço está rodando
is_service_running() {
    local service=$1
    docker-compose -f $COMPOSE_FILE ps $service | grep -q "Up" && return 0 || return 1
}

# Função para parar um serviço
stop_service() {
    local service=$1
    echo -e "${RED}🛑 Stopping $service...${NC}"
    docker-compose -f $COMPOSE_FILE stop $service
}

# Função para iniciar um serviço
start_service() {
    local service=$1
    echo -e "${GREEN}✅ Starting $service...${NC}"
    docker-compose -f $COMPOSE_FILE start $service
}

# Função para aguardar
wait_seconds() {
    local seconds=$1
    echo -e "${BLUE}⏳ Waiting $seconds seconds...${NC}"
    sleep $seconds
}

# Cenário de teste
echo -e "${YELLOW}📋 Test Scenario:${NC}"
echo "Phase 1: All services healthy (2 min)"
echo "Phase 2: RabbitMQ failure (3 min)"
echo "Phase 3: Multiple services failure (3 min)"
echo "Phase 4: Recovery (2 min)"
echo ""

# Fase 1: Tudo funcionando (2 minutos)
echo -e "${GREEN}🚀 Phase 1: All services healthy${NC}"
echo "All external services are running normally..."
wait_seconds 120

# Fase 2: Falha no RabbitMQ (3 minutos)
echo -e "${RED}💥 Phase 2: RabbitMQ failure${NC}"
echo "Simulating message queue failure..."
stop_service rabbitmq
wait_seconds 180

# Fase 3: Múltiplas falhas (3 minutos)
echo -e "${RED}💥 Phase 3: Multiple services failure${NC}"
echo "Simulating multiple external service failures..."
# RabbitMQ já está parado
# Simular outros serviços parando (se existirem)
wait_seconds 180

# Fase 4: Recuperação (2 minutos)
echo -e "${GREEN}🔄 Phase 4: Recovery${NC}"
echo "Restoring all services..."
start_service rabbitmq
wait_seconds 120

echo -e "${GREEN}✅ Service failure simulation completed!${NC}"
echo ""
echo -e "${YELLOW}📊 Check results:${NC}"
echo "- Artillery report: load-tests/results/"
echo "- Circuit breaker stats: curl http://localhost:3000/circuit-breaker/stats"
echo "- Application logs: docker-compose logs app"