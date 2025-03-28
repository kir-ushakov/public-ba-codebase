import { Router } from 'express';
import { createTaskController } from '../useCases/task/create/index.js';
import { updateTaskController } from '../useCases/task/update/index.js';
import { deleteTaskController } from '../useCases/task/delete/index.js';
import { releaseClientIdController } from '../useCases/release-client-id/index.js';
import { getChnagesController } from '../useCases/get-changes/_index.js';

const syncRouter: Router = Router();

syncRouter.post('/task', (req, res) => createTaskController.execute(req, res));
syncRouter.patch('/task', (req, res) => updateTaskController.execute(req, res));
syncRouter.delete('/task/:taskId', (req, res) =>
  deleteTaskController.execute(req, res)
);

syncRouter.get('/release-client-id', (req, res) =>
  releaseClientIdController.execute(req, res)
);
syncRouter.get('/changes', (req, res) =>
  getChnagesController.execute(req, res)
);

export { syncRouter };
