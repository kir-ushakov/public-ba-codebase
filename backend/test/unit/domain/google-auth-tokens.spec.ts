import { GoogleAuthTokens } from '../../../src/shared/domain/values/user/google-auth-tokens.js';

describe('GoogleAuthTokens', () => {
  describe('create', () => {
    it('creates a value object from access and refresh tokens', () => {
      const result = GoogleAuthTokens.create({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      expect(result.isSuccess).toBe(true);
      const tokens = result.getValue();
      expect(tokens.accessToken).toBe('access');
      expect(tokens.refreshToken).toBe('refresh');
    });

    it('allows a missing refresh token', () => {
      const result = GoogleAuthTokens.create({ accessToken: 'access' });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().refreshToken).toBe('');
    });

    it('rejects an empty access token', () => {
      const result = GoogleAuthTokens.create({ accessToken: '' });

      expect(result.isFailure).toBe(true);
    });

    it('compares two token pairs by value', () => {
      const a = GoogleAuthTokens.create({
        accessToken: 'access',
        refreshToken: 'refresh',
      }).getValue();
      const b = GoogleAuthTokens.create({
        accessToken: 'access',
        refreshToken: 'refresh',
      }).getValue();

      expect(a.equals(b)).toBe(true);
    });
  });
});
