import { SignupController } from './signup.controller.js';
import { SignUp } from './signup.usecase.js';
import { UserRepo } from '../../../../shared/repo/user.repo.js';
import { models } from '../../../../shared/infra/database/mongodb/index.js';
import { emailVerificationService } from '../../services/email/_index.js';

const userRepo: UserRepo = new UserRepo(models);
const signup: SignUp = new SignUp(userRepo, emailVerificationService);
const signupController = new SignupController(signup);

export { signupController };
