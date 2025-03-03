export namespace MbTaskTileAction {
  export class Clicked {
    static readonly type = '[MbTaskView] Tile Clicked';

    constructor(public taskId: string | number) {}
  }
}
