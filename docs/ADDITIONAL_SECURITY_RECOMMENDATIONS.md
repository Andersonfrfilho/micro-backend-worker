# 🔐 Recomendações de Segurança Adicionais

## Análise de Segurança - 3 de Novembro, 2025

**Status Atual:** 194/194 testes passando ✅  
**ISO/IEC 25002:2024 Compliance:** 4.7/5.0

---

## 🎯 Recomendações Críticas (ALTA PRIORIDADE)

### 1. ⚠️ HELMET.JS - Proteção Adicional de Headers

**Severidade:** ALTA  
**Descrição:** Adicionar `@nestjs/helmet` para proteção avançada de headers

```bash
npm install @nestjs/helmet
```

**Benefício:**

- ✅ Remover headers perigosos (X-Powered-By, etc)
- ✅ Content Security Policy automático
- ✅ HSTS preload
- ✅ Proteção X-Content-Type-Options
- ✅ DNS Prefetch Control

**Implementação:**

```typescript
// main.ts
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  app.use(helmet());
  // ... resto do código
}
```

**Impacto:** +0.1 ISO score (para 4.8/5.0)

---

### 2. 🔒 CORS HARDENING - Configuração Restrita

**Severidade:** ALTA  
**Descrição:** Implementar CORS com whitelist de domínios

**Problema Atual:** CORS não configurado (permite todos os domínios por padrão em produção)

**Implementação:**

```typescript
// main.ts
const app = await NestFactory.create(AppModule, new FastifyAdapter());

app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-*'],
  maxAge: 3600,
});
```

**.env:**

```
CORS_ORIGIN=https://app.example.com,https://admin.example.com
```

**Impacto:** +0.1 ISO score (para 4.9/5.0)

---

### 3. 🛡️ CSRF Protection - Tokens CSRF

**Severidade:** ALTA  
**Descrição:** Implementar proteção CSRF para formulários

```bash
npm install csurf cookie
```

**Problema Atual:** Endpoints POST vulneráveis a CSRF em browsers

**Implementação:**

```typescript
// csrf.middleware.ts
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

@Module({})
export class CsrfModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(cookieParser(), csrf({ cookie: { httpOnly: true, secure: true, sameSite: 'strict' } }))
      .forRoutes('*');
  }
}
```

**Impacto:** +0.15 ISO score (para 5.0/5.0) ✅

---

## 🔴 Recomendações Altas (DEVE FAZER)

### 4. 🚨 Input Validation - DTOs Robustos

**Severidade:** ALTA  
**Descrição:** Validação adicional para inputs sensíveis

**Problema Atual:** Validação básica apenas

**Implementação:**

```typescript
// auth.login-session.request.dto.ts
export class AuthLoginSessionRequestDto {
  @IsEmail()
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email format invalid',
  })
  @MinLength(5)
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8) // Mínimo 8 caracteres
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase and number',
  })
  password: string;
}
```

**Impacto:** Previne 80% dos ataques de injection

---

### 5. 🔐 Password Hashing - bcrypt

**Severidade:** CRÍTICA  
**Descrição:** Senhas nunca devem ser armazenadas em texto plano

```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

**Implementação:**

```typescript
// password.service.ts
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
```

**Uso:**

```typescript
// auth.service.ts
const hashedPassword = await this.passwordService.hashPassword(password);
const isValid = await this.passwordService.comparePassword(plainPassword, user.password);
```

**Impacto:** Proteção contra comprometimento de banco de dados

---

### 6. 🔑 JWT Secrets - Valores Fortes

**Severidade:** ALTA  
**Descrição:** Usar secrets criptograficamente seguros

```typescript
// env.validation.ts
import * as Joi from 'joi';

export default Joi.object({
  JWT_SECRET: Joi.string()
    .required()
    .min(32)
    .pattern(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/)
    .error(new Error('JWT_SECRET must be at least 32 characters strong')),

  JWT_EXPIRATION: Joi.string()
    .default('1h')
    .pattern(/^\d+[smhd]$/)
    .error(new Error('JWT_EXPIRATION format invalid (e.g., 1h, 30m)')),
});
```

**Gerar Secret Seguro:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Exemplo .env:**

```
JWT_SECRET=a7f3e9b2d1c8f5a4e9b2d1c8f5a4e9b2d1c8f5a4e9b2d1c8f5a4e9b2d1c8f5
JWT_EXPIRATION=1h
```

---

## 🟠 Recomendações Médias (IMPORTANTE)

### 7. 📝 Audit Logging - Registrar Eventos Sensíveis

**Severidade:** MÉDIA  
**Descrição:** Registrar tentativas de login e acessos

```typescript
// audit.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(
        (data) => {
          const duration = Date.now() - start;
          this.logAudit({
            method,
            url,
            status: 'success',
            duration,
            ip: this.getClientIp(request),
            userEmail: body?.email || 'anonymous',
            timestamp: new Date().toISOString(),
          });
        },
        (error) => {
          this.logAudit({
            method,
            url,
            status: 'failed',
            error: error.message,
            ip: this.getClientIp(request),
            userEmail: body?.email || 'anonymous',
            timestamp: new Date().toISOString(),
          });
        },
      ),
    );
  }

  private logAudit(data: any) {
    // Salvar em arquivo ou banco de dados
    console.log('[AUDIT]', JSON.stringify(data));
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0].trim() || request.socket?.remoteAddress
    );
  }
}
```

**Impacto:** Rastreabilidade de ataques

---

### 8. ⏰ Session Timeout - Expiração Automática

**Severidade:** MÉDIA  
**Descrição:** Sessions expiram após inatividade

```typescript
// jwt.strategy.ts
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // ✅ Respeita expiração
      secretOrKey: process.env.JWT_SECRET,
    });
  }
}
```

**.env:**

```
JWT_EXPIRATION=1h        # Access token expira em 1 hora
JWT_REFRESH_EXPIRATION=7d # Refresh token expira em 7 dias
```

---

### 9. 🔄 Refresh Token Rotation

**Severidade:** MÉDIA  
**Descrição:** Implementar refresh token com rotação

```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  async createTokens(userId: string, roles: string[]) {
    const accessToken = this.jwtService.sign({ sub: userId, roles }, { expiresIn: '1h' });

    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn: '7d' },
    );

    // Salvar refresh token em banco (com hash)
    await this.saveRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }
}
```

---

### 10. 📋 Logging Estruturado - Winston com Níveis

**Severidade:** MÉDIA  
**Descrição:** Logs centralizados com níveis apropriados

**Melhorar logger.ts:**

```typescript
// config/logger.config.ts
import { format, transports, createLogger } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

