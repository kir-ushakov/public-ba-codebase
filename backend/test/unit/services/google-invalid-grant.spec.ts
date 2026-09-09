import { isGoogleInvalidGrant } from '../../../src/modules/integrations/google/services/google-invalid-grant.js';

describe('isGoogleInvalidGrant', () => {
  it('detects the Google token response body', () => {
    expect(
      isGoogleInvalidGrant({
        response: { data: { error: 'invalid_grant', error_description: 'Bad Request' } },
      }),
    ).toBe(true);
  });

  it('detects the gaxios cause message', () => {
    expect(isGoogleInvalidGrant({ cause: { message: 'invalid_grant', code: 400 } })).toBe(true);
  });

  it('detects a top-level invalid_grant message', () => {
    expect(isGoogleInvalidGrant({ message: 'invalid_grant' })).toBe(true);
  });

  it('ignores unrelated errors', () => {
    expect(isGoogleInvalidGrant(new Error('network'))).toBe(false);
    expect(isGoogleInvalidGrant({ response: { data: { error: 'invalid_client' } } })).toBe(false);
    expect(isGoogleInvalidGrant(null)).toBe(false);
  });
});
