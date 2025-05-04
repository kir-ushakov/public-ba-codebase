import { CreateTaskController } from './create-task.controller.js';
import { CreateTask } from './create-task.usecase.js';
import { TaskRepoService } from '../../../../../shared/repo/task-repo.service.js';
import { models } from '../../../../../shared/infra/database/mongodb/index.js';
import { slackService } from '../../../../../shared/infra/integrations/slack/index.js';

const taskRepoService = new TaskRepoService(models);
const createTask = new CreateTask(taskRepoService, slackService);
const createTaskController = new CreateTaskController(createTask);

export { createTaskController };
