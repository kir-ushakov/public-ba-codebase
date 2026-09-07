import { ServiceError } from '../../core/service-error.js';
import { ServiceErrorLevel } from '../../core/service-error-level.enum.js';

export enum UnexpectedInfraError {
  UnexpectedFailure = 'UNEXPECTED_INFRA_ERROR__FAILURE',
}

const CRITICAL_ERRNO_CODES = new Set(['EACCES', 'EPERM', 'ENOSPC', 'EROFS']);

function levelFromThrown(error: unknown): ServiceErrorLevel {
  if (error instanceof Error && 'code' in error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code && CRITICAL_ERRNO_CODES.has(code)) {
      return ServiceErrorLevel.Critical;
    }
  }
  return ServiceErrorLevel.High;
}

/** Translate a thrown/next'd exception into the ServiceError model (HTTP adapter, not a use case). */
export function toUnexpectedInfraServiceError(error: unknown): ServiceError<UnexpectedInfraError> {
  return new ServiceError(
    'Unexpected infrastructure failure',
    UnexpectedInfraError.UnexpectedFailure,
    error,
    levelFromThrown(error),
  );
}
