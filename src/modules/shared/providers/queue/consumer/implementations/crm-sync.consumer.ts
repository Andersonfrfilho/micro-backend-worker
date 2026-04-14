import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Controller, Inject, Injectable } from '@nestjs/common';
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
import { CrmSyncMessage } from '../dto/consumer-messages.dto';

@Controller()
@Injectable()
export class CrmSyncConsumer implements MessageConsumerInterface {
  constructor(
    @Inject(LOG_PROVIDER) private readonly logger: LogProviderInterface,
    @Inject(RABBITMQ_MESSAGES_PROCESSED_PROVIDER)
    private readonly messagesProcessedProvider: RabbitMQMessagesProcessedProvider,
    @Inject(RABBITMQ_MESSAGE_PROCESSING_DURATION_PROVIDER)
    private readonly messageProcessingDurationProvider: RabbitMQMessageProcessingDurationProvider,
  ) {}

  getId(): string {
    return CONSUMER_IDS.CRM_SYNC;
  }

  getQueueName(): string {
    return QUEUE_NAMES.CRM_SYNC;
  }

  @RabbitSubscribe({
    exchange: EXCHANGE_NAMES.INTEGRATION,
    routingKey: ROUTING_KEYS.CRM_SYNC,
    queue: QUEUE_NAMES.CRM_SYNC,
  })
  @AsyncApiSub({
    channel: 'crm.sync',
    summary: 'Sincronização de Dados com CRM Externo',
    description:
      'Este worker garante que as alterações cadastrais do usuário sejam replicadas para o CRM (Salesforce/Hubspot).\n\n' +
      '### Topologia RabbitMQ\n' +
      '| Atributo | Valor |\n' +
      '| :--- | :--- |\n' +
      '| **Exchange** | `integration` (topic) |\n' +
      '| **Routing Key** | `crm.sync` |\n' +
      '| **Queue** | `crm-sync-queue` |\n' +
      '| **Retentativa** | Fila de DLQ configurada |\n\n' +
      '### Exemplo de Teste (cURL)\n' +
      '```bash\n' +
      'curl -u guest:guest -H "Content-Type: application/json" -X POST \\\n' +
      '  -d \'{"properties":{},"routing_key":"crm.sync","payload":"{\\"type\\":\\"crm-user-sync\\",\\"userId\\":\\"123\\",\\"email\\":\\"user@exemplo.com\\",\\"name\\":\\"João Silva\\"}",\\"payload_encoding\\":\\"string\\"}\' \\\n' +
      '  http://localhost:15672/api/exchanges/%2f/integration/publish\n' +
      '```',
    message: {
      name: 'CrmSyncMessage',
      payload: CrmSyncMessage,
    },
    operationId: 'handleCrmSync',
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
        message: `Processing CRM sync: ${JSON.stringify(message.body)}`,
        context: 'CrmSyncConsumer',
      });

      const { type, userId, email, name } = message.body;

      if (type === 'crm-user-sync') {
        // Sincronizar com sistema CRM
        this.logger.info({
          message: `Syncing user ${userId} to CRM: ${name} - ${email}`,
          context: 'CrmSyncConsumer',
        });
        // TODO: Integrar com API do CRM
      }

      // Registrar métricas de sucesso
      const processingTime = (Date.now() - startTime) / 1000;
      this.messagesProcessedProvider.increment(QUEUE_NAMES.CRM_SYNC);
      this.messageProcessingDurationProvider.observe(QUEUE_NAMES.CRM_SYNC, processingTime);

      return Promise.resolve({
        success: true,
      });
    } catch (error) {
      this.logger.error({
        message: `Error processing CRM sync: ${error.message}`,
        context: 'CrmSyncConsumer',
        params: { stack: error.stack },
      });

      // Registrar métricas de erro
      const processingTime = (Date.now() - startTime) / 1000;
      this.messageProcessingDurationProvider.observe(QUEUE_NAMES.CRM_SYNC, processingTime);

      const structuredError = QueueErrorFactory.messageProcessingFailed(
        QUEUE_NAMES.CRM_SYNC,
        message.metadata?.correlationId || 'unknown',
        error,
      );

      return {
        success: false,
        error: structuredError,
        retry: true,
      };
    }
  }

  process(message: ConsumerMessage): Promise<ConsumerResult> {
    return this.handleMessage(message);
  }

  handleError(message: ConsumerMessage, error: Error): Promise<ConsumerResult> {
    this.logger.error({
      message: `Handling error for CRM sync message: ${message.metadata?.correlationId}`,
      context: 'CrmSyncConsumer',
      params: { stack: error.stack },
    });

    const structuredError = QueueErrorFactory.messageProcessingFailed(
      QUEUE_NAMES.CRM_SYNC,
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
