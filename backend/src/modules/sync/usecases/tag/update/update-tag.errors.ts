import { ETagError, ETagRepoServiceError } from '@brainassistant/contracts';
import { DomainError } from '../../../../../shared/core/domain-error.js';
import { Result } from '../../../../../shared/core/result.js';
import { ServiceError } from '../../../../../shared/core/service-error.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { Tag } from '../../../../../shared/domain/models/tag.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';

export type UpdateTagErrorCode = ETagRepoServiceError | ETagError;

export const UpdateTagErrors = {
  TagNotFoundError: (
    error: ServiceError<ETagRepoServiceError>,
  ): Result<never, UseCaseError<UpdateTagErrorCode>> =>
    Result.fail(
      new UseCaseError<UpdateTagErrorCode>(error.code, error.message, EHttpStatus.NotFound),
    ),
  DataInvalid: (
    error: DomainError<Tag, ETagError>,
  ): Result<never, UseCaseError<UpdateTagErrorCode>> =>
    Result.fail(
      new UseCaseError<UpdateTagErrorCode>(error.code, error.message, EHttpStatus.BadRequest),
    ),
};
