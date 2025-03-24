import passport from 'passport';
import { GoogleAuthController } from './google-auth.controller.js';
import { GoogleAuthUsecase } from './google-auth.usecase.js';
import { loginService } from '../../services/index.js';
import { UserRepo } from '../../../../shared/repo/user.repo.js';
import { models } from '../../../../shared/infra/database/mongodb/index.js';

const userRepo = new UserRepo(models);
const googleAuthUsecase = new GoogleAuthUsecase(
  passport,
  userRepo,
  loginService
);
const googleAuthController = new GoogleAuthController(googleAuthUsecase);

export { googleAuthController };
