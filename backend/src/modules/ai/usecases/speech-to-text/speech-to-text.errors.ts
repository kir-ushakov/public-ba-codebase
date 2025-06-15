import { Result } from '../../../../shared/core/result.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';
import { OpenAISpeechTranscriberError } from '../../services/open-ai-speech-transcriber.service.js';

export enum SpeechToTextErrorCode {
  UnsupportedMimeType = 'SPEECH_TO_TEXT_ERROR__UNSUPPORTED_MIME_TYPE',
  TranscribeAudioFileFailed = 'SPEECH_TO_TEXT_ERROR__TRANSCRIBE_FAILED',
}

export class SpeechToTextError extends UseCaseError<SpeechToTextErrorCode> {}

export namespace SpeechToTextErrors {
  export class UnsupportedMimeType extends Result<never, SpeechToTextError> {
    constructor(error: ServiceError<OpenAISpeechTranscriberError>) {
      super(
        false,
        new SpeechToTextError(
          SpeechToTextErrorCode.UnsupportedMimeType,
          error.message,
          EHttpStatus.BadRequest,
          error,
        ),
      );
    }
  }

  export class TranscribeAudioFileFailed extends Result<never, SpeechToTextError> {
    constructor(error: ServiceError<OpenAISpeechTranscriberError>) {
      super(
        false,
        new SpeechToTextError(
          SpeechToTextErrorCode.TranscribeAudioFileFailed,
          error.message,
          EHttpStatus.BadGateway,
          error,
        ),
      );
    }
  }
}
