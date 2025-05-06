import { TaskRepoService } from '../../../../../shared/repo/task-repo.service.js';
import { DeleteTaskController } from './delete-task.controller.js';
import { DeleteTaskUsecase } from './delete-task.usecase.js';
import { models } from '../../../../../shared/infra/database/mongodb/index.js';
import { ActionRepo } from '../../../../../shared/repo/action.repo.js';

const taskRepoService = new TaskRepoService(models);
const actionRepo: ActionRepo = new ActionRepo(models);
const deleteTask = new DeleteTaskUsecase(taskRepoService, actionRepo);
const deleteTaskController = new DeleteTaskController(deleteTask);

export { deleteTaskController };
