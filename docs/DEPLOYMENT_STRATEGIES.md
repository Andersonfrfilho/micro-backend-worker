# Estratégias de Deploy

## Blue-Green Deployment

- Manter duas versões do serviço rodando
- Traffic switching via service mesh (Istio) ou ingress

## Canary Deployment

- Deploy gradual com porcentagem de traffic
- Rollback automático baseado em métricas

## Feature Flags

- Controle de features via configuração externa
- Exemplo: Unleash, LaunchDarkly

## Database Migrations

- Flyway ou Liquibase para versionamento de schema
- Rollback strategies

## Rollback Plan

- Automated rollback via CI/CD
- Database backup/restore procedures
