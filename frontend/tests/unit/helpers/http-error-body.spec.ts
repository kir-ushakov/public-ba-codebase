import { HttpErrorResponse } from '@angular/common/http';
import { EGetImageUseCaseError } from '@brainassistant/contracts';
import { isGoogleRefreshTokenInvalidError } from 'src/app/shared/helpers/google-refresh-token-invalid.function';
import {
  normalizeHttpErrorResponse,
  readApiErrorName,
} from 'src/app/shared/helpers/http-error-body.function';

function httpError(status: number, body: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: body });
}

describe('http error body', () => {
  it('readApiErrorName prefers name over code', () => {
    expect(readApiErrorName(httpError(403, { name: 'A', code: 'B' }))).toBe('A');
  });

  it('parses a JSON blob from a responseType: blob request', async () => {
    const blob = new Blob(
      [JSON.stringify({ name: EGetImageUseCaseError.GoogleRefreshTokenInvalid })],
      { type: 'application/json' },
    );
    const normalized = await normalizeHttpErrorResponse(httpError(403, blob));
    expect(isGoogleRefreshTokenInvalidError(normalized)).toBe(true);
  });
});
