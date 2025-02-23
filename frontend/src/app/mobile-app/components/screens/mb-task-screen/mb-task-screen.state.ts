import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector, Store } from '@ngxs/store';
import {
  Task,
  ETaskStatus,
  defaultTask,
} from 'src/app/shared/models/task.model';
import { MbTaskScreenAction } from './mb-task-screen.actions';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { UserState } from 'src/app/shared/state/user.state';
import { AppAction } from 'src/app/shared/state/app.actions';
import { UpdateFormValue } from '@ngxs/form-plugin';
import { DeviceCameraService } from 'src/app/shared/services/pwa/device-camera.service';

export enum ETaskViewMode {
  Create = 'TASK_VIEW_MODE_CREATE',
  Edit = 'TASK_VIEW_MODE_EDIT',
  View = 'TASK_VIEW_MODE_VIEW',
}

export interface IEditTaskFormData {
  title: string;
}

export interface IMbTaskScreenStateModel {
  mode: ETaskViewMode;
  taskData: Task;
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
  taskData: defaultTask,
};

@State<IMbTaskScreenStateModel>({
  name: 'mbTaskViewState',
  defaults: defaults,
})
@Injectable()
export class MbTaskScreenState {
  static readonly FORM_PATH = 'mbTaskViewState.taskViewForm';

  constructor(
    private _store: Store,
    private _deviceCameraService: DeviceCameraService
  ) {}

  @Selector()
  static mode(state: IMbTaskScreenStateModel): ETaskViewMode {
    return state.mode;
  }

  @Selector([TasksState.allTasks])
  static task(state: IMbTaskScreenStateModel): Task {
    return state.taskData;
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
    return state.mode === ETaskViewMode.View ? true : false;
  }

  @Selector()
  static imageUri(state: IMbTaskScreenStateModel): string {
    return state.taskData.imageUri;
  }

  @Action(MbTaskScreenAction.Opened)
  opened(ctx: StateContext<IMbTaskScreenStateModel>, { mode, taskId }) {
    ctx.patchState({ mode: mode });
    if (taskId) {
      const actualTasks: Task[] = this._store.selectSnapshot(
        TasksState.actualTasks
      );
      const selectedTask = actualTasks.find((t) => t.id === taskId) ?? defaultTask;
      ctx.patchState({ taskData: selectedTask });
    }
  }

  @Action(MbTaskScreenAction.ApplyButtonPressed)
  applyButtonPressed(ctx: StateContext<IMbTaskScreenStateModel>) {
    ctx.patchState({
      taskData: {
        ...ctx.getState().taskData,
        ...ctx.getState().taskViewForm.model,
      },
    });

    if (ctx.getState().mode === ETaskViewMode.Create) {
      const userId: string = this._store.selectSnapshot(UserState.userId);
      ctx.dispatch(
        new MbTaskScreenAction.CreateTask(ctx.getState().taskData, userId)
      );
      ctx.dispatch(MbTaskScreenAction.Close);
    } else {
      ctx.dispatch(new MbTaskScreenAction.UpdateTask(ctx.getState().taskData));
      ctx.patchState({ mode: ETaskViewMode.View });
    }
  }

  @Action(MbTaskScreenAction.EditTaskOptionSelected)
  editTask(ctx: StateContext<IMbTaskScreenStateModel>) {
    const task = this._store.selectSnapshot(MbTaskScreenState.task);
    ctx.patchState({ 
      mode: ETaskViewMode.Edit, 
      taskData: { ...task } 
    });
    ctx.dispatch(
      new UpdateFormValue({
        path: MbTaskScreenState.FORM_PATH,
        value: { title: task.title },
      })
    );
  }

  @Action(MbTaskScreenAction.CompleteTaskOptionSelected)
  completeTask(ctx: StateContext<IMbTaskScreenStateModel>) {
    const taskUpdateData: Task = { ...ctx.getState().taskData, status: ETaskStatus.Done };
    ctx.dispatch(new MbTaskScreenAction.UpdateTask(taskUpdateData));
    ctx.dispatch(MbTaskScreenAction.Close);
  }

  @Action(MbTaskScreenAction.CancelTaskOptionSelected)
  cancelTask(ctx: StateContext<IMbTaskScreenStateModel>) {
    const taskUpdateData: Task = ctx.getState().taskData;
    taskUpdateData.status = ETaskStatus.Cancel;
    ctx.dispatch(new MbTaskScreenAction.UpdateTask(taskUpdateData));
    ctx.dispatch(MbTaskScreenAction.Close);
  }

  @Action(MbTaskScreenAction.DeleteTaskOptionSelected)
  deleteTask(ctx: StateContext<IMbTaskScreenStateModel>) {
    ctx.dispatch(new MbTaskScreenAction.DeleteTask(ctx.getState().taskData.id));
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

  @Action(MbTaskScreenAction.AddPictureBtnPressed)
  async selectPictureFromDevice(ctx: StateContext<IMbTaskScreenStateModel>) {
    const imageUri: string = await this._deviceCameraService.takePicture();

    const state: IMbTaskScreenStateModel = ctx.getState();
    const taskData: Task = {
      ...state.taskData,
      imageUri: imageUri,
    };

    ctx.patchState({ taskData: taskData });
  }
}
