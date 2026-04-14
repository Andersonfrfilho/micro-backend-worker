# ========================
# Variáveis de ambiente
# ========================
ENV_FILE := .env
ENV_DEV_LOCAL_FILE := .env.dev.local
ENV_EXAMPLE := .env.example
COMPOSE_FILE := docker-compose.yml  # Defina o arquivo docker-compose explicitamente

# Se o .env existir, carrega suas variáveis no Makefile
ifneq ("$(wildcard $(ENV_FILE))","")
include $(ENV_FILE)
export
endif

# ========================
# Regras
# ========================

# Regra para garantir que o .env exista
setup-env:
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "⚙️  Criando $(ENV_FILE) a partir de $(ENV_EXAMPLE)..."; \
		cp $(ENV_EXAMPLE) $(ENV_FILE); \
	else \
		echo "✅ $(ENV_FILE) já existe — nada a fazer."; \
	fi

# ========================
# Migrations
# ========================

migrate: setup-env
	npm run migration:run

migrate-revert: setup-env
	npm run migration:revert

migrate-show: setup-env
	npm run migration:show

# Run migrations inside the docker container
docker-migrate: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) exec worker npm run migration:run

docker-migrate-revert: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) exec worker npm run migration:revert

docker-migrate-show: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) exec worker npm run migration:show

# ========================
# Docker commands
# ========================

app: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d worker

database_postgres: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d database_postgres

database_postgres-down: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down database_postgres

database_postgres-stop: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) stop database_postgres

queue_rabbitmq: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d queue_rabbitmq
queue_rabbitmq-down: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down queue_rabbitmq
queue_rabbitmq-stop: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) stop queue_rabbitmq

sonar-up: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d sonarqube sonar-db

sonar-down: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down sonarqube sonar-db

sonar-scan: setup-env
	npm run sonar  # Executa o script de análise do SonarQube definido no package.json

# ========================
# Monitoring commands
# ========================

monitoring: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d prometheus grafana alertmanager

monitoring-down: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down prometheus grafana alertmanager

monitoring-stop: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) stop prometheus grafana alertmanager

prometheus: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d prometheus

prometheus-down: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down prometheus

grafana: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d grafana

grafana-down: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down grafana

alertmanager: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d alertmanager

alertmanager-down: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down alertmanager

# ========================
# Tracing commands
# ========================

tracing: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d jaeger

tracing-down: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down jaeger

tracing-stop: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) stop jaeger

jaeger: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d jaeger

jaeger-down: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down jaeger

# ========================
# Logging commands
# ========================

logging: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d loki promtail

logging-down: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down loki promtail

logging-stop: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) stop loki promtail

loki: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d loki

loki-down: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down loki

promtail: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d promtail

promtail-down: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down promtail

# ========================
# Observability stack
# ========================

observability: setup-env
	@echo "🔍 Iniciando stack completa de observabilidade..."
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d prometheus grafana alertmanager jaeger loki promtail
	@echo "✅ Stack de observabilidade iniciada!"
	@echo "   📊 Prometheus: http://localhost:9090"
	@echo "   📈 Grafana: http://localhost:3000 (admin/admin)"
	@echo "   🚨 Alertmanager: http://localhost:9093"
	@echo "   🔍 Jaeger: http://localhost:16686"
	@echo "   📝 Loki: http://localhost:3100"

observability-down: setup-env
	@echo "🛑 Parando stack de observabilidade..."
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down prometheus grafana alertmanager jaeger loki promtail
	@echo "✅ Stack de observabilidade parada!"

observability-stop: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) stop prometheus grafana alertmanager jaeger loki promtail

stop: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) stop

down: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down $(SERVICE_NAME)  # Use SERVICE_NAME se definido, ou remova se não necessário

force-remove: setup-env
	docker rm -f $(shell docker ps -a -q --filter "name=$(SERVICE_NAME)")

clean: setup-env
	@echo "🧹 Limpando containers, redes e volumes do projeto $(PROJECT_NAME)..."
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down -v --remove-orphans
	@echo "🧽 Removendo artifacts locais (./dist)"
	- rm -rf ./dist
	@echo "🗑 Removendo imagens órfãs"
	- docker image prune -f

clean-images: setup-env
	docker rmi -f $(shell docker images --filter=reference="$(PROJECT_NAME)*" -q)

clean-safe: setup-env
	@echo "🧹 Limpando containers e redes do projeto $(PROJECT_NAME), mas preservando volumes (dados persistentes como SonarQube token e configs)..."
	# Remove apenas containers e redes, sem volumes (-v)
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down --remove-orphans

	# Remove imagens criadas com prefixo do projeto (opcional, preserva dados)
	-docker rmi -f $(shell docker images --filter=reference='$(PROJECT_NAME)*' -q)

	# Remove redes do projeto (se restarem)
	-docker network rm $(shell docker network ls --filter name=$(PROJECT_NAME) -q)

