import { ETaskStatus } from '@brainassistant/contracts';

export const ACTIVE_TASK_TO_NOTE_CONFIRM =
  'Turn this active task into a note? It will leave Active. You can convert it back.';

export function statusAfterConversion(status: ETaskStatus): ETaskStatus {
  return status === ETaskStatus.Notes ? ETaskStatus.Todo : ETaskStatus.Notes;
}

export function confirmActiveToNote(status: ETaskStatus): boolean {
  if (status !== ETaskStatus.Active) {
    return true;
  }
  // eslint-disable-next-line no-alert -- short check before an active task leaves Active
  return window.confirm(ACTIVE_TASK_TO_NOTE_CONFIRM);
}
