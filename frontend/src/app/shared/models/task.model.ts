import {
  ETaskCondition,
  ETaskStatus,
  ETaskType,
  type AudioAttachment,
  type ChecklistItemDTO,
  type TaskDescriptionDoc,
} from '@brainassistant/contracts';
export type { AudioAttachment };
export { ETaskCondition, ETaskStatus, ETaskType };
export type { TaskDescriptionDoc };
export type ChecklistItem = ChecklistItemDTO;

export type Task = {
  id: string;
  userId: string;
  type: ETaskType;
  title: string;
  imageId?: string;
  images?: string[];
  description?: TaskDescriptionDoc;
  checklist?: ChecklistItem[];
  audioAttachments?: AudioAttachment[];
  tagIds?: string[];
  status: ETaskStatus;
  conditions?: ETaskCondition[];
  createdAt: string;
  modifiedAt: string;
};

export const defaultTask = {
  id: null,
  userId: null,
  type: ETaskType.Basic,
  status: ETaskStatus.Todo,
  title: '',
  createdAt: null,
  modifiedAt: null,
};

export type DefaultTask = typeof defaultTask & {
  imageId?: string;
  description?: TaskDescriptionDoc;
  checklist?: ChecklistItem[];
  audioAttachments?: AudioAttachment[];
  tagIds?: string[];
  conditions?: ETaskCondition[];
};

export type TaskChanges = {
  taskId: string;
  changes: Partial<Task>;
};
