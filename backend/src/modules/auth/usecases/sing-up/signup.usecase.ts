import { UseCase } from '../../../../shared/core/UseCase.js';
import { Result } from '../../../../shared/core/Result.js';
import { SignUpRequestDTO, SignUpResponseDTO } from './signup.dto.js';
import { SignUpErrors } from './signup.errors.js';
import { UserRepo } from '../../../../shared/repo/user.repo.js';
import { UserEmail } from '../../../../shared/domain/values/user/user-email.js';
import { User } from '../../../../shared/domain/models/user.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { UserDocument } from '../../../../shared/infra/database/mongodb/user.model.js';
import { EmailVerificationService } from '../../services/email/email-verification.service.js';

export class SignUp
  implements
    UseCase<
      SignUpRequestDTO,
      Promise<Result<UseCaseError | SignUpResponseDTO>>
    >
{
  private _userRepo: UserRepo;
  private _emailVerificationService: EmailVerificationService;

  constructor(
    userRepo: UserRepo,
    emailVerificationService: EmailVerificationService
  ) {
    this._userRepo = userRepo;
    this._emailVerificationService = emailVerificationService;
  }

  public async execute(
    dto: SignUpRequestDTO
  ): Promise<Result<UseCaseError | SignUpResponseDTO>> {
    const emailOrError = UserEmail.create(dto.email);

    if (emailOrError.isFailure) {
      return new SignUpErrors.EmailInvalid(dto.email);
    }

    // TODO: handle password, username
    // TODO: need to move to controller level
    // TICKET: https://brainas.atlassian.net/browse/BA-115
    const dtoResult = Result.combine([
      emailOrError /*passwordOrError, usernameOrError*/,
    ]);

    if (dtoResult.isFailure) {
      return Result.fail<UseCaseError>(dtoResult.error);
    }

    const email: UserEmail = emailOrError.getValue();

    const emailAlreadyInUse = await this.emailInUse(email);

    if (emailAlreadyInUse) {
      return new SignUpErrors.EmailAlreadyInUse(email.value);
    }

    const userOrError: Result<User> = User.create({
      username: email,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    if (userOrError.isFailure) {
      // TODO handle case when user creation failed
    }

    const user: User = userOrError.getValue();

    const createdUser: User = await this._userRepo.create(
      user,
      dto.password
    );

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
