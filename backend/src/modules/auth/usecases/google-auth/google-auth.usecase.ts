import { Request, Response, NextFunction } from 'express';
import { PassportStatic } from 'passport';
import { Profile } from 'passport-google-oauth20';
import { v4 as uuidv4 } from 'uuid';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { Result } from '../../../../shared/core/Result.js';
import { GoogleAuthError, GoogleAuthErrors } from './google-auth.errors.js';
import { LoginResponseDTO } from '../login/login.dto.js';
import { UserRepo } from '../../../../shared/repo/user.repo.js';
import { User } from '../../../../shared/domain/models/user.js';
import { UserEmail } from '../../../../shared/domain/values/user/user-email.js';
import { UserDocument } from '../../../../shared/infra/database/mongodb/user.model.js';
import { LoginService } from '../../services/login.service.js';
import {
  GoogleAuthTokens,
  GoogleProfileWithTokens,
} from '../../../../shared/infra/auth/google.strategy.js';

export type GoogleAuthRequest = {
  context: { req: Request; res: Response; next: NextFunction };
};
export type GoogleAuthResult = Result<LoginResponseDTO | never, GoogleAuthError>;

export class GoogleAuthUsecase implements UseCase<GoogleAuthRequest, Promise<GoogleAuthResult>> {
  private passport: PassportStatic;
  private userRepo: UserRepo;
  private loginService: LoginService;

  constructor(passport: PassportStatic, userRepo: UserRepo, loginService: LoginService) {
    this.passport = passport;
    this.userRepo = userRepo;
    this.loginService = loginService;
  }

  public execute(request: GoogleAuthRequest): Promise<GoogleAuthResult> {
    return new Promise<GoogleAuthResult>(async (resolve, reject) => {
      try {
        this.passport.authenticate('google', async (err, res: GoogleProfileWithTokens) => {
          if (err) {
            return reject(err);
          }
          const profile = res.profile;
          const tokens = res.tokens;
          const userOrError = await this.findOrCreateUser(profile, tokens);
          if (userOrError.isFailure) {
            return resolve(userOrError as Result<never, GoogleAuthError>);
          }
          let user: User = userOrError.getValue() as User;

          const loginResponseDto: LoginResponseDTO = await this.loginService.login(
            user,
            request.context.req,
            request.context.res,
          );

          return resolve(Result.ok(loginResponseDto));
        })(request.context.req, request.context.res, request.context.next);
      } catch (err) {
        return reject(err);
      }
    });
  }

  private async findOrCreateUser(
    profile: Profile,
    tokens: GoogleAuthTokens,
  ): Promise<Result<User | never, GoogleAuthError>> {
    let user: User;
    user = await this.userRepo.getUserByGoogleId(profile.id);

    if (user) {
      if (tokens.accessToken && tokens.refreshToken) {
        user.setGoogleTokens(tokens);
        await this.userRepo.save(user);
      }
      return Result.ok(user);
    }

    const existUser: UserDocument = await this.userRepo.getUserByUsername(profile._json.email);

    if (existUser) {
      if (existUser.verified) {
        return new GoogleAuthErrors.EmailAlreadyInUse(profile._json.email);
      } else {
        await this.userRepo.removeByUsername(profile._json.email);
      }
    }

    const email: UserEmail = UserEmail.create(profile._json.email).getValue();

    const userModel: User = User.create({
      username: email,
      googleId: profile.id,
      googleAccessToken: tokens.accessToken,
      googleRefreshToken: tokens.refreshToken,
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
