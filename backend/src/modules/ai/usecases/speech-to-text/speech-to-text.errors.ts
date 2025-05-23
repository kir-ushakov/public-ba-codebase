import { Result } from '../../../../shared/core/Result.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';
import { EOpenAIServiceError } from '../../services/open-ai.service.js';

type ESpeechToTextError = EOpenAIServiceError;
export class SpeechToTextError extends UseCaseError<ESpeechToTextError> {}

export namespace SpeechToTextErrors {
  export class UnsupportedMimeType extends Result<never, SpeechToTextError> {
    constructor(error: ServiceError<EOpenAIServiceError>) {
      super(false, new SpeechToTextError(error.code, error.message, EHttpStatus.BadRequest));
    }
  }

  export class TranscribeAudioFileFailed extends Result<never, SpeechToTextError> {
    constructor(error: ServiceError<EOpenAIServiceError>) {
      super(false, new SpeechToTextError(error.code, error.message, EHttpStatus.BadGateway));
    }
  }
}
