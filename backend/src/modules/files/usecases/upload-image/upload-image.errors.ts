import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';
import { MAX_IMAGE_UPLOAD_FILE_BYTES } from '../../config.js';

export enum UploadImageErrorCode {
  NotSupportedType = 'UPLOAD_IMAGE_ERROR_CODE__NOT_SUPPORTED_TYPE',
  UploadToGoogleDriveFailed = 'UPLOAD_IMAGE_ERROR_CODE__UPLOAD_TO_GOOGLE_DRIVE_FAILED',
  FileTooLarge = 'FILE_TOO_LARGE',
}

export const UploadImageErrors = {
  NotSupportedTypeError: (type: string): Result<never, UseCaseError<UploadImageErrorCode>> =>
    Result.fail(
      new UseCaseError<UploadImageErrorCode>(
        UploadImageErrorCode.NotSupportedType,
        `The file type "${type}" doesn't supported`,
        EHttpStatus.BadRequest,
      ),
    ),
  UploadToGoogleDriveFailed: (): Result<never, UseCaseError<UploadImageErrorCode>> =>
    Result.fail(
      new UseCaseError<UploadImageErrorCode>(
        UploadImageErrorCode.UploadToGoogleDriveFailed,
        `Uploading file to Google Drive failed`,
        EHttpStatus.BadGateway,
      ),
    ),
  /** Description only: multer enforces the limit before execute(). Not a use-case Result. */
  FileTooLarge: (): UseCaseError<UploadImageErrorCode> =>
    new UseCaseError<UploadImageErrorCode>(
      UploadImageErrorCode.FileTooLarge,
      `File exceeds the maximum size of ${MAX_IMAGE_UPLOAD_FILE_BYTES} bytes`,
      EHttpStatus.PayloadTooLarge,
    ),
};
