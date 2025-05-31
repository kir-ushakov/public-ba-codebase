import { Result } from './result.js';
import { ServiceError } from './service-error.js';
import { ServiceErrorLevel } from './service-error-level.enum.js';

export interface FailOptions {
  error?: unknown;
  level?: ServiceErrorLevel;
  metadata?: Record<string, unknown>;
}

export function serviceFail<E>(
  message: string,
  errorCode: E,
  options: FailOptions = {},
): Result<never, ServiceError<E>> {
  const { error, level = ServiceErrorLevel.Medium, metadata } = options;

  return Result.fail(new ServiceError(message, errorCode, error, level, metadata));
}
