import { ETaskError, Task } from '../../../src/shared/domain/models/task.js';
import { UniqueEntityID } from '../../../src/shared/domain/UniqueEntityID.js';
import {
  ETaskCondition,
  ETaskStatus,
  ETaskType,
  TaskConst,
  type TaskDescriptionDoc,
} from '@brainassistant/contracts';
import { sampleDescription } from './task-description.fixture.js';

const baseTaskProps = {
  userId: 'user-1',
  type: ETaskType.Basic,
  status: ETaskStatus.Todo,
} as const;

describe('Task', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    it('creates a task with a valid title', () => {
      const result = Task.create({
        ...baseTaskProps,
        title: 'Valid task title',
      });

      expect(result.isSuccess).toBe(true);
      const task = result.getValue();
      expect(task.title).toBe('Valid task title');
      expect(task.type).toBe(ETaskType.Basic);
      expect(task.status).toBe(ETaskStatus.Todo);
      expect(task.createdAt).toEqual(new Date('2025-01-15T12:00:00.000Z'));
      expect(task.modifiedAt).toEqual(new Date('2025-01-15T12:00:00.000Z'));
      expect(task.conditions).toEqual([ETaskCondition.Todo]);
    });

    it('accepts a two-character title when no imageId is provided', () => {
      const result = Task.create({
        ...baseTaskProps,
        title: 'Hi',
      });

      expect(result.isSuccess).toBe(true);
    });

    it('rejects an empty title when no imageId is provided', () => {
      const result = Task.create({
        ...baseTaskProps,
        title: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(ETaskError.TitleMissed);
    });

    it('allows an empty title when imageId is provided', () => {
      const result = Task.create({
        ...baseTaskProps,
        title: '',
        imageId: 'image-1',
      });

      expect(result.isSuccess).toBe(true);
    });

    it('rejects a title longer than the maximum', () => {
      const result = Task.create({
        ...baseTaskProps,
        title: 'a'.repeat(TaskConst.TITLE_MAX_LENGTH + 1),
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(ETaskError.TitleTooLong);
    });

    it('accepts a title at the maximum length boundary', () => {
      const result = Task.create({
        ...baseTaskProps,
        title: 'a'.repeat(TaskConst.TITLE_MAX_LENGTH),
      });

      expect(result.isSuccess).toBe(true);
    });

    it('accepts a title at the minimum length boundary', () => {
      const result = Task.create({
        ...baseTaskProps,
        title: 'A',
      });

      expect(result.isSuccess).toBe(true);
    });

    it('stores a valid description', () => {
      const result = Task.create({
        ...baseTaskProps,
        title: 'Valid task title',
        description: sampleDescription,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().description).toEqual(sampleDescription);
    });

    it('drops an empty description instead of storing it', () => {
      const result = Task.create({
        ...baseTaskProps,
        title: 'Valid task title',
        description: { type: 'doc', content: [{ type: 'paragraph' }] },
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().description).toBeUndefined();
    });

    it('rejects an unsupported description node', () => {
      const result = Task.create({
        ...baseTaskProps,
        title: 'Valid task title',
        description: {
          type: 'doc',
          content: [{ type: 'heading', content: [{ type: 'text', text: 'Nope' }] }],
        } as unknown as TaskDescriptionDoc,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(ETaskError.DescriptionInvalid);
    });

    it('keeps createdAt and modifiedAt sent by the device', () => {
      const createdAt = new Date('2020-03-01T10:00:00.000Z');
      const modifiedAt = new Date('2020-03-01T10:05:00.000Z');

      const result = Task.create({
        ...baseTaskProps,
        title: 'Valid task title',
        createdAt,
        modifiedAt,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().createdAt).toEqual(createdAt);
      expect(result.getValue().modifiedAt).toEqual(modifiedAt);
    });

    it('preserves a provided id', () => {
      const result = Task.create(
        {
          ...baseTaskProps,
          title: 'Valid task title',
        },
        new UniqueEntityID('task-123'),
      );

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().id.toString()).toBe('task-123');
    });
  });

  describe('update', () => {
    it('rejects update with empty title when no imageId is present', () => {
      const createResult = Task.create({
        ...baseTaskProps,
        title: 'Valid task title',
      });
      const task = createResult.getValue();

      const updateResult = task.update({ title: '' });

      expect(updateResult.isFailure).toBe(true);
      expect(updateResult.error.code).toBe(ETaskError.TitleMissed);
    });

    it('stores the device modifiedAt and keeps the original createdAt', () => {
      const createdAt = new Date('2020-03-01T10:00:00.000Z');
      const createResult = Task.create({
        ...baseTaskProps,
        title: 'Valid task title',
        createdAt,
        modifiedAt: createdAt,
      });
      const task = createResult.getValue();
      const editedAt = new Date('2020-03-02T09:00:00.000Z');

      const updateResult = task.update({
        title: 'Renamed task',
        modifiedAt: editedAt,
      });

      expect(updateResult.isSuccess).toBe(true);
      expect(task.title).toBe('Renamed task');
      expect(task.modifiedAt).toEqual(editedAt);
      expect(task.createdAt).toEqual(createdAt);
    });

    it('updates description and can clear it with an empty document', () => {
      const createResult = Task.create({
        ...baseTaskProps,
        title: 'Valid task title',
        description: sampleDescription,
      });
      const task = createResult.getValue();

      const cleared = task.update({
        description: { type: 'doc', content: [{ type: 'paragraph' }] },
      });

      expect(cleared.isSuccess).toBe(true);
      expect(task.description).toBeUndefined();
    });

    it('stores a checklist and keeps it when a later update omits the field', () => {
      const checklist = [
        { id: 'item-1', text: 'Buy cat food', completed: false },
        { id: 'item-2', text: 'Check salmon variant', completed: true },
      ];
      const created = Task.create({
        ...baseTaskProps,
        title: 'Valid task title',
        checklist,
      });

      expect(created.isSuccess).toBe(true);
      const task = created.getValue();
      expect(task.checklist).toEqual(checklist);

      const renamed = task.update({ title: 'Renamed task' });

      expect(renamed.isSuccess).toBe(true);
      expect(task.checklist).toEqual(checklist);
      expect(task.title).toBe('Renamed task');
    });

    it('clears a checklist when the update sends an empty list', () => {
      const created = Task.create({
        ...baseTaskProps,
        title: 'Valid task title',
        checklist: [{ id: 'item-1', text: 'Buy cat food', completed: false }],
      });
      const task = created.getValue();

      const cleared = task.update({ checklist: [] });

      expect(cleared.isSuccess).toBe(true);
      expect(task.checklist).toBeUndefined();
    });

    it('rejects a checklist item without text', () => {
      const created = Task.create({
        ...baseTaskProps,
        title: 'Valid task title',
        checklist: [{ id: 'item-1', text: '   ', completed: false }],
      });

      expect(created.isFailure).toBe(true);
      expect(created.error.code).toBe(ETaskError.ChecklistInvalid);
    });

    it('rejects a checklist with a duplicate item id', () => {
      const created = Task.create({
        ...baseTaskProps,
        title: 'Valid task title',
        checklist: [
          { id: 'same', text: 'One', completed: false },
          { id: 'same', text: 'Two', completed: false },
        ],
      });

      expect(created.isFailure).toBe(true);
      expect(created.error.code).toBe(ETaskError.ChecklistInvalid);
    });

    it('creates a note that keeps its checklist', () => {
      const checklist = [{ id: 'item-1', text: 'Buy cat food', completed: true }];
      const created = Task.create({
        ...baseTaskProps,
        status: ETaskStatus.Notes,
        title: 'Note title here',
        checklist,
      });

      expect(created.isSuccess).toBe(true);
      expect(created.getValue().status).toBe(ETaskStatus.Notes);
      expect(created.getValue().checklist).toEqual(checklist);
    });
  });

  describe('reconstitute', () => {
    it('loads a persisted task that create() would reject', () => {
      const createdAt = new Date('2024-01-01T00:00:00.000Z');
      const modifiedAt = new Date('2024-01-02T00:00:00.000Z');

      const task = Task.reconstitute(
        {
          ...baseTaskProps,
          title: '',
          createdAt,
          modifiedAt,
        },
        new UniqueEntityID('legacy-task'),
      );

      expect(task.id.toString()).toBe('legacy-task');
      expect(task.title).toBe('');
      expect(task.createdAt).toEqual(createdAt);
      expect(task.modifiedAt).toEqual(modifiedAt);

      const invariants = task.checkWriteInvariants();
      expect(invariants.isFailure).toBe(true);
      expect(invariants.error.code).toBe(ETaskError.TitleMissed);
    });
  });

  describe('conditions', () => {
    it('stores todo and location together and projects the type older clients read', () => {
      const result = Task.create({
        ...baseTaskProps,
        title: 'Buy lemons',
        conditions: [ETaskCondition.Todo, ETaskCondition.Location],
      });

      expect(result.isSuccess).toBe(true);
      const task = result.getValue();
      expect(task.conditions).toEqual([ETaskCondition.Todo, ETaskCondition.Location]);
      expect(task.type).toBe(ETaskType.Location);
    });

    it('rejects an empty condition list and conditions on a note', () => {
      const empty = Task.create({
        ...baseTaskProps,
        title: 'Buy lemons',
        conditions: [],
      });
      const note = Task.create({
        ...baseTaskProps,
        title: 'A note',
        status: ETaskStatus.Notes,
        conditions: [ETaskCondition.Todo],
      });

      expect(empty.isFailure).toBe(true);
      expect(empty.error.code).toBe(ETaskError.ConditionsInvalid);
      expect(note.isFailure).toBe(true);
      expect(note.error.code).toBe(ETaskError.ConditionsInvalid);
    });

    it('keeps stored conditions when an older client omits them', () => {
      const created = Task.create({
        ...baseTaskProps,
        title: 'Buy lemons',
        conditions: [ETaskCondition.Todo, ETaskCondition.Location],
      }).getValue();

      const updated = created.update({
        title: 'Buy more lemons',
        type: ETaskType.Basic,
        status: ETaskStatus.Todo,
      });

      expect(updated.isSuccess).toBe(true);
      expect(created.conditions).toEqual([ETaskCondition.Todo, ETaskCondition.Location]);
      expect(created.type).toBe(ETaskType.Location);
    });

    it('clears conditions when the task becomes a note', () => {
      const created = Task.create({
        ...baseTaskProps,
        title: 'Buy lemons',
        conditions: [ETaskCondition.Location],
      }).getValue();

      const updated = created.update({ status: ETaskStatus.Notes });

      expect(updated.isSuccess).toBe(true);
      expect(created.status).toBe(ETaskStatus.Notes);
      expect(created.conditions).toBeUndefined();
    });
  });
});
