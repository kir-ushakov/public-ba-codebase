import { EGetImageUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { EImageRepoServiceError } from '../../../../shared/repo/image-repo.service.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';
import { EGoogleDriveServiceError } from '../../../integrations/google/services/google-drive-service.error.js';

export { EGetImageUseCaseError };

export type GetImageErrorCode = EImageRepoServiceError | EGetImageUseCaseError;

export const GetImageErrors = {
  ImageNotFoundError: (
    error: ServiceError<EImageRepoServiceError>,
  ): Result<never, UseCaseError<GetImageErrorCode>> =>
    Result.fail(
      new UseCaseError<GetImageErrorCode>(error.code, error.message, EHttpStatus.NotFound),
    ),
  GoogleRefreshTokenInvalid: (
    error: ServiceError<EGoogleDriveServiceError>,
  ): Result<never, UseCaseError<GetImageErrorCode>> =>
    Result.fail(
      new UseCaseError<GetImageErrorCode>(
        EGetImageUseCaseError.GoogleRefreshTokenInvalid,
        error.message,
        EHttpStatus.Forbidden,
        error,
      ),
    ),
  GoogleDriveRequestFailed: (
    error: ServiceError<EGoogleDriveServiceError>,
  ): Result<never, UseCaseError<GetImageErrorCode>> =>
    Result.fail(
      new UseCaseError<GetImageErrorCode>(
        EGetImageUseCaseError.GoogleDriveRequestFailed,
        error.message,
        EHttpStatus.BadGateway,
        error,
      ),
    ),
};
