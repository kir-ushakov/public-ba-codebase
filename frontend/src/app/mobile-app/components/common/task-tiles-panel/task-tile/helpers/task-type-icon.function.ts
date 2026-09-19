import { ETaskType } from '@brainassistant/contracts';

const TASK_TYPE_ICONS: Record<ETaskType, string> = {
  [ETaskType.Basic]: 'radio_button_unchecked',
};

export function taskTypeIcon(type: ETaskType): string {
  return TASK_TYPE_ICONS[type] ?? TASK_TYPE_ICONS[ETaskType.Basic];
}
