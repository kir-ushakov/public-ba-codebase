import { Result } from '../../../core/result.js';
import { DomainError } from '../../../core/domain-error.js';
import { Guard } from '../../../core/guard.js';
import { ValueObject } from '../../ValueObject.js';

export enum EGoogleAuthTokensError {
  AccessTokenRequired = 'GOOGLE_AUTH_TOKENS_ERROR__ACCESS_TOKEN_REQUIRED',
}

export interface GoogleAuthTokensProps {
  accessToken: string;
  refreshToken?: string;
}

export class GoogleAuthTokens extends ValueObject<GoogleAuthTokensProps> {
  get accessToken(): string {
    return this.props.accessToken;
  }

  get refreshToken(): string {
    return this.props.refreshToken ?? '';
  }

  private constructor(props: GoogleAuthTokensProps) {
    super(props);
  }

  public static create(
    props: GoogleAuthTokensProps,
  ): Result<GoogleAuthTokens, DomainError<GoogleAuthTokens, EGoogleAuthTokensError>> {
    if (!Guard.notEmptyString(props.accessToken)) {
      return Result.fail(
        new DomainError<GoogleAuthTokens, EGoogleAuthTokensError>(
          EGoogleAuthTokensError.AccessTokenRequired,
          'Google access token is required',
        ),
      );
    }

    const trimmedRefresh = props.refreshToken?.trim();
    const refreshToken = trimmedRefresh ? trimmedRefresh : undefined;

    return Result.ok(
      new GoogleAuthTokens({
        accessToken: props.accessToken.trim(),
        refreshToken,
      }),
    );
  }
}
