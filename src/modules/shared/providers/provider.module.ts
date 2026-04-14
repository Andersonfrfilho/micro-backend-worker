import { Module } from '@nestjs/common';

import { SharedInfrastructureProviderDatabaseModule } from './database/database.module';
import { SharedInfrastructureProviderMetricsModule } from './metrics/metrics.module';
import { SharedInfrastructureProviderQueueModule } from './queue/queue.module';

@Module({
  imports: [
    SharedInfrastructureProviderDatabaseModule,
    SharedInfrastructureProviderQueueModule,
    SharedInfrastructureProviderMetricsModule,
  ],
  exports: [
    SharedInfrastructureProviderDatabaseModule,
    SharedInfrastructureProviderQueueModule,
    SharedInfrastructureProviderMetricsModule,
  ],
})
export class SharedInfrastructureProviderModule {}
