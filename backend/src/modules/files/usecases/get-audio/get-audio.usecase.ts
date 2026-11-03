import { EGetAudioUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';
import {
  EAudioStorageError,
  isSafeAudioId,
  LocalAudioStorage,
  StoredAudioFile,
} from '../../services/audio-storage/local-audio-storage.service.js';

export { EGetAudioUseCaseError };

export const GetAudioErrors = {
  InvalidAudioId: (): Result<never, UseCaseError<EGetAudioUseCaseError>> =>
    Result.fail(
      new UseCaseError(
        EGetAudioUseCaseError.InvalidAudioId,
        'audioId may contain only latin letters, digits and dashes (up to 64 characters)',
        EHttpStatus.BadRequest,
      ),
    ),
  Missing: (
    error?: ServiceError<EAudioStorageError>,
  ): Result<never, UseCaseError<EGetAudioUseCaseError>> =>
    Result.fail(
      new UseCaseError(
        EGetAudioUseCaseError.AudioFileMissing,
        'Audio file is missing',
        EHttpStatus.NotFound,
        error,
      ),
    ),
};

export class GetAudioUsecase
  implements
    UseCase<
      { audioId: string; userId: string },
      Promise<Result<StoredAudioFile, UseCaseError<EGetAudioUseCaseError>>>
    >
{
  constructor(private readonly storage: LocalAudioStorage) {}

  public async execute(params: {
    audioId: string;
    userId: string;
  }): Promise<Result<StoredAudioFile, UseCaseError<EGetAudioUseCaseError>>> {
    if (!isSafeAudioId(params.audioId)) {
      return GetAudioErrors.InvalidAudioId();
    }
    const file = await this.storage.get(params);
    if (file.isFailure) {
      return GetAudioErrors.Missing(file.error);
    }
    return Result.ok(file.getValue());
  }
}
