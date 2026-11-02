/**
 * Wire values for TaskDTO.status. Cached PWAs send these strings;
 * renaming or removing a member is a breaking change.
 *
 * Todo is the waiting lifecycle (not yet active). Which Home list shows a
 * waiting task comes from ETaskCondition, not from this value.
 */
export enum ETaskStatus {
  Todo = 'TASK_STATUS_TODO',
  Active = 'TASK_STATUS_ACTIVE',
  Done = 'TASK_STATUS_DONE',
  Cancel = 'TASK_STATUS_CANCEL',
  Notes = 'TASK_STATUS_NOTES',
}
