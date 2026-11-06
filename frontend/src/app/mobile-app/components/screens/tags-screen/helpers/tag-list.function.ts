import { displayTagColor, type Tag } from 'src/app/shared/models/tag.model';
import type { Task } from 'src/app/shared/models/task.model';

export type TagListItem = {
  id: string;
  name: string;
  color: string;
  isPinned: boolean;
  taskCount: number;
  countLabel: string;
};

export function tagCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'task' : 'tasks'}`;
}

export function deleteTagMessage(name: string, taskCount: number): string {
  const tasks = `${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`;
  return `Delete "${name}"? This tag will be removed from ${tasks}. The tasks themselves will not be deleted.`;
}

export function tagsPageSubtitle(total: number, pinned: number): string {
  const tags = `${total} ${total === 1 ? 'tag' : 'tags'}`;
  if (pinned === 0) {
    return tags;
  }
  return `${tags} · ${pinned} pinned`;
}

export function buildTagRows(tags: Tag[], tasks: Task[]): TagListItem[] {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    for (const tagId of task.tagIds ?? []) {
      counts.set(tagId, (counts.get(tagId) ?? 0) + 1);
    }
  }

  return tags
    .map(tag => {
      const taskCount = counts.get(tag.id) ?? 0;
      return {
        id: tag.id,
        name: tag.name,
        color: displayTagColor(tag.color),
        isPinned: tag.isPinned === true,
        taskCount,
        countLabel: tagCountLabel(taskCount),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }));
}

export function filterTagRows(rows: TagListItem[], query: string): TagListItem[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return rows;
  }
  return rows.filter(row => row.name.toLowerCase().includes(needle));
}
