import type { ETaskStatus } from '@brainassistant/contracts';

export namespace TaskTileAction {
  export class DeleteSelected {
    static readonly type = '[TaskTile] Delete Selected';

    constructor(public taskId: string) {}
  }

  export class ConvertSelected {
    static readonly type = '[TaskTile] Convert Selected';

    constructor(
      public taskId: string,
      public status: ETaskStatus,
    ) {}
  }
}
