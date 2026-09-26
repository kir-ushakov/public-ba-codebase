import { inject, Injectable } from '@angular/core';
import type { StateContext } from '@ngxs/store';
import { State, Action, Selector, Store } from '@ngxs/store';
import type { DefaultTask, Task } from 'src/app/shared/models/task.model';
import { ETaskStatus, defaultTask } from 'src/app/shared/models/task.model';
import { TaskScreenAction } from './task-screen.actions';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { UserState } from 'src/app/shared/state/user.state';
import { AppAction } from 'src/app/shared/state/app.actions';
import { DeviceCameraService } from 'src/app/shared/services/pwa/device-camera.service';
import type { ITaskEditFormData } from './task-edit/task-edit.component.interface';
import { TasksAction } from 'src/app/shared/state/tasks.action';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { VoiceInputAction } from 'src/app/shared/features/voice-input/state/voice-input.actions';
import { isEmptyTaskDescription } from 'src/app/shared/helpers/is-empty-task-description.function';

export enum ETaskViewMode {
  Create = 'TASK_VIEW_MODE_CREATE',
  Edit = 'TASK_VIEW_MODE_EDIT',
  View = 'TASK_VIEW_MODE_VIEW',
}

export type DraftTaskImage = {
  previewUrl?: string;
  imageId?: string;
};

export interface ITaskScreenStateModel {
  mode: ETaskViewMode;
  taskData: Task | DefaultTask;
  taskViewForm: {
    formData: ITaskEditFormData;
    status: boolean;
  };
  isSideMenuOpened: boolean;
  draftImages: DraftTaskImage[];
  coverDraftKey?: string;
}

const defaults: ITaskScreenStateModel = {
  mode: ETaskViewMode.Create,
  taskViewForm: {
    formData: {
      title: '',
      description: null,
    },
    status: false,
  },
  taskData: defaultTask,
  isSideMenuOpened: false,
  draftImages: [],
};

@State<ITaskScreenStateModel>({
  name: 'taskViewState',
  defaults: defaults,
})
@Injectable()
export class TaskScreenState {
  private readonly store = inject(Store);
  private readonly deviceCameraService = inject(DeviceCameraService);
  private readonly imageService = inject(ImageService);

  @Selector()
  static mode(state: ITaskScreenStateModel): ETaskViewMode {
    return state.mode;
  }

  @Selector()
  static task(state: ITaskScreenStateModel): Task | DefaultTask {
    return state.taskData;
  }

  @Selector()
  static showCompleteTaskBtn(state: ITaskScreenStateModel): boolean {
    if (state.mode === ETaskViewMode.View && state.taskData.status === ETaskStatus.Todo) {
      return true;
    }
    return false;
  }

  @Selector()
  static showToggleOptionsBtn(state: ITaskScreenStateModel): boolean {
    return state.mode === ETaskViewMode.View ? true : false;
  }

  @Selector()
  static draftImages(state: ITaskScreenStateModel): DraftTaskImage[] {
    return state.draftImages ?? [];
  }

  @Selector()
  static coverDraftKey(state: ITaskScreenStateModel): string | undefined {
    return state.coverDraftKey;
  }

  @Selector()
  static isSideMenuOpened(state: ITaskScreenStateModel): boolean {
    return state.isSideMenuOpened;
  }

  @Selector()
  static isEditFormValid(state: ITaskScreenStateModel): boolean {
    return state.taskViewForm?.status ?? false;
  }

  @Action(TaskScreenAction.Opened)
  opened(
    ctx: StateContext<ITaskScreenStateModel>,
    { mode, taskId }: TaskScreenAction.Opened,
  ): void {
    ctx.dispatch(new VoiceInputAction.Reset());
    ctx.setState({
      ...defaults,
      mode,
    });
    if (taskId) {
      const actualTasks: Task[] = this.store.selectSnapshot(TasksState.actualTasks);
      const selectedTask = actualTasks.find(t => t.id === taskId) ?? defaultTask;
      ctx.patchState({
        taskData: selectedTask,
        ...(mode === ETaskViewMode.Edit ? { draftImages: draftsFromTask(selectedTask) } : {}),
      });
    }
  }

