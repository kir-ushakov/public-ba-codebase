import { ESpeechToTextUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';
import { OpenAISpeechTranscriberError } from '../../services/open-ai-speech-transcriber.service.js';

export { ESpeechToTextUseCaseError };

export const SpeechToTextErrors = {
  UnsupportedMimeType: (
    error: ServiceError<OpenAISpeechTranscriberError>,
  ): Result<never, UseCaseError<ESpeechToTextUseCaseError>> =>
    Result.fail(
      new UseCaseError<ESpeechToTextUseCaseError>(
        ESpeechToTextUseCaseError.UnsupportedMimeType,
        error.message,
        EHttpStatus.BadRequest,
        error,
      ),
    ),
  TranscribeAudioFileFailed: (
    error: ServiceError<OpenAISpeechTranscriberError>,
  ): Result<never, UseCaseError<ESpeechToTextUseCaseError>> =>
    Result.fail(
      new UseCaseError<ESpeechToTextUseCaseError>(
        ESpeechToTextUseCaseError.TranscribeAudioFileFailed,
        error.message,
        EHttpStatus.BadGateway,
        error,
      ),
    ),
};
