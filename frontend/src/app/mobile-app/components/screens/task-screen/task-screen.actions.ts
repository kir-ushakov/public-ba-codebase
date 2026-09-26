import type { ITaskEditFormData } from './task-edit/task-edit.component.interface';
import type { DraftTaskImage, ETaskViewMode } from './task-screen.state';

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

  export class ImageSelectedAsCover {
    static readonly type = '[TaskScreen] Image Selected As Cover';

    constructor(public image: DraftTaskImage) {}
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
