/**
 * Wire values for TaskDTO.conditions. Cached PWAs omit this field;
 * renaming or removing a member is a breaking change.
 *
 * A task has one or more conditions. `todo` means it can be started at any
 * time. `calendar` and `location` are external triggers. A note has none.
 */
export enum ETaskCondition {
  Todo = 'TASK_CONDITION_TODO',
  Calendar = 'TASK_CONDITION_CALENDAR',
  Location = 'TASK_CONDITION_LOCATION',
}
