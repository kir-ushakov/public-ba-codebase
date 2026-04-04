export namespace VoiceInputAction {
  export class Reset {
    static readonly type = '[VoiceInput] Reset';
  }

  export class VoiceToTextConvertingSet {
    static readonly type = '[VoiceInput] Voice To Text Converting Set';

    constructor(public converting: boolean) {}
  }
}
