export namespace VoiceInputAction {
  export class Reset {
    static readonly type = '[VoiceInput] Reset';
  }

  export class StartRecording {
    static readonly type = '[VoiceInput] Start Recording';
  }

  export class StopRecordingAndConvertToText {
    static readonly type = '[VoiceInput] Stop Recording And Convert To Text';
  }

  export class CancelRecording {
    static readonly type = '[VoiceInput] Cancel Recording';
  }

  export class VoiceToTextConvertedSuccessfully {
    static readonly type = '[VoiceInput] Voice To Text Converted Successfully';

    constructor(public text: string) {}
  }

  export class VoiceToTextConvertedFailed {
    static readonly type = '[VoiceInput] Voice To Text Converted Failed';
  }

  export class VoiceToTextConvertingStatusSet {
    static readonly type = '[VoiceInput] Voice To Text Converting Status Set';

    constructor(public converting: boolean) {}
  }
}
