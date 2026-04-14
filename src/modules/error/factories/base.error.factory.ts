import { HttpStatus } from '@nestjs/common';

import { AppErrorFactory } from '@modules/error/app.error.factory';
import { AppError, ErrorType } from '@modules/error/app.error';
import type { BusinessLogicErrorConfig } from '@modules/error/configs';

export abstract class BaseErrorFactory {
  protected static createBusinessLogic(config: BusinessLogicErrorConfig): AppError {
    return AppErrorFactory.businessLogic(config);
  }

  protected static createNotFound(config: BusinessLogicErrorConfig): AppError {
    return new AppError({
      type: ErrorType.BUSINESS_LOGIC,
      message: config.message,
      statusCode: HttpStatus.NOT_FOUND,
      details: {
        code: config.code,
        ...config.details,
      },
    });
  }

  protected static createValidation(config: BusinessLogicErrorConfig): AppError {
    return new AppError({
      type: ErrorType.BUSINESS_LOGIC,
      message: config.message,
      statusCode: HttpStatus.BAD_REQUEST,
      details: {
        code: config.code,
        ...config.details,
      },
    });
  }

  protected static createConflict(config: BusinessLogicErrorConfig): AppError {
    return new AppError({
      type: ErrorType.BUSINESS_LOGIC,
      message: config.message,
      statusCode: HttpStatus.CONFLICT,
      details: {
        code: config.code,
        ...config.details,
      },
    });
  }
}
