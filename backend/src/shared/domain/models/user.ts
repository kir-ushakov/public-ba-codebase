import { Result } from '../../core/result.js';
import { DomainError } from '../../core/domain-error.js';
import { GoogleAuthTokens } from '../values/user/google-auth-tokens.js';
import { AggregateRoot } from '../AggregateRoot.js';
import { UniqueEntityID } from '../UniqueEntityID.js';
import { UserEmail } from '../values/user/user-email.js';

export enum EUserError {
  AlreadyVerified = 'USER_ERROR__ALREADY_VERIFIED',
}

export interface UserProps {
  // TODO: use separate username (string) and email (UserEmail)
  username: UserEmail;
  firstName: string;
  lastName: string;
  verified?: boolean;
  googleId?: string;
  googleRefreshToken?: string;
  googleAccessToken?: string;
}

export interface UserPersistent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _id?: string | any; // used 'any' to support compatibility with '_id?: T;' property of class mongoose Document
  username: string;
  firstName: string;
  lastName: string;
  verified?: boolean;
  googleId?: string;
  googleRefreshToken?: string;
  googleAccessToken?: string;
}

export class User extends AggregateRoot<UserProps> {
  get id(): UniqueEntityID {
    return this._id;
  }

  get username(): UserEmail {
    return this.props.username;
  }

  get firstname(): string {
    return this.props.firstName;
  }

  get lastname(): string {
    return this.props.lastName;
  }

  get verified(): boolean {
    return this.props.verified;
  }

  get googleId(): string {
    return this.props.googleId;
  }

  get googleRefreshToken(): string {
    return this.props.googleRefreshToken;
  }

  get googleAccessToken(): string {
    return this.props.googleAccessToken;
  }

  // TDOD: setGoogleTokens has not to be a part of domain logic
  setGoogleTokens(googleTokens: GoogleAuthTokens): void {
    this.props.googleAccessToken = googleTokens.accessToken;
    this.props.googleRefreshToken = googleTokens.refreshToken;
  }

  public static create(props: UserProps, id?: UniqueEntityID): Result<User, never> {
    // TODO: check null or undefined here

    const isNewUser = !!!id;

    const defaultProps: UserProps = {
      username: null,
      firstName: null,
      lastName: null,
      verified: false,
      googleId: null,
      googleAccessToken: null,
      googleRefreshToken: null,
    };

    props = { ...defaultProps, ...props };

    const user: User = new User(props, id);

    if (isNewUser) {
      // TODO: Use Domain event to notify listeners about new user
    }

    return Result.ok<User, never>(user);
  }

  public verify(): Result<void, DomainError<User, EUserError>> {
    if (this.props.verified) {
      return Result.fail(
        new DomainError<User, EUserError>(EUserError.AlreadyVerified, 'User already verified.'),
      );
    }

    this.props.verified = true;

    return Result.ok<void, DomainError<User, EUserError>>();
  }

  private constructor(props: UserProps, id?: UniqueEntityID) {
    super(props, id);
  }
}
