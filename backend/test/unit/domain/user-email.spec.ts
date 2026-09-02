import { UserEmail } from '../../../src/shared/domain/values/user/user-email.js';

describe('UserEmail', () => {
  describe('create', () => {
    it('normalizes email to lowercase', () => {
      const result = UserEmail.create('Test@Example.COM');

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe('test@example.com');
    });

    it('rejects email with surrounding whitespace before normalization', () => {
      const result = UserEmail.create('  Test@Example.COM  ');

      expect(result.isFailure).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = UserEmail.create('not-an-email');

      expect(result.isFailure).toBe(true);
    });

    it('rejects empty string', () => {
      const result = UserEmail.create('');

      expect(result.isFailure).toBe(true);
    });
  });
});
