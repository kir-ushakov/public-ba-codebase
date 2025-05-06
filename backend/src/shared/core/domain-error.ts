import { AppError } from './app-error.js';

export class DomainError<T, U = string> extends AppError<U> {
  constructor(
    code: U,
    message: string,
    public readonly object?: T,
  ) {
    super(message, code);
    this.object = object ? Object.freeze(object) : undefined;
  }
}
