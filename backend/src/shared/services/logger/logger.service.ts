import { AppError } from '../../core/app-error.js';
import { ServiceError } from '../../core/service-error.js';
import { ServiceErrorLevel } from '../../core/service-error-level.enum.js';

// TODO: need to use real logger
// TICKET: https://brainas.atlassian.net/browse/BA-230
export class LoggerService {
  logServiceError<U>(error: ServiceError<U>): void {
    console.error(`[SERVICE ERROR] ${error.code}: ${error.message}`, {
      level: error.level,
      metadata: error.metadata,
      cause: error.error,
    });
    if (error.level === ServiceErrorLevel.Critical) {
      this.alertStub(error);
    }
  }

  logAppError(error: AppError): void {
    console.error(`[APP ERROR] ${error.code}: ${error.message}`, {
      cause: error.error,
      metadata: error.metadata,
    });
    this.alertStub(error);
  }

  logUnexpectedError(error: unknown): void {
    console.error(`[UNEXPECTED ERROR]`, error);
  }

  /** Placeholder until mail/Slack is wired. Always runs for AppError; ServiceError only when Critical. */
  private alertStub(error: { code: unknown; message: string }): void {
    console.error(`[ALERT STUB] ${error.code}: ${error.message}`);
  }
}
