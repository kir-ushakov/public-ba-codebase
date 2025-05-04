import { UseCaseError } from '../../../../shared/core/use-case-error.js';

export enum EVerifyEmailUsecaseError {
  GivenTokenDoesNotExist = 'VERIFY_EMAIL_ERROR__GIVEN_TOKEN_DOES_NOT_EXIST',
  VerificationFailed = 'VERIFY_EMAIL_ERROR__VERIFICATION_FAILED',
}

type EVerifyEmail = EVerifyEmailUsecaseError;
export class VerifyEmailError extends UseCaseError<EVerifyEmail> {}
