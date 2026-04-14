import { Module } from '@nestjs/common';

import { SharedInfrastructureModule } from '..module';

@Module({
  imports: [SharedInfrastructureModule],
  exports: [SharedInfrastructureModule],
})
export class SharedModule {}
