export enum ETaskStatus {
  Todo = 'TASK_STATUS_TODO',
  Done = 'TASK_STATUS_DONE',
  Cancel = 'TASK_STATUS_CANCEL',
}

export enum ETaskType {
  Basic = 'TASK_TYPE_BASIC',
  // TODO: More statuses will be here
}

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
