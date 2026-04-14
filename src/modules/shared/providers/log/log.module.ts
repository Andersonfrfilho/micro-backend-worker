import { LoggerModule } from '@adatechnology/logger';
import { Module } from '@nestjs/common';

import { LOG_PROVIDER } from '@modules/shared/providers/log/log.token';

import { LogProvider } from './log.provider';

@Module({
  imports: [LoggerModule],
  providers: [
    {
      provide: LOG_PROVIDER,
      useClass: LogProvider,
    },
  ],
  exports: [LOG_PROVIDER],
})
export class SharedInfrastructureProviderLogModule {}
