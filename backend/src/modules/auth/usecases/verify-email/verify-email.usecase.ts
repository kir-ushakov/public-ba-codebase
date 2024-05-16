import { Result } from '../../../../shared/core/Result';
import { UseCase } from '../../../../shared/core/UseCase';
import { UseCaseError } from '../../../../shared/core/use-case-error';
import { User } from '../../../../shared/domain/models/user';
import { VerificationToken } from '../../../../shared/domain/values/user/verification-token';
import { UserRepo } from '../../../../shared/repo/user.repo';
import {
  VerifyEmailRequestDTO,
  IVerifyEmailResponceDTO,
} from './verify-email.dto';

export class VerifyEmailUseCase
  implements
    UseCase<
      VerifyEmailRequestDTO,
      Promise<Result<UseCaseError | IVerifyEmailResponceDTO>>
    >
{
  private _userRepo: UserRepo;

  constructor(userRepo: UserRepo) {
    this._userRepo = userRepo;
  }

  public async execute(
    dto: VerifyEmailRequestDTO
  ): Promise<Result<UseCaseError | IVerifyEmailResponceDTO>> {
    const tokenId: string = dto.token;

    const token: VerificationToken = await this._userRepo.getTokenByTokenId(
      tokenId
    );
    if (!token) {
      // TODO: Potentially we can handle case if token not found (throw usecase error)
    }
    // TODO: verify that token not expired (throw usecase error)

    const user: User = await this._userRepo.findUserById(token.userId);
    // TODO: verify that token not expired (throw usecase error)

    const verified: Result<void> = user.verify();

    if (verified.isFailure) {
      // TODO: handle case when user was not verified
      // UseCaseError.VerificationFailed(verified.error)
    }

    await this._userRepo.save(user);

    const response: IVerifyEmailResponceDTO = {
      email: user.username.value,
      firstName: user.firstname,
      lastName: user.lastname,
      verified: user.verified,
    };
    return Result.ok(response);
  }
}
