import { Module } from '@nestjs/common';
import { makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

import {
  RABBITMQ_MESSAGES_PROCESSED_PROVIDER,
  RABBITMQ_MESSAGE_PROCESSING_DURATION_PROVIDER,
  RabbitMQMessagesProcessedProvider,
  RabbitMQMessageProcessingDurationProvider,
} from './providers';

@Module({
  providers: [
    // Prometheus metric providers
    makeCounterProvider({
      name: 'rabbitmq_messages_processed_total',
      help: 'Total number of RabbitMQ messages processed',
      labelNames: ['queue'],
    }),
    makeHistogramProvider({
      name: 'rabbitmq_message_processing_duration',
      help: 'Duration of message processing in seconds',
      labelNames: ['queue'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    }),

    // Custom providers
    {
      provide: RABBITMQ_MESSAGES_PROCESSED_PROVIDER,
      useClass: RabbitMQMessagesProcessedProvider,
    },
    {
      provide: RABBITMQ_MESSAGE_PROCESSING_DURATION_PROVIDER,
      useClass: RabbitMQMessageProcessingDurationProvider,
    },
  ],
  exports: [RABBITMQ_MESSAGES_PROCESSED_PROVIDER, RABBITMQ_MESSAGE_PROCESSING_DURATION_PROVIDER],
})
export class SharedInfrastructureProviderMetricsModule {}
