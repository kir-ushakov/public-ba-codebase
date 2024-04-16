import { LoginController } from './login.controller';
import passport from 'passport';
import { loginService } from '../../services/';

const loginController = new LoginController(passport, loginService);

export { loginController };
