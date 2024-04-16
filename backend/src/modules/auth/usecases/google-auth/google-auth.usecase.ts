import { PassportStatic } from 'passport';
import { Profile } from 'passport-google-oauth20';
import { v4 as uuidv4 } from 'uuid';
import { UseCase } from '../../../../shared/core/UseCase';
import { UseCaseError } from '../../../../shared/core/use-case-error';
import { Result } from '../../../../shared/core/Result';
import { Request, Response, NextFunction } from 'express';
import { AuthenticateUserError } from './google-auth.errors';
import { LoginResponseDTO } from '../login/login.dto';
import { UserRepo } from '../../../../shared/repo/user.repo';
import { User } from '../../../../shared/domain/models/user';
import { UserEmail } from '../../../../shared/domain/values/user/user-email';
import { UserDocument } from '../../../../shared/infra/database/mongodb/user.model';
import { LoginService } from '../../services/login.service';
import { googleStrategy } from '../../../../shared/infra/auth';

export type GoogleAuthRequest = {
  context: { req: Request; res: Response; next: NextFunction };
};
export type GoogleAuthResult = Result<LoginResponseDTO | UseCaseError>;

export class GoogleAuthUsecase
  implements UseCase<GoogleAuthRequest, Promise<GoogleAuthResult>>
{
  private passport: PassportStatic;
  private userRepo: UserRepo;
  private loginService: LoginService;

  constructor(
    passport: PassportStatic,
    userRepo: UserRepo,
    loginService: LoginService
  ) {
    this.passport = passport;
    this.userRepo = userRepo;
    this.loginService = loginService;
  }

  public execute(request: GoogleAuthRequest): Promise<GoogleAuthResult> {
    return new Promise<GoogleAuthResult>(async (resolve, reject) => {
      try {
        this.passport.authenticate('google', async (err, profile: Profile) => {
          if (err) {
            return reject(err);
          }

          const userOrError = await this.findOrCreateUser(profile);
          if (userOrError.isFailure) {
            const error: Result<UseCaseError> =
              userOrError as Result<UseCaseError>;
            return resolve(error);
          }
          let user: UserDocument = userOrError.getValue() as UserDocument;


            await this.loginService.login(
              user,
              request.context.req,
              request.context.res
            );

          return resolve(Result.ok(loginResponseDto));
        })(request.context.req, request.context.res, request.context.next);
      } catch (err) {
        return reject(err);
      }
    });
  }

  private async findOrCreateUser(
    profile: Profile
  ): Promise<Result<UserDocument | UseCaseError>> {
    let user: UserDocument;

    user = await this.userRepo.getUserByGoogleId(profile.id);
    if (user) {
      return Result.ok(user);
    }

    const existUser: UserDocument = await this.userRepo.getUserByUsername(
      profile._json.email
    );
    if (existUser) {
      if (existUser.verified) {
        return new AuthenticateUserError.EmailAlreadyInUse(profile._json.email);
      } else {
        await this.userRepo.removeByUsername(profile._json.email);
      }
    }

    const email: UserEmail = UserEmail.create(profile._json.email).getValue();
    const userModel: User = User.create({
      username: email,
      googleId: profile.id,
      firstName: profile._json.given_name,
      lastName: profile._json.family_name,
      verified: true,
    }).getValue();

    // Password for consistency
    const dummyPassword = uuidv4();
    user = await this.userRepo.create(userModel, dummyPassword);

    return Result.ok(user);
  }
}
