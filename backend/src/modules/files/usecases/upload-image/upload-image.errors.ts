import { Result } from '../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export enum EUploadImageError {
  NotSupportedType = 'NOT_SUPPORTED_TYPE',
}

export namespace UploadImageErrors {
  export class NotSupportedTypeError extends Result<UseCaseError> {
    constructor(type: string) {
      super(
        false,
        new UseCaseError(
          EHttpStatus.BadRequest,
          EUploadImageError.NotSupportedType,
          `The file type "${type}" doesn't supported`
        )
      );
    }
  }
}
