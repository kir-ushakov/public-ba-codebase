import { GetChnagesController } from './get-changes.controller.js';
import { GetChangesUC } from './get-changes.usecase.js';
import { models } from '../../../../shared/infra/database/mongodb/index.js';
import { ClientRepo } from '../../../../shared/repo/client.repo.js';
import { TaskRepoService } from '../../../../shared/repo/task-repo.service.js';
import { ActionRepo } from '../../../../shared/repo/action.repo.js';

const taskRepoService = new TaskRepoService(models);
const clientRepo = new ClientRepo(models);
const actionRepo = new ActionRepo(models);
const getChangesUC = new GetChangesUC(clientRepo, taskRepoService, actionRepo);
const getChnagesController = new GetChnagesController(getChangesUC);

export { getChnagesController };
