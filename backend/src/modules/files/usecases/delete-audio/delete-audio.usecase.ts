import { EDeleteAudioUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import {
  isSafeAudioId,
  LocalAudioStorage,
} from '../../services/audio-storage/local-audio-storage.service.js';
import { DeleteAudioErrors } from './delete-audio.errors.js';

export type DeleteAudioParams = {
  audioId: string;
  userId: string;
};

export class DeleteAudioUsecase
  implements
    UseCase<DeleteAudioParams, Promise<Result<void, UseCaseError<EDeleteAudioUseCaseError>>>>
{
  constructor(private readonly storage: LocalAudioStorage) {}

  public async execute(
    params: DeleteAudioParams,
  ): Promise<Result<void, UseCaseError<EDeleteAudioUseCaseError>>> {
    if (!isSafeAudioId(params.audioId)) {
      return DeleteAudioErrors.InvalidAudioId();
    }
    const removed = await this.storage.delete(params);
    if (removed.isFailure) {
      return DeleteAudioErrors.DeleteFailed(removed.error);
    }
    return Result.ok(undefined);
  }
}
