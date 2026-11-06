import { EDeleteTaskUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../../shared/core/result.js';
import { ServiceError } from '../../../../../shared/core/service-error.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';

export { EDeleteTaskUseCaseError };

export type DeleteTaskError = UseCaseError<EDeleteTaskUseCaseError>;

export const DeleteTaskErrors = {
  AttachmentCleanupFailed: (error: ServiceError): Result<never, DeleteTaskError> =>
    Result.fail(
      new UseCaseError(
        EDeleteTaskUseCaseError.AttachmentCleanupFailed,
        'Deleting task attachments failed',
        EHttpStatus.InternalServerError,
        error,
      ),
    ),
};
