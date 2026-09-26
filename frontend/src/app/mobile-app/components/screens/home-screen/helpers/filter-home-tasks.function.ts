import { taskDescriptionText } from 'src/app/shared/helpers/is-empty-task-description.function';
import type { Task } from 'src/app/shared/models/task.model';

export function filterHomeTasks(tasks: Task[], query: string): Task[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return tasks;
  }

  return tasks.filter(task => {
    const title = task.title.toLowerCase();
    const description = taskDescriptionText(task.description).toLowerCase();
    return title.includes(needle) || description.includes(needle);
  });
}
