/**
 * Google returns `{ error: 'invalid_grant' }` when a stored refresh token
 * is revoked, expired, or issued for a different OAuth client.
 * Do not inspect request `data` / `body` — they contain the refresh token.
 */
export function isGoogleInvalidGrant(error: unknown): boolean {
  if (error == null || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    message?: unknown;
    response?: { data?: { error?: unknown } };
    cause?: { message?: unknown };
  };

  if (candidate.response?.data?.error === 'invalid_grant') {
    return true;
  }
  if (candidate.cause?.message === 'invalid_grant') {
    return true;
  }
  if (candidate.message === 'invalid_grant') {
    return true;
  }

  return false;
}
