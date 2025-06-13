import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export class UploadImageError extends UseCaseError<UploadImageErrorCodes> {}

enum UploadImageErrorCode {
  NotSupportedType = 'UPLOAD_IMAGE_ERROR_CODE__NOT_SUPPORTED_TYPE',
  UploadToGoogleDriveFailed = 'UPLOAD_IMAGE_ERROR_CODE__UPLOAD_TO_GOOGLE_DRIVE_FAILED',
}

type UploadImageErrorCodes = UploadImageErrorCode;

export namespace UploadImageErrors {
  export class NotSupportedTypeError extends Result<never, UploadImageError> {
    constructor(type: string) {
      super(
        false,
        new UploadImageError(
          UploadImageErrorCode.NotSupportedType,
          `The file type "${type}" doesn't supported`,
          EHttpStatus.BadRequest,
        ),
      );
    }
  }

  export class UploadToGoogleDriveFailed extends Result<never, UploadImageError> {
    constructor() {
      super(
        false,
        new UseCaseError(
          UploadImageErrorCode.UploadToGoogleDriveFailed,
          `Uploading file to Google Drive failed`,
          EHttpStatus.BadGateway,
        ),
      );
    }
  }
}
