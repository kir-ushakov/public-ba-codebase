import { refreshSessionRepo } from '../../services/index.js';
import { LogoutController } from './logout.controller.js';
import { LogoutUsecase } from './logout.usecase.js';

const logoutController = new LogoutController(new LogoutUsecase(refreshSessionRepo));

export { logoutController };
