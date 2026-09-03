import { Guard } from '../../../src/shared/core/guard.js';

describe('Guard', () => {
  describe('notEmptyString', () => {
    it('returns true for a non-empty trimmed string', () => {
      expect(Guard.notEmptyString('hello')).toBe(true);
    });

    it('returns false for empty or whitespace-only strings', () => {
      expect(Guard.notEmptyString('')).toBe(false);
      expect(Guard.notEmptyString('   ')).toBe(false);
    });
  });

  describe('textLengthAtLeast', () => {
    it('returns true when length meets the minimum', () => {
      expect(Guard.textLengthAtLeast('12345', 5)).toBe(true);
    });

    it('returns false when length is below the minimum', () => {
      expect(Guard.textLengthAtLeast('1234', 5)).toBe(false);
    });
  });

  describe('textLengthAtMost', () => {
    it('returns true when length is within the maximum', () => {
      expect(Guard.textLengthAtMost('a'.repeat(120), 120)).toBe(true);
    });

    it('returns false when length exceeds the maximum', () => {
      expect(Guard.textLengthAtMost('a'.repeat(121), 120)).toBe(false);
    });
  });
});
