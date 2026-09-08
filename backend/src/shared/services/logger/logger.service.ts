import { AppError } from '../../core/app-error.js';
import { ServiceError } from '../../core/service-error.js';

// TODO: need to use real logger
// TICKET: https://brainas.atlassian.net/browse/BA-230
export class LoggerService {
  logServiceError<U>(error: ServiceError<U>): void {
    console.error(`[SERVICE ERROR] ${error.code}: ${error.message}`, {
      level: error.level,
      metadata: error.metadata,
      cause: error.error,
    });
  }

  logAppError(error: AppError): void {
    console.error(`[APP ERROR] ${error.code}: ${error.message}`, {
      cause: error.error,
      metadata: error.metadata,
    });
  }

  logUnexpectedError(error: unknown): void {
    console.error(`[UNEXPECTED ERROR]`, error);
  }
}
