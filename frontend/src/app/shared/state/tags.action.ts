export type TagCreateInput = {
  id: string;
  name: string;
};

export namespace TagsAction {
  export class CreateTag {
    static readonly type = '[Tags] Create Tag';

    constructor(
      public tagInitData: TagCreateInput,
      public userId: string,
    ) {}
  }

  export class SetPinned {
    static readonly type = '[Tags] Set Pinned';

    constructor(
      public tagId: string,
      public isPinned: boolean,
    ) {}
  }
}
