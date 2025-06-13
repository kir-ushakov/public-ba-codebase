import { Result } from '../core/result.js';
import { ServiceError } from '../core/service-error.js';
import { ServiceErrorLevel } from '../core/service-error-level.enum.js';

export function wrapServiceError<T extends string>(
  message: string,
  code: T,
  lowerLevelError: ServiceError<unknown>,
): Result<never, ServiceError<T>> {
  return Result.fail(
    new ServiceError<T>(
      message,
      code,
      lowerLevelError.error,
      lowerLevelError.level ?? ServiceErrorLevel.Medium,
      lowerLevelError.metadata,
    ),
  );
}
