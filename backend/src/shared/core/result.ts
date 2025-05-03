export class Result<T, E = string> {
  public isSuccess: boolean;
  public isFailure: boolean;
  public _error: E;
  private _value: T;

  public constructor(isSuccess: boolean, error?: E, value?: T) {
    if (isSuccess && error) {
      throw new Error('InvalidOperation: A result cannot be successful and contain an error');
    }
    if (!isSuccess && !error) {
      throw new Error('InvalidOperation: A failing result needs to contain an error message');
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._error = error;
    this._value = value;

    Object.freeze(this);
  }

  public getValue(): T {
    if (!this.isSuccess) {
      console.log(this._error);
      throw new Error("Can't get the value of an error result. Use 'error' instead.");
    }

    return this._value;
  }

  get error(): E {
    return this._error as E;
  }

  public static ok<U, E = string>(value?: U): Result<U, E> {
    return new Result<U, E>(true, null, value);
  }

  public static fail<U = never, E = string>(error: E): Result<U, E> {
    return new Result<U, E>(false, error);
  }

  public static combine(results: Result<any>[]): Result<any> {
    for (let result of results) {
      if (result.isFailure) return result;
    }
    return Result.ok();
  }
}
