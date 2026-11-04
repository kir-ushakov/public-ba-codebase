import { EDeleteImageUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';
import { EImageStorageError } from '../../services/image-storage/image-storage.error.js';

export { EDeleteImageUseCaseError };

export const DeleteImageErrors = {
  InvalidImageId: (): Result<never, UseCaseError<EDeleteImageUseCaseError>> =>
    Result.fail(
      new UseCaseError(
        EDeleteImageUseCaseError.InvalidImageId,
        'imageId may contain only latin letters, digits and dashes (up to 64 characters)',
        EHttpStatus.BadRequest,
      ),
    ),
  DeleteFailed: (
    error: ServiceError<EImageStorageError>,
  ): Result<never, UseCaseError<EDeleteImageUseCaseError>> =>
    Result.fail(
      new UseCaseError(
        EDeleteImageUseCaseError.DeleteFailed,
        'Deleting the image failed',
        EHttpStatus.InternalServerError,
        error,
      ),
    ),
};
