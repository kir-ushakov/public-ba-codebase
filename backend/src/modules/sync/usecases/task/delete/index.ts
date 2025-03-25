import { TaskRepo } from '../../../../../shared/repo/task.repo.js';
import { DeleteTaskController } from './delete-task.controller.js';
import { DeleteTaskUsecase } from './delete-task.usecase.js';
import { models } from '../../../../../shared/infra/database/mongodb/index.js';
import { ActionRepo } from '../../../../../shared/repo/action.repo.js';

const taskRepo: TaskRepo = new TaskRepo(models);
const actionRepo: ActionRepo = new ActionRepo(models);
const deleteTask = new DeleteTaskUsecase(taskRepo, actionRepo);
const deleteTaskController = new DeleteTaskController(deleteTask);

export { deleteTaskController };
