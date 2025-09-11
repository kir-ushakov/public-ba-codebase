import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { EImageRepoServiceError } from '../../../../shared/repo/image-repo.service.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

type GetImageErrorCodes = EImageRepoServiceError;
export class GetImageError extends UseCaseError<GetImageErrorCodes> {}

export namespace GetImageErrors {
  export class ImageNotFoundError extends Result<never, GetImageError> {
    constructor(error: ServiceError<EImageRepoServiceError>) {
      super(false, new GetImageError(error.code, error.message, EHttpStatus.NotFound));
    }
  }
}
