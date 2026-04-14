#!/bin/bash

# Teste de carga simples usando curl
# Usage: ./simple-load-test.sh [duration_seconds] [concurrency]

set -e

DURATION=${1:-300}  # 5 minutos por padrão
CONCURRENCY=${2:-10} # 10 requests simultâneos por padrão

echo "🧪 Simple Circuit Breaker Load Test"
echo "==================================="
echo "Duration: $DURATION seconds"
echo "Concurrency: $CONCURRENCY requests"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Criar diretório para resultados
mkdir -p load-tests/results

RESULTS_FILE="load-tests/results/simple-test-$(date +%Y%m%d-%H%M%S).csv"
LOG_FILE="load-tests/results/simple-test-$(date +%Y%m%d-%H%M%S).log"

# Headers do CSV
echo "timestamp,request_id,status_code,response_time,warnings_count,user_created,success" > "$RESULTS_FILE"

# Função para fazer uma request
make_request() {
    local request_id=$1
    local start_time=$(date +%s%N)

    # Gerar dados aleatórios
    local name="LoadTestUser$request_id"
    local email="loadtest$request_id-$(date +%s)@example.com"
    local phone="+551199999${request_id: -4}"

    # Fazer request
    local response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
        -X POST http://localhost:3000/users \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$name\",
            \"email\": \"$email\",
            \"phone\": \"$phone\",
            \"address\": {
                \"street\": \"Rua Teste $request_id\",
                \"city\": \"São Paulo\",
                \"state\": \"SP\",
                \"zipCode\": \"01234-567\"
            }
        }")

    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 )) # em ms

    # Parse response
    local body=$(echo "$response" | head -n -2)
    local status_code=$(echo "$response" | tail -n 2 | head -n 1)
    local curl_time=$(echo "$response" | tail -n 1)

    # Extrair informações do response
    local warnings_count=0
    local user_created="false"
    local success="false"

    if [ "$status_code" = "201" ]; then
        success="true"
        user_created="true"
        warnings_count=$(echo "$body" | jq -r '.warnings | length' 2>/dev/null || echo "0")
    fi

    # Log detalhado
    echo "$(date '+%Y-%m-%d %H:%M:%S'),$request_id,$status_code,${response_time}ms,$warnings_count,$user_created,$success" >> "$RESULTS_FILE"

    # Log simples para console
    if [ "$success" = "true" ]; then
        if [ "$warnings_count" -gt 0 ]; then
            echo -e "${YELLOW}⚠️  Request $request_id: $status_code (${response_time}ms) - $warnings_count warnings${NC}"
        else
            echo -e "${GREEN}✅ Request $request_id: $status_code (${response_time}ms)${NC}"
        fi
    else
        echo -e "${RED}❌ Request $request_id: $status_code (${response_time}ms)${NC}"
    fi
}

# Função para mostrar progresso
show_progress() {
    local current=$1
    local total=$2
    local percent=$(( current * 100 / total ))
    local progress_bar=""

    for ((i=0; i<50; i++)); do
        if [ $i -lt $((percent / 2)) ]; then
            progress_bar+="█"
        else
            progress_bar+="░"
        fi
    done

    echo -ne "\r${BLUE}Progress: [${progress_bar}] ${percent}% (${current}/${total})${NC}"
}

# Função para mostrar estatísticas em tempo real
show_stats() {
    local results_file=$1

    while true; do
        sleep 5

        if [ -f "$results_file" ]; then
            local total=$(tail -n +2 "$results_file" | wc -l)
            local success=$(tail -n +2 "$results_file" | grep ",true$" | wc -l)
            local warnings=$(tail -n +2 "$results_file" | awk -F',' '{sum += $5} END {print sum+0}')

            if [ "$total" -gt 0 ]; then
                local success_rate=$(( success * 100 / total ))
                echo -ne "\r${BLUE}Stats: $total requests, $success success ($success_rate%), $warnings warnings${NC}          "
            fi
        fi
    done
}

# Iniciar monitoramento em background
show_stats "$RESULTS_FILE" &
STATS_PID=$!

# Executar teste
echo -e "${BLUE}🚀 Starting load test...${NC}"
echo "Results will be saved to: $RESULTS_FILE"
echo ""

start_time=$(date +%s)
request_count=0

while [ $(($(date +%s) - start_time)) -lt $DURATION ]; do
    # Controlar concorrência
    running_jobs=$(jobs -p | wc -l)
    while [ $running_jobs -ge $CONCURRENCY ]; do
        sleep 0.1
        running_jobs=$(jobs -p | wc -l)
    done

    # Fazer request em background
    make_request $request_count &
    request_count=$((request_count + 1))

    # Mostrar progresso
    show_progress $(( $(date +%s) - start_time )) $DURATION

    # Pequeno delay para não sobrecarregar
    sleep 0.1
done

# Aguardar todas as requests terminarem
echo -e "\n${BLUE}⏳ Waiting for remaining requests to complete...${NC}"
wait

# Parar monitoramento
kill $STATS_PID 2>/dev/null || true

echo -e "\n${GREEN}✅ Load test completed!${NC}"
echo ""

# Calcular estatísticas finais
total_requests=$(tail -n +2 "$RESULTS_FILE" | wc -l)
successful_requests=$(tail -n +2 "$RESULTS_FILE" | grep ",true$" | wc -l)
failed_requests=$((total_requests - successful_requests))
total_warnings=$(tail -n +2 "$RESULTS_FILE" | awk -F',' '{sum += $5} END {print sum+0}')
avg_response_time=$(tail -n +2 "$RESULTS_FILE" | awk -F',' '{sum += $4} END {if (NR>0) print int(sum/(NR-1)) "ms"; else print "0ms"}')

if [ "$total_requests" -gt 0 ]; then
    success_rate=$(( successful_requests * 100 / total_requests ))
    warnings_per_request=$(echo "scale=2; $total_warnings / $successful_requests" | bc 2>/dev/null || echo "0")

    echo "📊 Final Results:"
    echo "================="
    echo "Total Requests: $total_requests"
    echo "Successful: $successful_requests ($success_rate%)"
    echo "Failed: $failed_requests"
    echo "Average Response Time: $avg_response_time"
    echo "Total Warnings: $total_warnings"
    echo "Warnings per Successful Request: $warnings_per_request"
    echo ""
    echo "📁 Results saved to: $RESULTS_FILE"
    echo ""

    # Verificar circuit breakers
    echo "🔍 Circuit Breaker Status:"
    if curl -s http://localhost:3000/circuit-breaker/stats > /dev/null 2>&1; then
        curl -s http://localhost:3000/circuit-breaker/stats | jq '.' 2>/dev/null || curl -s http://localhost:3000/circuit-breaker/stats
    else
        echo "Circuit breaker endpoint not available"
    fi
else
    echo "No requests were made. Check your configuration."
fi