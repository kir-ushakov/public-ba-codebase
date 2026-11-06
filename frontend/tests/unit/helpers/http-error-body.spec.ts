import { HttpErrorResponse } from '@angular/common/http';
import { EGetImageUseCaseError } from '@brainassistant/contracts';
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
    const blob = new Blob([JSON.stringify({ name: EGetImageUseCaseError.ImageFileMissing })], {
      type: 'application/json',
    });
    const normalized = await normalizeHttpErrorResponse(httpError(404, blob));
    expect(readApiErrorName(normalized)).toBe(EGetImageUseCaseError.ImageFileMissing);
  });
});
