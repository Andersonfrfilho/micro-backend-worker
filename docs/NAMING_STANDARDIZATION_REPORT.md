# 📋 RELATÓRIO DE PADRONIZAÇÃO - PROJETO COMPLETO

## 🎯 PADRÃO RECOMENDADO

**Convenção Global:**

- **Filenames:** `kebab-case` com sufixo indicando papel
- **Classes/Interfaces:** `PascalCase`
- **Sufixos de arquivo:** `.controller`, `.service`, `.use-case`, `.dto`, `.interface`, `.repository`, `.module`, `.token`, `.constant`, `.enum`, `.interceptor`, `.middleware`, `.guard`, `.strategy`, `.decorator`, `.provider`, `.filter`

---

## 📊 ANÁLISE POR MÓDULO

### ✅ **MÓDULO: ERROR** (Padrão correto em geral)

| Arquivo Atual                                      | Status | Observação                                          |
| -------------------------------------------------- | ------ | --------------------------------------------------- |
| `error.module.ts`                                  | ✅     | Correto                                             |
| `domain/AppError.ts`                               | ❌     | Deveria ser `app.error.ts` (kebab-case)             |
| `dtos/errors.dto.ts`                               | ✅     | Correto                                             |
| `application/app.error.factory.ts`                 | ✅     | Correto                                             |
| `infrastructure/filters/filter.error.module.ts`    | ⚠️     | Padrão inconsistente (filter.error vs error.filter) |
| `infrastructure/filters/error-filter.ts`           | ✅     | Correto                                             |
| `infrastructure/filters/error-filter.constant.ts`  | ✅     | Correto                                             |
| `infrastructure/filters/error-filter.unit.spec.ts` | ✅     | Correto                                             |

**Mudanças necessárias:**

1. `domain/AppError.ts` → `domain/app.error.ts`

---

### ✅ **MÓDULO: HEALTH** (Padrão correto em geral)

| Arquivo Atual                                               | Status | Observação                                 |
| ----------------------------------------------------------- | ------ | ------------------------------------------ |
| `health.module.ts`                                          | ✅     | Correto                                    |
| `domain/health.get.interface.ts`                            | ✅     | Correto                                    |
| `application/application.module.ts`                         | ⚠️     | Deveria ser `health.application.module.ts` |
| `application/use-cases/use-cases.module.ts`                 | ⚠️     | Deveria ser `health.use-cases.module.ts`   |
| `application/use-cases/health.get.use-case.ts`              | ✅     | Correto                                    |
| `application/use-cases/health.get.use-case.unit.spec.ts`    | ✅     | Correto                                    |
| `infrastructure/health.controller.ts`                       | ✅     | Correto                                    |
| `infrastructure/health.token.ts`                            | ✅     | Correto                                    |
| `infrastructure/health.infrastructure.module.ts`            | ✅     | Correto                                    |
| `infrastructure/services/health.check.service.ts`           | ✅     | Correto                                    |
| `infrastructure/services/health.check.service.unit.spec.ts` | ✅     | Correto                                    |
| `infrastructure/services/health.service.module.ts`          | ✅     | Correto                                    |
| `shared/health.dto.ts`                                      | ✅     | Correto                                    |

**Mudanças necessárias:**

1. `application/application.module.ts` → `application/health-application.module.ts`
2. `application/use-cases/use-cases.module.ts` → `application/use-cases/health-use-cases.module.ts`

---

### ⚠️ **MÓDULO: AUTH** (Múltiplos padrões inconsistentes)

