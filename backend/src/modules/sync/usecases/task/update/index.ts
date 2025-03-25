import { models } from '../../../../../shared/infra/database/mongodb/index.js';
import { TaskRepo } from '../../../../../shared/repo/task.repo.js';
import { UpdateTaskController } from './update-task.controller.js';
import { UpdateTask } from './update-task.usecase.js';

const taskRepo: TaskRepo = new TaskRepo(models);
const updateTask = new UpdateTask(taskRepo);
const updateTaskController = new UpdateTaskController(updateTask);

export { updateTaskController };
