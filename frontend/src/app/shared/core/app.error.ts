export class AppError extends Error {
  constructor(message = '', ...args) {
    super(message, ...args);
  }
}
