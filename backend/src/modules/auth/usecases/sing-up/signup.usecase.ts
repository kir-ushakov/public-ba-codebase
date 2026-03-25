import { UseCase } from '../../../../shared/core/UseCase.js';
import { Result } from '../../../../shared/core/result.js';
import { SignUpResponseDTO } from './signup.dto.js';
import { SignUpError, SignUpErrors } from './signup.errors.js';
import { UserRepo } from '../../../../shared/repo/user.repo.js';
import { UserEmail } from '../../../../shared/domain/values/user/user-email.js';
import { User } from '../../../../shared/domain/models/user.js';
import { EmailVerificationService } from '../../services/email/email-verification.service.js';

export type SignUpResult = Result<SignUpResponseDTO | never, SignUpError>;

export type SignUpParams = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

export class SignUp implements UseCase<SignUpParams, Promise<SignUpResult>> {
  private _userRepo: UserRepo;
  private _emailVerificationService: EmailVerificationService;

  constructor(userRepo: UserRepo, emailVerificationService: EmailVerificationService) {
    this._userRepo = userRepo;
    this._emailVerificationService = emailVerificationService;
  }

  public async execute(params: SignUpParams): Promise<SignUpResult> {
    const emailOrError = UserEmail.create(params.email);

    if (emailOrError.isFailure) {
      return new SignUpErrors.EmailInvalid(params.email);
    }

    const email: UserEmail = emailOrError.getValue();

    const emailAlreadyInUse = await this.emailInUse(email);

    if (emailAlreadyInUse) {
      return new SignUpErrors.EmailAlreadyInUse(email.value);
    }

    const userOrError: Result<User> = User.create({
      username: email,
      firstName: params.firstName,
      lastName: params.lastName,
    });

    if (userOrError.isFailure) {
      // TODO handle case when user creation failed
    }

    const user: User = userOrError.getValue();

    const createdUser: User = await this._userRepo.create(user, params.password);

    // TODO: This feature is temporarily unused
    /*try {
      this._emailVerificationService.sendVerificationEmail(createdUser);
    } catch (err) {
      return new SignUpErrors.VerificationEmailSendingFailed();
    }*/

    const response: SignUpResponseDTO = {
      email: createdUser.username.value,
      firstName: createdUser.firstname,
      lastName: createdUser.lastname,
    };
    return Result.ok(response);
  }

  private async emailInUse(email: UserEmail): Promise<boolean> {
    return await this._userRepo.exist(email);
  }
}
