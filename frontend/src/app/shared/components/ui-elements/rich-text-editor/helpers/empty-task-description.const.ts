import type { TaskDescriptionDoc } from '@brainassistant/contracts';

export const EMPTY_TASK_DESCRIPTION: TaskDescriptionDoc = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};
