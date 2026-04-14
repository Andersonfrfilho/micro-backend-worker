import { Inject, Injectable } from '@nestjs/common';
import { LOGGER_PROVIDER } from '@adatechnology/logger';

import type { LogBaseParams, LogProviderInterface } from '@app/modules/shared';
import { obfuscatorInfo } from '@modules/shared/providers/log/log.utils';

import { ObfuscatorInfoParams } from './log.interface';

@Injectable()
export class LogProvider implements LogProviderInterface {
  constructor(
    @Inject(LOGGER_PROVIDER)
    private readonly logger: LogProviderInterface,
  ) {}

  info(params: LogBaseParams) {
    const { message, context, ...rest } = params;
    const obfuscated = obfuscatorInfo(rest as unknown as ObfuscatorInfoParams);
    this.logger.info({ message, context, ...(obfuscated as object) } as LogBaseParams);
  }

  error(params: LogBaseParams) {
    const { message, context, ...rest } = params;
    const obfuscated = obfuscatorInfo(rest as unknown as ObfuscatorInfoParams);
    this.logger.error({ message, context, ...(obfuscated as object) } as LogBaseParams);
  }

  warn(params: LogBaseParams) {
    const { message, context, ...rest } = params;
    const obfuscated = obfuscatorInfo(rest as unknown as ObfuscatorInfoParams);
    this.logger.warn({ message, context, ...(obfuscated as object) } as LogBaseParams);
  }

  debug(params: LogBaseParams) {
    const { message, context, ...rest } = params;
    const obfuscated = obfuscatorInfo(rest as unknown as ObfuscatorInfoParams);
    this.logger.debug({ message, context, ...(obfuscated as object) } as LogBaseParams);
  }
}
