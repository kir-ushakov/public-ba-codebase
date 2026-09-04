/**
 * Wire values for TaskDTO.status. Cached PWAs send these strings;
 * renaming or removing a member is a breaking change.
 */
export enum ETaskStatus {
  Todo = 'TASK_STATUS_TODO',
  Done = 'TASK_STATUS_DONE',
  Cancel = 'TASK_STATUS_CANCEL',
}
