import { ETaskStatus, type ChecklistItemDTO } from '@brainassistant/contracts';

export type ChecklistItem = ChecklistItemDTO;

export function isChecklistComplete(checklist?: ChecklistItem[]): boolean {
  if (checklist === undefined || checklist.length === 0) {
    return false;
  }
  return checklist.every(item => item.completed);
}

export function shouldOfferChecklistCompletion(
  status: ETaskStatus,
  previous: ChecklistItem[] | undefined,
  next: ChecklistItem[] | undefined,
): boolean {
  if (status !== ETaskStatus.Todo && status !== ETaskStatus.Active) {
    return false;
  }
  return !isChecklistComplete(previous) && isChecklistComplete(next);
}

export function shouldOfferChecklistCompletionOnNoteConversion(
  from: ETaskStatus,
  to: ETaskStatus,
  checklist: ChecklistItem[] | undefined,
): boolean {
  return from === ETaskStatus.Notes && to === ETaskStatus.Todo && isChecklistComplete(checklist);
}

export function moveChecklistItem(
  items: ChecklistItem[],
  id: string,
  direction: -1 | 1,
): ChecklistItem[] {
  const index = items.findIndex(item => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) {
    return items;
  }
  const next = items.slice();
  const [item] = next.splice(index, 1);
  if (!item) {
    return items;
  }
  next.splice(target, 0, item);
  return next;
}

export function checklistKeepLabel(status: ETaskStatus): string {
  return status === ETaskStatus.Active ? 'Keep Active' : 'Keep as To do';
}
