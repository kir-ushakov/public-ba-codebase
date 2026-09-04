import { Application } from 'express';
import { TaskDTO, ETaskStatus, ETaskType } from '@brainassistant/contracts';
import { authenticatedRequest } from './auth.helper.js';

export type TaskSeed = {
  id: string;
  type?: ETaskType;
  title?: string;
  status?: ETaskStatus;
  imageId?: string;
};

/**
 * Allocates a new sync client via GET /api/sync/release-client-id.
 * The production path is named "release", but it creates a client and returns its id.
 */
export async function allocateClientId(app: Application, jwtCookie: string): Promise<string> {
  const res = await authenticatedRequest(app, jwtCookie).get('/api/sync/release-client-id');
  if (res.status !== 200 || typeof res.body?.clientId !== 'string') {
    throw new Error(`Failed to allocate clientId: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.clientId;
}

export async function createTaskViaApi(
  app: Application,
  jwtCookie: string,
  seed: TaskSeed,
): Promise<TaskDTO> {
  const dto = {
    id: seed.id,
    type: seed.type ?? ETaskType.Basic,
    title: seed.title ?? 'Integration Test Task',
    status: seed.status ?? ETaskStatus.Todo,
    ...(seed.imageId !== undefined ? { imageId: seed.imageId } : {}),
  };

  const res = await authenticatedRequest(app, jwtCookie)
    .post('/api/sync/task')
    .send({ changeableObjectDto: dto })
    .set('Accept', 'application/json');

  if (res.status !== 201) {
    throw new Error(`Failed to create task: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return res.body as TaskDTO;
}
