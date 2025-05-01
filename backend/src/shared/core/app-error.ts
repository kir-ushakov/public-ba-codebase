export class AppError<U = string> extends Error {
  public readonly code: U;

  constructor(message: string, code: U) {
    super(message);
    this.code = code;

    // Fix the prototype chain (important if you compile to ES5)
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;

    // V8-only: capture a cleaner stack trace
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, new.target);
    }
  }
}
