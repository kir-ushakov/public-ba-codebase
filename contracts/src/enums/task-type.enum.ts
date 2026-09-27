/**
 * Wire values for TaskDTO.type. Cached PWAs send these strings;
 * renaming or removing a member is a breaking change.
 *
 * Basic is the To do type. Its wire value stays TASK_TYPE_BASIC so stored
 * tasks and older clients keep working.
 */
export enum ETaskType {
  Basic = 'TASK_TYPE_BASIC',
  Location = 'TASK_TYPE_LOCATION',
  Calendar = 'TASK_TYPE_CALENDAR',
}
