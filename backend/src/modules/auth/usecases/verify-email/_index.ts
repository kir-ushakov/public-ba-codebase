import { models } from '../../../../shared/infra/database/mongodb/index.js';
import { UserRepo } from '../../../../shared/repo/user.repo.js';
import { VerifyEmailController } from './verify-email.controller.js';
import { VerifyEmailUseCase } from './verify-email.usecase.js';

const userRepo: UserRepo = new UserRepo(models);
const verifyEmail: VerifyEmailUseCase = new VerifyEmailUseCase(userRepo);
const verifyEmailController = new VerifyEmailController(verifyEmail);

export { verifyEmailController };
