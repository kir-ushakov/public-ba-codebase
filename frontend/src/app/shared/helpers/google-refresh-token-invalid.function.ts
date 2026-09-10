import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { EGetImageUseCaseError, EUploadImageUseCaseError } from '@brainassistant/contracts';

const GOOGLE_REFRESH_TOKEN_INVALID_NAMES = new Set<string>([
  EGetImageUseCaseError.GoogleRefreshTokenInvalid,
  EUploadImageUseCaseError.GoogleRefreshTokenInvalid,
]);

export function readApiErrorName(error: HttpErrorResponse): string | undefined {
  const payload = error.error as { name?: unknown; code?: unknown } | undefined;
  if (typeof payload?.name === 'string') {
    return payload.name;
  }
  if (typeof payload?.code === 'string') {
    return payload.code;
  }
  return undefined;
}

export function isGoogleRefreshTokenInvalidError(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse) || error.status !== HttpStatusCode.Forbidden) {
    return false;
  }
  const name = readApiErrorName(error);
  if (!name) {
    return false;
  }
  return GOOGLE_REFRESH_TOKEN_INVALID_NAMES.has(name);
}
