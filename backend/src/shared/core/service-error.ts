import { AppError } from './app-error';

export class ServiceError<U = string> extends AppError<U> {
  constructor(
    message: string,
    code: U,
    public readonly error?: unknown,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message, code, {
      cause: error instanceof Error ? error : undefined,
    });
    this.details = details ? Object.freeze(details) : undefined;
  }
}
