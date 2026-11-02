import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { firstValueFrom } from 'rxjs';
import { ETaskStatus, ETaskType, Task } from 'src/app/shared/models/task.model';
import { LocalStore } from 'src/app/shared/services/infrastructure/local-store.service';
import { ChecklistCompletionPromptService } from 'src/app/shared/services/application/checklist-completion-prompt.service';
import { AuthService } from 'src/app/shared/services/api/auth.service';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { SyncAction } from 'src/app/shared/state/sync.action';
import { TasksAction } from 'src/app/shared/state/tasks.action';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { EUserAuthState, UserState } from 'src/app/shared/state/user.state';

const userId = 'user-1';

describe('TasksState', () => {
  let store: Store;
  const existing: Task = {
    id: 'task-1',
    userId,
    type: ETaskType.Basic,
    title: 'Existing task title',
    status: ETaskStatus.Todo,
    createdAt: '2024-06-01T10:00:00.000Z',
    modifiedAt: '2024-06-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideStore([TasksState, UserState]),
        { provide: AuthService, useValue: {} },
        { provide: SlackService, useValue: {} },
      ],
    });

    store = TestBed.inject(Store);
    store.reset({
      tasks: { entities: [existing] },
      user: {
        userData: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          userId,
          googleId: 'g-1',
        },
        authState: EUserAuthState.Authenticated,
        authType: undefined,
        integrations: { isAddedToSlack: undefined },
      },
    });
  });

  it('creates a task optimistically and filters allTasks by userId', async () => {
    await firstValueFrom(
      store.dispatch(new TasksAction.CreateTask({ title: 'Fresh task title' } as Task, userId)),
    );

    const all = store.selectSnapshot(TasksState.allTasks);
    expect(all).toHaveLength(2);
    expect(all[0]).toMatchObject({
      title: 'Fresh task title',
      userId,
      status: ETaskStatus.Todo,
    });
    expect(all[0]?.id).toBeTruthy();
    expect(all[0]?.tagIds).toEqual([]);
  });

  it('stores selected tag ids on optimistic create', async () => {
    await firstValueFrom(
      store.dispatch(
        new TasksAction.CreateTask({ title: 'Tagged task', tagIds: ['tag-1'] }, userId),
      ),
    );

    expect(store.selectSnapshot(TasksState.allTasks)[0]).toMatchObject({
      title: 'Tagged task',
      tagIds: ['tag-1'],
    });
  });

  it('stores description on optimistic create', async () => {
    const description = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'Contact supplier' }],
        },
      ],
    };

    await firstValueFrom(
      store.dispatch(
        new TasksAction.CreateTask({ title: 'Task with details', description }, userId),
      ),
    );

    expect(store.selectSnapshot(TasksState.allTasks)[0]?.description).toEqual(description);
  });

  it('updates a task title in place', async () => {
    await firstValueFrom(
      store.dispatch(
        new TasksAction.UpdateTask({
          taskId: existing.id,
          changes: { title: 'Renamed task title' },
        }),
      ),
    );

    expect(store.selectSnapshot(TasksState.allTasks)[0]?.title).toBe('Renamed task title');
  });

  it('keeps To do, Active and Notes tasks on the home list', () => {
    const active: Task = {
      ...existing,
      id: 'task-active',
      title: 'Active task',
      status: ETaskStatus.Active,
      createdAt: '2024-06-02T10:00:00.000Z',
    };
    const notes: Task = {
      ...existing,
      id: 'task-notes',
      title: 'Notes task',
      status: ETaskStatus.Notes,
      createdAt: '2024-06-03T10:00:00.000Z',
    };
    const done: Task = {
      ...existing,
      id: 'task-done',
      title: 'Done task',
      status: ETaskStatus.Done,
    };

    store.reset({
      tasks: { entities: [existing, active, notes, done] },
      user: {
        userData: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          userId,
          googleId: 'g-1',
        },
        authState: EUserAuthState.Authenticated,
        authType: undefined,
        integrations: { isAddedToSlack: undefined },
      },
    });

    const titles = store.selectSnapshot(TasksState.actualTasks).map(task => task.title);

    expect(titles).toEqual(['Notes task', 'Active task', 'Existing task title']);
    expect(titles).not.toContain('Done task');
  });

  it('removes a task on local delete', async () => {
    await firstValueFrom(store.dispatch(new TasksAction.DeleteTask(existing.id)));

    expect(store.selectSnapshot(TasksState.allTasks)).toEqual([]);
  });

  it('applies server upserts and deletes from ServerChangesLoaded', async () => {
    const fromServer: Task = {
      ...existing,
      title: 'Title from server',
      modifiedAt: '2024-06-02T10:00:00.000Z',
    };
    const inserted: Task = {
      id: 'task-2',
      userId,
      type: ETaskType.Basic,
      title: 'Inserted from server',
      status: ETaskStatus.Todo,
      createdAt: '2024-06-03T10:00:00.000Z',
      modifiedAt: '2024-06-03T10:00:00.000Z',
    };

    await firstValueFrom(
      store.dispatch(
        new SyncAction.ServerChangesLoaded([
          { entity: EChangedEntity.Task, action: EChangeAction.Updated, object: fromServer },
          { entity: EChangedEntity.Task, action: EChangeAction.Updated, object: inserted },
        ]),
      ),
    );

    expect(store.selectSnapshot(TasksState.allTasks).map(t => t.id)).toEqual([
      inserted.id,
      existing.id,
    ]);
    expect(
      store.selectSnapshot(s => s.tasks.entities.find((t: Task) => t.id === existing.id)?.title),
    ).toBe('Title from server');

    await firstValueFrom(
      store.dispatch(
        new SyncAction.ServerChangesLoaded([
          {
            entity: EChangedEntity.Task,
            action: EChangeAction.Deleted,
            object: { id: existing.id, modifiedAt: '2024-06-04T10:00:00.000Z' },
          },
        ]),
      ),
    );

    expect(store.selectSnapshot(TasksState.allTasks).map(t => t.id)).toEqual([inserted.id]);
  });

  it('creates a task and a note with a checklist and keeps it on a status-only update', async () => {
    const checklist = [
      { id: 'a', text: 'Buy cat food', completed: false },
      { id: 'b', text: 'Check salmon variant', completed: true },
    ];

    await firstValueFrom(
      store.dispatch(new TasksAction.CreateTask({ title: 'Shopping', checklist }, userId)),
    );
    await firstValueFrom(
      store.dispatch(
        new TasksAction.CreateTask(
          { title: 'Remember this', status: ETaskStatus.Notes, checklist },
          userId,
        ),
      ),
    );

    const tasks = store.selectSnapshot(TasksState.allTasks);
    const createdTask = tasks.find(task => task.title === 'Shopping');
    const createdNote = tasks.find(task => task.title === 'Remember this');
    expect(createdTask?.checklist).toEqual(checklist);
    expect(createdTask?.status).toBe(ETaskStatus.Todo);
    expect(createdNote?.checklist).toEqual(checklist);
    expect(createdNote?.status).toBe(ETaskStatus.Notes);
    expect(
      store.selectSnapshot(TasksState.allTasks).find(task => task.id === existing.id)?.checklist,
    ).toBeUndefined();

    await firstValueFrom(
      store.dispatch(
        new TasksAction.UpdateTask({
          taskId: createdTask!.id,
          changes: { status: ETaskStatus.Active },
        }),
      ),
    );

    const updated = store
      .selectSnapshot(TasksState.allTasks)
      .find(task => task.id === createdTask!.id);
    expect(updated?.status).toBe(ETaskStatus.Active);
    expect(updated?.checklist).toEqual(checklist);
  });

  it('reloads a checklist from local data and applies a remote checklist without offering completion', async () => {
    const prompts = TestBed.inject(ChecklistCompletionPromptService);
    const checklist = [{ id: 'a', text: 'Buy cat food', completed: true }];
    const stored: Task = {
      ...existing,
      checklist,
    };

    await firstValueFrom(
      store.dispatch(
        new SyncAction.LocalDataHydrated({
          tasks: [stored],
          tags: [],
          outbox: [],
          syncedRevision: 1,
        }),
      ),
    );

    expect(store.selectSnapshot(TasksState.allTasks)[0]?.checklist).toEqual(checklist);
    expect(prompts.prompt()).toBeNull();

    const fromAnotherDevice: Task = {
      ...stored,
      checklist: [{ id: 'a', text: 'Buy cat food', completed: true }],
      modifiedAt: '2024-06-05T10:00:00.000Z',
    };
    await firstValueFrom(
      store.dispatch(
        new SyncAction.ServerChangesLoaded([
          {
            entity: EChangedEntity.Task,
            action: EChangeAction.Updated,
            object: fromAnotherDevice,
          },
        ]),
      ),
    );

    expect(store.selectSnapshot(TasksState.allTasks)[0]?.checklist).toEqual(
      fromAnotherDevice.checklist,
    );
    expect(store.selectSnapshot(TasksState.allTasks)[0]?.status).toBe(ETaskStatus.Todo);
    expect(prompts.prompt()).toBeNull();
  });

  it('enqueues an offline checklist edit for later synchronization', async () => {
    const localStore = TestBed.inject(LocalStore);
    const save = jest.spyOn(localStore, 'saveTaskAndEnqueue');
    const checklist = [
      { id: 'a', text: 'Buy cat food', completed: true },
      { id: 'b', text: 'Check salmon variant', completed: false },
    ];

    await firstValueFrom(
      store.dispatch(
        new TasksAction.UpdateTask({
          taskId: existing.id,
          changes: { checklist },
        }),
      ),
    );

    expect(save).toHaveBeenCalledTimes(1);
    const [savedTask, entry] = save.mock.calls[0] ?? [];
    expect(savedTask?.checklist).toEqual(checklist);
    expect(savedTask?.status).toBe(ETaskStatus.Todo);
    expect(entry?.change.action).toBe(EChangeAction.Updated);
    expect(entry?.change.object).toMatchObject({ id: existing.id, checklist });
  });
});

describe('TasksState when the device store rejects the write', () => {
  it('does not add the task', async () => {
    const localStore = {
      saveTaskAndEnqueue: jest.fn().mockRejectedValue(new Error('disk')),
    };
    TestBed.configureTestingModule({
      providers: [
        provideStore([TasksState, UserState]),
        { provide: AuthService, useValue: {} },
        { provide: SlackService, useValue: {} },
        { provide: LocalStore, useValue: localStore },
      ],
    });
    const store = TestBed.inject(Store);
    store.reset({
      tasks: { entities: [] },
      user: {
        userData: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          userId,
          googleId: 'g-1',
        },
        authState: EUserAuthState.Authenticated,
        authType: undefined,
        integrations: { isAddedToSlack: undefined },
      },
    });

    await firstValueFrom(store.dispatch(new TasksAction.CreateTask({ title: 'Nope' }, userId)));

    expect(localStore.saveTaskAndEnqueue).toHaveBeenCalledTimes(1);
    expect(store.selectSnapshot(TasksState.allTasks)).toEqual([]);
  });
});
