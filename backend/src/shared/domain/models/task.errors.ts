import { Result } from '../../core/Result.js';
import { DomainError } from '../../core/domain-error.js';
export enum ETaskError {
  TitleMissed = 'TASK_ERROR_TITLE_MISSED',
  TitleTooShort = 'TASK_ERROR_TITLE_TOO_SHORT',
  TitleTooLong = 'TASK_ERROR_TITLE_TOO_LONG',
}

export namespace TaskError {
  export class TitleMissedError extends Result<DomainError> {
    public constructor() {
      super(
        false,
        new DomainError(ETaskError.TitleMissed, `Title for task missed`)
      );
    }
  }

  export class TitleTooShortError extends Result<DomainError> {
    public constructor(title: string, minLength: number) {
      super(
        false,
        new DomainError(
          ETaskError.TitleTooShort,
          `Title "${title}" too short. It has to be not less thant ${minLength}`
        )
      );
    }
  }

  export class TitleTooLongError extends Result<DomainError> {
    public constructor(title: string, maxLength: number) {
      super(
        false,
        new DomainError(
          ETaskError.TitleTooShort,
          `Title "${title}" too long. It has to be not longer than ${maxLength}`
        )
      );
    }
  }
}
