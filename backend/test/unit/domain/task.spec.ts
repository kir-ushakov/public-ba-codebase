import { ETaskError, Task } from '../../../src/shared/domain/models/task.js';
import { UniqueEntityID } from '../../../src/shared/domain/UniqueEntityID.js';
import { ETaskStatus, ETaskType } from '@brainassistant/contracts';

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
      expect(task.createdAt).toEqual(new Date('2025-01-15T12:00:00.000Z'));
      expect(task.modifiedAt).toEqual(new Date('2025-01-15T12:00:00.000Z'));
    });

    it('rejects a title that is too short when no imageId is provided', () => {
      const result = Task.create({
        ...baseTaskProps,
        title: 'Hi',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(ETaskError.TitleTooShort);
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
        title: 'a'.repeat(121),
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(ETaskError.TitleTooLong);
    });

    it('accepts a title at the minimum length boundary', () => {
      const result = Task.create({
        ...baseTaskProps,
        title: '12345',
      });

      expect(result.isSuccess).toBe(true);
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
  });
});
