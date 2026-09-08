import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { EImageRepoServiceError } from '../../../../shared/repo/image-repo.service.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export const GetImageErrors = {
  ImageNotFoundError: (
    error: ServiceError<EImageRepoServiceError>,
  ): Result<never, UseCaseError<EImageRepoServiceError>> =>
    Result.fail(
      new UseCaseError<EImageRepoServiceError>(error.code, error.message, EHttpStatus.NotFound),
    ),
};
