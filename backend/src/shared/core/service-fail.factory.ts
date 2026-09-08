import { Result } from './result.js';
import { ServiceError } from './service-error.js';
import { ServiceErrorLevel } from './service-error-level.enum.js';
import { LoggerService } from '../services/logger/logger.service.js';

const logger = new LoggerService();

export interface FailOptions {
  error?: unknown;
  level?: ServiceErrorLevel;
  metadata?: Record<string, unknown>;
  cause?: ServiceError;
}

export function serviceFail<E>(
  message: string,
  errorCode: E,
  options: FailOptions = {},
): Result<never, ServiceError<E>> {
  const error = options.error ?? options.cause?.error;
  const level = options.level ?? options.cause?.level ?? ServiceErrorLevel.Medium;
  const metadata = options.metadata ?? options.cause?.metadata;

  const serviceError = new ServiceError(message, errorCode, error, level, metadata);
  if (!options.cause) {
    logger.logServiceError(serviceError);
  }

  return Result.fail(serviceError);
}
