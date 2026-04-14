#!/bin/bash

# Script completo para executar teste de carga com circuit breakers
# Usage: ./run-load-test.sh

set -e

echo "🚀 Circuit Breaker Load Test Suite"
echo "=================================="

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar dependências
check_dependencies() {
    echo -e "${BLUE}🔍 Checking dependencies...${NC}"

    if ! command -v artillery &> /dev/null; then
        echo -e "${RED}❌ Artillery not found. Installing...${NC}"
        npm install -g artillery
    fi

    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}⚠️  jq not found. Installing...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install jq
        else
            sudo apt-get update && sudo apt-get install -y jq
        fi
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ docker-compose not found. Please install Docker and Docker Compose.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Dependencies OK${NC}"
}

# Verificar se a aplicação está rodando
check_application() {
    echo -e "${BLUE}🔍 Checking application status...${NC}"

    if ! curl -s http://localhost:3000/health &> /dev/null; then
        echo -e "${RED}❌ Application not running. Starting...${NC}"
        docker-compose up -d
        echo "Waiting for application to start..."
        sleep 30
    fi

    if curl -s http://localhost:3000/health | jq -e '.status == "ok"' &> /dev/null; then
        echo -e "${GREEN}✅ Application is healthy${NC}"
    else
        echo -e "${RED}❌ Application health check failed${NC}"
        exit 1
    fi
}

# Função para monitorar circuit breakers em background
monitor_circuit_breakers() {
    echo -e "${BLUE}📊 Starting circuit breaker monitor...${NC}"

    # Criar diretório para logs
    mkdir -p load-tests/results

    # Monitor em background
    (
        echo "timestamp,phase,email_state,audit_state,crm_state,risk_state,total_users,warnings" > load-tests/results/circuit_breaker_monitor.csv

        while true; do
            timestamp=$(date '+%Y-%m-%d %H:%M:%S')

            # Tentar pegar stats dos circuit breakers
            if stats=$(curl -s http://localhost:3000/circuit-breaker/stats 2>/dev/null); then
                email_state=$(echo $stats | jq -r '.["email-service"]?.state // "unknown"')
                audit_state=$(echo $stats | jq -r '.["audit-service"]?.state // "unknown"')
                crm_state=$(echo $stats | jq -r '.["crm-service"]?.state // "unknown"')
                risk_state=$(echo $stats | jq -r '.["risk-analysis-service"]?.state // "unknown"')
            else
                email_state="unknown"
                audit_state="unknown"
                crm_state="unknown"
                risk_state="unknown"
            fi

            # Pegar métricas de usuários (se Prometheus estiver disponível)
            total_users="unknown"
            warnings="unknown"

            echo "$timestamp,unknown,$email_state,$audit_state,$crm_state,$risk_state,$total_users,$warnings" >> load-tests/results/circuit_breaker_monitor.csv

            sleep 10
        done
    ) &
    MONITOR_PID=$!

    echo -e "${GREEN}✅ Monitor started (PID: $MONITOR_PID)${NC}"
}

# Função para executar teste de carga
run_load_test() {
    echo -e "${YELLOW}🎯 Starting Artillery load test...${NC}"

    mkdir -p load-tests/results

    artillery run \
        --config load-tests/user-creation-load-test.yml \
        --output load-tests/results/report.json \
        --overrides '{"config": {"target": "http://localhost:3000"}}'

    echo -e "${GREEN}✅ Load test completed${NC}"
}

# Função para executar simulador de falhas
run_failure_simulation() {
    echo -e "${YELLOW}💥 Starting service failure simulation...${NC}"

    chmod +x load-tests/simulate-service-failures.sh
    ./load-tests/simulate-service-failures.sh &
    FAILURE_PID=$!

    echo -e "${GREEN}✅ Failure simulation started (PID: $FAILURE_PID)${NC}"
}

# Função para gerar relatório
generate_report() {
    echo -e "${BLUE}📊 Generating test report...${NC}"

    # Aguardar um pouco para garantir que todos os dados foram coletados
    sleep 5

    # Kill monitor
    if [ ! -z "$MONITOR_PID" ]; then
        kill $MONITOR_PID 2>/dev/null || true
    fi

    # Kill failure simulation
    if [ ! -z "$FAILURE_PID" ]; then
        kill $FAILURE_PID 2>/dev/null || true
    fi

    # Gerar relatório HTML
    artillery report load-tests/results/report.json --output load-tests/results/report.html

    # Coletar métricas finais
    echo "=== FINAL METRICS ===" > load-tests/results/summary.txt
    echo "Test completed at: $(date)" >> load-tests/results/summary.txt
    echo "" >> load-tests/results/summary.txt

    if [ -f "load-tests/results/report.json" ]; then
        echo "Artillery Results:" >> load-tests/results/summary.txt
        jq -r '.aggregate' load-tests/results/report.json >> load-tests/results/summary.txt 2>/dev/null || echo "Could not parse Artillery results" >> load-tests/results/summary.txt
    fi

    echo "" >> load-tests/results/summary.txt
    echo "Final Circuit Breaker States:" >> load-tests/results/summary.txt
    curl -s http://localhost:3000/circuit-breaker/stats >> load-tests/results/summary.txt 2>/dev/null || echo "Could not fetch circuit breaker stats" >> load-tests/results/summary.txt

    echo "" >> load-tests/results/summary.txt
    echo "Test Results:" >> load-tests/results/summary.txt
    echo "- Report: load-tests/results/report.html" >> load-tests/results/summary.txt
    echo "- Raw data: load-tests/results/report.json" >> load-tests/results/summary.txt
    echo "- Monitor data: load-tests/results/circuit_breaker_monitor.csv" >> load-tests/results/summary.txt
    echo "- Summary: load-tests/results/summary.txt" >> load-tests/results/summary.txt

    echo -e "${GREEN}✅ Report generated: load-tests/results/summary.txt${NC}"
    echo -e "${GREEN}📈 HTML Report: load-tests/results/report.html${NC}"
}

# Função principal
main() {
    echo "Starting Circuit Breaker Load Test Suite..."

    check_dependencies
    check_application
    monitor_circuit_breakers

    # Executar teste e simulação em paralelo
    run_failure_simulation &
    FAILURE_PID=$!

    sleep 30  # Aguardar simulação começar

    run_load_test

    # Aguardar simulação terminar
    wait $FAILURE_PID 2>/dev/null || true

    generate_report

    echo ""
    echo -e "${GREEN}🎉 Load test completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📊 Results:${NC}"
    echo "- HTML Report: load-tests/results/report.html"
    echo "- Summary: load-tests/results/summary.txt"
    echo "- Circuit Breaker Monitor: load-tests/results/circuit_breaker_monitor.csv"
    echo ""
    echo -e "${BLUE}🔍 Key metrics to check:${NC}"
    echo "- User creation success rate (should be 100%)"
    echo "- Circuit breaker states during failures"
    echo "- Response times under load"
    echo "- Warning rates during service failures"
}

# Executar função principal
main "$@"