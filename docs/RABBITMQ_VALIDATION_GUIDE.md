# Validação de Mensagens RabbitMQ

Este guia explica como validar mensagens recebidas do RabbitMQ usando `class-validator` e `class-transformer`.

## Índice

- [Visão Geral](#visão-geral)
- [Como Funciona](#como-funciona)
- [Definindo DTOs](#definindo-dtos)
- [Aplicando Validação](#aplicando-validação)
- [Tipos de Validações Disponíveis](#tipos-de-validações-disponíveis)
- [Testando Validação](#testando-validação)
- [Exemplos de Erros](#exemplos-de-erros)

## Visão Geral

A validação de mensagens é implementada usando:

- **class-validator**: Para definir regras de validação nos DTOs
- **class-transformer**: Para transformar objetos plain em instâncias de classes
- **RabbitMQValidationPipe**: Pipe customizado que intercepta mensagens e aplica validação

## Como Funciona

1. Mensagem chega do RabbitMQ
2. `RabbitMQValidationPipe` intercepta a mensagem
3. O payload é transformado em uma instância do DTO
4. Validações são executadas
5. Se válido: mensagem é processada
6. Se inválido: erro é lançado com detalhes

## Definindo DTOs

### Exemplo: EmailNotificationMessage

```typescript
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

enum EmailNotificationType {
  USER_WELCOME = 'user-welcome',
  PASSWORD_RESET = 'password-reset',
  SYSTEM_ALERT = 'system-alert',
}

export class EmailNotificationMessage {
  @IsNotEmpty({ message: 'O campo type é obrigatório' })
  @IsEnum(EmailNotificationType, { message: 'Tipo de notificação inválido' })
  type: string;

  @IsNotEmpty({ message: 'O campo userId é obrigatório' })
  @IsString({ message: 'O userId deve ser uma string' })
  @MaxLength(100)
  userId: string;

  @IsNotEmpty({ message: 'O campo email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}
```

## Aplicando Validação

### No Consumer

```typescript
import { UsePipes } from '@nestjs/common';
import { QUEUE_NAMES, EXCHANGE_NAMES, ROUTING_KEYS } from '@modules/shared/domain/constants';
import { RabbitMQValidationPipe } from '../../pipes/rabbitmq-validation.pipe';

@Controller()
@Injectable()
export class EmailNotificationConsumer {
  @RabbitSubscribe({
    exchange: EXCHANGE_NAMES.NOTIFICATIONS,
    routingKey: ROUTING_KEYS.EMAIL_NOTIFICATIONS,
    queue: QUEUE_NAMES.EMAIL_NOTIFICATIONS,
  })
  @UsePipes(new RabbitMQValidationPipe()) // 👈 Aplica validação
  @AsyncApiSub({
    channel: 'email.notifications',
    message: {
      payload: EmailNotificationMessage,
    },
  })
  async handleMessage(message: ConsumerMessage): Promise<ConsumerResult> {
    // Aqui a mensagem já está validada! ✅
    const { type, userId, email } = message.body;

    // Processar mensagem...
  }
}
```

## Tipos de Validações Disponíveis

### Validadores Comuns

| Validador       | Uso                       | Exemplo                                         |
| --------------- | ------------------------- | ----------------------------------------------- |
| `@IsNotEmpty()` | Campo obrigatório         | `@IsNotEmpty({ message: 'Campo obrigatório' })` |
| `@IsString()`   | Deve ser string           | `@IsString()`                                   |
| `@IsEmail()`    | Deve ser email válido     | `@IsEmail({}, { message: 'Email inválido' })`   |
| `@IsEnum()`     | Deve ser um valor do enum | `@IsEnum(MyEnum)`                               |
| `@IsOptional()` | Campo opcional            | `@IsOptional()`                                 |
| `@MaxLength()`  | Tamanho máximo            | `@MaxLength(100)`                               |
| `@MinLength()`  | Tamanho mínimo            | `@MinLength(3)`                                 |
| `@IsNumber()`   | Deve ser número           | `@IsNumber()`                                   |
| `@IsBoolean()`  | Deve ser boolean          | `@IsBoolean()`                                  |
| `@IsDate()`     | Deve ser data             | `@IsDate()`                                     |
| `@IsArray()`    | Deve ser array            | `@IsArray()`                                    |
| `@IsUrl()`      | Deve ser URL válida       | `@IsUrl()`                                      |
| `@IsUUID()`     | Deve ser UUID             | `@IsUUID()`                                     |
| `@Matches()`    | Deve corresponder regex   | `@Matches(/^[a-z]+$/)`                          |

### Validações Numéricas

```typescript
@IsNumber()
@Min(0)
@Max(100)
age: number;

@IsInt()
@IsPositive()
count: number;
```

### Validações de Data

```typescript
@IsDate()
@Type(() => Date)
createdAt: Date;

@IsISO8601()
dateString: string;
```

### Validações Customizadas

```typescript
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Senha deve ter 8+ caracteres, maiúscula, minúscula, número e símbolo';
        },
      },
    });
  };
}

// Uso
@IsStrongPassword()
password: string;
```

## Testando Validação

### Teste Manual via cURL

```bash
# ✅ Mensagem válida
curl -u guest:guest -H "Content-Type: application/json" -X POST \
  -d '{"properties":{},"routing_key":"email.notifications","payload":"{\"type\":\"user-welcome\",\"userId\":\"123\",\"email\":\"test@example.com\"}","payload_encoding":"string"}' \
  http://localhost:15672/api/exchanges/%2f/notifications/publish

# ❌ Email inválido
curl -u guest:guest -H "Content-Type: application/json" -X POST \
  -d '{"properties":{},"routing_key":"email.notifications","payload":"{\"type\":\"user-welcome\",\"userId\":\"123\",\"email\":\"invalid-email\"}","payload_encoding":"string"}' \
  http://localhost:15672/api/exchanges/%2f/notifications/publish

# ❌ Type inválido
curl -u guest:guest -H "Content-Type: application/json" -X POST \
  -d '{"properties":{},"routing_key":"email.notifications","payload":"{\"type\":\"invalid-type\",\"userId\":\"123\",\"email\":\"test@example.com\"}","payload_encoding":"string"}' \
  http://localhost:15672/api/exchanges/%2f/notifications/publish

# ❌ Campos ausentes
curl -u guest:guest -H "Content-Type: application/json" -X POST \
  -d '{"properties":{},"routing_key":"email.notifications","payload":"{\"type\":\"user-welcome\"}","payload_encoding":"string"}' \
  http://localhost:15672/api/exchanges/%2f/notifications/publish
```

### Teste Unitário

```typescript
describe('RabbitMQValidationPipe', () => {
  it('deve validar mensagem válida', async () => {
    const validMessage = {
      body: {
        type: 'user-welcome',
        userId: '12345',
        email: 'test@example.com',
      },
    };

    const result = await pipe.transform(validMessage, {
      type: 'body',
      metatype: EmailNotificationMessage,
    });

    expect(result.body).toBeInstanceOf(EmailNotificationMessage);
  });

  it('deve rejeitar email inválido', async () => {
    const invalidMessage = {
      body: {
        type: 'user-welcome',
        userId: '12345',
        email: 'invalid-email',
      },
    };

    await expect(
      pipe.transform(invalidMessage, {
        type: 'body',
        metatype: EmailNotificationMessage,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
```

## Exemplos de Erros

### Erro de Validação

Quando uma mensagem inválida é recebida:

```json
{
  "statusCode": 400,
  "message": "Validation failed for message payload",
  "errors": [
    {
      "field": "email",
      "value": "invalid-email",
      "constraints": {
        "isEmail": "Email inválido"
      }
    },
    {
      "field": "type",
      "value": "invalid-type",
      "constraints": {
        "isEnum": "Tipo de notificação inválido"
      }
    }
  ]
}
```

### Logs

O consumer automaticamente loga erros de validação:

```
[EmailNotificationConsumer] Error processing email notification: Validation failed for message payload
[EmailNotificationConsumer] Handling error for message: correlation-id-123
```

## Configurações do Pipe

O `RabbitMQValidationPipe` usa as seguintes configurações:

```typescript
const errors = await validate(object, {
  whitelist: true, // Remove propriedades não definidas no DTO
  forbidNonWhitelisted: true, // Lança erro se houver props não permitidas
  transform: true, // Transforma tipos automaticamente
});
```

### Customizando o Pipe

```typescript
@UsePipes(
  new RabbitMQValidationPipe({
    skipMissingProperties: false,  // Valida mesmo se props estiverem undefined
    forbidUnknownValues: true,     // Rejeita valores desconhecidos em enums
    stopAtFirstError: false,       // Retorna todos os erros, não apenas o primeiro
  }),
)
```

## Boas Práticas

1. **Sempre defina mensagens de erro claras**

   ```typescript
   @IsEmail({}, { message: 'Email inválido' })
   ```

2. **Use enums para valores fixos**

   ```typescript
   enum Status { ACTIVE = 'active', INACTIVE = 'inactive' }
   @IsEnum(Status)
   status: Status;
   ```

3. **Valide limites de tamanho**

   ```typescript
   @MaxLength(100)
   @MinLength(3)
   username: string;
   ```

4. **Marque campos opcionais explicitamente**

   ```typescript
   @IsOptional()
   nickname?: string;
   ```

5. **Teste todos os cenários de validação**
   - Campos obrigatórios ausentes
   - Formatos inválidos
   - Valores fora do range
   - Propriedades extras

## Troubleshooting

### Validação não está funcionando

1. Verifique se o `@UsePipes()` está aplicado no método correto
2. Confirme que o DTO tem os decoradores do `class-validator`
3. Veja os logs para erros de transformação

### Propriedades extras são aceitas

- Certifique-se de usar `forbidNonWhitelisted: true` no pipe
- Adicione `@IsOptional()` apenas em campos realmente opcionais

### Transformação de tipos não funciona

- Use `@Type(() => Date)` do `class-transformer` para datas
- Use `@Transform()` para transformações customizadas

## Recursos Adicionais

- [class-validator Documentação](https://github.com/typestack/class-validator)
- [class-transformer Documentação](https://github.com/typestack/class-transformer)
- [NestJS Pipes](https://docs.nestjs.com/pipes)
