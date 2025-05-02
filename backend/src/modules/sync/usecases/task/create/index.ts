import { CreateTaskController } from './create-task.controller.js';
import { CreateTask } from './create-task.usecase.js';
import { TaskRepo } from '../../../../../shared/repo/task.repo.js';
import { models } from '../../../../../shared/infra/database/mongodb/index.js';
import { slackService } from '../../../../../shared/infra/integrations/slack/index.js';

const taskRepo: TaskRepo = new TaskRepo(models);
const createTask: CreateTask = new CreateTask(taskRepo, slackService);
const createTaskController = new CreateTaskController(createTask);

export { createTaskController };