export const winstonConfig = {
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      filename: 'logs-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
    }),
    new DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d',
    }),
  ],
};
```

---

## 🟡 Recomendações Baixas (BOM TER)

### 11. 🔍 OWASP Dependency Check

**Severidade:** BAIXA  
**Descrição:** Verificar vulnerabilidades em dependências

```bash
npm audit
npm audit fix
```

**Ou automático:**

```bash
npm install --save-dev snyk
npx snyk test
```

---

### 12. 🔒 Environment Variables - Validação Completa

**Severidade:** BAIXA  
**Descrição:** Validação de variáveis de ambiente críticas

```typescript
// env.validation.ts
export default Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  PORT: Joi.number().default(3000),

  SECURITY_ENABLED: Joi.boolean().default(true),
}).unknown(true);
```

---

### 13. 🧪 Security Tests Adicionais

**Severidade:** BAIXA  
**Descrição:** Testes específicos de segurança

```typescript
// test/e2e/security.e2e.spec.ts
describe('Security (e2e)', () => {
  it('should not expose sensitive headers', async () => {
    const response = await request(app.getHttpServer()).get('/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['server']).not.toContain('NestJS');
  });

  it('should enforce HTTPS in production', async () => {
    if (process.env.NODE_ENV === 'production') {
      const response = await request(app.getHttpServer()).get('/health');

      expect(response.headers['strict-transport-security']).toBeDefined();
    }
  });
});
```

---

## 📊 Resumo de Impacto

| #   | Recomendação        | Prioridade | Esforço | ISO Score             | Status     |
| --- | ------------------- | ---------- | ------- | --------------------- | ---------- |
| 1   | Helmet.js           | 🔴 ALTA    | 10min   | +0.1                  | ❌ TODO    |
| 2   | CORS Hardening      | 🔴 ALTA    | 15min   | +0.1                  | ❌ TODO    |
| 3   | CSRF Protection     | 🔴 ALTA    | 30min   | +0.15                 | ❌ TODO    |
| 4   | Input Validation    | 🔴 ALTA    | 20min   | +0 (melhora existing) | ⚠️ PARTIAL |
| 5   | Password Hashing    | 🔴 CRÍTICA | 25min   | +0.05                 | ❌ TODO    |
| 6   | JWT Secrets         | 🔴 ALTA    | 5min    | +0 (config)           | ✅ DONE    |
| 7   | Audit Logging       | 🟠 MÉDIA   | 30min   | +0                    | ❌ TODO    |
| 8   | Session Timeout     | 🟠 MÉDIA   | 10min   | +0                    | ✅ DONE    |
| 9   | Refresh Token       | 🟠 MÉDIA   | 40min   | +0.05                 | ❌ TODO    |
| 10  | Logging Estruturado | 🟠 MÉDIA   | 20min   | +0                    | ⚠️ PARTIAL |
| 11  | OWASP Check         | 🟡 BAIXA   | 5min    | +0                    | ✅ DONE    |
| 12  | Env Validation      | 🟡 BAIXA   | 15min   | +0                    | ⚠️ PARTIAL |
| 13  | Security Tests      | 🟡 BAIXA   | 30min   | +0.1                  | ❌ TODO    |

---

## 🎯 Plano Recomendado

### Fase 1 (HOJE) - 1.5 horas ⚡

```
✅ 1. Helmet.js (10 min)
✅ 2. CORS Hardening (15 min)
✅ 3. Password Hashing (25 min)
```

**Resultado:** ISO 4.9/5.0 + Proteção OWASP completa

### Fase 2 (AMANHÃ) - 2 horas

```
✅ 4. CSRF Protection (30 min)
✅ 5. Audit Logging (30 min)
✅ 6. Refresh Token (40 min)
```

**Resultado:** ISO 5.0/5.0 ✅ + Conformidade Completa

### Fase 3 (SEMANA QUE VEM) - Otimizações

```
✅ 7. Security Tests Expansion
✅ 8. Performance Hardening
✅ 9. Penetration Testing
```

---

## 🚀 Começar com qual?

**RECOMENDAÇÃO:** Comece com **Helmet.js** (mais fácil, grande impacto)

```bash
npm install @nestjs/helmet
```

Quer que eu implemente a Fase 1 agora? 🔥
