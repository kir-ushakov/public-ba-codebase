import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector, Store } from '@ngxs/store';
import { Task, ETaskStatus, ETaskType } from 'src/app/shared/models/task.model';
import { MbTaskScreenAction } from './mb-task-screen.actions';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { UserState } from 'src/app/shared/state/user.state';
import { AppAction } from 'src/app/shared/state/app.actions';
import { UpdateFormValue } from '@ngxs/form-plugin';

export enum ETaskViewMode {
  Create = 'CreateTaskMode',
  Edit = 'EditTaskMode',
  View = 'ViewTaskMode',
}

export interface IEditTaskFormData {
  title: string;
}

export interface IEditTaskData extends IEditTaskFormData {
  type: ETaskType;
  status: ETaskStatus;
}

export interface IMbTaskScreenStateModel {
  mode: ETaskViewMode;
  taskId: string | undefined;
  editTaskData: IEditTaskData;
  taskViewForm: {
    model: IEditTaskFormData;
  };
}

const defaults = {
  mode: ETaskViewMode.Create,
  taskViewForm: {
    model: {
      title: '',
    } as IEditTaskFormData,
  },
  taskId: undefined,
  editTaskData: {
    type: ETaskType.Basic,
    title: '',
    status: ETaskStatus.Todo,
  },
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
  static task(
    state: IMbTaskScreenStateModel,
    allTasks: Array<Task>
  ): IEditTaskFormData {
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
    const state: IMbTaskScreenStateModel = ctx.getState();
    const taskData: IEditTaskData = {
      ...state.editTaskData,
      ...state.taskViewForm.model,
    };
    if (ctx.getState().mode === ETaskViewMode.Create) {
      const userId: string = this.store.selectSnapshot(UserState.userId);
      ctx.dispatch(new MbTaskScreenAction.CreateTask(taskData, userId));
      ctx.dispatch(MbTaskScreenAction.Close);
    } else {
      const taskId: string | number = ctx.getState().taskId;
      ctx.dispatch(new MbTaskScreenAction.UpdateTask(taskData, taskId));
      ctx.patchState({ mode: ETaskViewMode.View });
    }
  }

  @Action(MbTaskScreenAction.EditTaskOptionSelected)
  editTask(ctx: StateContext<IMbTaskScreenStateModel>) {
    const task = this.store.selectSnapshot(MbTaskScreenState.task);
    ctx.patchState({ mode: ETaskViewMode.Edit });

    ctx.dispatch(
      new UpdateFormValue({
        path: 'mbTaskViewState.taskViewForm',
        value: task,
      })
    );
  }

  @Action(MbTaskScreenAction.CompleteTaskOptionSelected)
  completeTask(ctx: StateContext<IMbTaskScreenStateModel>) {
    const taskId: string | number = ctx.getState().taskId;
    const taskUpdateData: IEditTaskData = ctx.getState().editTaskData;
    taskUpdateData.status = ETaskStatus.Done;
    ctx.dispatch(new MbTaskScreenAction.UpdateTask(taskUpdateData, taskId));
    ctx.dispatch(MbTaskScreenAction.Close);
  }

  @Action(MbTaskScreenAction.CancelTaskOptionSelected)
  cancelTask(ctx: StateContext<IMbTaskScreenStateModel>) {
    const taskId: string | number = ctx.getState().taskId;
    const taskUpdateData: IEditTaskData = ctx.getState().editTaskData;
    taskUpdateData.status = ETaskStatus.Cancel;
    ctx.dispatch(new MbTaskScreenAction.UpdateTask(taskUpdateData, taskId));
    ctx.dispatch(MbTaskScreenAction.Close);
  }

  @Action(MbTaskScreenAction.DeleteTaskOptionSelected)
  deleteTask(ctx: StateContext<IMbTaskScreenStateModel>) {
    ctx.dispatch(new MbTaskScreenAction.DeleteTask(ctx.getState().taskId));
    ctx.dispatch(AppAction.NavigateToHomeScreen);
  }

  @Action(MbTaskScreenAction.CancelButtonPressed)
  cancelChanges(ctx: StateContext<IMbTaskScreenStateModel>) {
    ctx.dispatch(MbTaskScreenAction.Close);
  }

  @Action(MbTaskScreenAction.Close)
  close(ctx: StateContext<IMbTaskScreenStateModel>) {
    ctx.setState(defaults);
  }

  @Action(MbTaskScreenAction.HomeButtonPressed)
  homeButtonPressed(ctx: StateContext<IMbTaskScreenStateModel>) {
    ctx.dispatch(AppAction.NavigateToHomeScreen);
  }
}
