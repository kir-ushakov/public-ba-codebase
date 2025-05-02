import { EHttpStatus } from '../infra/http/models/base-controller.js';
import { AppError } from './app-error.js';

export class UseCaseError<U extends string> extends AppError<U> {
  constructor(
    code: U,
    message: string,
    public readonly httpCode: EHttpStatus,
  ) {
    super(message, code);
  }
}
