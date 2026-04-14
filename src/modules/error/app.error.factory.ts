import { HttpStatus } from '@nestjs/common';

import { AppError, ErrorType } from '@modules/error/app.error';
import type { BusinessLogicErrorConfig } from '@modules/error/configs';

export class AppErrorFactory {
  static businessLogic(config: BusinessLogicErrorConfig): AppError {
    return new AppError({
      type: ErrorType.BUSINESS_LOGIC,
      message: config.message,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      details: {
        code: config.code,
        ...config.details,
      },
    });
  }

  static validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError({
      type: ErrorType.VALIDATION,
      message,
      statusCode: HttpStatus.BAD_REQUEST,
      details,
    });
  }

  static notFound(message: string, details?: Record<string, unknown>): AppError {
    return new AppError({
      type: ErrorType.NOT_FOUND,
      message,
      statusCode: HttpStatus.NOT_FOUND,
      details,
    });
  }

  static internalServer(message: string, details?: Record<string, unknown>): AppError {
    return new AppError({
      type: ErrorType.INTERNAL_SERVER,
      message,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      details,
    });
  }

  static conflict(message: string, details?: Record<string, unknown>): AppError {
    return new AppError({
      type: ErrorType.CONFLICT,
      message,
      statusCode: HttpStatus.CONFLICT,
      details,
    });
  }

  static authentication(message: string, details?: Record<string, unknown>): AppError {
    return new AppError({
      type: ErrorType.AUTHENTICATION,
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
      details,
    });
  }

  static authorization(message: string, details?: Record<string, unknown>): AppError {
    return new AppError({
      type: ErrorType.AUTHORIZATION,
      message,
      statusCode: HttpStatus.FORBIDDEN,
      details,
    });
  }
}
