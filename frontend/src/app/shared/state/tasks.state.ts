import { State, Action, StateContext, Selector } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { patch, append, updateItem, iif, insertItem, removeItem } from '@ngxs/store/operators';
import { v4 as uuidv4 } from 'uuid';
import { Change, Task, ETaskStatus, ETaskType, TaskChanges } from 'src/app/shared/models/';
import { OutboxEntry } from '../models/outbox-entry.type';
import { LocalStore } from '../services/infrastructure/local-store.service';
import { UserAction } from './user.actions';
import { UserState } from './user.state';
import { AppAction } from './app.actions';
import { SyncAction } from './sync.action';
import { TasksAction, type TaskCreateInput } from './tasks.action';
import { isEmptyTaskDescription } from '../helpers/is-empty-task-description.function';

interface ITasksStateModel {
  entities: Array<Task>;
}

const SAVE_FAILED = 'Could not save the task on this device.';

@State<ITasksStateModel>({
  name: 'tasks',
  defaults: {
    entities: [],
  },
})
@Injectable()
export class TasksState {
  static readonly actualStatuses: Array<ETaskStatus> = [
    ETaskStatus.Todo,
    ETaskStatus.Active,
    ETaskStatus.Notes,
  ];

  constructor(private readonly localStore: LocalStore) {}

  @Selector([TasksState, UserState.userId])
  static allTasks(state: ITasksStateModel, userId: string | null): Array<Task> {
    return this.getSortedUserTasks(state, userId);
  }

  @Selector([TasksState, UserState.userId])
  static actualTasks(state: ITasksStateModel, userId: string | null): Array<Task> {
    return this.getSortedUserTasks(state, userId).filter(t =>
      TasksState.actualStatuses.includes(t.status),
    );
  }

  @Action(TasksAction.CreateTask)
  async createTask(
    ctx: StateContext<ITasksStateModel>,
    {
      taskInitData,
      userId,
    }: {
      taskInitData: TaskCreateInput;
      userId: string;
    },
  ): Promise<void> {
    const now = this.now();
    const newTask = this.createTaskEntity(taskInitData, userId, now);
    const entry = this.outboxEntry(newTask.id, EChangeAction.Created, newTask, now);

    try {
      await this.localStore.saveTaskAndEnqueue(newTask, entry);
    } catch {
      ctx.dispatch(new AppAction.ShowErrorInUI(SAVE_FAILED, 'Not saved'));
      return;
    }

    ctx.setState(
      patch({
        entities: append([newTask]),
      }),
    );
    ctx.dispatch(new AppAction.ClearErrorInUI());
    ctx.dispatch(new SyncAction.ChangeForSyncOccurred(entry));
  }

  @Action(TasksAction.UpdateTask)
  async updateTask(
    ctx: StateContext<ITasksStateModel>,
    { taskUpdateData }: { taskUpdateData: TaskChanges },
  ): Promise<void> {
    const current = ctx.getState().entities.find(task => task.id === taskUpdateData.taskId);
    if (!current) {
      return;
    }

    const now = this.now();
    const updated: Task = {
      ...current,
      ...taskUpdateData.changes,
      modifiedAt: now,
    };
    const entry = this.outboxEntry(updated.id, EChangeAction.Updated, updated, now);

    try {
      await this.localStore.saveTaskAndEnqueue(updated, entry);
    } catch {
      ctx.dispatch(new AppAction.ShowErrorInUI(SAVE_FAILED, 'Not saved'));
      return;
    }

    ctx.setState(
      patch({
        entities: updateItem(task => task.id === updated.id, patch(updated)),
      }),
    );
    ctx.dispatch(new AppAction.ClearErrorInUI());
    ctx.dispatch(new SyncAction.ChangeForSyncOccurred(entry));
  }

  @Action(TasksAction.DeleteTask)
  async delete(ctx: StateContext<ITasksStateModel>, { taskId }: { taskId: string }): Promise<void> {
    const existing = ctx.getState().entities.find(task => task.id === taskId);
    if (!existing) {
      return;
    }

    const now = this.now();
    const entry = this.outboxEntry(
      taskId,
      EChangeAction.Deleted,
      { id: taskId, modifiedAt: now },
      now,
    );

    try {
      await this.localStore.deleteTaskAndEnqueue(existing.userId, taskId, entry);
    } catch {
      ctx.dispatch(new AppAction.ShowErrorInUI(SAVE_FAILED, 'Not saved'));
      return;
    }

    ctx.setState(
      patch({
        entities: removeItem<Task>(task => task.id === taskId),
      }),
    );
    ctx.dispatch(new AppAction.ClearErrorInUI());
    ctx.dispatch(new SyncAction.ChangeForSyncOccurred(entry));
  }

  @Action(UserAction.LoggedOut)
  loggedOut(ctx: StateContext<ITasksStateModel>): void {
    ctx.setState({ entities: [] });
  }

  @Action(SyncAction.LocalDataHydrated)
  hydrate(ctx: StateContext<ITasksStateModel>, { snapshot }: SyncAction.LocalDataHydrated): void {
    ctx.setState({ entities: snapshot.tasks });
  }

  @Action(SyncAction.ServerChangesLoaded)
  synchronize(ctx: StateContext<ITasksStateModel>, { changes }: { changes: Change[] }): void {
    const taskChanges = changes.filter(c => c.entity === EChangedEntity.Task);
    for (const taskChange of taskChanges) {
      const changedObject = taskChange.object;
      if (!changedObject) {
        continue;
      }
      if (taskChange.action === EChangeAction.Deleted) {
        ctx.setState(
          patch({
            entities: removeItem<Task>(task => task.id === changedObject.id),
          }),
        );
      } else {
        const task = changedObject as Task;
        ctx.setState(
          patch({
            entities: iif<Array<Task>>(
              tasks => tasks.some(t => t.id === task.id),
              updateItem(t => t.id === task.id, patch(task)),
              insertItem(task),
            ),
          }),
        );
      }
    }
  }

  private outboxEntry(
    entityId: string,
    action: EChangeAction,
    object: OutboxEntry['change']['object'],
    modifiedAt: string,
  ): OutboxEntry {
    return {
      id: uuidv4(),
      entityId,
      change: {
        entity: EChangedEntity.Task,
        action,
        object,
        modifiedAt,
      },
    };
  }

  private createTaskEntity(taskInitData: TaskCreateInput, userId: string, timestamp: string): Task {
    const task: Task = {
      type: ETaskType.Basic,
      userId,
      id: uuidv4(),
      title: taskInitData.title,
      imageId: taskInitData.imageId,
      description: isEmptyTaskDescription(taskInitData.description)
        ? undefined
        : taskInitData.description,
      status: taskInitData.status ?? ETaskStatus.Todo,
      tagIds: taskInitData.tagIds ?? [],
      createdAt: timestamp,
      modifiedAt: timestamp,
    };

    if (taskInitData.images?.length) {
      task.images = taskInitData.images;
    }

    return task;
  }

  private static getSortedUserTasks(state: ITasksStateModel, userId: string | null): Task[] {
    return state.entities
      .filter(e => e.userId === userId)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
  }

  private now(): string {
    return new Date().toISOString();
  }
}
