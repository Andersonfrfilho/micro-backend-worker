import { LoggerModule } from '@adatechnology/logger';
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { register as tsConfigPathsRegister } from 'tsconfig-paths';

import { ConfigModule } from '@config/config.module';

import * as tsConfig from '../tsconfig.json';

import { CircuitBreakerModule } from './modules/circuit-breaker/circuit-breaker.module';
import { SharedModule } from './modules/shared/shared.module';

const compilerOptions = tsConfig.compilerOptions;
tsConfigPathsRegister({
  baseUrl: compilerOptions.baseUrl,
  paths: compilerOptions.paths,
});

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
    }),
    SharedModule,
    CircuitBreakerModule,
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
})
export class AppModule {}
