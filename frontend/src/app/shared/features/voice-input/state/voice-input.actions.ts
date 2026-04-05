export namespace VoiceInputAction {
  export class Reset {
    static readonly type = '[VoiceInput] Reset';
  }

  export class VoiceToTextConvertingStatusSet {
    static readonly type = '[VoiceInput] Voice To Text Converting Status Set';

    constructor(public converting: boolean) {}
  }
}
