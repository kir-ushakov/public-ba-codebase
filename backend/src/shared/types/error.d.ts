export {}; // ← this makes the file an external module

declare global {
  interface ErrorConstructor {
    /**
     * V8-only: capture a cleaner stack without the constructor frame itself.
     * @param target The object on which to assign the .stack property.
     * @param constructorOpt The constructor to omit from the stack trace.
     */
    captureStackTrace(target: object, constructorOpt?: { new (...args: any[]): any }): void;
  }
}
