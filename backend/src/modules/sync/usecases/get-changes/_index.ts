import { GetChnagesController } from './get-changes.controller.js';
import { GetChangesUC } from './get-changes.usecase.js';
import { models } from '../../../../shared/infra/database/mongodb/index.js';
import { ClientRepo } from '../../../../shared/repo/client.repo.js';
import { TaskRepo } from '../../../../shared/repo/task.repo.js';
import { ActionRepo } from '../../../../shared/repo/action.repo.js';

const taskRepo = new TaskRepo(models);
const clientRepo = new ClientRepo(models);
const actionRepo = new ActionRepo(models);
const getChangesUC = new GetChangesUC(clientRepo, taskRepo, actionRepo);
const getChnagesController = new GetChnagesController(getChangesUC);

export { getChnagesController };
