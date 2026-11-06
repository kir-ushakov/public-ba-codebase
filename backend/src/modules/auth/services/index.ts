import { models } from '../../../shared/infra/database/mongodb/index.js';
import { RefreshSessionRepo } from '../../../shared/repo/refresh-session.repo.js';
import { LoginService } from './login.service.js';

const refreshSessionRepo = new RefreshSessionRepo(models);
const loginService = new LoginService(refreshSessionRepo);

export { loginService, refreshSessionRepo };
