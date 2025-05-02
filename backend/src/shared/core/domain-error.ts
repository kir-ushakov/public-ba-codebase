import { AppError } from './app-error';

export class DomainError<T, U = string> extends AppError<U> {
  constructor(
    public readonly code: U,
    public readonly message: string,
    public readonly object: T = null,
  ) {
    super(message, code);
  }
}
