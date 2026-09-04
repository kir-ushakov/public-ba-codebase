import { ETaskStatus, ETaskType } from '@brainassistant/contracts';
export { ETaskStatus, ETaskType };

export type Task = {
  id: string;
  userId: string;
  type: ETaskType;
  title: string;
  imageId?: string;
  status: ETaskStatus;
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

export type TaskChanges = {
  taskId: string;
  changes: Partial<Task>;
};
