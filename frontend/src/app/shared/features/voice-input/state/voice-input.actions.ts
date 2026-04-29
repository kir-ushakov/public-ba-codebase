/**
 * #VIWAI_FE_VOICE-INPUT-ACTIONS:
 *
 * Voice input actions are the main orchestration layer of the Voice Input feature.
 *
 * The related state is intentionally minimal and only reflects the current process status
 * (e.g. a single `voiceToTextConverting` flag).
 *
 * The full workflow is encapsulated in action handlers, which coordinate side effects:
 * - stop the recording
 * - retrieve recorded audio
 * - send it to the backend for transcription
 * - process the backend response
 *
 * The transcription result is not persisted in the state. Instead, it is forwarded via a
 * dedicated action and handled directly at the component level.
 *
 * In other words, actions here are more than just state mutations — they act as a central
 * coordination point between UI and business logic, keeping the entire workflow in one place.
 */
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
