import { CreateTaskController } from './create-task.controller.js';
import { CreateTaskUC } from './create-task.usecase.js';
import { TaskRepo } from '../../../../../shared/repo/task.repo.js';
import { models } from '../../../../../shared/infra/database/mongodb/index.js';
import { slackService } from '../../../../../shared/infra/integrations/slack/index.js';

const taskRepo: TaskRepo = new TaskRepo(models);
const createTaskUC: CreateTaskUC = new CreateTaskUC(taskRepo, slackService);
const createTaskController = new CreateTaskController(createTaskUC);

export { createTaskController };