  @Action(TaskScreenAction.ApplyButtonPressed)
  async applyButtonPressed(ctx: StateContext<ITaskScreenStateModel>): Promise<void> {
    const state = ctx.getState();

    const formData = state.taskViewForm.formData;
    const description = isEmptyTaskDescription(formData.description)
      ? undefined
      : (formData.description ?? undefined);

    ctx.patchState({
      taskData: {
        ...state.taskData,
        ...formData,
        description,
      },
    });
    if (state.mode === ETaskViewMode.Create) {
      await this.handleCreateTask(ctx);
    } else {
      await this.handleUpdateTask(ctx);
    }
  }

  private async handleCreateTask(ctx: StateContext<ITaskScreenStateModel>): Promise<void> {
    const { taskData, draftImages, coverDraftKey } = ctx.getState();
    const userId = this.store.selectSnapshot(UserState.userId);
    if (userId == null) {
      throw new Error('Cannot create a task without a user id');
    }

    const saved = await this.savedImagesFromDrafts(draftImages, taskData.imageId, coverDraftKey);
    const finalTaskData = { ...taskData, ...saved };

    ctx.patchState({ taskData: finalTaskData });
    ctx.dispatch(new TasksAction.CreateTask(finalTaskData, userId));
    ctx.dispatch(TaskScreenAction.Close);
  }

  private async handleUpdateTask(ctx: StateContext<ITaskScreenStateModel>): Promise<void> {
    const { taskData, draftImages, coverDraftKey } = ctx.getState();
    if (taskData.id == null) {
      return;
    }

    const saved = await this.savedImagesFromDrafts(draftImages, taskData.imageId, coverDraftKey);
    const changes = { ...taskData, ...saved };

    ctx.patchState({ taskData: changes });
    ctx.dispatch(
      new TasksAction.UpdateTask({
        taskId: taskData.id,
        changes,
      }),
    );
    ctx.patchState({ mode: ETaskViewMode.View });
  }

  @Action(TaskScreenAction.EditTaskOptionSelected)
  editTask(ctx: StateContext<ITaskScreenStateModel>): void {
    const task = this.store.selectSnapshot(TaskScreenState.task);

    ctx.patchState({
      mode: ETaskViewMode.Edit,
      taskData: { ...task },
      draftImages: draftsFromTask(task),
      coverDraftKey: undefined,
      taskViewForm: {
        ...ctx.getState().taskViewForm,
        formData: { title: task.title, description: task.description ?? null },
      },
    });
  }

  @Action(TaskScreenAction.CompleteTaskOptionSelected)
  completeTask(ctx: StateContext<ITaskScreenStateModel>): void {
    const taskUpdateData: Partial<Task> = { status: ETaskStatus.Done };
    this.updateAndClose(ctx, taskUpdateData);
  }

  @Action(TaskScreenAction.CancelTaskOptionSelected)
  cancelTask(ctx: StateContext<ITaskScreenStateModel>): void {
    const taskUpdateData: Partial<Task> = { status: ETaskStatus.Cancel };
    this.updateAndClose(ctx, taskUpdateData);
  }

  @Action(TaskScreenAction.DeleteTaskOptionSelected)
  deleteTask(ctx: StateContext<ITaskScreenStateModel>): void {
    const taskId = ctx.getState().taskData.id;
    if (taskId == null) {
      return;
    }
    ctx.dispatch(new TasksAction.DeleteTask(taskId));
    ctx.dispatch(AppAction.NavigateToHomeScreen);
  }

  @Action(TaskScreenAction.CancelButtonPressed)
  cancelChanges(ctx: StateContext<ITaskScreenStateModel>): void {
    ctx.dispatch(TaskScreenAction.Close);
  }

  @Action(TaskScreenAction.Close)
  close(ctx: StateContext<ITaskScreenStateModel>): void {
    ctx.dispatch(new VoiceInputAction.Reset());
    ctx.setState(defaults);
  }

  @Action(TaskScreenAction.HomeButtonPressed)
  homeButtonPressed(ctx: StateContext<ITaskScreenStateModel>): void {
    ctx.dispatch([TaskScreenAction.Close, AppAction.NavigateToHomeScreen]);
  }

  @Action(TaskScreenAction.AddPictureBtnPressed)
  async selectPictureFromDevice(ctx: StateContext<ITaskScreenStateModel>): Promise<void> {
    const imageUri = await this.deviceCameraService.takePicture();
    if (!imageUri) {
      return;
    }
    const draftImages = ctx.getState().draftImages ?? [];
    ctx.patchState({
      draftImages: [...draftImages, { previewUrl: imageUri }],
    });
  }

