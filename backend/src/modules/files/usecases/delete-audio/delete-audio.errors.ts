import { EDeleteAudioUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';
import { EAudioStorageError } from '../../services/audio-storage/local-audio-storage.service.js';

export { EDeleteAudioUseCaseError };

export const DeleteAudioErrors = {
  InvalidAudioId: (): Result<never, UseCaseError<EDeleteAudioUseCaseError>> =>
    Result.fail(
      new UseCaseError(
        EDeleteAudioUseCaseError.InvalidAudioId,
        'audioId may contain only latin letters, digits and dashes (up to 64 characters)',
        EHttpStatus.BadRequest,
      ),
    ),
  DeleteFailed: (
    error: ServiceError<EAudioStorageError>,
  ): Result<never, UseCaseError<EDeleteAudioUseCaseError>> =>
    Result.fail(
      new UseCaseError(
        EDeleteAudioUseCaseError.DeleteFailed,
        'Deleting the audio failed',
        EHttpStatus.InternalServerError,
        error,
      ),
    ),
};
