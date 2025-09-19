import { Task, TaskChanges } from 'src/app/shared/models/';

export namespace TasksAction {
  export class CreateTask {
    static readonly type = '[Tasks] Create Task';

    constructor(
      public taskInitData: Task,
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
