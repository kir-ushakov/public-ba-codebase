import { ETaskStatus, ETaskType } from '@brainassistant/contracts';
import type { Task } from 'src/app/shared/models/task.model';
import { filterHomeTasks } from 'src/app/mobile-app/components/screens/home-screen/helpers/filter-home-tasks.function';

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
    status: ETaskStatus.Todo,
    createdAt: '2026-09-11T10:00:00.000Z',
    modifiedAt: '2026-09-11T10:00:00.000Z',
  },
];

describe('filterHomeTasks', () => {
  it('returns every task when the query is empty or blank', () => {
    expect(filterHomeTasks(tasks, '')).toEqual(tasks);
    expect(filterHomeTasks(tasks, '   ')).toEqual(tasks);
  });

  it('matches a title substring without case', () => {
    expect(filterHomeTasks(tasks, 'CAT').map(task => task.id)).toEqual(['task-cat']);
  });

  it('matches plain text inside the description', () => {
    expect(filterHomeTasks(tasks, 'warm light').map(task => task.id)).toEqual(['task-lamp']);
  });
});
