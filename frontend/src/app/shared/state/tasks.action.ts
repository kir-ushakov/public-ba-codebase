import { Task, TaskChanges } from 'src/app/shared/models/';

export type TaskCreateInput = Pick<
  Task,
  'title' | 'description' | 'imageId' | 'images' | 'tagIds'
> &
  Partial<Pick<Task, 'status'>>;

export namespace TasksAction {
  export class CreateTask {
    static readonly type = '[Tasks] Create Task';

    constructor(
      public taskInitData: TaskCreateInput,
      public userId: string,
    ) {}
  }

  export class UpdateTask {
    static readonly type = '[Tasks] Update Task';

    constructor(public readonly taskUpdateData: TaskChanges) {}
  }

  export class DeleteTask {
    static readonly type = '[Tasks] Delete Task';

    constructor(public readonly taskId: string) {}
  }
}
