import passport from 'passport';
import { loginService } from '../../services/index.js';
import { LoginController } from './login.controller.js';
import { LoginUsecase } from './login.usecase.js';

const loginUsecase = new LoginUsecase(passport, loginService);
const loginController = new LoginController(loginUsecase);

export { loginController };
