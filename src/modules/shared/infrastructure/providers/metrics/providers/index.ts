import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

export const RABBITMQ_MESSAGES_PROCESSED_PROVIDER = Symbol('RABBITMQ_MESSAGES_PROCESSED_PROVIDER');
export const RABBITMQ_MESSAGE_PROCESSING_DURATION_PROVIDER = Symbol(
  'RABBITMQ_MESSAGE_PROCESSING_DURATION_PROVIDER',
);

@Injectable()
export class RabbitMQMessagesProcessedProvider {
  constructor(
    @InjectMetric('rabbitmq_messages_processed_total')
    public readonly counter: Counter<string>,
  ) {}

  increment(queueName: string) {
    this.counter.inc({ queue: queueName });
  }
}

@Injectable()
export class RabbitMQMessageProcessingDurationProvider {
  constructor(
    @InjectMetric('rabbitmq_message_processing_duration')
    public readonly histogram: Histogram<string>,
  ) {}

  observe(queueName: string, duration: number) {
    this.histogram.observe({ queue: queueName }, duration);
  }
}
