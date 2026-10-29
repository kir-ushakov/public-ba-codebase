import { ETaskStatus } from '@brainassistant/contracts';
import type { Task } from 'src/app/shared/models/task.model';

export const HOME_CONTENT_MODES = ['active', 'todo', 'notes'] as const;

export type HomeContentMode = (typeof HOME_CONTENT_MODES)[number];

export type HomeContentModeCounts = Record<HomeContentMode, number>;

const STATUS_BY_MODE: Record<HomeContentMode, ETaskStatus> = {
  active: ETaskStatus.Active,
  todo: ETaskStatus.Todo,
  notes: ETaskStatus.Notes,
};

const SWIPE_AXIS_PX = 48;

export function statusForHomeMode(mode: HomeContentMode): ETaskStatus {
  return STATUS_BY_MODE[mode];
}

export function homeModeForStatus(status: ETaskStatus | undefined): HomeContentMode | undefined {
  if (status === ETaskStatus.Active) {
    return 'active';
  }
  if (status === ETaskStatus.Todo) {
    return 'todo';
  }
  if (status === ETaskStatus.Notes) {
    return 'notes';
  }
  return undefined;
}

export function tasksForHomeMode(tasks: Task[], mode: HomeContentMode): Task[] {
  const status = STATUS_BY_MODE[mode];
  return tasks.filter(task => task.status === status);
}

export function homeModeCounts(tasks: Task[]): HomeContentModeCounts {
  return {
    active: tasksForHomeMode(tasks, 'active').length,
    todo: tasksForHomeMode(tasks, 'todo').length,
    notes: tasksForHomeMode(tasks, 'notes').length,
  };
}

export function homeModeItemLabel(mode: HomeContentMode, count: number): string {
  if (mode === 'active') {
    return `${count} active ${count === 1 ? 'item' : 'items'}`;
  }
  if (mode === 'todo') {
    return `${count} to do ${count === 1 ? 'item' : 'items'}`;
  }
  return `${count} ${count === 1 ? 'note' : 'notes'}`;
}

export function homeModeAfterSwipe(
  mode: HomeContentMode,
  deltaX: number,
  deltaY: number,
): HomeContentMode {
  if (Math.abs(deltaX) < SWIPE_AXIS_PX || Math.abs(deltaX) <= Math.abs(deltaY)) {
    return mode;
  }

  const index = HOME_CONTENT_MODES.indexOf(mode);
  const next = index + (deltaX < 0 ? 1 : -1);
  return HOME_CONTENT_MODES[next] ?? mode;
}
