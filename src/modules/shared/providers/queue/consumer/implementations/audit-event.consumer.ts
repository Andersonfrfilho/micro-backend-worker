import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Controller, Inject, Injectable, Logger } from '@nestjs/common';
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
import { QueueErrorFactory } from '../../queue.error.factory';
import type {
  MessageConsumerInterface,
  ConsumerMessage,
  ConsumerResult,
} from '../consumer.interface';
import { AuditEventMessage } from '../dto/consumer-messages.dto';

@Controller()
@Injectable()
export class AuditEventConsumer implements MessageConsumerInterface {
  constructor(
    @Inject(LOG_PROVIDER) private readonly logger: LogProviderInterface,
    @Inject(RABBITMQ_MESSAGES_PROCESSED_PROVIDER)
    private readonly messagesProcessedProvider: RabbitMQMessagesProcessedProvider,
    @Inject(RABBITMQ_MESSAGE_PROCESSING_DURATION_PROVIDER)
    private readonly messageProcessingDurationProvider: RabbitMQMessageProcessingDurationProvider,
  ) {}

  getId(): string {
    return CONSUMER_IDS.AUDIT_EVENT;
  }

  getQueueName(): string {
    return QUEUE_NAMES.AUDIT_EVENTS;
  }

  @RabbitSubscribe({
    exchange: EXCHANGE_NAMES.AUDIT,
    routingKey: ROUTING_KEYS.AUDIT_EVENTS,
    queue: QUEUE_NAMES.AUDIT_EVENTS,
  })
  @AsyncApiSub({
    channel: 'audit.events',
    summary: 'Registro de Auditoria e Logs de Segurança',
    description:
      'Este worker processa eventos críticos que precisam ser persistidos para fins de conformidade (compliance) e segurança.\n\n' +
      '### Topologia RabbitMQ\n' +
      '| Atributo | Valor |\n' +
      '| :--- | :--- |\n' +
      '| **Exchange** | `audit` (topic) |\n' +
      '| **Routing Key** | `audit.events` |\n' +
      '| **Queue** | `audit-events-queue` |\n' +
      '| **Ack** | Requerido (Manual) |\n\n' +
      '### Exemplo de Teste (cURL)\n' +
      'Utilize o comando abaixo para publicar um evento via RabbitMQ Management API:\n' +
      '```bash\n' +
      'curl -u guest:guest -H "Content-Type: application/json" -X POST \\\n' +
      '  -d \'{"properties":{},"routing_key":"audit.events","payload":"{\\"type\\":\\"user-created-audit\\",\\"userId\\":\\"123\\",\\"action\\":\\"create\\"}",\\"payload_encoding\\":\\"string\\"}\' \\\n' +
      '  http://localhost:15672/api/exchanges/%2f/audit/publish\n' +
      '```',
    message: {
      name: 'AuditEventMessage',
      payload: AuditEventMessage,
    },
    operationId: 'handleAuditEvent',
    bindings: {
      amqp: {
        ack: true,
      },
    },
  })
  async handleMessage(message: ConsumerMessage): Promise<ConsumerResult> {
    const startTime = Date.now();

    try {
      this.logger.info({
        message: `Processing audit event: ${JSON.stringify(message.body)}`,
        context: 'AuditEventConsumer',
      });

      const { type, userId, email, action } = message.body;

      if (type === 'user-created-audit') {
        // Salvar no banco de auditoria ou enviar para sistema de logs
        this.logger.info({
          message: `Auditing user creation: ${userId} - ${email} - ${action}`,
          context: 'AuditEventConsumer',
        });
        // TODO: Persistir no banco de auditoria
      }

      // Registrar métricas de sucesso
      const processingTime = (Date.now() - startTime) / 1000;
      this.messagesProcessedProvider.increment(QUEUE_NAMES.AUDIT_EVENTS);
      this.messageProcessingDurationProvider.observe(QUEUE_NAMES.AUDIT_EVENTS, processingTime);

      return Promise.resolve({
        success: true,
      });
    } catch (error) {
      this.logger.error({
        message: `Error processing audit event: ${error.message}`,
        context: 'AuditEventConsumer',
        params: { stack: error.stack },
      });

      // Registrar métricas de erro
      const processingTime = (Date.now() - startTime) / 1000;
      this.messageProcessingDurationProvider.observe(QUEUE_NAMES.AUDIT_EVENTS, processingTime);

      const structuredError = QueueErrorFactory.messageProcessingFailed(
        QUEUE_NAMES.AUDIT_EVENTS,
        message.metadata?.correlationId || 'unknown',
        error,
      );

      return Promise.resolve({
        success: false,
        error: structuredError,
        retry: true,
      });
    }
  }

  process(message: ConsumerMessage): Promise<ConsumerResult> {
    return this.handleMessage(message);
  }

  handleError(message: ConsumerMessage, error: Error): Promise<ConsumerResult> {
    this.logger.error({
      message: `Handling error for audit message: ${message.metadata?.correlationId}`,
      context: 'AuditEventConsumer',
      params: { stack: error.stack },
    });

    const structuredError = QueueErrorFactory.messageProcessingFailed(
      QUEUE_NAMES.AUDIT_EVENTS,
      message.metadata?.correlationId || 'unknown',
      error,
    );

    return Promise.resolve({
      success: false,
      error: structuredError,
      retry: true,
    });
  }

  isHealthy(): Promise<boolean> {
    return Promise.resolve(true);
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
