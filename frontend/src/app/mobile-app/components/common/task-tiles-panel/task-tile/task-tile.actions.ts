export namespace TaskTileAction {
  export class DeleteSelected {
    static readonly type = '[TaskTile] Delete Selected';

    constructor(public taskId: string) {}
  }
}
