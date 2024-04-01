import { ETaskViewMode, IEditTaskData } from './mb-task-screen.state';

export namespace MbTaskScreenAction {
  export class Opened {
    static readonly type = '[MbTaskScreen] Opened';

    constructor(public mode: ETaskViewMode, public taskId: string) {}
  }
  export class ApplyButtonPressed {
    static readonly type = '[MbTaskScreen] Apply Button Pressed';
  }

  export class CancelButtonPressed {
    static readonly type = '[MbTaskScreen] Cancel Button Pressed';
  }

  export class HomeButtonPressed {
    static readonly type = '[MbTaskScreen] Home Button Pressed';
  }

  export class CreateTask {
    static readonly type = '[MbTaskScreen] Create Task';

    constructor(public taskInitData: IEditTaskData, public userId: string) {}
  }

  export class UpdateTask {
    static readonly type = '[MbTaskScreen] Update Task ';

    constructor(public taskUpdateData: IEditTaskData, public taskId: string) {}
  }

  export class DeleteTask {
    static readonly type = '[MbTaskScreen] Delete Task ';

    constructor(public taskId: string) {}
  }

  export class Close {
    static readonly type = '[MbTaskScreen] Close';
  }

  export class OpenTaskOptions {
    static readonly type = '[MbTaskScreen] Open Task Options';
  }

  export class EditTaskOptionSelected {
    static readonly type = '[MbTaskScreen] Edit Task Option Selected';
  }

  export class CompleteTaskOptionSelected {
    static readonly type = '[MbTaskScreen] Complete Task Option Selected';
  }

  export class CancelTaskOptionSelected {
    static readonly type = '[MbTaskScreen] Cancel Task';
  }

  export class DeleteTaskOptionSelected {
    static readonly type = '[MbTaskScreen] Delete Task Option Selected';
  }
}
