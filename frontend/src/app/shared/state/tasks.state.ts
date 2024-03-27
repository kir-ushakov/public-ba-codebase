import { State, Action, StateContext, Selector } from '@ngxs/store';
import { Injectable } from '@angular/core';
import {
  patch,
  append,
  updateItem,
  iif,
  insertItem,
  removeItem,
} from '@ngxs/store/operators';
import { v4 as uuidv4 } from 'uuid';
import {
  Task,
  ETaskStatus,
  ETaskType,
  Change,
  EChangeAction,
  EChangedEntity,
} from 'src/app/shared/models/';
import { SyncStateAction } from './sync.actions';
import { UserState } from './user.state';
import { MbTaskScreenAction } from 'src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.actions';
import { IChangeableObject } from '../models/change.model';

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

  constructor() {}

  @Selector([UserState.userId])
  static allTasks(state: ITasksStateModel, userId: string): Array<Task> {
    return state.entities
      .filter((e) => e.userId === userId)
      .sort((a, b) => {
        if (a.createdAt > b.createdAt) {
          return -1;
        } else {
          return 1;
        }
      });
  }

  @Selector([TasksState.allTasks])
  static actualTasks(
    state: ITasksStateModel,
    allTasks: Array<Task>
  ): Array<Task> {
    return allTasks.filter((t) => TasksState.actualStatuses.includes(t.status));
  }

  @Action(MbTaskScreenAction.CreateTask)
  createTask(
    ctx: StateContext<ITasksStateModel>,
    { taskInitData, userId }: { taskInitData: Task; userId: string }
  ): void {
    const createdTask: Task = {
      type: ETaskType.Basic,
      userId: userId,
      id: uuidv4(),
      title: taskInitData.title,
      status: ETaskStatus.Todo,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    ctx.setState(
      patch({
        entities: append([createdTask]),
      })
    );

    ctx.dispatch(
      new SyncStateAction.ChangeOccurred({
        entity: EChangedEntity.Task,
        action: EChangeAction.Created,
        object: createdTask as Task,
        modifiedAt: new Date().toISOString(),
      } as Change)
    );
  }

  @Action(MbTaskScreenAction.UpdateTask)
  updateTask(
    ctx: StateContext<ITasksStateModel>,
    { taskUpdateData, taskId }: { taskUpdateData: Task; taskId: string }
  ) {
    ctx.setState(
      patch({
        entities: updateItem(
          (task) => task.id === taskId,
          patch({ ...taskUpdateData })
        ),
      })
    );

    const updatedTask: Task = ctx
      .getState()
      .entities.find((t) => t.id === taskId);

    ctx.dispatch(
      new SyncStateAction.ChangeOccurred({
        entity: EChangedEntity.Task,
        action: EChangeAction.Updated,
        object: updatedTask,
        modifiedAt: new Date().toISOString(),
      } as Change)
    );
  }

  @Action(MbTaskScreenAction.DeleteTask)
  delete(ctx: StateContext<ITasksStateModel>, { taskId }: { taskId: string }) {
    ctx.setState(
      patch({
        entities: removeItem<Task>((task) => task.id === taskId),
      })
    );
    const change: Change = {
      entity: EChangedEntity.Task,
      action: EChangeAction.Deleted,
      modifiedAt: new Date().toISOString(),
    };
    ctx.dispatch(new SyncStateAction.ChangeOccurred(change));
  }

  @Action(SyncStateAction.SynchronizeEntity)
  synchronize(
    ctx: StateContext<ITasksStateModel>,
    { type, entity }: { type: EChangedEntity; entity: IChangeableObject }
  ): void {
    if (type !== EChangedEntity.Task) return;
    const task = entity as Task;
    ctx.setState(
      patch({
        entities: iif<Array<Task>>(
          (tasks) => tasks.some((t) => t.id === task.id),
          updateItem((t) => t.id === task.id, patch(task)),
          insertItem(task)
        ),
      })
    );
  }
}
