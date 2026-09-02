import { Task, TaskPresitant } from '../../../src/shared/domain/models/task.js';
import { UniqueEntityID } from '../../../src/shared/domain/UniqueEntityID.js';
import { TaskMapper } from '../../../src/shared/mappers/task.mapper.js';

describe('TaskMapper', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('toPersistence', () => {
    it('maps domain id to persistence _id', () => {
      const task = Task.create(
        {
          userId: 'user-1',
          type: 'TASK',
          title: 'Valid task title',
          status: 'OPEN',
        },
        new UniqueEntityID('task-123'),
      ).getValue();

      const persisted = TaskMapper.toPersistence(task);

      expect(persisted._id).toBe('task-123');
      expect(persisted.userId).toBe('user-1');
      expect(persisted.title).toBe('Valid task title');
    });
  });

  describe('toDomain', () => {
    it('preserves createdAt and modifiedAt from persistence', () => {
      const createdAt = new Date('2024-06-01T10:00:00.000Z');
      const modifiedAt = new Date('2024-06-02T15:30:00.000Z');

      const raw: TaskPresitant = {
        _id: 'task-1',
        userId: 'user-1',
        type: 'TASK',
        title: 'Persisted task title',
        status: 'OPEN',
        createdAt,
        modifiedAt,
      };

      const domain = TaskMapper.toDomain(raw) as Task;

      expect(domain.createdAt).toEqual(createdAt);
      expect(domain.modifiedAt).toEqual(modifiedAt);
    });
  });

  describe('toDTO', () => {
    it('returns TaskDTO shape without _id field', () => {
      const task = Task.create(
        {
          userId: 'user-1',
          type: 'TASK',
          title: 'Valid task title',
          status: 'OPEN',
        },
        new UniqueEntityID('task-123'),
      ).getValue();

      const dto = TaskMapper.toDTO(task);

      expect(dto.id).toBe('task-123');
      expect(dto.userId).toBe('user-1');
      expect(dto.createdAt).toBe('2025-01-15T12:00:00.000Z');
      expect(dto.modifiedAt).toBe('2025-01-15T12:00:00.000Z');
      expect('_id' in dto).toBe(false);
    });
  });

  describe('round-trip', () => {
    it('preserves task data through persistence and back to domain', () => {
      const original = Task.create(
        {
          userId: 'user-1',
          type: 'TASK',
          title: 'Valid task title',
          status: 'OPEN',
          imageId: 'image-1',
        },
        new UniqueEntityID('task-123'),
      ).getValue();

      const persisted = TaskMapper.toPersistence(original);
      const restored = TaskMapper.toDomain(persisted) as Task;

      expect(restored.id.toString()).toBe('task-123');
      expect(restored.title).toBe('Valid task title');
      expect(restored.imageId).toBe('image-1');
      expect(restored.createdAt).toEqual(original.createdAt);
      expect(restored.modifiedAt).toEqual(original.modifiedAt);
    });
  });
});
