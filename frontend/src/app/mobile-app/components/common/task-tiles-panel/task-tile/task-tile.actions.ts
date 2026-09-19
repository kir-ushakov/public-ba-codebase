export namespace MbTaskTileAction {
  export class DeleteSelected {
    static readonly type = '[MbTaskTile] Delete Selected';

    constructor(public taskId: string) {}
  }
}
