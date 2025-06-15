import { Result } from '../../../../shared/core/result.js';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { User } from '../../../../shared/domain/models/user.js';
import { VerificationToken } from '../../../../shared/domain/values/user/verification-token.js';
import { UserRepo } from '../../../../shared/repo/user.repo.js';
import { VerifyEmailRequestDTO, IVerifyEmailResponceDTO } from './verify-email.dto.js';
import { VerifyEmailError } from './verify-email.errors.js';

type UseCaseRequest = {
  dto: VerifyEmailRequestDTO;
};
type UseCaseResult = Result<IVerifyEmailResponceDTO | never, VerifyEmailError>;

export class VerifyEmailUseCase implements UseCase<UseCaseRequest, Promise<UseCaseResult>> {
  private userRepo: UserRepo;

  constructor(userRepo: UserRepo) {
    this.userRepo = userRepo;
  }

  public async execute(reqest: UseCaseRequest): Promise<UseCaseResult> {
    const dto = reqest.dto;
    const tokenId: string = dto.token;

    const token: VerificationToken = await this.userRepo.getTokenByTokenId(tokenId);
    if (!token) {
      // TODO: Potentially we can handle case if token not found (throw usecase error)
    }
    // TODO: verify that token not expired (throw usecase error)

    const user: User = await this.userRepo.findUserById(token.userId);
    // TODO: verify that token not expired (throw usecase error)

    const verified: Result<void> = user.verify();

    if (verified.isFailure) {
      // TODO: handle case when user was not verified
      // UseCaseError.VerificationFailed(verified.error)
    }

    await this.userRepo.save(user);

    const response: IVerifyEmailResponceDTO = {
      email: user.username.value,
      firstName: user.firstname,
      lastName: user.lastname,
      verified: user.verified,
    };
    return Result.ok(response);
  }
}
