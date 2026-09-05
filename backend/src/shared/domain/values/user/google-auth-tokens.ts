import { Result } from '../../../core/result.js';
import { Guard } from '../../../core/guard.js';
import { ValueObject } from '../../ValueObject.js';

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

  public static create(props: GoogleAuthTokensProps): Result<GoogleAuthTokens> {
    if (!Guard.notEmptyString(props.accessToken)) {
      return Result.fail<GoogleAuthTokens>('Google access token is required');
    }

    const refreshToken = Guard.notEmptyString(props.refreshToken)
      ? props.refreshToken.trim()
      : undefined;

    return Result.ok(
      new GoogleAuthTokens({
        accessToken: props.accessToken.trim(),
        refreshToken,
      }),
    );
  }
}
