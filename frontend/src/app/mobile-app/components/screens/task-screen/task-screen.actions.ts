import type { ITaskEditFormData } from './task-edit/task-edit.component.interface';
import type { ETaskViewMode } from './task-screen.state';
import type { Task } from 'src/app/shared/models/task.model';

export namespace TaskScreenAction {
  export class Opened {
    static readonly type = '[TaskScreen] Opened';

    constructor(
      public mode: ETaskViewMode,
      public taskId: string | null,
    ) {}
  }
  export class ApplyButtonPressed {
    static readonly type = '[TaskScreen] Apply Button Pressed';
  }

  export class CancelButtonPressed {
    static readonly type = '[TaskScreen] Cancel Button Pressed';
  }

  export class HomeButtonPressed {
    static readonly type = '[TaskScreen] Home Button Pressed';
  }

  export class Close {
    static readonly type = '[TaskScreen] Close';
  }

  export class EditTaskOptionSelected {
    static readonly type = '[TaskScreen] Edit Task Option Selected';
  }

  export class CompleteTaskOptionSelected {
    static readonly type = '[TaskScreen] Complete Task Option Selected';
  }

  export class CancelTaskOptionSelected {
    static readonly type = '[TaskScreen] Cancel Task';
  }

  export class DeleteTaskOptionSelected {
    static readonly type = '[TaskScreen] Delete Task Option Selected';
  }

  export class AddPictureBtnPressed {
    static readonly type = '[TaskScreen] Add Picture Btn Pressed';
  }

  export class SideMenuToggle {
    static readonly type = '[TaskScreen] Side Menu Toggle';
  }

  export class UpdateFormData {
    static readonly type = '[TaskScreen] Update Form';

    constructor(
      public valid: boolean,
      public formData: ITaskEditFormData,
    ) {}
  }
}
