import { Result } from '../../../core/result.js';
import { DomainError } from '../../../core/domain-error.js';
import { ValueObject } from '../../ValueObject.js';

export enum EUserEmailError {
  Invalid = 'USER_EMAIL_ERROR__INVALID',
}

export interface UserEmailProps {
  value: string;
}

export class UserEmail extends ValueObject<UserEmailProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: UserEmailProps) {
    super(props);
  }

  private static isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  private static format(email: string): string {
    return email.trim().toLowerCase();
  }

  public static create(email: string): Result<UserEmail, DomainError<UserEmail, EUserEmailError>> {
    if (!this.isValidEmail(email)) {
      return Result.fail(
        new DomainError<UserEmail, EUserEmailError>(
          EUserEmailError.Invalid,
          'Email address not valid',
        ),
      );
    }
    return Result.ok(new UserEmail({ value: this.format(email) }));
  }
}
