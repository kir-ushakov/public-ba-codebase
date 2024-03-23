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
import { TasksAction } from './tasks.actions';
import { TaskSerivce } from 'src/app/shared/serivces/task.service';
import { Task, ETaskStatus } from 'src/app/shared/models/task.model';
import { Change, EChangeAction, EChangedEntity } from '../models/change.model';
import { SyncStateAction } from './sync.actions';
import { UserState } from './user.state';

const actualStatuses: Array<ETaskStatus> = [ETaskStatus.Todo];

interface ITasksStateModel {
  entities: Array<Task>;
}
/**
 * #NOTE
 * The task state is not tied to a specific component.
 * It contains task objects that are used in different places in the project.
 * Thus, it can be considered as an application level state.
 */
@State<ITasksStateModel>({
  name: 'tasks',
  defaults: {
    entities: [],
  },
})
@Injectable()
export class TasksState {
  constructor(private taskSerivce: TaskSerivce) {}

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
    return allTasks.filter((t) => actualStatuses.includes(t.status));
  }

  @Action(TasksAction.Create)
  createTask(
    ctx: StateContext<ITasksStateModel>,
    { taskInitData, userId }: { taskInitData: Task; userId: string }
  ): void {
    const createdTask: Task = this.taskSerivce.createTask(taskInitData, userId);

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

  @Action(TasksAction.Update)
  updateTask(
    ctx: StateContext<ITasksStateModel>,
    { taskEditedData, taskId }: { taskEditedData: Task; taskId: string }
  ) {
    const updatedTask: Task = ctx
      .getState()
      .entities.find((t) => t.id === taskId);
    const editedTask = this.taskSerivce.editTask(taskEditedData, updatedTask);
    ctx.setState(
      patch({
        entities: updateItem(
          (task) => task.id === editedTask.id,
          patch(editedTask)
        ),
      })
    );

    ctx.dispatch(
      new SyncStateAction.ChangeOccurred({
        entity: EChangedEntity.Task,
        action: EChangeAction.Updated,
        object: updatedTask,
        modifiedAt: new Date().toISOString(),
      } as Change)
    );
  }

  @Action(TasksAction.Delete)
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

  @Action(TasksAction.ChangeStatus)
  changeStatus(
    ctx: StateContext<ITasksStateModel>,
    { taskId, status }: TasksAction.ChangeStatus
  ): void {
    ctx.setState(
      patch({
        entities: updateItem<Task>(
          (t) => t.id === taskId,
          patch({
            status,
            modifiedAt: new Date().toISOString(),
          })
        ),
      })
    );
    const task: Task = ctx.getState().entities.find((t) => t.id == taskId);
    ctx.dispatch(new TasksAction.Update(task, taskId as string));
  }

  @Action(TasksAction.Synchronize)
  synchronize(
    ctx: StateContext<ITasksStateModel>,
    { task }: TasksAction.Synchronize
  ): void {
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
