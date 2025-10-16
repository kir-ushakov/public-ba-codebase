import { State, Action, StateContext, Selector } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { patch, append, updateItem, iif, insertItem, removeItem } from '@ngxs/store/operators';
import { v4 as uuidv4 } from 'uuid';
import {
  Task,
  ETaskStatus,
  ETaskType,
  Change,
  TaskChanges,
} from 'src/app/shared/models/';
import { UserState } from './user.state';
import { AppAction } from './app.actions';
import { SyncAction } from './sync.action';
import { TasksAction } from './tasks.action';

interface ITasksStateModel {
  entities: Array<Task>;
}

@State<ITasksStateModel>({
  name: 'tasks',
  defaults: {
    entities: [],
  },
})
@Injectable()
export class TasksState {
  static readonly actualStatuses: Array<ETaskStatus> = [ETaskStatus.Todo];

  @Selector([TasksState, UserState.userId])
  static allTasks(state: ITasksStateModel, userId: string): Array<Task> {
    return this.getSortedUserTasks(state, userId);
  }

  @Selector([TasksState, UserState.userId])
  static actualTasks(state: ITasksStateModel, userId: string): Array<Task> {
    return this.getSortedUserTasks(state, userId).filter(t =>
      TasksState.actualStatuses.includes(t.status),
    );
  }

  @Action(TasksAction.CreateTask)
  async createTask(
    ctx: StateContext<ITasksStateModel>,
    { taskInitData, userId }: { taskInitData: Task; userId: string },
  ): Promise<void> {
    try {
      const now = this.now();
      const newTask = this.createTaskEntity(taskInitData, userId, now);
      ctx.setState(
        patch({
          entities: append([newTask]),
        }),
      );

      ctx.dispatch(
        new SyncAction.ChangeForSyncOccurred({
          entity: EChangedEntity.Task,
          action: EChangeAction.Created,
          object: newTask,
          modifiedAt: now,
        } as Change),
      );
    } catch (error) {
      ctx.dispatch(new AppAction.ShowErrorInUI('Task creation failed.'));
    }
  }

  @Action(TasksAction.UpdateTask)
  updateTask(
    ctx: StateContext<ITasksStateModel>,
    { taskUpdateData }: { taskUpdateData: TaskChanges },
  ) {
    const now = this.now();

    ctx.setState(
      patch({
        entities: updateItem(
          task => task.id === taskUpdateData.taskId,
          patch({
            ...taskUpdateData.changes,
            modifiedAt: now,
          }),
        ),
      }),
    );

    const updatedTask: Task = ctx.getState().entities.find(t => t.id === taskUpdateData.taskId);

    ctx.dispatch(
      new SyncAction.ChangeForSyncOccurred({
        entity: EChangedEntity.Task,
        action: EChangeAction.Updated,
        object: updatedTask,
        modifiedAt: this.now(),
      } as Change),
    );
  }

  @Action(TasksAction.DeleteTask)
  delete(ctx: StateContext<ITasksStateModel>, { taskId }: { taskId: string }) {
    ctx.setState(
      patch({
        entities: removeItem<Task>(task => task.id === taskId),
      }),
    );

    const now = this.now();

    ctx.dispatch(
      new SyncAction.ChangeForSyncOccurred({
        entity: EChangedEntity.Task,
        action: EChangeAction.Deleted,
        object: { id: taskId, modifiedAt: now },
        modifiedAt: now,
      }),
    );
  }

  @Action(SyncAction.ServerChangesLoaded)
  synchronize(ctx: StateContext<ITasksStateModel>, { changes }: { changes: Change[] }): void {
    const taskChanges = changes.filter(c => c.entity === EChangedEntity.Task);
    for (const taskChange of taskChanges) {
      if (taskChange.action === EChangeAction.Deleted) {
        ctx.setState(
          patch({
            entities: removeItem<Task>(task => task.id === taskChange.object.id),
          }),
        );
      } else {
        const task = taskChange.object as Task;
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

  private createTaskEntity(taskInitData: Task, userId: string, timestamp: string): Task {
    return {
      type: ETaskType.Basic,
      userId,
      id: uuidv4(),
      title: taskInitData.title,
      imageId: taskInitData.imageId,
      status: ETaskStatus.Todo,
      createdAt: timestamp,
      modifiedAt: timestamp,
    };
  }

  private static getSortedUserTasks(state: ITasksStateModel, userId: string): Task[] {
    return state.entities
      .filter(e => e.userId === userId)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // descending order
      });
  }

  private now(): string {
    return new Date().toISOString();
  }
}
