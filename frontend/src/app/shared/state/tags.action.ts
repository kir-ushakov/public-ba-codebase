export type TagCreateInput = {
  id: string;
  name: string;
  color?: string;
};

export type TagUpdateInput = {
  tagId: string;
  name: string;
  color: string;
};

export namespace TagsAction {
  export class CreateTag {
    static readonly type = '[Tags] Create Tag';

    constructor(
      public tagInitData: TagCreateInput,
      public userId: string,
    ) {}
  }

  export class UpdateTag {
    static readonly type = '[Tags] Update Tag';

    constructor(public readonly tagUpdateData: TagUpdateInput) {}
  }

  export class DeleteTag {
    static readonly type = '[Tags] Delete Tag';

    constructor(public readonly tagId: string) {}
  }

  export class SetPinned {
    static readonly type = '[Tags] Set Pinned';

    constructor(
      public tagId: string,
      public isPinned: boolean,
    ) {}
  }
}
