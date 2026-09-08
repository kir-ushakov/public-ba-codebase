import { BaseError } from './base-error.js';

export class DomainError<T, U = string> extends BaseError<U> {
  constructor(
    code: U,
    message: string,
    public readonly object?: T,
  ) {
    super(message, code);
    this.object = object ? Object.freeze(object) : undefined;
  }
}
