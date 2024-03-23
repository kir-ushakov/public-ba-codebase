import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector, Store } from '@ngxs/store';
import { Task, ETaskStatus, ETaskType } from 'src/app/shared/models/task.model';
import { MbTaskScreenAction } from './mb-task-screen.actions';
import { TasksAction } from 'src/app/shared/state/tasks.actions';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { UserState } from 'src/app/shared/state/user.state';
import { AppAction } from 'src/app/shared/state/app.actions';
import { UpdateFormValue } from '@ngxs/form-plugin';

export enum ETaskViewMode {
  Create = 'CreateTaskMode',
  Edit = 'EditTaskMode',
  View = 'ViewTaskMode',
}

export interface IMbTaskScreenStateModel {
  mode: ETaskViewMode;
  taskId: string | undefined;
  taskViewForm: {
    model: Task;
  };
}

const defaults = {
  mode: ETaskViewMode.Create,
  taskViewForm: {
    model: {
      type: ETaskType.Basic,
      title: '',
      status: ETaskStatus.Todo,
    } as Task,
  },
  taskId: null,
};

@State<IMbTaskScreenStateModel>({
  name: 'mbTaskViewState',
  defaults: defaults,
})
@Injectable()
export class MbTaskScreenState {
  constructor(private store: Store) {}

  @Selector()
  static mode(state: IMbTaskScreenStateModel): ETaskViewMode {
    return state.mode;
  }

  @Selector([TasksState.allTasks])
  static task(state: IMbTaskScreenStateModel, allTasks: Array<Task>): Task {
    if (state.mode !== ETaskViewMode.Create) {
      return allTasks.find((t) => t.id === state.taskId);
    }
    return state.taskViewForm.model;
  }

  @Selector([MbTaskScreenState.task])
  static showCompleteTaskBtn(state: IMbTaskScreenStateModel, task: Task) {
    if (state.mode === ETaskViewMode.View && task.status === ETaskStatus.Todo) {
      return true;
    }
    return false;
  }

  @Selector()
  static showToggleOptionsBtn(state: IMbTaskScreenStateModel): boolean {
    return state.mode == ETaskViewMode.View ? true : false;
  }

  @Action(MbTaskScreenAction.Opened)
  opened(ctx: StateContext<IMbTaskScreenStateModel>, { mode, taskId }) {
    ctx.patchState({ mode: mode });
    if (mode === ETaskViewMode.View && taskId) {
      ctx.patchState({ taskId: taskId });
    }
  }

  @Action(MbTaskScreenAction.ApplyButtonPressed)
  applyButtonPressed(ctx: StateContext<IMbTaskScreenStateModel>) {
    if (ctx.getState().mode === ETaskViewMode.Create) {
      ctx.dispatch(MbTaskScreenAction.CreateTask);
    } else {
      ctx.dispatch(MbTaskScreenAction.EditTask);
    }
  }

  @Action(MbTaskScreenAction.EditTaskOptionSelected)
  editTaskOptionSelected(ctx: StateContext<IMbTaskScreenStateModel>) {
    ctx.patchState({ mode: ETaskViewMode.Edit });
    const task = this.store.selectSnapshot(MbTaskScreenState.task);
    ctx.dispatch(
      new UpdateFormValue({
        path: 'mbTaskViewState.taskViewForm',
        value: {
          title: task.title,
        },
      })
    );
  }

  @Action(MbTaskScreenAction.CreateTask)
  createNewTask(ctx: StateContext<IMbTaskScreenStateModel>) {
    const userId: string = this.store.selectSnapshot(UserState.userId);
    ctx.dispatch(
      new TasksAction.Create(ctx.getState().taskViewForm.model, userId)
    );
    ctx.dispatch(MbTaskScreenAction.Close);
  }

  @Action(MbTaskScreenAction.CancelButtonPressed)
  cancelChanges(ctx: StateContext<IMbTaskScreenStateModel>) {
    ctx.dispatch(MbTaskScreenAction.Close);
  }

  @Action(MbTaskScreenAction.Close)
  close(ctx: StateContext<IMbTaskScreenStateModel>) {
    ctx.setState(defaults);
  }

  @Action(MbTaskScreenAction.EditTask)
  editTask(ctx: StateContext<IMbTaskScreenStateModel>) {
    const taskId: string | number = ctx.getState().taskId;
    const taskData: Task = ctx.getState().taskViewForm.model;
    ctx.dispatch(new TasksAction.Update(taskData, taskId));
    ctx.patchState({ mode: ETaskViewMode.View });
  }

  @Action(MbTaskScreenAction.CompleteTaskOptionSelected)
  completeTask(ctx: StateContext<IMbTaskScreenStateModel>) {
    const taskId: string | number = ctx.getState().taskId;
    ctx.dispatch(new TasksAction.ChangeStatus(taskId, ETaskStatus.Done));
    ctx.dispatch(MbTaskScreenAction.Close);
  }

  @Action(MbTaskScreenAction.CancelTaskOptionSelected)
  cancelTask(ctx: StateContext<IMbTaskScreenStateModel>) {
    const taskId: string | number = ctx.getState().taskId;
    ctx.dispatch(new TasksAction.ChangeStatus(taskId, ETaskStatus.Cancel));
    ctx.dispatch(MbTaskScreenAction.Close);
  }

  @Action(MbTaskScreenAction.DeleteTaskOptionSelected)
  deleteTask(ctx: StateContext<IMbTaskScreenStateModel>) {
    ctx.dispatch(new TasksAction.Delete(ctx.getState().taskId));
    ctx.dispatch(AppAction.NavigateToHomeScreen);
  }

  @Action(MbTaskScreenAction.HomeButtonPressed)
  homeButtonPressed(ctx: StateContext<IMbTaskScreenStateModel>) {
    ctx.dispatch(AppAction.NavigateToHomeScreen);
  }
}
