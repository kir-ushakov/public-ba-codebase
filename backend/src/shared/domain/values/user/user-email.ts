import { Result } from '../../../core/result.js';
import { ValueObject } from '../../ValueObject.js';

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

  public static create(email: string): Result<UserEmail> {
    if (!this.isValidEmail(email)) {
      return Result.fail<UserEmail>('Email address not valid');
    } else {
      return Result.ok<UserEmail>(new UserEmail({ value: this.format(email) }));
    }
  }
}
