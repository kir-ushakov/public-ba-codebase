import { EUploadImageUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';
import { MAX_IMAGE_UPLOAD_FILE_BYTES } from '../../config.js';
import { EGoogleDriveServiceError } from '../../../integrations/google/services/google-drive-service.error.js';

export { EUploadImageUseCaseError };

export const UploadImageErrors = {
  NotSupportedTypeError: (type: string): Result<never, UseCaseError<EUploadImageUseCaseError>> =>
    Result.fail(
      new UseCaseError<EUploadImageUseCaseError>(
        EUploadImageUseCaseError.NotSupportedType,
        `The file type "${type}" doesn't supported`,
        EHttpStatus.BadRequest,
      ),
    ),
  UploadToGoogleDriveFailed: (
    error?: ServiceError<EGoogleDriveServiceError>,
  ): Result<never, UseCaseError<EUploadImageUseCaseError>> =>
    Result.fail(
      new UseCaseError<EUploadImageUseCaseError>(
        EUploadImageUseCaseError.UploadToGoogleDriveFailed,
        `Uploading file to Google Drive failed`,
        EHttpStatus.BadGateway,
        error,
      ),
    ),
  GoogleRefreshTokenInvalid: (
    error: ServiceError<EGoogleDriveServiceError>,
  ): Result<never, UseCaseError<EUploadImageUseCaseError>> =>
    Result.fail(
      new UseCaseError<EUploadImageUseCaseError>(
        EUploadImageUseCaseError.GoogleRefreshTokenInvalid,
        error.message,
        EHttpStatus.Forbidden,
        error,
      ),
    ),
  /** Description only: multer enforces the limit before execute(). Not a use-case Result. */
  FileTooLarge: (): UseCaseError<EUploadImageUseCaseError> =>
    new UseCaseError<EUploadImageUseCaseError>(
      EUploadImageUseCaseError.FileTooLarge,
      `File exceeds the maximum size of ${MAX_IMAGE_UPLOAD_FILE_BYTES} bytes`,
      EHttpStatus.PayloadTooLarge,
    ),
};
