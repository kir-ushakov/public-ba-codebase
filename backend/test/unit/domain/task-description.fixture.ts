import type { TaskDescriptionDoc } from '@brainassistant/contracts';

export const sampleDescription: TaskDescriptionDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Contact supplier', marks: [{ type: 'bold' }] }],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Check delivery date' }],
            },
          ],
        },
      ],
    },
  ],
};
