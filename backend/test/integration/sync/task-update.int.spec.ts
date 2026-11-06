import { Application } from 'express';
import request from 'supertest';
import { ETaskCondition, ETaskStatus, ETaskType } from '@brainassistant/contracts';
import { ETaskError } from '../../../src/shared/domain/models/task.js';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import { ETaskRepoServiceError } from '../../../src/shared/repo/task-repo.service.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';
import { createTagViaApi, createTaskViaApi } from '../_setup/sync.helper.js';

describe('Integration: UpdateTask (Controller -> UseCase -> Repo -> MongoDB)', () => {
  let app: Application;

  beforeAll(async () => {
    await startInMemoryMongo();
    app = buildTestApp().app;
  }, 30_000);

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('returns 401 without auth cookie', async () => {
    const res = await request(app)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          id: 'task-unauth',
          type: ETaskType.Basic,
          title: 'Should not update',
          status: ETaskStatus.Todo,
        },
      });

    expect(res.status).toBe(401);
  });

  it('happy path: updates title and preserves createdAt', async () => {
    const { jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-update-1',
      title: 'Original task title',
    });

    const res = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...created,
          title: 'Updated task title',
          createdAt: '2019-01-01T00:00:00.000Z',
          modifiedAt: '2024-06-01T08:00:00.000Z',
        },
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: created.id,
      userId: created.userId,
      type: created.type,
      title: 'Updated task title',
      status: created.status,
    });
    expect(res.body.createdAt).toBe(created.createdAt);
    expect(res.body.modifiedAt).toBe('2024-06-01T08:00:00.000Z');

    const persisted = await models.TaskModel.findById(created.id).lean();
    expect(persisted).toMatchObject({
      title: 'Updated task title',
      type: created.type,
      status: created.status,
    });
    if (!persisted) {
      throw new Error('expected persisted task');
    }
    expect(new Date(persisted.createdAt).toISOString()).toBe(created.createdAt);
    expect(new Date(persisted.modifiedAt).toISOString()).toBe('2024-06-01T08:00:00.000Z');
  });

  it('returns 404 when the task does not exist', async () => {
    const { jwtCookie } = await seedTestUser();

    const res = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          id: 'task-missing',
          type: ETaskType.Basic,
          title: 'Missing task title',
          status: ETaskStatus.Todo,
        },
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(404);
    expect(res.body.name).toBe(ETaskRepoServiceError.UserTaskNotFound);
    expect(res.body).toHaveProperty('message');
  });

  it('invalid title -> 400 and the persisted title is unchanged', async () => {
    const { jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-update-invalid',
      title: 'Valid task title',
    });

    const res = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...created,
          title: '',
        },
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.name).toBe(ETaskError.TitleMissed);
    expect(res.body).toHaveProperty('message');

    const persisted = await models.TaskModel.findById(created.id).lean();
    if (!persisted) {
      throw new Error('expected persisted task');
    }
    expect(persisted.title).toBe('Valid task title');
  });

  it('happy path: updates description and persists it', async () => {
    const { jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-update-description',
      title: 'Task with details',
    });
    const description = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'Check delivery date' }],
        },
      ],
    };

    const res = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...created,
          description,
        },
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.description).toEqual(description);

    const persisted = await models.TaskModel.findById(created.id).lean();
    expect(persisted?.description).toEqual(description);
  });

  it('clears description when an empty document is sent', async () => {
    const { jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-clear-description',
      title: 'Task with details',
      description: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Will be cleared' }],
          },
        ],
      },
    });

    const res = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...created,
          description: { type: 'doc', content: [{ type: 'paragraph' }] },
        },
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.description).toBeUndefined();

    const persisted = await models.TaskModel.findById(created.id).lean();
    expect(persisted?.description).toBeUndefined();
  });

  it('persists owned tag ids and leaves them when a later update omits tagIds', async () => {
    const { jwtCookie } = await seedTestUser();
    const tag = await createTagViaApi(app, jwtCookie, { id: 'tag-update', name: 'Ideas' });
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-update-tags',
      title: 'Task before tags',
    });

    const withTags = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...created,
          tagIds: [tag.id],
        },
      })
      .set('Accept', 'application/json');

    expect(withTags.status).toBe(200);
    expect(withTags.body.tagIds).toEqual([tag.id]);

    const { tagIds: _tagIds, ...withoutTagIds } = withTags.body;
    const renamed = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...withoutTagIds,
          title: 'Renamed without touching tags',
        },
      })
      .set('Accept', 'application/json');

    expect(renamed.status).toBe(200);
    expect(renamed.body.tagIds).toEqual([tag.id]);

    const persisted = await models.TaskModel.findById(created.id).lean();
    expect(persisted?.title).toBe('Renamed without touching tags');
    expect(persisted?.tagIds).toEqual([tag.id]);
  });

  it('rejects a tag id the user does not own and keeps the stored ids', async () => {
    const { jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-update-foreign-tag',
      title: 'Task stays untagged',
    });

    const res = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...created,
          tagIds: ['tag-not-owned'],
        },
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.name).toBe(ETaskError.UnknownTag);
    expect(res.body).toHaveProperty('message');

    const persisted = await models.TaskModel.findById(created.id).lean();
    expect(persisted?.tagIds ?? []).toEqual([]);
  });

  it('keeps a checklist when the update omits it and clears it when the update sends an empty list', async () => {
    const { jwtCookie } = await seedTestUser();
    const checklist = [
      { id: 'item-1', text: 'Buy cat food', completed: false },
      { id: 'item-2', text: 'Check salmon variant', completed: true },
    ];
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-checklist-update',
      title: 'Shopping',
      checklist,
    });

    const { checklist: _checklist, ...withoutChecklist } = created;
    const renamed = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...withoutChecklist,
          title: 'Shopping later',
        },
      })
      .set('Accept', 'application/json');

    expect(renamed.status).toBe(200);
    expect(renamed.body.checklist).toEqual(checklist);
    expect((await models.TaskModel.findById(created.id).lean())?.checklist).toEqual(checklist);

    const cleared = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...created,
          title: 'Shopping later',
          checklist: [],
        },
      })
      .set('Accept', 'application/json');

    expect(cleared.status).toBe(200);
    expect(cleared.body.checklist).toBeUndefined();
    expect((await models.TaskModel.findById(created.id).lean())?.checklist).toBeUndefined();
  });

  it('keeps conditions when an older client updates the task without the field', async () => {
    const { jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-keep-conditions',
      title: 'Buy lemons',
      conditions: [ETaskCondition.Todo, ETaskCondition.Location],
    });

    const { conditions: _conditions, ...withoutConditions } = created;
    const res = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...withoutConditions,
          type: ETaskType.Basic,
          title: 'Buy more lemons',
        },
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.conditions).toEqual([ETaskCondition.Todo, ETaskCondition.Location]);
    expect(res.body.type).toBe(ETaskType.Location);

    const persisted = await models.TaskModel.findById(created.id).lean();
    expect(persisted?.conditions).toEqual([ETaskCondition.Todo, ETaskCondition.Location]);
    expect(persisted?.type).toBe(ETaskType.Location);
    expect(persisted?.title).toBe('Buy more lemons');
  });

  it('stores an audio attachment and keeps it when the field is omitted', async () => {
    const { jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-audio-keep',
      title: 'Discuss sync',
    });
    const attachment = {
      id: 'audio-1',
      durationMs: 12500,
      mimeType: 'audio/webm',
      createdAt: '2024-06-01T08:00:00.000Z',
      transcription: {
        text: 'Discuss the sync plan',
        createdAt: '2024-06-01T08:05:00.000Z',
        model: 'whisper-1',
      },
    };

    const saved = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...created,
          audioAttachments: [attachment],
          modifiedAt: '2024-06-01T08:01:00.000Z',
        },
      })
      .set('Accept', 'application/json');

    expect(saved.status).toBe(200);
    expect(saved.body.audioAttachments).toEqual([attachment]);

    const { audioAttachments: _audio, ...withoutAudio } = saved.body;
    const kept = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...withoutAudio,
          title: 'Discuss sync later',
          modifiedAt: '2024-06-01T08:02:00.000Z',
        },
      })
      .set('Accept', 'application/json');

    expect(kept.status).toBe(200);
    expect(kept.body.audioAttachments).toEqual([attachment]);
    expect(kept.body.title).toBe('Discuss sync later');

    const persisted = await models.TaskModel.findById(created.id).lean();
    expect(persisted?.audioAttachments).toEqual([attachment]);
  });

  it('rejects an invalid audio attachment', async () => {
    const { jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-audio-invalid',
      title: 'Valid task title',
    });

    const res = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/task')
      .send({
        changeableObjectDto: {
          ...created,
          audioAttachments: [
            {
              id: 'not valid',
              durationMs: 1,
              mimeType: 'audio/webm',
              createdAt: '2024-06-01T08:00:00.000Z',
            },
          ],
        },
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.name).toBe(ETaskError.AudioAttachmentsInvalid);
    expect(res.body).toHaveProperty('message');

    const persisted = await models.TaskModel.findById(created.id).lean();
    expect(persisted?.audioAttachments).toBeUndefined();
  });
});
