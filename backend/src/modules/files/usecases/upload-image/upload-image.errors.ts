import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';
import { MAX_IMAGE_UPLOAD_FILE_BYTES } from '../../config.js';

export class UploadImageError extends UseCaseError<UploadImageErrorCodes> {}

export enum UploadImageErrorCode {
  NotSupportedType = 'UPLOAD_IMAGE_ERROR_CODE__NOT_SUPPORTED_TYPE',
  UploadToGoogleDriveFailed = 'UPLOAD_IMAGE_ERROR_CODE__UPLOAD_TO_GOOGLE_DRIVE_FAILED',
  FileTooLarge = 'FILE_TOO_LARGE',
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
        new UploadImageError(
          UploadImageErrorCode.UploadToGoogleDriveFailed,
          `Uploading file to Google Drive failed`,
          EHttpStatus.BadGateway,
        ),
      );
    }
  }

  /** Description only: multer enforces the limit before execute(). Not a use-case Result. */
  export class FileTooLarge extends UploadImageError {
    constructor() {
      super(
        UploadImageErrorCode.FileTooLarge,
        `File exceeds the maximum size of ${MAX_IMAGE_UPLOAD_FILE_BYTES} bytes`,
        EHttpStatus.PayloadTooLarge,
      );
    }
  }
}
