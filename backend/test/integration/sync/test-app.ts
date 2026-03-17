import express, { Request, Response } from 'express';
import { CreateTaskController } from '../../../src/modules/sync/usecases/task/create/create-task.controller.js';
import { CreateTask } from '../../../src/modules/sync/usecases/task/create/create-task.usecase.js';
import { TaskRepoService } from '../../../src/shared/repo/task-repo.service.js';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';

/**
 * Build Express app wired to the real controller + repo
 */
export function buildTestApp() {
  // Use real models - better integration testing!
  // All models work with in-memory MongoDB
  
  // Minimal mock slack service (no real network calls)
  const slackService = {
    sendMessage: jest.fn(),
  } as any;

  const taskRepoService = new TaskRepoService(models);
  const createTaskUseCase = new CreateTask(taskRepoService, slackService);
  const createTaskController = new CreateTaskController(createTaskUseCase);

  const app = express();
  app.use(express.json());

  // Fake auth middleware: sets req.user to a known user object.
  // Adjust the shape if your controller expects other properties on req.user.
  app.use((req: Request, _res: Response, next) => {
    (req as any).user = { _id: 'test-user-1' };
    next();
  });

  // Mount the controller on POST /api/tasks (adjust path if your real route differs)
  // We attempt to call public execute(); if your BaseController provides a different API,
  // adjust the call accordingly (e.g. createTaskController.execute(req,res)).
  app.post('/api/tasks', async (req: Request, res: Response) => {
    // The controller you shared implements executeImpl as protected; BaseController
    // likely has a public method. Try execute first; fallback to executeImpl if necessary.
    try {
      // @ts-ignore - call execute if available
      if (typeof (createTaskController as any).execute === 'function') {
        await (createTaskController as any).execute(req, res);
      } else {
        // fallback (not ideal but handles protected naming mismatch)
        await (createTaskController as any).executeImpl(req, res);
      }
    } catch (err) {
      console.error('Controller threw:', err);
      res.status(500).json({ error: String(err) });
    }
  });

  return { app, createTaskController, taskRepoService, slackService };
}
