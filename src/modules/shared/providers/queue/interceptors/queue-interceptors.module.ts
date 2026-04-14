import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { SharedInfrastructureProviderLogModule } from '@modules/shared/providers/log/log.module';
import { RabbitMQLoggingInterceptor } from '@modules/shared/providers/queue/interceptors/rabbitmq-logging.interceptor';

@Module({
  imports: [SharedInfrastructureProviderLogModule],
  providers: [
    RabbitMQLoggingInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: RabbitMQLoggingInterceptor,
    },
  ],
  exports: [RabbitMQLoggingInterceptor],
})
export class SharedInfrastructureQueueInterceptorsModule {}
