import { models } from "../../../../shared/infra/database/mongodb";
import { UserRepo } from "../../../../shared/repo/user.repo";
import { VerifyEmailController } from "./verify-email.controller";
import { VerifyEmailUseCase } from "./verify-email.usecase";

const userRepo: UserRepo = new UserRepo(models);
const verifyEmail: VerifyEmailUseCase = new VerifyEmailUseCase(userRepo);
const verifyEmailController = new VerifyEmailController(verifyEmail);

export { verifyEmailController };
