export type Task = {
  id: string;
  userId: string;
  type: ETaskType;
  title: string;
  status: ETaskStatus;
  createdAt: Date;
  modifiedAt: Date;
};

export enum ETaskStatus {
  Todo = 'TASK_STATUS_TODO',
  Done = 'TASK_STATUS_DONE',
  Cancel = 'TASK_STATUS_CANCEL',
}

export enum ETaskType {
  Basic = 'TASK_TYPE_BASIC',
  // TODO: More statuses will be here
}
