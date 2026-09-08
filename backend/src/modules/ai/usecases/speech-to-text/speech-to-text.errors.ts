import { Result } from '../../../../shared/core/result.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';
import { OpenAISpeechTranscriberError } from '../../services/open-ai-speech-transcriber.service.js';

export enum SpeechToTextErrorCode {
  UnsupportedMimeType = 'SPEECH_TO_TEXT_ERROR__UNSUPPORTED_MIME_TYPE',
  TranscribeAudioFileFailed = 'SPEECH_TO_TEXT_ERROR__TRANSCRIBE_FAILED',
}

export const SpeechToTextErrors = {
  UnsupportedMimeType: (
    error: ServiceError<OpenAISpeechTranscriberError>,
  ): Result<never, UseCaseError<SpeechToTextErrorCode>> =>
    Result.fail(
      new UseCaseError<SpeechToTextErrorCode>(
        SpeechToTextErrorCode.UnsupportedMimeType,
        error.message,
        EHttpStatus.BadRequest,
        error,
      ),
    ),
  TranscribeAudioFileFailed: (
    error: ServiceError<OpenAISpeechTranscriberError>,
  ): Result<never, UseCaseError<SpeechToTextErrorCode>> =>
    Result.fail(
      new UseCaseError<SpeechToTextErrorCode>(
        SpeechToTextErrorCode.TranscribeAudioFileFailed,
        error.message,
        EHttpStatus.BadGateway,
        error,
      ),
    ),
};
