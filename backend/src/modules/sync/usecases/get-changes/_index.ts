import { GetChnagesController } from './get-changes.controller.js';
import { GetChanges } from './get-changes.usecase.js';
import { models } from '../../../../shared/infra/database/mongodb/index.js';
import { ClientRepo } from '../../../../shared/repo/client.repo.js';
import { TaskRepoService } from '../../../../shared/repo/task-repo.service.js';
import { ActionRepo } from '../../../../shared/repo/action.repo.js';

const taskRepoService = new TaskRepoService(models);
const clientRepo = new ClientRepo(models);
const actionRepo = new ActionRepo(models);
const getChanges = new GetChanges(clientRepo, taskRepoService, actionRepo);
const getChnagesController = new GetChnagesController(getChanges);

export { getChnagesController };
