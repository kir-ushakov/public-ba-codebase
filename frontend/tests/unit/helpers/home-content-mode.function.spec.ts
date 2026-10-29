import { ETaskStatus, ETaskType } from '@brainassistant/contracts';
import {
  homeModeAfterSwipe,
  homeModeCounts,
  homeModeForStatus,
  homeModeItemLabel,
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
    expect(homeModeCounts(tasks)).toEqual({ active: 1, todo: 1, notes: 1 });
  });

  it('names the header count for the selected mode', () => {
    expect(homeModeItemLabel('active', 1)).toBe('1 active item');
    expect(homeModeItemLabel('active', 3)).toBe('3 active items');
    expect(homeModeItemLabel('todo', 8)).toBe('8 to do items');
    expect(homeModeItemLabel('notes', 1)).toBe('1 note');
    expect(homeModeItemLabel('notes', 12)).toBe('12 notes');
  });

  it('maps a saved task onto its Home mode and leaves Done where it was', () => {
    expect(statusForHomeMode('active')).toBe(ETaskStatus.Active);
    expect(statusForHomeMode('todo')).toBe(ETaskStatus.Todo);
    expect(statusForHomeMode('notes')).toBe(ETaskStatus.Notes);
    expect(homeModeForStatus(ETaskStatus.Active)).toBe('active');
    expect(homeModeForStatus(ETaskStatus.Todo)).toBe('todo');
    expect(homeModeForStatus(ETaskStatus.Notes)).toBe('notes');
    expect(homeModeForStatus(ETaskStatus.Done)).toBeUndefined();
    expect(homeModeForStatus(ETaskStatus.Cancel)).toBeUndefined();
  });

  it('moves one mode on a horizontal swipe and ignores a vertical drag', () => {
    expect(homeModeAfterSwipe('active', -80, 10)).toBe('todo');
    expect(homeModeAfterSwipe('todo', 80, 10)).toBe('active');
    expect(homeModeAfterSwipe('notes', -80, 10)).toBe('notes');
    expect(homeModeAfterSwipe('active', 80, 10)).toBe('active');
    expect(homeModeAfterSwipe('todo', -20, 10)).toBe('todo');
    expect(homeModeAfterSwipe('todo', -80, 90)).toBe('todo');
  });
});
