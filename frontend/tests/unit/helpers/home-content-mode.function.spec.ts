import { ETaskCondition, ETaskStatus, ETaskType } from '@brainassistant/contracts';
import {
  homeCategoryMenuModes,
  homeModeAfterSwipe,
  homeModeCounts,
  homeModeForStatus,
  homeModeForTask,
  homeModeItemLabel,
  isHomeSecondaryMode,
  statusForHomeMode,
  tasksForHomeMode,
} from 'src/app/mobile-app/components/screens/home-screen/helpers/home-content-mode.function';
import type { Task } from 'src/app/shared/models/task.model';

const task = (id: string, status: ETaskStatus): Task => ({
  id,
  userId: 'user-1',
  type: ETaskType.Basic,
  title: id,
  status,
  createdAt: '2026-09-12T10:00:00.000Z',
  modifiedAt: '2026-09-12T10:00:00.000Z',
});

const tasks = [
  task('active', ETaskStatus.Active),
  task('todo', ETaskStatus.Todo),
  task('notes', ETaskStatus.Notes),
  task('done', ETaskStatus.Done),
];

describe('home content mode', () => {
  it('keeps Done off every Home mode and counts the three working sets', () => {
    expect(tasksForHomeMode(tasks, 'active').map(item => item.id)).toEqual(['active']);
    expect(tasksForHomeMode(tasks, 'todo').map(item => item.id)).toEqual(['todo']);
    expect(tasksForHomeMode(tasks, 'notes').map(item => item.id)).toEqual(['notes']);
    expect(homeModeCounts(tasks)).toEqual({ active: 1, todo: 1, waiting: 0, notes: 1 });
  });

  it('names the header count for the selected mode', () => {
    expect(homeModeItemLabel('active', 1)).toBe('1 active item');
    expect(homeModeItemLabel('active', 3)).toBe('3 active items');
    expect(homeModeItemLabel('todo', 8)).toBe('8 to do items');
    expect(homeModeItemLabel('waiting', 1)).toBe('1 waiting item');
    expect(homeModeItemLabel('waiting', 2)).toBe('2 waiting items');
    expect(homeModeItemLabel('notes', 1)).toBe('1 note');
    expect(homeModeItemLabel('notes', 12)).toBe('12 notes');
  });

  it('maps a saved task onto its Home mode and leaves Done where it was', () => {
    expect(statusForHomeMode('active')).toBe(ETaskStatus.Active);
    expect(statusForHomeMode('todo')).toBe(ETaskStatus.Todo);
    expect(statusForHomeMode('waiting')).toBe(ETaskStatus.Todo);
    expect(statusForHomeMode('notes')).toBe(ETaskStatus.Notes);
    expect(homeModeForStatus(ETaskStatus.Active)).toBe('active');
    expect(homeModeForStatus(ETaskStatus.Todo)).toBe('todo');
    expect(homeModeForStatus(ETaskStatus.Notes)).toBe('notes');
    expect(homeModeForStatus(ETaskStatus.Done)).toBeUndefined();
    expect(homeModeForStatus(ETaskStatus.Cancel)).toBeUndefined();
  });

  it('moves one mode on a horizontal swipe and ignores a vertical drag', () => {
    expect(homeModeAfterSwipe('active', -80, 10)).toBe('todo');
    expect(homeModeAfterSwipe('todo', -80, 10)).toBe('waiting');
    expect(homeModeAfterSwipe('waiting', -80, 10)).toBe('notes');
    expect(homeModeAfterSwipe('todo', 80, 10)).toBe('active');
    expect(homeModeAfterSwipe('notes', -80, 10)).toBe('notes');
    expect(homeModeAfterSwipe('active', 80, 10)).toBe('active');
    expect(homeModeAfterSwipe('todo', -20, 10)).toBe('todo');
    expect(homeModeAfterSwipe('todo', -80, 90)).toBe('todo');
  });

  it('offers the other secondary categories and never Active', () => {
    expect(homeCategoryMenuModes('todo')).toEqual(['waiting', 'notes']);
    expect(homeCategoryMenuModes('waiting')).toEqual(['todo', 'notes']);
    expect(homeCategoryMenuModes('notes')).toEqual(['todo', 'waiting']);
    expect(isHomeSecondaryMode('todo')).toBe(true);
    expect(isHomeSecondaryMode('waiting')).toBe(true);
    expect(isHomeSecondaryMode('notes')).toBe(true);
    expect(isHomeSecondaryMode('active')).toBe(false);
  });

  it('lists a waiting task with a todo condition in both To do and Waiting', () => {
    const lemons: Task = {
      ...task('lemons', ETaskStatus.Todo),
      conditions: [ETaskCondition.Todo, ETaskCondition.Location],
    };
    const storeOnly: Task = {
      ...task('store', ETaskStatus.Todo),
      type: ETaskType.Location,
      conditions: [ETaskCondition.Location],
    };

    expect(tasksForHomeMode([lemons, storeOnly], 'todo').map(item => item.id)).toEqual(['lemons']);
    expect(tasksForHomeMode([lemons, storeOnly], 'waiting').map(item => item.id)).toEqual([
      'lemons',
      'store',
    ]);
    expect(homeModeForTask(lemons)).toBe('todo');
    expect(homeModeForTask(storeOnly)).toBe('waiting');
  });
});
