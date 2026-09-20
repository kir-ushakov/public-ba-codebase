import { stripTitleNewlines } from 'src/app/mobile-app/components/screens/task-screen/task-edit/helpers/strip-title-newlines.function';

describe('stripTitleNewlines', () => {
  it('leaves a single-line title unchanged', () => {
    expect(stripTitleNewlines('Buy milk')).toBe('Buy milk');
  });

  it('replaces newlines with a space so a pasted title stays one logical line', () => {
    expect(stripTitleNewlines('Buy milk\nand bread')).toBe('Buy milk and bread');
    expect(stripTitleNewlines('Buy milk\r\nand bread')).toBe('Buy milk and bread');
  });
});
