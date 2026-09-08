import { EHttpStatus } from '../infra/http/models/base-controller.js';
import { BaseError } from './base-error.js';
import { ServiceError } from './service-error.js';

export class UseCaseError<U extends string> extends BaseError<U> {
  constructor(
    code: U,
    message: string,
    public readonly httpCode: EHttpStatus,
    public readonly cause?: ServiceError,
  ) {
    super(message, code);
  }
}
