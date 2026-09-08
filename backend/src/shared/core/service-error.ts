import { BaseError } from './base-error.js';
import { ServiceErrorLevel } from './service-error-level.enum.js';

export class ServiceError<U = string> extends BaseError<U> {
  constructor(
    message: string,
    code: U,
    public readonly error?: unknown,
    public readonly level?: ServiceErrorLevel,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(message, code, {
      cause: error instanceof Error ? error : undefined,
    });
    this.metadata = metadata ? Object.freeze(metadata) : undefined;
  }
}
