import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export class GetImageError extends UseCaseError<GetImageErrorCodes> {}

enum GetImageErrorCode {
  ImageNotFound = 'GET_IMAGE_ERROR_CODE__IMAGE_NOT_FOUND',
}

type GetImageErrorCodes = GetImageErrorCode;

export namespace GetImageErrors {
  export class ImageNotFoundError extends Result<never, GetImageError> {
    constructor(imageId: string) {
      super(
        false,
        new GetImageError(
          GetImageErrorCode.ImageNotFound,
          `Image with id "${imageId}" not found`,
          EHttpStatus.NotFound,
        ),
      );
    }
  }
}