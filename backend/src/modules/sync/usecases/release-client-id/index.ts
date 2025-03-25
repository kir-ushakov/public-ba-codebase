import { ReleaseClientIdController } from './release-client-id.controller.js';
import { ReleaseClientId } from './release-client-id.usecase.js';
import { models } from '../../../../shared/infra/database/mongodb/index.js';
import { ClientRepo } from '../../../../shared/repo/client.repo.js';
import { UserRepo } from '../../../../shared/repo/user.repo.js';

const clientRepo: ClientRepo = new ClientRepo(models);
const userRepo: UserRepo = new UserRepo(models);
const releaseClientId = new ReleaseClientId(clientRepo, userRepo);
const releaseClientIdController = new ReleaseClientIdController(
  releaseClientId
);

export { releaseClientIdController };
