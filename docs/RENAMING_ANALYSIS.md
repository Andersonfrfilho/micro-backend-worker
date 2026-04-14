# 📊 ANÁLISE COMPLETA - Arquivos a Renomear/Reorganizar

## ✅ CONCLUSÃO DA ANÁLISE

Foram identificadas **8 mudanças obrigatórias** em toda a estrutura do projeto.

---

## 🔴 MUDANÇAS OBRIGATÓRIAS (8 total)

### 1. **ERROR Module** (1 mudança)

| Arquivo Atual                   | Novo Nome                        | Motivo     |
| ------------------------------- | -------------------------------- | ---------- |
| `src/modules/error/AppError.ts` | `src/modules/error/app.error.ts` | kebab-case |

**Status:** ❌ Não feito

---

### 2. **HEALTH Module** (2 mudanças)

| Arquivo Atual                                      | Novo Nome                                                 | Motivo                      |
| -------------------------------------------------- | --------------------------------------------------------- | --------------------------- |
| `src/modules/health.module.ts`                     | `src/modules/health/health-application.module.ts`         | Prefixo módulo para clarity |
| `src/modules/health/use-cases/use-cases.module.ts` | `src/modules/health/use-cases/health-use-cases.module.ts` | Prefixo módulo para clarity |

**Status:** ❌ Não feito

---

### 3. **AUTH Module** (4 mudanças)

| Arquivo Atual                                              | Novo Nome                                                    | Motivo                                |
| ---------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------- |
| `src/modules/auth/auth.controller.ts` (raiz)               | ❌ DELETAR                                                   | Duplicado - existe em infrastructure/ |
| `src/modules/auth/exceptions.ts`                           | `src/modules/auth/auth.exceptions.ts`                        | Prefixo módulo para clarity           |
| `src/modules/auth/shared/dtos/LoginSessionRequest.dto.ts`  | `src/modules/auth/shared/dtos/login-session-request.dto.ts`  | kebab-case                            |
| `src/modules/auth/shared/dtos/LoginSessionResponse.dto.ts` | `src/modules/auth/shared/dtos/login-session-response.dto.ts` | kebab-case                            |

**Status:** ⚠️ Parcial (alguns erros de import ainda presentes)

---

### 4. **SHARED Module** (1 mudança)

| Arquivo Atual                                     | Novo Nome                                          | Motivo     |
| ------------------------------------------------- | -------------------------------------------------- | ---------- |
| `src/modules/shared/entities/userTypes.entity.ts` | `src/modules/shared/entities/user-types.entity.ts` | kebab-case |

**Status:** ✅ JÁ FEITO

---

### 5. **USER Module** (0 mudanças necessárias)

**Status:** ✅ PADRONIZADO CORRETAMENTE

- ✅ `user.service.ts` (renomeado de `user-infrastructure.service.ts`)
- ✅ `user.controller.ts`
- ✅ `user.repository.ts`
- ✅ Todos os arquivos seguem padrão

---

## 📋 RESUMO

- **Total de mudanças:** 8
- **JÁ FEITAS:** 1 (user-types.entity.ts)
- **JÁ FEITAS NESTA SESSÃO:** 1 (user-infrastructure.service.ts → user.service.ts)
- **FALTAM:** 6 mudanças

---

## 🚀 PRÓXIMAS AÇÕES

1. Renomear arquivo ERROR module (1 arquivo)
2. Renomear 2 arquivos HEALTH module
3. Deletar + renomear 4 arquivos AUTH module
4. Atualizar todos os imports afetados

Quer que eu faça todas as 6 mudanças restantes agora?
