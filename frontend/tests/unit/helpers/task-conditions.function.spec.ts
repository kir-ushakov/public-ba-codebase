import { ETaskCondition, ETaskStatus, ETaskType } from '@brainassistant/contracts';
import {
  deriveTaskConditions,
  normalizeTaskRecord,
  projectTaskType,
  taskHasTodoCondition,
} from 'src/app/shared/helpers/task-conditions.function';
import type { Task } from 'src/app/shared/models/task.model';

const task = (patch: Partial<Task> = {}): Task => ({
  id: 'task-1',
  userId: 'user-1',
  type: ETaskType.Basic,
  title: 'Buy lemons',
  status: ETaskStatus.Todo,
  createdAt: '2026-09-12T10:00:00.000Z',
  modifiedAt: '2026-09-12T10:00:00.000Z',
  ...patch,
});

describe('task conditions', () => {
  it('derives a todo condition for a legacy basic task and adds the stored type', () => {
    expect(deriveTaskConditions(ETaskType.Basic)).toEqual([ETaskCondition.Todo]);
    expect(deriveTaskConditions(ETaskType.Calendar)).toEqual([
      ETaskCondition.Todo,
      ETaskCondition.Calendar,
    ]);
    expect(deriveTaskConditions(ETaskType.Location)).toEqual([
      ETaskCondition.Todo,
      ETaskCondition.Location,
    ]);
  });

  it('projects location ahead of calendar for the single type older clients can store', () => {
    expect(projectTaskType([ETaskCondition.Todo, ETaskCondition.Location])).toBe(
      ETaskType.Location,
    );
    expect(projectTaskType([ETaskCondition.Calendar, ETaskCondition.Location])).toBe(
      ETaskType.Location,
    );
    expect(projectTaskType([ETaskCondition.Calendar])).toBe(ETaskType.Calendar);
    expect(projectTaskType([ETaskCondition.Todo])).toBe(ETaskType.Basic);
  });

  it('fills missing conditions on read and clears them for a note', () => {
    expect(normalizeTaskRecord(task({ type: ETaskType.Calendar })).conditions).toEqual([
      ETaskCondition.Todo,
      ETaskCondition.Calendar,
    ]);
    const note = normalizeTaskRecord(
      task({
        status: ETaskStatus.Notes,
        conditions: [ETaskCondition.Todo],
      }),
    );
    expect(note.conditions).toBeUndefined();
    expect(taskHasTodoCondition(task({ conditions: [ETaskCondition.Location] }))).toBe(false);
    expect(
      taskHasTodoCondition(task({ conditions: [ETaskCondition.Todo, ETaskCondition.Location] })),
    ).toBe(true);
  });
});
