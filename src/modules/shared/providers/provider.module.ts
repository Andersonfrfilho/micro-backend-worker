import { Module } from '@nestjs/common';

import { SharedInfrastructureProviderDatabaseModule } from './database/database.module';
import { SharedInfrastructureProviderLogModule } from './log/log.module';
import { SharedInfrastructureProviderMetricsModule } from './metrics/metrics.module';
import { SharedInfrastructureProviderQueueModule } from './queue/queue.module';

@Module({
  imports: [
    SharedInfrastructureProviderLogModule,
    SharedInfrastructureProviderDatabaseModule,
    SharedInfrastructureProviderQueueModule,
    SharedInfrastructureProviderMetricsModule,
  ],
  exports: [
    SharedInfrastructureProviderLogModule,
    SharedInfrastructureProviderDatabaseModule,
    SharedInfrastructureProviderQueueModule,
    SharedInfrastructureProviderMetricsModule,
  ],
})
export class SharedInfrastructureProviderModule {}
