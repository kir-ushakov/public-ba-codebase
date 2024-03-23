import { ETaskViewMode } from './mb-task-screen.state';

export namespace MbTaskScreenAction {
  export class Opened {
    static readonly type = '[Mb Task Screen] Opened';

    constructor(public mode: ETaskViewMode, public taskId: string) {}
  }
  export class ApplyButtonPressed {
    static readonly type = '[Mb Task Screen] ApplyButtonPressed';
  }

  export class CancelButtonPressed {
    static readonly type = '[Mb Task Screen] CancelButtonPressed';
  }

  export class HomeButtonPressed {
    static readonly type = '[Mb Task Screen] HomeButtonPressed';
  }

  export class CreateTask {
    static readonly type = '[Mb Task Screen] CreateTask ';
  }

  export class EditTask {
    static readonly type = '[Mb Task Screen] EditTask ';
  }

  export class TitleUpdated {
    static readonly type = '[Mb Task Screen] TitleUpdated ';

    constructor(public title: string) {}
  }

  export class Close {
    static readonly type = '[Mb Task Screen] Close';
  }

  export class OpenTaskOptions {
    static readonly type = '[Mb Task Screen] OpenTaskOptions';
  }

  export class EditTaskOptionSelected {
    static readonly type = '[Mb Task Screen] EditTaskOptionSelected';
  }

  export class CompleteTaskOptionSelected {
    static readonly type = '[Mb Task Screen] Complete Task Option Selected';
  }

  export class CancelTaskOptionSelected {
    static readonly type = '[Mb Task Screen] Cancel Task';
  }

  export class DeleteTaskOptionSelected {
    static readonly type = '[Mb Task Screen] Delete Task Option Selected';
  }
}
