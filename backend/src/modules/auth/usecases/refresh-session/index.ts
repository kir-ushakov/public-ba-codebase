import { models } from '../../../../shared/infra/database/mongodb/index.js';
import { UserRepo } from '../../../../shared/repo/user.repo.js';
import { loginService, refreshSessionRepo } from '../../services/index.js';
import { RefreshSessionController } from './refresh-session.controller.js';
import { RefreshSessionUsecase } from './refresh-session.usecase.js';

const refreshSessionUsecase = new RefreshSessionUsecase(
  refreshSessionRepo,
  new UserRepo(models),
  loginService,
);
const refreshSessionController = new RefreshSessionController(refreshSessionUsecase);

export { refreshSessionController };
