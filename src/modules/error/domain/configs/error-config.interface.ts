import type { ErrorCode } from '@modules/error/domain/error-codes';

export interface ErrorConfig {
  message: string;
  code?: ErrorCode;
  details?: Record<string, unknown>;
}

export interface BusinessLogicErrorConfig extends ErrorConfig {
  code: ErrorCode;
}
