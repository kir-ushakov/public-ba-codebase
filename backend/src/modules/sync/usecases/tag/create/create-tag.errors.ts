import { DomainError } from '../../../../../shared/core/domain-error.js';
import { Result } from '../../../../../shared/core/result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { ETagError, Tag } from '../../../../../shared/domain/models/tag.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';

export const CreateTagErrors = {
  DataInvalid: (error: DomainError<Tag, ETagError>): Result<never, UseCaseError<ETagError>> =>
    Result.fail(new UseCaseError<ETagError>(error.code, error.message, EHttpStatus.BadRequest)),
};
