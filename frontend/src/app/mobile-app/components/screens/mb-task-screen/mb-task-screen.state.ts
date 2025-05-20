import { inject, Injectable } from '@angular/core';
import type { StateContext } from '@ngxs/store';
import { State, Action, Selector, Store } from '@ngxs/store';
import type { Task } from 'src/app/shared/models/task.model';
import { ETaskStatus, defaultTask } from 'src/app/shared/models/task.model';
import { MbTaskScreenAction } from './mb-task-screen.actions';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { UserState } from 'src/app/shared/state/user.state';
import { AppAction } from 'src/app/shared/state/app.actions';
import { DeviceCameraService } from 'src/app/shared/services/pwa/device-camera.service';
import { SpeechToTextService } from 'src/app/shared/services/api/speech-to-text.service';
import { VoiceRecorderService } from 'src/app/shared/services/pwa/voice-recorder.service';
import { firstValueFrom } from 'rxjs';
import type { ITaskEditFormData } from './mb-task-edit/mb-task-edit.component.interface';

export enum ETaskViewMode {
  Create = 'TASK_VIEW_MODE_CREATE',
  Edit = 'TASK_VIEW_MODE_EDIT',
  View = 'TASK_VIEW_MODE_VIEW',
}

export interface IMbTaskScreenStateModel {
  mode: ETaskViewMode;
  taskData: Task;
  taskViewForm: {
    formData: ITaskEditFormData;
    status: boolean;
  };
  isSideMenuOpened: boolean;
}

const defaults = {
  mode: ETaskViewMode.Create,
  taskViewForm: {
    formData: {
      title: '',
    },
    status: false,
  },
  taskData: defaultTask,
  isSideMenuOpened: false,
};

@State<IMbTaskScreenStateModel>({
  name: 'mbTaskViewState',
  defaults: defaults,
})
@Injectable()
export class MbTaskScreenState {
  private readonly store = inject(Store);
  private readonly deviceCameraService = inject(DeviceCameraService);
  private readonly voiceRecorderService = inject(VoiceRecorderService);
  private readonly speechToTextService = inject(SpeechToTextService);

  @Selector()
  static mode(state: IMbTaskScreenStateModel): ETaskViewMode {
    return state.mode;
  }

  @Selector()
  static task(state: IMbTaskScreenStateModel): Task {
    return state.taskData;
  }

