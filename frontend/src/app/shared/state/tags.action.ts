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
}
