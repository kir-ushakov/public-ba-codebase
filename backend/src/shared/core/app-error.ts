import { BaseError } from './base-error.js';

export enum AppErrorCode {
  FilesStorageUnwritable = 'APP_ERROR__FILES_STORAGE_UNWRITABLE',
}

/**
 * The running app cannot do its job (storage permissions, dead credentials, …).
 * No `level`: these are always critical — unlike ServiceError, which varies by call.
 */
export class AppError<U = string> extends BaseError<U> {
  constructor(
    message: string,
    code: U,
    public readonly error?: unknown,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(message, code, {
      cause: error instanceof Error ? error : undefined,
    });
    this.metadata = metadata ? Object.freeze(metadata) : undefined;
  }
}
