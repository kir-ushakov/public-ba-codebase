import { Router } from 'express';
import { loginController } from '../usecases/login/index.js';
import { logoutController } from '../usecases/logout/index.js';
import { signupController } from '../usecases/sing-up/index.js';
import { verifyEmailController } from '../usecases/verify-email/_index.js';

const authRouter: Router = Router();

authRouter.post('/signup', (req, res, next) =>
  signupController.execute(req, res, next)
);
authRouter.post('/login', (req, res, next) =>
  loginController.execute(req, res, next)
);
authRouter.get('/verify-email', (req, res, next) =>
  verifyEmailController.execute(req, res, next)
);
authRouter.delete('/logout', (req, res, next) =>
  logoutController.execute(req, res, next)
);

export { authRouter };
