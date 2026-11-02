import type { ETaskStatus, TaskDescriptionDoc } from '@brainassistant/contracts';
import type { ETaskCondition } from '@brainassistant/contracts';

export type ITaskEditFormData = {
  title?: string;
  description?: TaskDescriptionDoc | null;
  status?: ETaskStatus;
  conditions?: ETaskCondition[];
  tagIds?: string[];
};
