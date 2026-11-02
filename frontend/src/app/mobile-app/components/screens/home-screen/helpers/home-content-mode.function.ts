import { ETaskCondition, ETaskStatus } from '@brainassistant/contracts';
import type { Task } from 'src/app/shared/models/task.model';
import {
  deriveTaskConditions,
  taskConditions,
} from 'src/app/shared/helpers/task-conditions.function';

export const HOME_CONTENT_MODES = ['active', 'todo', 'waiting', 'notes'] as const;

export type HomeContentMode = (typeof HOME_CONTENT_MODES)[number];

export type HomeContentModeCounts = Record<HomeContentMode, number>;

const SWIPE_AXIS_PX = 48;

export function statusForHomeMode(mode: HomeContentMode): ETaskStatus {
  if (mode === 'active') {
    return ETaskStatus.Active;
  }
  if (mode === 'notes') {
    return ETaskStatus.Notes;
  }
  return ETaskStatus.Todo;
}

export function taskDraftForHomeMode(mode: HomeContentMode): {
  status: ETaskStatus;
  conditions?: ETaskCondition[];
} {
  if (mode === 'active') {
    return { status: ETaskStatus.Active, conditions: [ETaskCondition.Todo] };
  }
  if (mode === 'waiting') {
    return { status: ETaskStatus.Todo, conditions: [ETaskCondition.Calendar] };
  }
  if (mode === 'notes') {
    return { status: ETaskStatus.Notes };
  }
  return { status: ETaskStatus.Todo, conditions: [ETaskCondition.Todo] };
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

export function homeModeForTask(
  task: Pick<Task, 'status' | 'type' | 'conditions'>,
): HomeContentMode | undefined {
  if (task.status === ETaskStatus.Active) {
    return 'active';
  }
  if (task.status === ETaskStatus.Notes) {
    return 'notes';
  }
  if (task.status !== ETaskStatus.Todo) {
    return undefined;
  }
  const conditions = task.conditions?.length ? task.conditions : deriveTaskConditions(task.type);
  if (conditions.includes(ETaskCondition.Todo)) {
    return 'todo';
  }
  if (
    conditions.includes(ETaskCondition.Calendar) ||
    conditions.includes(ETaskCondition.Location)
  ) {
    return 'waiting';
  }
  return 'todo';
}

export function tasksForHomeMode(tasks: Task[], mode: HomeContentMode): Task[] {
  if (mode === 'active') {
    return tasks.filter(task => task.status === ETaskStatus.Active);
  }
  if (mode === 'notes') {
    return tasks.filter(task => task.status === ETaskStatus.Notes);
  }
  return tasks.filter(task => task.status === ETaskStatus.Todo && listedIn(task, mode));
}

export function homeModeCounts(tasks: Task[]): HomeContentModeCounts {
  return {
    active: tasksForHomeMode(tasks, 'active').length,
    todo: tasksForHomeMode(tasks, 'todo').length,
    waiting: tasksForHomeMode(tasks, 'waiting').length,
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
  if (mode === 'waiting') {
    return `${count} waiting ${count === 1 ? 'item' : 'items'}`;
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

function listedIn(task: Task, mode: 'todo' | 'waiting'): boolean {
  const conditions = taskConditions(task);
  if (mode === 'todo') {
    return conditions.includes(ETaskCondition.Todo);
  }
  return (
    conditions.includes(ETaskCondition.Calendar) || conditions.includes(ETaskCondition.Location)
  );
}
