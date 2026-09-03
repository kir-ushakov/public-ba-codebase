import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { firstValueFrom } from 'rxjs';
import { ETaskStatus, ETaskType, Task } from 'src/app/shared/models/task.model';
import { AuthService } from 'src/app/shared/services/api/auth.service';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { SyncAction } from 'src/app/shared/state/sync.action';
import { TasksAction } from 'src/app/shared/state/tasks.action';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { EUserAuthState, UserState } from 'src/app/shared/state/user.state';

describe('TasksState', () => {
  let store: Store;

  const userId = 'user-1';
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
      store.dispatch(
        new TasksAction.CreateTask({ title: 'Fresh task title' } as Task, userId),
      ),
    );

    const all = store.selectSnapshot(TasksState.allTasks);
    expect(all).toHaveLength(2);
    expect(all[0]).toMatchObject({
      title: 'Fresh task title',
      userId,
      status: ETaskStatus.Todo,
    });
    expect(all[0].id).toBeTruthy();
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

    expect(store.selectSnapshot(TasksState.allTasks)[0].title).toBe('Renamed task title');
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
    expect(store.selectSnapshot(s => s.tasks.entities.find(t => t.id === existing.id)?.title)).toBe(
      'Title from server',
    );

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
});