| Arquivo Atual                                          | Status | Observação                                               |
| ------------------------------------------------------ | ------ | -------------------------------------------------------- |
| `auth.module.ts`                                       | ✅     | Correto                                                  |
| `auth.controller.ts` (duplicado)                       | ⚠️     | Existe em 2 locais!                                      |
| `domain/auth.login-session.interface.ts`               | ✅     | Correto                                                  |
| `domain/exceptions.ts`                                 | ❌     | Deveria ser `auth.exceptions.ts` ou `auth-exceptions.ts` |
| `application/auth.application.module.ts`               | ✅     | Correto                                                  |
| `application/use-cases/auth.use-cases.module.ts`       | ✅     | Correto                                                  |
| `application/use-cases/auth-login-session.use-case.ts` | ✅     | Correto                                                  |
| `infrastructure/auth.controller.ts`                    | ⚠️     | Duplicado - deveria estar apenas aqui                    |
| `infrastructure/auth.token.ts`                         | ✅     | Correto                                                  |
| `infrastructure/auth.infrastructure.module.ts`         | ✅     | Correto                                                  |
| `infrastructure/guards/roles.guard.ts`                 | ✅     | Correto                                                  |
| `infrastructure/guards/jwt-auth.guard.ts`              | ✅     | Correto                                                  |
| `infrastructure/decorators/roles.decorator.ts`         | ✅     | Correto                                                  |
| `infrastructure/strategies/mock-jwt.strategy.ts`       | ✅     | Correto                                                  |
| `infrastructure/service/auth.login-session.service.ts` | ✅     | Correto                                                  |
| `infrastructure/service/auth.service.module.ts`        | ✅     | Correto                                                  |
| `shared/dtos/LoginSessionRequest.dto.ts`               | ❌     | Deveria ser `login-session-request.dto.ts`               |
| `shared/dtos/LoginSessionResponse.dto.ts`              | ❌     | Deveria ser `login-session-response.dto.ts`              |

**Mudanças necessárias:**

1. Remover `/auth/auth.controller.ts` (está duplicado em infrastructure)
2. `domain/exceptions.ts` → `domain/auth.exceptions.ts`
3. `shared/dtos/LoginSessionRequest.dto.ts` → `shared/dtos/login-session-request.dto.ts`
4. `shared/dtos/LoginSessionResponse.dto.ts` → `shared/dtos/login-session-response.dto.ts`

---

### ⚠️ **MÓDULO: USER** (Recentemente padronizado, mas ainda há issues)

| Arquivo Atual                                      | Status | Observação |
| -------------------------------------------------- | ------ | ---------- |
| `user.module.ts`                                   | ✅     | Correto    |
| `infrastructure/user.controller.ts`                | ✅     | Correto    |
| `infrastructure/user.repository.ts`                | ✅     | Correto    |
| `infrastructure/user.token.ts`                     | ✅     | Correto    |
| `infrastructure/user-infrastructure.service.ts`    | ✅     | Correto    |
| `infrastructure/user.infrastructure.module.ts`     | ✅     | Correto    |
| `domain/repositories/user.repository.interface.ts` | ✅     | Correto    |
| `application/use-cases/create-user.use-case.ts`    | ✅     | Correto    |
| `application/interfaces/create-user.interface.ts`  | ✅     | Correto    |
| `application/dtos/create-user.dto.ts`              | ✅     | Correto    |
| `application/types/user.types.ts`                  | ✅     | Correto    |
| `shared/dtos/create-user-request.dto.ts`           | ✅     | Correto    |
| `shared/dtos/create-user-response.dto.ts`          | ✅     | Correto    |

**Status:** ✅ **PADRONIZADO CORRETAMENTE!**

---

### ⚠️ **MÓDULO: SHARED** (Múltiplas inconsistências)

