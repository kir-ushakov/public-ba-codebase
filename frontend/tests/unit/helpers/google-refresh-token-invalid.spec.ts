import { HttpErrorResponse } from '@angular/common/http';
import { EGetImageUseCaseError, EUploadImageUseCaseError } from '@brainassistant/contracts';
import { isGoogleRefreshTokenInvalidError } from 'src/app/shared/helpers/google-refresh-token-invalid.function';

function httpError(status: number, body: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: body });
}

describe('isGoogleRefreshTokenInvalidError', () => {
  it('matches upload and get-image 403 wire names', () => {
    expect(
      isGoogleRefreshTokenInvalidError(
        httpError(403, { name: EUploadImageUseCaseError.GoogleRefreshTokenInvalid }),
      ),
    ).toBe(true);
    expect(
      isGoogleRefreshTokenInvalidError(
        httpError(403, { name: EGetImageUseCaseError.GoogleRefreshTokenInvalid }),
      ),
    ).toBe(true);
  });

  it('reads cached clients that still send code', () => {
    expect(
      isGoogleRefreshTokenInvalidError(
        httpError(403, { code: EGetImageUseCaseError.GoogleRefreshTokenInvalid }),
      ),
    ).toBe(true);
  });

  it('reads a JSON string body', () => {
    expect(
      isGoogleRefreshTokenInvalidError(
        httpError(
          403,
          JSON.stringify({ name: EUploadImageUseCaseError.GoogleRefreshTokenInvalid }),
        ),
      ),
    ).toBe(true);
  });

  it('ignores other 403s and non-HTTP errors', () => {
    expect(
      isGoogleRefreshTokenInvalidError(
        httpError(403, { name: EUploadImageUseCaseError.UploadToGoogleDriveFailed }),
      ),
    ).toBe(false);
    expect(isGoogleRefreshTokenInvalidError(httpError(401, { name: 'UNEXPECTED_ERROR' }))).toBe(
      false,
    );
    expect(isGoogleRefreshTokenInvalidError(new Error('invalid_grant'))).toBe(false);
  });
});
