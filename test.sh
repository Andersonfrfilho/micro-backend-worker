#!/bin/bash

# Atalho rápido para testes de carga
# Usage: ./test.sh [type] [duration] [concurrency]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função de ajuda
show_help() {
    echo -e "${BLUE}🚀 Circuit Breaker Load Test Quick Start${NC}"
    echo ""
    echo "Usage: $0 [TYPE] [DURATION] [CONCURRENCY]"
    echo ""
    echo "Types:"
    echo "  simple    - Basic curl-based test (default)"
    echo "  full      - Complete Artillery test with failure simulation"
    echo "  quick     - 1 minute simple test"
    echo "  stress    - High concurrency test"
    echo ""
    echo "Examples:"
    echo "  $0                    # Simple test: 5min, 10 concurrent"
    echo "  $0 simple 300 20     # Simple test: 5min, 20 concurrent"
    echo "  $0 full               # Full Artillery test"
    echo "  $0 quick              # Quick 1min test"
    echo "  $0 stress             # Stress test: 2min, 50 concurrent"
    echo ""
    echo "Results will be saved to: load-tests/results/"
    echo "Dashboard: load-tests/dashboard.html"
}

# Verificar pré-requisitos
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

    # Verificar se aplicação está rodando
    if ! curl -s http://localhost:3000/health &> /dev/null; then
        echo -e "${YELLOW}⚠️  Application not running. Starting...${NC}"
        docker-compose up -d
        echo "Waiting 30 seconds for startup..."
        sleep 30
    fi

    if curl -s http://localhost:3000/health | jq -e '.status == "ok"' &> /dev/null 2>/dev/null; then
        echo -e "${GREEN}✅ Application is healthy${NC}"
    else
        echo -e "${RED}❌ Application health check failed${NC}"
        echo -e "${YELLOW}💡 Make sure the application is running on http://localhost:3000${NC}"
        exit 1
    fi
}

# Teste simples
run_simple_test() {
    local duration=${1:-300}
    local concurrency=${2:-10}

    echo -e "${GREEN}🧪 Running Simple Load Test${NC}"
    echo -e "${BLUE}Duration: $duration seconds${NC}"
    echo -e "${BLUE}Concurrency: $concurrency requests${NC}"
    echo ""

    ./simple-load-test.sh "$duration" "$concurrency"
}

# Teste completo
run_full_test() {
    echo -e "${GREEN}🚀 Running Full Load Test (Artillery + Failure Simulation)${NC}"
    echo -e "${YELLOW}This will take about 10 minutes...${NC}"
    echo ""

    # Verificar se Artillery está instalado
    if ! command -v artillery &> /dev/null; then
        echo -e "${RED}❌ Artillery not found. Installing...${NC}"
        npm install -g artillery
    fi

    ./run-load-test.sh
}

# Teste rápido
run_quick_test() {
    echo -e "${GREEN}⚡ Running Quick Test (1 minute)${NC}"
    echo ""

    run_simple_test 60 5
}

# Teste de stress
run_stress_test() {
    echo -e "${GREEN}💥 Running Stress Test${NC}"
    echo -e "${YELLOW}High concurrency may stress your system!${NC}"
    echo ""

    run_simple_test 120 50
}

# Mostrar resultados
show_results() {
    echo ""
    echo -e "${GREEN}📊 Test Results:${NC}"

    # Encontrar arquivo de resultado mais recente
    local latest_result=$(find load-tests/results/ -name "*.csv" -o -name "*.json" | sort | tail -1)

    if [ -n "$latest_result" ]; then
        echo -e "${BLUE}Latest results: $latest_result${NC}"

        if [[ $latest_result == *.csv ]]; then
            echo ""
            echo -e "${YELLOW}📈 Summary:${NC}"
            # Calcular métricas básicas do CSV
            local total=$(tail -n +2 "$latest_result" | wc -l)
            local success=$(tail -n +2 "$latest_result" | grep ",true$" | wc -l)
            local warnings=$(tail -n +2 "$latest_result" | awk -F',' '{sum += $5} END {print sum+0}')

            if [ "$total" -gt 0 ]; then
                local success_rate=$(( success * 100 / total ))
                echo "Total Requests: $total"
                echo "Success Rate: $success_rate%"
                echo "Total Warnings: $warnings"
            fi
        fi
    fi

    echo ""
    echo -e "${BLUE}🔍 Circuit Breaker Status:${NC}"
    if curl -s http://localhost:3000/circuit-breaker/stats > /dev/null 2>&1; then
        curl -s http://localhost:3000/circuit-breaker/stats | jq '.' 2>/dev/null || curl -s http://localhost:3000/circuit-breaker/stats
    else
        echo "Circuit breaker endpoint not available"
    fi

    echo ""
    echo -e "${GREEN}📁 View detailed results:${NC}"
    echo "Dashboard: load-tests/dashboard.html"
    echo "Results: load-tests/results/"
}

# Main
main() {
    local test_type=${1:-simple}
    local duration=${2:-300}
    local concurrency=${3:-10}

    case $test_type in
        "help"|"-h"|"--help")
            show_help
            exit 0
            ;;
        "simple")
            check_prerequisites
            run_simple_test "$duration" "$concurrency"
            ;;
        "full")
            check_prerequisites
            run_full_test
            ;;
        "quick")
            check_prerequisites
            run_quick_test
            ;;
        "stress")
            check_prerequisites
            run_stress_test
            ;;
        *)
            echo -e "${RED}❌ Unknown test type: $test_type${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac

    show_results
}

# Executar
main "$@"