  @Selector()
  static showCompleteTaskBtn(state: IMbTaskScreenStateModel): boolean {
    if (state.mode === ETaskViewMode.View && state.taskData.status === ETaskStatus.Todo) {
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

  @Selector()
  static isSideMenuOpened(state: IMbTaskScreenStateModel): boolean {
    return state.isSideMenuOpened;
  }

  @Selector()
  static isEditFormValid(state: IMbTaskScreenStateModel): boolean {
    return state.taskViewForm.status;
  }

  @Action(MbTaskScreenAction.Opened)
  opened(ctx: StateContext<IMbTaskScreenStateModel>, { mode, taskId }): void {
    ctx.patchState({ mode: mode });
    if (taskId) {
      const actualTasks: Task[] = this.store.selectSnapshot(TasksState.actualTasks);
      const selectedTask = actualTasks.find(t => t.id === taskId) ?? defaultTask;
      ctx.patchState({ taskData: selectedTask });
    }
  }

  @Action(MbTaskScreenAction.ApplyButtonPressed)
  applyButtonPressed(ctx: StateContext<IMbTaskScreenStateModel>): void {
    const state = ctx.getState();
    ctx.patchState({
      taskData: {
        ...state.taskData,
        ...state.taskViewForm.formData,
      },
    });

    if (ctx.getState().mode === ETaskViewMode.Create) {
      const userId: string = this.store.selectSnapshot(UserState.userId);
      ctx.dispatch(new MbTaskScreenAction.CreateTask(ctx.getState().taskData, userId));
      ctx.dispatch(MbTaskScreenAction.Close);
    } else {
      ctx.dispatch(new MbTaskScreenAction.UpdateTask(ctx.getState().taskData));
      ctx.patchState({ mode: ETaskViewMode.View });
    }
  }

  @Action(MbTaskScreenAction.EditTaskOptionSelected)
  editTask(ctx: StateContext<IMbTaskScreenStateModel>): void {
    const task = this.store.selectSnapshot(MbTaskScreenState.task);

    ctx.patchState({
      mode: ETaskViewMode.Edit,
      taskData: { ...task },
      taskViewForm: {
        ...ctx.getState().taskViewForm,
        formData: { title: task.title },
      },
    });
  }

  @Action(MbTaskScreenAction.CompleteTaskOptionSelected)
  completeTask(ctx: StateContext<IMbTaskScreenStateModel>): void {
    const taskUpdateData: Task = { ...ctx.getState().taskData, status: ETaskStatus.Done };
    this.updateAndClose(ctx, taskUpdateData);
  }

  @Action(MbTaskScreenAction.CancelTaskOptionSelected)
  cancelTask(ctx: StateContext<IMbTaskScreenStateModel>): void {
    const task = ctx.getState().taskData;
    const taskUpdateData: Task = { ...task, status: ETaskStatus.Cancel };
    this.updateAndClose(ctx, taskUpdateData);
  }

  @Action(MbTaskScreenAction.DeleteTaskOptionSelected)
  deleteTask(ctx: StateContext<IMbTaskScreenStateModel>): void {
    ctx.dispatch(new MbTaskScreenAction.DeleteTask(ctx.getState().taskData.id));
    ctx.dispatch(AppAction.NavigateToHomeScreen);
  }

  @Action(MbTaskScreenAction.CancelButtonPressed)
  cancelChanges(ctx: StateContext<IMbTaskScreenStateModel>): void {
    ctx.dispatch(MbTaskScreenAction.Close);
  }

  @Action(MbTaskScreenAction.Close)
  close(ctx: StateContext<IMbTaskScreenStateModel>): void {
    ctx.setState(defaults);
  }

  @Action(MbTaskScreenAction.HomeButtonPressed)
  homeButtonPressed(ctx: StateContext<IMbTaskScreenStateModel>): void {
    ctx.dispatch([MbTaskScreenAction.Close, AppAction.NavigateToHomeScreen]);
  }

  @Action(MbTaskScreenAction.AddPictureBtnPressed)
  async selectPictureFromDevice(ctx: StateContext<IMbTaskScreenStateModel>): Promise<void> {
    const imageUri: string = await this.deviceCameraService.takePicture();

    const state: IMbTaskScreenStateModel = ctx.getState();
    const taskData: Task = {
      ...state.taskData,
      imageUri: imageUri,
    };

    ctx.patchState({ taskData: taskData });
  }

  @Action(MbTaskScreenAction.SideMenuToggle)
  sideMenuToggled(ctx: StateContext<IMbTaskScreenStateModel>): void {
    const isSideMenuOpened = ctx.getState().isSideMenuOpened;
    ctx.patchState({
      isSideMenuOpened: !isSideMenuOpened,
    });
  }

  @Action(MbTaskScreenAction.UpdateFormData)
  updateFormDate(
    ctx: StateContext<IMbTaskScreenStateModel>,
    { valid, formData }: { valid: boolean; formData: ITaskEditFormData },
  ): void {
    ctx.patchState({
      taskViewForm: {
        formData: formData,
        status: valid,
      },
    });
  }

  @Action(MbTaskScreenAction.StartVoiceRecording)
  async startVoiceRecording(): Promise<void> {
    if (this.voiceRecorderService.isRecording) {
      return;
    }
    await this.voiceRecorderService.startRecording();
  }

  @Action(MbTaskScreenAction.StopVoiceRecording)
  async stopVoiceRecording(ctx: StateContext<IMbTaskScreenStateModel>): Promise<void> {
    try {
      if (!this.voiceRecorderService.isRecording) {
        return;
      }
      const record: Blob = await this.voiceRecorderService.stopRecording();
      const result = await firstValueFrom(this.speechToTextService.uploadAudio(record));
      ctx.dispatch(new MbTaskScreenAction.VoiceConvertedToTextSuccessful(result.transcript));
    } catch (error) {
      console.error(error);
      ctx.dispatch(new AppAction.ShowErrorInUI('Voice record failed'));
    }
  }

  @Action(MbTaskScreenAction.CancelVoiceRecording)
  async cancelVoiceRecording(): Promise<void> {
    if (!this.voiceRecorderService.isRecording) {
      return;
    }
    await this.voiceRecorderService.stopRecording();
  }

  private updateAndClose(ctx: StateContext<IMbTaskScreenStateModel>, updated: Task): void {
    ctx.dispatch([new MbTaskScreenAction.UpdateTask(updated), MbTaskScreenAction.Close]);
  }
}
