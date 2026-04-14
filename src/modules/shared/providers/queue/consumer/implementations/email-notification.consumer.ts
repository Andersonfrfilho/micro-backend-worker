import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Controller, Inject, Injectable, Logger, UsePipes } from '@nestjs/common';
import { AsyncApiSub } from 'nestjs-asyncapi';

import type { LogProviderInterface } from '@modules/shared';
import { QUEUE_NAMES, EXCHANGE_NAMES, ROUTING_KEYS, CONSUMER_IDS } from '@modules/shared/constants';
import { LOG_PROVIDER } from '@modules/shared/providers/log/log.token';

import {
  RABBITMQ_MESSAGES_PROCESSED_PROVIDER,
  RABBITMQ_MESSAGE_PROCESSING_DURATION_PROVIDER,
  RabbitMQMessagesProcessedProvider,
  RabbitMQMessageProcessingDurationProvider,
} from '../../../metrics/providers';
import { RabbitMQValidationPipe } from '../../pipes/rabbitmq-validation.pipe';
import { QueueErrorFactory } from '../../queue.error.factory';
import type {
  MessageConsumerInterface,
  ConsumerMessage,
  ConsumerResult,
} from '../consumer.interface';
import { EmailNotificationMessage } from '../dto/consumer-messages.dto';

@Controller()
@Injectable()
export class EmailNotificationConsumer
  implements MessageConsumerInterface<EmailNotificationMessage>
{
  constructor(
    @Inject(LOG_PROVIDER) private readonly logger: LogProviderInterface,
    @Inject(RABBITMQ_MESSAGES_PROCESSED_PROVIDER)
    private readonly messagesProcessedProvider: RabbitMQMessagesProcessedProvider,
    @Inject(RABBITMQ_MESSAGE_PROCESSING_DURATION_PROVIDER)
    private readonly messageProcessingDurationProvider: RabbitMQMessageProcessingDurationProvider,
  ) {}

  getId(): string {
    return CONSUMER_IDS.EMAIL_NOTIFICATION;
  }

  getQueueName(): string {
    return QUEUE_NAMES.EMAIL_NOTIFICATIONS;
  }

  @RabbitSubscribe({
    exchange: EXCHANGE_NAMES.NOTIFICATIONS,
    routingKey: ROUTING_KEYS.EMAIL_NOTIFICATIONS,
    queue: QUEUE_NAMES.EMAIL_NOTIFICATIONS,
  })
  @UsePipes(new RabbitMQValidationPipe())
  @AsyncApiSub({
    channel: 'email.notifications',
    summary: 'Envio de E-mails Transacionais',
    description:
      'Este worker é responsável por processar a fila de e-mails e integrar com o provedor de SMTP.\n\n' +
      '### Detalhes Técnicos\n' +
      '| Atributo | Valor |\n' +
      '| :--- | :--- |\n' +
      '| **Exchange** | `notifications` (topic) |\n' +
      '| **Routing Key** | `email.notifications` |\n' +
      '| **Queue** | `email-notifications-queue` |\n' +
      '| **Retry Strategy** | 3 tentativas com Backoff Exponencial |\n\n' +
      '### Fluxos Suportados\n' +
      '- `user-welcome`: Boas-vindas para novos usuários.\n' +
      '- `password-reset`: Link para recuperação de senha.\n' +
      '- `system-alert`: Notificações críticas de segurança.\n\n' +
      '### Exemplo de Teste (cURL)\n' +
      '```bash\n' +
      'curl -u guest:guest -H "Content-Type: application/json" -X POST \\\n' +
      '  -d \'{"properties":{},"routing_key":"email.notifications","payload":"{\\"type\\":\\"user-welcome\\",\\"userId\\":\\"123\\",\\"email\\":\\"welcome@teste.com\\"}",\\"payload_encoding\\":\\"string\\"}\' \\\n' +
      '  http://localhost:15672/api/exchanges/%2f/notifications/publish\n' +
      '```',
    message: {
      name: 'EmailNotificationMessage',
      payload: EmailNotificationMessage,
    },
    operationId: 'handleEmailNotification',
    bindings: {
      amqp: {
        ack: true,
      },
    },
  })
  async handleMessage(message: ConsumerMessage<EmailNotificationMessage>): Promise<ConsumerResult> {
    const startTime = Date.now();

    try {
      this.logger.info({
        message: `Processing email notification: ${JSON.stringify(message.body)}`,
        context: 'EmailNotificationConsumer',
      });

      // Aqui você implementa a lógica para enviar email
      // Ex.: usar um serviço de email como SendGrid, SES, etc.

      const { type, userId, email } = message.body;

      if (type === 'user-welcome') {
        // Enviar email de boas-vindas
        this.logger.info({
          message: `Sending welcome email to ${email} for user ${userId}`,
          context: 'EmailNotificationConsumer',
        });
        // TODO: Integrar com serviço de email
        // Placeholder para futura integração assíncrona
      }

      // Registrar métricas de sucesso
      const processingTime = (Date.now() - startTime) / 1000;
      this.messagesProcessedProvider.increment(QUEUE_NAMES.EMAIL_NOTIFICATIONS);
      this.messageProcessingDurationProvider.observe(
        QUEUE_NAMES.EMAIL_NOTIFICATIONS,
        processingTime,
      );

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error({
        message: `Error processing email notification: ${error.message}`,
        context: 'EmailNotificationConsumer',
        params: { stack: error.stack },
      });

      // Registrar métricas de erro
      const processingTime = (Date.now() - startTime) / 1000;
      this.messageProcessingDurationProvider.observe(
        QUEUE_NAMES.EMAIL_NOTIFICATIONS,
        processingTime,
      );

      return {
        success: false,
        error: QueueErrorFactory.messageProcessingFailed(
          QUEUE_NAMES.EMAIL_NOTIFICATIONS,
          message.metadata?.correlationId || 'unknown',
          error as Error,
        ),
        retry: true,
      };
    }
  }

  async process(message: ConsumerMessage<EmailNotificationMessage>): Promise<ConsumerResult> {
    return this.handleMessage(message);
  }

  async handleError(message: ConsumerMessage, error: Error): Promise<ConsumerResult> {
    this.logger.error({
      message: `Handling error for message: ${message.metadata?.correlationId}`,
      context: 'EmailNotificationConsumer',
      params: { stack: error.stack },
    });
    // Placeholder para futura lógica assíncrona
    return {
      success: false,
      error: QueueErrorFactory.messageProcessingFailed(
        QUEUE_NAMES.EMAIL_NOTIFICATIONS,
        message.metadata?.correlationId || 'unknown',
        error,
      ),
      retry: true,
    };
  }

  async isHealthy(): Promise<boolean> {
    // Verificar se o serviço de email está disponível
    return true;
  }

  getMetrics() {
    return {
      totalProcessed: 0,
      totalFailed: 0,
      totalRetried: 0,
      averageProcessingTime: 0,
      uptime: 0,
    };
  }
}
