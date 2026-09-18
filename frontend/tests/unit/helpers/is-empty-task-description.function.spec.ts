import { isEmptyTaskDescription } from 'src/app/shared/helpers/is-empty-task-description.function';

describe('isEmptyTaskDescription', () => {
  it('treats a missing document as empty', () => {
    expect(isEmptyTaskDescription(undefined)).toBe(true);
    expect(isEmptyTaskDescription(null)).toBe(true);
  });

  it('treats an empty paragraph as empty', () => {
    expect(isEmptyTaskDescription({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe(true);
  });

  it('treats a document with text as not empty', () => {
    expect(
      isEmptyTaskDescription({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Contact supplier' }] }],
      }),
    ).toBe(false);
  });
});
