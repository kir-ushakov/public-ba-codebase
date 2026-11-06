import { EUploadAudioUseCaseError } from '@brainassistant/contracts';
import { TaskConst } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';
import { EAudioStorageError } from '../../services/audio-storage/local-audio-storage.service.js';

export { EUploadAudioUseCaseError };

export const UploadAudioErrors = {
  NotSupportedType: (type: string): Result<never, UseCaseError<EUploadAudioUseCaseError>> =>
    Result.fail(
      new UseCaseError(
        EUploadAudioUseCaseError.NotSupportedType,
        `The file type "${type}" doesn't supported`,
        EHttpStatus.BadRequest,
      ),
    ),
  InvalidAudioId: (): Result<never, UseCaseError<EUploadAudioUseCaseError>> =>
    Result.fail(
      new UseCaseError(
        EUploadAudioUseCaseError.InvalidAudioId,
        'audioId may contain only latin letters, digits and dashes (up to 64 characters)',
        EHttpStatus.BadRequest,
      ),
    ),
  StoreAudioFailed: (
    error: ServiceError<EAudioStorageError>,
  ): Result<never, UseCaseError<EUploadAudioUseCaseError>> =>
    Result.fail(
      new UseCaseError(
        EUploadAudioUseCaseError.StoreAudioFailed,
        'Storing the audio failed',
        EHttpStatus.InternalServerError,
        error,
      ),
    ),
  FileTooLarge: (): UseCaseError<EUploadAudioUseCaseError> =>
    new UseCaseError(
      EUploadAudioUseCaseError.FileTooLarge,
      `File exceeds the maximum size of ${TaskConst.AUDIO_MAX_BYTES} bytes`,
      EHttpStatus.PayloadTooLarge,
    ),
};
