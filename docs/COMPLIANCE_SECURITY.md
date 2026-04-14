# Compliance e Segurança Empresarial

## GDPR/CCPA Compliance

- Data minimization
- Right to erasure
- Data portability
- Consent management

## Security Headers

```typescript
// Adicionar no main.ts
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }),
);
```

## Rate Limiting

```typescript
// Usar @nestjs/throttler
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
})
```

## API Gateway

- Kong, Traefik ou AWS API Gateway
- Authentication, rate limiting, logging centralizado

## Secrets Management

- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault

## Encryption at Rest

- Database encryption
- File system encryption

## Audit Logging

- Todos os acessos e mudanças devem ser logados
- Immutable logs
- SIEM integration (Splunk, ELK)
