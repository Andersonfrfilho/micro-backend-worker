import { AppErrorFactory } from '@modules/error/application/app.error.factory';

export class QueueErrorFactory {
  static messageProcessingFailed(
    queueName: string,
    messageId: string,
    originalError: Error,
  ): Error {
    return AppErrorFactory.businessLogic({
      message: `Failed to process message from queue ${queueName}`,
      code: 'QUEUE_PROCESSING_FAILED',
      details: {
        queueName,
        messageId,
        originalError: originalError.message,
        stack: originalError.stack,
      },
    });
  }

  static messageValidationFailed(
    queueName: string,
    messageId: string,
    validationErrors: unknown[],
  ): Error {
    return AppErrorFactory.validation(`Message validation failed for queue ${queueName}`, {
      queueName,
      messageId,
      validationErrors,
    });
  }

  static connectionFailed(queueName: string, originalError: Error): Error {
    return AppErrorFactory.internalServer(`Failed to connect to queue ${queueName}`, {
      queueName,
      originalError: originalError.message,
    });
  }

  static timeout(queueName: string, messageId: string, timeoutMs: number): Error {
    return AppErrorFactory.businessLogic({
      message: `Message processing timeout for queue ${queueName}`,
      code: 'QUEUE_TIMEOUT',
      details: {
        queueName,
        messageId,
        timeoutMs,
      },
    });
  }
}
