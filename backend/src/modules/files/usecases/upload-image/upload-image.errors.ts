import { Result } from '../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export enum EUploadImageError {
  NotSupportedType = 'UPLOAD_IMAGE_ERROR__NOT_SUPPORTED_TYPE',
  UploadToGoogleDriveFailed = 'UPLOAD_IMAGE_ERROR__UPLOAD_TO_GOOGLE_DRIVE_FAILED',
}

export namespace UploadImageErrors {
  export class NotSupportedTypeError extends Result<UseCaseError> {
    constructor(type: string) {
      super(
        false,
        new UseCaseError(
          EHttpStatus.BadRequest,
          EUploadImageError.NotSupportedType,
          `The file type "${type}" doesn't supported`,
        ),
      );
    }
  }

  export class UploadToGoogleDriveFailed extends Result<UseCaseError> {
    constructor() {
      super(
        false,
        new UseCaseError(
          EHttpStatus.BadGateway,
          EUploadImageError.UploadToGoogleDriveFailed,
          `Uploading file to Google Drive failed`,
        ),
      );
    }
  }
}
