import { ETaskType } from '@brainassistant/contracts';

const TASK_TYPES: Record<ETaskType, { icon: string; label: string }> = {
  [ETaskType.Basic]: { icon: 'radio_button_unchecked', label: 'To do' },
  [ETaskType.Location]: { icon: 'location_on', label: 'Location' },
  [ETaskType.Calendar]: { icon: 'calendar_month', label: 'Calendar' },
};

export function taskTypeIcon(type: ETaskType): string {
  return (TASK_TYPES[type] ?? TASK_TYPES[ETaskType.Basic]).icon;
}

export function taskTypeLabel(type: ETaskType): string {
  return (TASK_TYPES[type] ?? TASK_TYPES[ETaskType.Basic]).label;
}
