import { TaskRepoService } from '../../../../../shared/repo/task-repo.service.js';
import { ImageRepoService } from '../../../../../shared/repo/image-repo.service.js';
import { DeleteTaskController } from './delete-task.controller.js';
import { DeleteTaskUsecase } from './delete-task.usecase.js';
import { models } from '../../../../../shared/infra/database/mongodb/index.js';
import { ActionRepo } from '../../../../../shared/repo/action.repo.js';
import { localAudioStorage, localImageStorage } from '../../../../files/services/_index.js';

const taskRepoService = new TaskRepoService(models);
const imageRepo = new ImageRepoService(models);
const actionRepo: ActionRepo = new ActionRepo(models);
const deleteTask = new DeleteTaskUsecase(
  taskRepoService,
  actionRepo,
  imageRepo,
  localImageStorage,
  localAudioStorage,
);
const deleteTaskController = new DeleteTaskController(deleteTask);

export { deleteTaskController };
