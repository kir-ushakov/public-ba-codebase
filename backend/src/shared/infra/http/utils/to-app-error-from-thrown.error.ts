import { AppError, AppErrorCode } from '../../../core/app-error.js';

const APP_STORAGE_ERRNO_CODES = new Set(['EACCES', 'EPERM', 'ENOSPC', 'EROFS']);

function errnoCode(error: unknown): string | undefined {
  if (error instanceof Error && 'code' in error) {
    return (error as NodeJS.ErrnoException).code;
  }
  return undefined;
}

/** Known runtime-broken storage; anything else stays an untyped next(err). */
export function toAppErrorFromThrown(error: unknown): AppError<AppErrorCode> | null {
  const code = errnoCode(error);
  if (!code || !APP_STORAGE_ERRNO_CODES.has(code)) {
    return null;
  }

  return new AppError(
    'Application storage is not writable',
    AppErrorCode.FilesStorageUnwritable,
    error,
  );
}
