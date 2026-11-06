/**
 * POST /api/auth/refresh
 *
 * The credential is the httpOnly `refresh` cookie (path `/api/auth`), not the JSON body.
 * A success rotates that cookie and sets a new `jwt` cookie. `{ refreshed: true }` only
 * confirms the rotation. Additive: cached clients never call this route, and the login
 * response is unchanged, so they keep using the sliding `jwt` cookie.
 */
export namespace RefreshSessionContract {
  export type Request = Record<string, never>;

  export type Response = {
    refreshed: true;
  };
}
