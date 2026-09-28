import { models } from '../../../../../shared/infra/database/mongodb/index.js';
import { TaskRepoService } from '../../../../../shared/repo/task-repo.service.js';
import { TagRepoService } from '../../../../../shared/repo/tag-repo.service.js';
import { UpdateTaskController } from './update-task.controller.js';
import { UpdateTask } from './update-task.usecase.js';

const taskRepoService = new TaskRepoService(models);
const tagRepoService = new TagRepoService(models);
const updateTask = new UpdateTask(taskRepoService, tagRepoService);
const updateTaskController = new UpdateTaskController(updateTask);

export { updateTaskController };
