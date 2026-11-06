import { promises as fsp } from 'fs';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EUploadAudioUseCaseError, UploadAudioErrors } from './upload-audio.errors.js';
import {
  extensionForMime,
  isSafeAudioId,
  LocalAudioStorage,
} from '../../services/audio-storage/local-audio-storage.service.js';

export type UploadAudioParams = {
  audioId: string;
  file: Express.Multer.File;
  userId: string;
};

export class UploadAudioUsecase
  implements
    UseCase<
      UploadAudioParams,
      Promise<Result<{ audioId: string }, UseCaseError<EUploadAudioUseCaseError>>>
    >
{
  constructor(private readonly storage: LocalAudioStorage) {}

  public async execute(
    params: UploadAudioParams,
  ): Promise<Result<{ audioId: string }, UseCaseError<EUploadAudioUseCaseError>>> {
    const mimeType = params.file.mimetype || '';
    try {
      if (!isSafeAudioId(params.audioId)) {
        return UploadAudioErrors.InvalidAudioId();
      }
      if (!extensionForMime(mimeType)) {
        return UploadAudioErrors.NotSupportedType(mimeType);
      }
      const stored = await this.storage.put({
        userId: params.userId,
        audioId: params.audioId,
        sourcePath: params.file.path,
        mimeType,
      });
      if (stored.isFailure) {
        return UploadAudioErrors.StoreAudioFailed(stored.error);
      }
      return Result.ok({ audioId: params.audioId });
    } finally {
      await fsp.rm(params.file.path, { force: true }).catch(() => undefined);
    }
  }
}