clean-all: setup-env
	@echo "🧹 Limpando todos os recursos do projeto $(PROJECT_NAME)..."
	# Force remove datadog-agent if it exists
	-docker rm -f datadog-agent 2>/dev/null || true
	# Remove containers, volumes e redes do projeto
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) down -v --remove-orphans
	# Remove imagens criadas com prefixo do projeto
	-docker rmi -f $(shell docker images --filter=reference='$(PROJECT_NAME)*' -q)

rebuild-app: setup-env
	@echo "🔄 Rebuildando a imagem do serviço 'app' após instalação de dependências..."
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) build app
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d --force-recreate app

all: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d --remove-orphans
	@echo "✅ Projeto iniciado com sucesso!"

setup-e2e-databases: setup-env
	@echo "🔧 Criando bancos de dados E2E..."
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d database_postgres database_mongo
	@echo "⏳ Aguardando PostgreSQL ficar pronto..."
	sleep 3
	@echo "⏳ Aguardando MongoDB ficar pronto..."
	sleep 3
	@echo "✅ Bancos de dados E2E criados com sucesso!"
	@echo "   - PostgreSQL: backend_database_test_e2e"
	@echo "   - MongoDB: backend_test_e2e"

test-e2e-ready: setup-env setup-e2e-databases
	@echo "🧪 Bancos de dados E2E preparados e prontos para testes!"
	npm run test:e2e

test-e2e-docker: setup-env
	@echo "🧪 Iniciando testes E2E com Docker Compose..."
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) --profile e2e up --abort-on-container-exit --exit-code-from e2e-tests

# ========================
# Development helpers
# ========================

logs-monitoring: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) logs -f prometheus grafana alertmanager

logs-tracing: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) logs -f jaeger

logs-logging: setup-env
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) logs -f loki promtail

status: setup-env
	@echo "📊 Status dos serviços:"
	@docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) ps

health-check: setup-env
	@echo "🏥 Verificando saúde dos serviços..."
	@curl -s http://localhost:9090/-/healthy && echo "✅ Prometheus: OK" || echo "❌ Prometheus: FAIL"
	@curl -s http://localhost:3000/api/health && echo "✅ Grafana: OK" || echo "❌ Grafana: FAIL"
	@curl -s http://localhost:3100/ready && echo "✅ Loki: OK" || echo "❌ Loki: FAIL"
	@curl -s http://localhost:16686/api/services && echo "✅ Jaeger: OK" || echo "❌ Jaeger: FAIL"

circuit-breaker-stats: setup-env
	@echo "🔌 Verificando status dos circuit breakers..."
	@curl -s http://localhost:3000/circuit-breaker/stats | jq . || echo "❌ Falha ao obter stats dos circuit breakers"

circuit-breaker-test-payment: setup-env
	@echo "💳 Testando circuit breaker de pagamentos..."
	@curl -s -X POST http://localhost:3000/circuit-breaker/test-payment \
		-H "Content-Type: application/json" \
		-d '{"amount": 100, "userId": "test-user"}' | jq . || echo "❌ Falha no teste de pagamento"

circuit-breaker-test-external-api: setup-env
	@echo "🌐 Testando circuit breaker de API externa..."
	@curl -s -X POST http://localhost:3000/circuit-breaker/test-external-api \
		-H "Content-Type: application/json" \
		-d '{"url": "https://httpbin.org/post", "data": {"test": "data"}}' | jq . || echo "❌ Falha no teste de API externa"

circuit-breaker-reset: setup-env
	@echo "🔄 Resetando todos os circuit breakers..."
	@curl -s -X POST http://localhost:3000/circuit-breaker/reset | jq . || echo "❌ Falha ao resetar circuit breakers"

setup: setup-env
	@echo "🚀 Iniciando setup completo do projeto..."
	docker-compose -p $(PROJECT_NAME) -f $(COMPOSE_FILE) up -d --remove-orphans
	@echo "✅ Setup completo! Projeto pronto para usar."

.PHONY: all rebuild-app setup-env clean clean-all clean-images force-remove down stop app sonar-up sonar-down sonar-scan clean-safe database_postgres queue_rabbitmq cache_redis setup setup-e2e-databases test-e2e-ready test-e2e-docker migrate migrate-revert migrate-show docker-migrate docker-migrate-revert docker-migrate-show monitoring monitoring-down monitoring-stop prometheus prometheus-down grafana grafana-down alertmanager alertmanager-down tracing tracing-down tracing-stop jaeger jaeger-down logging logging-down logging-stop loki loki-down promtail promtail-down observability observability-down observability-stop logs-monitoring logs-tracing logs-logging status health-check circuit-breaker-stats circuit-breaker-test-payment circuit-breaker-test-external-api circuit-breaker-reset