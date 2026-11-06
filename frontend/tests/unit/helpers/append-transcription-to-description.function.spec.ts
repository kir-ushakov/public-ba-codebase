import { TaskConst } from '@brainassistant/contracts';
import { appendTranscriptionToDescription } from 'src/app/shared/helpers/append-transcription-to-description.function';

describe('appendTranscriptionToDescription', () => {
  it('appends a paragraph and leaves the description unchanged when the text would be too long', () => {
    const current = {
      type: 'doc' as const,
      content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: 'Keep' }] }],
    };

    expect(appendTranscriptionToDescription(current, ' this')).toEqual({
      type: 'doc',
      content: [
        current.content[0],
        { type: 'paragraph', content: [{ type: 'text', text: 'this' }] },
      ],
    });

    const full = 'x'.repeat(TaskConst.DESCRIPTION_MAX_TEXT_LENGTH);
    expect(
      appendTranscriptionToDescription(
        {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: full }] }],
        },
        'more',
      ),
    ).toBeNull();
  });
});
