import { Router } from 'express';
import { asyncHandler } from '../../../shared/core/async-handler.function.js';
import { createTaskController } from '../usecases/task/create/index.js';
import { updateTaskController } from '../usecases/task/update/index.js';
import { deleteTaskController } from '../usecases/task/delete/index.js';
import { createTagController } from '../usecases/tag/create/index.js';
import { deleteTagController } from '../usecases/tag/delete/index.js';
import { releaseClientIdController } from '../usecases/release-client-id/index.js';
import { getChnagesController } from '../usecases/get-changes/_index.js';

const syncRouter: Router = Router();

syncRouter.post('/task', asyncHandler(createTaskController.execute.bind(createTaskController)));
syncRouter.patch('/task', asyncHandler(updateTaskController.execute.bind(updateTaskController)));
syncRouter.delete(
  '/task/:taskId',
  asyncHandler(deleteTaskController.execute.bind(deleteTaskController)),
);

syncRouter.post('/tag', asyncHandler(createTagController.execute.bind(createTagController)));
syncRouter.delete(
  '/tag/:tagId',
  asyncHandler(deleteTagController.execute.bind(deleteTagController)),
);

syncRouter.get(
  '/release-client-id',
  asyncHandler(releaseClientIdController.execute.bind(releaseClientIdController)),
);
syncRouter.get('/changes', asyncHandler(getChnagesController.execute.bind(getChnagesController)));

export { syncRouter };
