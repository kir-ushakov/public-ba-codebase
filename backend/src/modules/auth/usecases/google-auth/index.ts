import passport from 'passport';
import { GoogleAuthController } from './google-auth.controller';
import { GoogleAuthUsecase } from './google-auth.usecase';
import { loginService } from '../../services';
import { UserRepo } from '../../../../shared/repo/user.repo';
import { models } from '../../../../shared/infra/database/mongodb';

const userRepo = new UserRepo(models);
const googleAuthUsecase = new GoogleAuthUsecase(
  passport,
  userRepo,
  loginService
);
const googleAuthController = new GoogleAuthController(googleAuthUsecase);

export { googleAuthController };