| Arquivo Atual                                                     | Status | Observação                                      |
| ----------------------------------------------------------------- | ------ | ----------------------------------------------- |
| `shared.module.ts`                                                | ✅     | Correto                                         |
| `domain/constants/log.constant.ts`                                | ✅     | Correto                                         |
| `domain/enums/log.enum.ts`                                        | ✅     | Correto                                         |
| `domain/enums/context.enum.ts`                                    | ✅     | Correto                                         |
| `domain/interfaces/error.interface.ts`                            | ✅     | Correto                                         |
| `domain/interfaces/log.interface.ts`                              | ✅     | Correto                                         |
| `domain/interfaces/context.interface.ts`                          | ✅     | Correto                                         |
| `domain/entities/user.entity.ts`                                  | ✅     | Correto                                         |
| `domain/entities/type.entity.ts`                                  | ✅     | Correto                                         |
| `domain/entities/userTypes.entity.ts`                             | ⚠️     | Deveria ser `user-types.entity.ts` (kebab-case) |
| `domain/entities/phone.entity.ts`                                 | ✅     | Correto                                         |
| `infrastructure/context/request-context.ts`                       | ✅     | Correto                                         |
| `infrastructure/context/context.module.ts`                        | ✅     | Correto                                         |
| `infrastructure/context/middleware/request-context.middleware.ts` | ✅     | Correto                                         |
| `infrastructure/middleware/security-headers.middleware.ts`        | ✅     | Correto                                         |
| `infrastructure/middleware/csrf.middleware.ts`                    | ✅     | Correto                                         |
| `infrastructure/interceptors/rate-limit.interceptor.ts`           | ✅     | Correto                                         |
| `infrastructure/interceptors/logging/logging.interceptor.ts`      | ✅     | Correto                                         |
| `infrastructure/interceptors/logging/logging.module.ts`           | ✅     | Correto                                         |
| `infrastructure/interceptors/logging/logging-config.module.ts`    | ✅     | Correto                                         |
| `infrastructure/providers/database/...`                           | ✅     | Correto                                         |
| `infrastructure/providers/log/log.obfuscator.ts`                  | ✅     | Correto                                         |
| `infrastructure/providers/log/log.utils.ts`                       | ✅     | Correto                                         |
| `infrastructure/providers/log/log.token.ts`                       | ✅     | Correto                                         |
| `infrastructure/providers/log/log.module.ts`                      | ✅     | Correto                                         |
| `infrastructure/providers/log/index.ts`                           | ✅     | Correto                                         |

**Mudanças necessárias:**

1. `domain/entities/userTypes.entity.ts` → `domain/entities/user-types.entity.ts`

---

## 🔴 **RESUMO DE MUDANÇAS OBRIGATÓRIAS**

### **Total: 8 mudanças**

| #   | Arquivo Atual                                      | Novo Nome                                                 | Módulo | Prioridade          |
| --- | -------------------------------------------------- | --------------------------------------------------------- | ------ | ------------------- |
| 1   | `error/AppError.ts`                                | `error/app.error.ts`                                      | ERROR  | 🔵 Média            |
| 2   | `health/application/application.module.ts`         | `health/application/health-application.module.ts`         | HEALTH | 🔵 Média            |
| 3   | `health/application/use-cases/use-cases.module.ts` | `health/application/use-cases/health-use-cases.module.ts` | HEALTH | 🔵 Média            |
| 4   | `auth/auth.controller.ts` (raiz)                   | ❌ DELETAR                                                | AUTH   | 🔴 Alta (duplicado) |
| 5   | `auth/exceptions.ts`                               | `auth/auth.exceptions.ts`                                 | AUTH   | 🔵 Média            |
| 6   | `auth/shared/dtos/LoginSessionRequest.dto.ts`      | `auth/shared/dtos/login-session-request.dto.ts`           | AUTH   | 🔵 Média            |
| 7   | `auth/shared/dtos/LoginSessionResponse.dto.ts`     | `auth/shared/dtos/login-session-response.dto.ts`          | AUTH   | 🔵 Média            |
| 8   | `shared/entities/userTypes.entity.ts`              | `shared/entities/user-types.entity.ts`                    | SHARED | 🔵 Média            |

---

## ✅ **PRÓXIMOS PASSOS**

1. **Você realiza as mudanças de nome** (renomear via VS Code, que atualiza imports automaticamente)
2. **Depois me avisa** quando terminar
3. **Eu faço uma busca final** para validar todos os imports foram atualizados corretamente

---

## 📝 **NOTAS IMPORTANTES**

- **USER Module:** ✅ Já está totalmente padronizado!
- **Prioridade Alta (Duplicado):** O arquivo `auth.controller.ts` na raiz de `auth/` deve ser deletado (está duplicado em `infrastructure/`)
- **Impacto:** Ao renomear arquivos, o VS Code atualiza imports automaticamente. Depois precisaremos validar.

Quer que eu gere os comandos exatos para renomear cada arquivo?
