# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev           # Watch mode
npm run start:dev:local     # Load .env.dev.local and watch

# Testing
npm run test:unit           # Unit tests (*.unit.spec.ts)
npm run test:unit:watch     # Unit tests watch mode
npm run test:unit:cov       # Unit tests with coverage report
npm run test:e2e            # E2E tests

# Code quality
npm run lint                # Fix ESLint issues + import order
npm run lint:check          # Check without fixing
npm run format:all          # Prettier + lint

# Migrations
npm run migration:run       # Run pending migrations (local)
npm run migration:revert    # Revert last migration (local)
npm run migration:show      # Show migration status (local)
npm run migration:generate  # Generate new migration from entity diff
make docker-migrate         # Run migrations inside running container
make docker-migrate-revert  # Revert inside running container
```

## Architecture

**Stack:** NestJS 11 + Express, TypeScript, TypeORM + PostgreSQL, RabbitMQ (`@golevelup/nestjs-rabbitmq`), Circuit Breaker (`opossum`), Metrics (`@willsoto/nestjs-prometheus`), `@adatechnology/logger`.

**Purpose:** Async worker. Consumes RabbitMQ queues published by the API, processes domain events, persists results.

**Spec:** `.agents/skills/SPEC-WORKER.md`

### Module structure

```
src/modules/
├── shared/
│   └── infrastructure/providers/
│       ├── database/       # TypeORM (Postgres) + migrations
│       └── log/            # LogProvider with obfuscation wrapping LOGGER_PROVIDER
├── circuit-breaker/        # Circuit breaker service + metrics + controller
├── user/                   # User entity + operations
├── address/                # Address entity
├── phone/                  # Phone entity
├── error/                  # Global error handling
└── health/                 # Liveness/readiness (terminus)
```

### Pattern per module (consumer)

```
Consumer (@RabbitMQHandler) → Handler/Service → Repository → Database
```

- **Consumers:** entry point for queue messages. ACK on success, NACK (no requeue) on unrecoverable error.
- **Handlers/Services:** business logic, injectable, directly testable.
- **Never throw unhandled exceptions** in consumers — catch all errors, log, and ACK/NACK explicitly.

### Logger

The worker has a custom `LogProvider` (`LOG_PROVIDER`) that wraps `LOGGER_PROVIDER` with field obfuscation.

- Use `LOG_PROVIDER` in worker-specific business modules (obfuscation applied).
- Use `LOGGER_PROVIDER` directly only in infrastructure modules.

```ts
constructor(@Inject(LOG_PROVIDER) private readonly log: LogProviderInterface) {}
```

### Circuit Breaker

Use `CircuitBreakerService` for calls to external services (HTTP, SMTP, Firebase).

### Migrations

`migrationsRun: false` is hardcoded in `postgres.database-connection.ts`. Never set it to `true`.
Run migrations explicitly via `make docker-migrate` or `npm run migration:run`.

### TypeScript path aliases

```
@app/*      → src/*
@config/*   → src/config/*
@modules/*  → src/modules/*
```

### Testing conventions

- Unit test files: `*.unit.spec.ts`
- Coverage threshold: 50% functions/lines/statements
- Mock RabbitMQ channel, TypeORM repositories

## Code Style

**Full reference:** `.agents/skills/CODE_STYLE.md`

### Logger

Always inject via `@Inject(LOGGER_PROVIDER)` from `@adatechnology/logger` (or `LOG_PROVIDER` for obfuscated variant). Never use `new Logger()`.

```ts
constructor(@Inject(LOGGER_PROVIDER) private readonly log: LogProviderInterface) {}

this.log.info({ message: 'Message processed', context: 'MyConsumer.handle', meta: { id } });
```

### Function parameters

Functions with more than one parameter MUST accept a single object. Use `<FunctionName>Params` / `<FunctionName>Result` naming.
