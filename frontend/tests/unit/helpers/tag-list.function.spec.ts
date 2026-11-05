import { ETaskStatus, ETaskType } from '@brainassistant/contracts';
import {
  buildTagRows,
  filterTagRows,
  tagsPageSubtitle,
} from 'src/app/mobile-app/components/screens/tags-screen/helpers/tag-list.function';
import type { Tag } from 'src/app/shared/models/tag.model';
import type { Task } from 'src/app/shared/models/task.model';

const tags: Tag[] = [
  {
    id: 'ideas',
    userId: 'user-1',
    name: 'Ideas',
    color: '#00a991',
    isPinned: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'work',
    userId: 'user-1',
    name: 'Work',
    color: '#00a991',
    createdAt: '2026-01-02T00:00:00.000Z',
    modifiedAt: '2026-01-02T00:00:00.000Z',
  },
];

const tasks: Task[] = [
  {
    id: 'task-1',
    userId: 'user-1',
    type: ETaskType.Basic,
    title: 'One',
    status: ETaskStatus.Active,
    tagIds: ['work'],
    createdAt: '2026-01-03T00:00:00.000Z',
    modifiedAt: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'task-2',
    userId: 'user-1',
    type: ETaskType.Basic,
    title: 'Two',
    status: ETaskStatus.Todo,
    tagIds: ['work', 'ideas'],
    createdAt: '2026-01-04T00:00:00.000Z',
    modifiedAt: '2026-01-04T00:00:00.000Z',
  },
];

describe('tag list', () => {
  it('sorts tags by name and counts tasks that use them', () => {
    const rows = buildTagRows(tags, tasks);

    expect(rows.map(row => row.name)).toEqual(['Ideas', 'Work']);
    expect(rows.find(row => row.id === 'work')).toMatchObject({
      isPinned: false,
      taskCount: 2,
      countLabel: '2 tasks',
    });
    expect(rows.find(row => row.id === 'ideas')?.countLabel).toBe('1 task');
  });

  it('filters by name without case and leaves the source list intact', () => {
    const rows = buildTagRows(tags, tasks);

    expect(filterTagRows(rows, '  WORK ').map(row => row.id)).toEqual(['work']);
    expect(filterTagRows(rows, 'missing')).toEqual([]);
    expect(rows).toHaveLength(2);
  });

  it('mentions the pinned count only when a tag is pinned', () => {
    expect(tagsPageSubtitle(16, 2)).toBe('16 tags · 2 pinned');
    expect(tagsPageSubtitle(1, 0)).toBe('1 tag');
    expect(tagsPageSubtitle(0, 0)).toBe('0 tags');
  });
});
