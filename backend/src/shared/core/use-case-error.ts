import { DomainError } from './domain-error.js';

export class UseCaseError extends DomainError {
  public readonly code: number;

  constructor(code: number, name, message: string, error = null) {
    super(name, message, error);
    this.code = code;
  }
}
