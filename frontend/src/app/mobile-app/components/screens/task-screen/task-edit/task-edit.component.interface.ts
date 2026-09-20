import type { TaskDescriptionDoc } from '@brainassistant/contracts';

export type ITaskEditFormData = {
  title?: string;
  description?: TaskDescriptionDoc | null;
};