  @Action(TaskScreenAction.ImageSelectedAsCover)
  selectImageAsCover(
    ctx: StateContext<ITaskScreenStateModel>,
    { image }: TaskScreenAction.ImageSelectedAsCover,
  ): void {
    const key = image.imageId ?? image.previewUrl;
    if (!key) {
      return;
    }
    const drafts = ctx.getState().draftImages ?? [];
    const matches = drafts.some(draft => (draft.imageId ?? draft.previewUrl) === key);
    if (!matches) {
      return;
    }
    ctx.patchState({ coverDraftKey: key });
  }

  @Action(TaskScreenAction.DraftImageRemoved)
  removeDraftImage(
    ctx: StateContext<ITaskScreenStateModel>,
    { image }: TaskScreenAction.DraftImageRemoved,
  ): void {
    const removedKey = draftImageKey(image);
    if (!removedKey) {
      return;
    }
    const { draftImages, taskData, coverDraftKey } = ctx.getState();
    const drafts = draftImages ?? [];
    const removedIndex = drafts.findIndex(draft => draftImageKey(draft) === removedKey);
    if (removedIndex < 0) {
      return;
    }

    const nextDrafts = drafts.filter((_, index) => index !== removedIndex);
    const coverKey = activeCoverKey(drafts, taskData.imageId, coverDraftKey);
    ctx.patchState({
      draftImages: nextDrafts,
      coverDraftKey: coverKey === removedKey ? draftImageKey(nextDrafts[0]) : coverDraftKey,
    });
  }

  @Action(TaskScreenAction.SideMenuToggle)
  sideMenuToggled(ctx: StateContext<ITaskScreenStateModel>): void {
    const isSideMenuOpened = ctx.getState().isSideMenuOpened;
    ctx.patchState({
      isSideMenuOpened: !isSideMenuOpened,
    });
  }

  @Action(TaskScreenAction.UpdateFormData)
  updateFormDate(
    ctx: StateContext<ITaskScreenStateModel>,
    { valid, formData }: { valid: boolean; formData: ITaskEditFormData },
  ): void {
    ctx.patchState({
      taskViewForm: {
        formData: formData,
        status: valid,
      },
    });
  }

  private async savedImagesFromDrafts(
    drafts: DraftTaskImage[] | undefined,
    currentCoverId?: string,
    coverDraftKey?: string,
  ): Promise<{ imageId?: string; images?: string[] }> {
    const images: string[] = [];
    let selectedCoverId: string | undefined;

    for (const draft of drafts ?? []) {
      const id =
        draft.imageId ??
        (draft.previewUrl ? await this.imageService.saveImage(draft.previewUrl) : undefined);
      if (!id) {
        continue;
      }
      images.push(id);
      if (coverDraftKey && (draft.imageId ?? draft.previewUrl) === coverDraftKey) {
        selectedCoverId = id;
      }
    }

    if (images.length === 0) {
      return { imageId: undefined, images: [] };
    }

    const imageId =
      selectedCoverId ??
      (currentCoverId && images.includes(currentCoverId) ? currentCoverId : images[0]);

    return { imageId, images };
  }

  private updateAndClose(
    ctx: StateContext<ITaskScreenStateModel>,
    updatedTaskData: Partial<Task>,
  ): void {
    const taskId = ctx.getState().taskData.id;
    if (taskId == null) {
      return;
    }
    ctx.dispatch([
      new TasksAction.UpdateTask({ taskId, changes: updatedTaskData }),
      TaskScreenAction.Close,
    ]);
  }
}

function draftImageKey(draft: DraftTaskImage | undefined): string | undefined {
  return draft?.imageId ?? draft?.previewUrl;
}

function activeCoverKey(
  drafts: readonly DraftTaskImage[],
  coverImageId: string | undefined,
  coverDraftKey: string | undefined,
): string | undefined {
  if (coverDraftKey && drafts.some(draft => draftImageKey(draft) === coverDraftKey)) {
    return coverDraftKey;
  }
  const savedCover = drafts.find(
    draft => coverImageId !== undefined && draft.imageId === coverImageId,
  );
  if (savedCover) {
    return draftImageKey(savedCover);
  }
  return draftImageKey(drafts[0]);
}

function draftsFromTask(task: Task | DefaultTask): DraftTaskImage[] {
  if ('images' in task && task.images?.length) {
    return task.images.map(imageId => ({ imageId }));
  }

  if (task.imageId) {
    return [{ imageId: task.imageId }];
  }

  return [];
}
