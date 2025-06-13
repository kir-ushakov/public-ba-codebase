import { ServiceError } from '../../core/service-error.js';

// TODO: need to use real logger
// TICKET: https://brainas.atlassian.net/browse/BA-230
export class LoggerService {
  logServiceError(error: ServiceError): void {
    console.error(`[SERVICE ERROR] ${error.code}: ${error.message}`, {
      level: error.level,
      metadata: error.metadata,
      cause: error.error,
    });
  }

  logUnexpectedError(error: unknown): void {
    console.error(`[UNEXPECTED ERROR]`, error);
  }
}
