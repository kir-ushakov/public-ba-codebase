import { ETaskStatus, ETaskType } from '@brainassistant/contracts';
import { filterHomeTasks } from 'src/app/mobile-app/components/screens/home-screen/helpers/filter-home-tasks.function';
import type { Tag } from 'src/app/shared/models/tag.model';
import type { Task } from 'src/app/shared/models/task.model';

const tasks: Task[] = [
  {
    id: 'task-cat',
    userId: 'user-1',
    type: ETaskType.Basic,
    title: 'Buy cat food',
    status: ETaskStatus.Todo,
    createdAt: '2026-09-12T10:00:00.000Z',
    modifiedAt: '2026-09-12T10:00:00.000Z',
  },
  {
    id: 'task-lamp',
    userId: 'user-1',
    type: ETaskType.Basic,
    title: 'Lamp photo',
    description: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Warm light on the desk' }],
        },
      ],
    },
    tagIds: ['tag-errands'],
    status: ETaskStatus.Todo,
    createdAt: '2026-09-11T10:00:00.000Z',
    modifiedAt: '2026-09-11T10:00:00.000Z',
  },
];

const tags: Tag[] = [
  {
    id: 'tag-errands',
    userId: 'user-1',
    name: 'Errands',
    color: '#00a991',
    createdAt: '2026-09-10T10:00:00.000Z',
    modifiedAt: '2026-09-10T10:00:00.000Z',
  },
  {
    id: 'tag-unused',
    userId: 'user-1',
    name: 'Someday',
    color: '#00a991',
    createdAt: '2026-09-10T10:00:00.000Z',
    modifiedAt: '2026-09-10T10:00:00.000Z',
  },
];

describe('filterHomeTasks', () => {
  it('returns every task when the query is empty or blank', () => {
    expect(filterHomeTasks(tasks, '', tags)).toEqual(tasks);
    expect(filterHomeTasks(tasks, '   ', tags)).toEqual(tasks);
  });

  it('matches a title substring without case', () => {
    expect(filterHomeTasks(tasks, 'CAT', tags).map(task => task.id)).toEqual(['task-cat']);
  });

  it('matches plain text inside the description', () => {
    expect(filterHomeTasks(tasks, 'warm light', tags).map(task => task.id)).toEqual(['task-lamp']);
  });

  it('matches a tag name on the task without case', () => {
    expect(filterHomeTasks(tasks, 'ERRAND', tags).map(task => task.id)).toEqual(['task-lamp']);
  });

  it('ignores a tag that is not assigned to the task', () => {
    expect(filterHomeTasks(tasks, 'someday', tags)).toEqual([]);
  });
});
