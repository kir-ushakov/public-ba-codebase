import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { EGetImageUseCaseError, EUploadImageUseCaseError } from '@brainassistant/contracts';
import { readApiErrorName } from './http-error-body.function';

const GOOGLE_REFRESH_TOKEN_INVALID_NAMES = new Set<string>([
  EGetImageUseCaseError.GoogleRefreshTokenInvalid,
  EUploadImageUseCaseError.GoogleRefreshTokenInvalid,
]);

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
