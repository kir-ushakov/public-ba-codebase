import { Router } from 'express';
import { asyncHandler } from '../../../shared/core/async-handler.function.js';
import { loginController } from '../usecases/login/index.js';
import { logoutController } from '../usecases/logout/index.js';
import { signupController } from '../usecases/sing-up/index.js';
import { verifyEmailController } from '../usecases/verify-email/_index.js';

const authRouter: Router = Router();

authRouter.post('/signup', asyncHandler(signupController.execute.bind(signupController)));
authRouter.post('/login', asyncHandler(loginController.execute.bind(loginController)));
authRouter.get(
  '/verify-email',
  asyncHandler(verifyEmailController.execute.bind(verifyEmailController)),
);
authRouter.delete('/logout', asyncHandler(logoutController.execute.bind(logoutController)));

export { authRouter };
