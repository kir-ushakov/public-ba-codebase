import { taskDescriptionText } from 'src/app/shared/helpers/is-empty-task-description.function';
import type { Tag } from 'src/app/shared/models/tag.model';
import type { Task } from 'src/app/shared/models/task.model';

export function filterHomeTasks(tasks: Task[], query: string, tags: Tag[]): Task[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return tasks;
  }

  const namesById = new Map(tags.map(tag => [tag.id, tag.name.toLowerCase()]));

  return tasks.filter(task => {
    const title = task.title.toLowerCase();
    const description = taskDescriptionText(task.description).toLowerCase();
    const matchesTag = (task.tagIds ?? []).some(tagId => namesById.get(tagId)?.includes(needle));
    return title.includes(needle) || description.includes(needle) || matchesTag;
  });
}
