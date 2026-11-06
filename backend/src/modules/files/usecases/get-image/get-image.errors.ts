import { EGetImageUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { EImageRepoServiceError } from '../../../../shared/repo/image-repo.service.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';
import { EImageStorageError } from '../../services/image-storage/image-storage.error.js';

export { EGetImageUseCaseError };

export type GetImageErrorCode = EImageRepoServiceError | EGetImageUseCaseError;

export const GetImageErrors = {
  ImageNotFoundError: (
    error: ServiceError<EImageRepoServiceError>,
  ): Result<never, UseCaseError<GetImageErrorCode>> =>
    Result.fail(
      new UseCaseError<GetImageErrorCode>(error.code, error.message, EHttpStatus.NotFound),
    ),
  ImageFileMissing: (
    error: ServiceError<EImageStorageError>,
  ): Result<never, UseCaseError<GetImageErrorCode>> =>
    Result.fail(
      new UseCaseError<GetImageErrorCode>(
        EGetImageUseCaseError.ImageFileMissing,
        'The image file is not available',
        EHttpStatus.NotFound,
        error,
      ),
    ),
  ImageReadFailed: (
    error?: ServiceError<EImageStorageError>,
  ): Result<never, UseCaseError<GetImageErrorCode>> =>
    Result.fail(
      new UseCaseError<GetImageErrorCode>(
        EGetImageUseCaseError.ImageReadFailed,
        'Reading the image failed',
        EHttpStatus.InternalServerError,
        error,
      ),
    ),
};
