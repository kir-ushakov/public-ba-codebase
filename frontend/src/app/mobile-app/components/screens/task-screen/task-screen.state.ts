import { inject, Injectable } from '@angular/core';
import type { StateContext } from '@ngxs/store';
import { State, Action, Selector, Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
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
import {
  shouldOfferChecklistCompletion,
  shouldOfferChecklistCompletionOnNoteConversion,
} from 'src/app/shared/helpers/checklist.function';
import { ChecklistCompletionPromptService } from 'src/app/shared/services/application/checklist-completion-prompt.service';
import { taskDraftForHomeMode } from '../home-screen/helpers/home-content-mode.function';
import {
  projectTaskType,
  taskHasTodoCondition,
} from 'src/app/shared/helpers/task-conditions.function';
import { HomeContentModeService } from '../home-screen/home-content-mode.service';
import { TaskConst, type AudioAttachment } from '@brainassistant/contracts';
import { AudioService } from 'src/app/shared/services/application/audio.service';
import { SpeechToTextService } from 'src/app/shared/features/voice-input/api/speech-to-text.service';
import { appendTranscriptionToDescription } from 'src/app/shared/helpers/append-transcription-to-description.function';

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
  draftImages: DraftTaskImage[];
  coverDraftKey?: string;
  /** Audio saved during create and not yet kept by Apply. */
  uncommittedAudioIds: string[];
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
  draftImages: [],
  uncommittedAudioIds: [],
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
  private readonly homeContentMode = inject(HomeContentModeService);
  private readonly checklistPrompts = inject(ChecklistCompletionPromptService);
  private readonly audioService = inject(AudioService);
  private readonly speechToText = inject(SpeechToTextService);

  @Selector()
  static mode(state: ITaskScreenStateModel): ETaskViewMode {
    return state.mode;
  }

  @Selector()
  static task(state: ITaskScreenStateModel): Task | DefaultTask {
    return state.taskData;
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
  static isEditFormValid(state: ITaskScreenStateModel): boolean {
    return state.taskViewForm?.status ?? false;
  }

  @Action(TaskScreenAction.Opened)
  opened(
    ctx: StateContext<ITaskScreenStateModel>,
    { mode, taskId }: TaskScreenAction.Opened,
  ): void {
    ctx.dispatch(new VoiceInputAction.Reset());
    const draft = taskDraftForHomeMode(this.homeContentMode.mode());
    ctx.setState({
      ...defaults,
      mode,
      ...(mode === ETaskViewMode.Create
        ? {
            taskData: {
              ...defaults.taskData,
              status: draft.status,
              ...(draft.conditions
                ? { conditions: draft.conditions, type: projectTaskType(draft.conditions) }
                : {}),
            },
          }
        : {}),
    });
    if (taskId) {
      const actualTasks: Task[] = this.store.selectSnapshot(TasksState.actualTasks);
      const selectedTask = actualTasks.find(t => t.id === taskId) ?? defaultTask;
      ctx.patchState({
        taskData: selectedTask,
        ...(mode === ETaskViewMode.Edit || mode === ETaskViewMode.View
          ? { draftImages: draftsFromTask(selectedTask) }
          : {}),
      });
    }
  }

  @Action(TaskScreenAction.TagIdsChanged)
  async tagIdsChanged(
    ctx: StateContext<ITaskScreenStateModel>,
    { tagIds }: TaskScreenAction.TagIdsChanged,
  ): Promise<void> {
    const state = ctx.getState();
    ctx.patchState({
      taskData: {
        ...state.taskData,
        tagIds,
      },
    });
    if (state.mode !== ETaskViewMode.View || !state.taskData.id) {
      return;
    }

    await firstValueFrom(
      ctx.dispatch(
        new TasksAction.UpdateTask({
          taskId: state.taskData.id,
          changes: { tagIds },
        }),
      ),
    );
  }

  @Action(TaskScreenAction.ChecklistChanged)
  async checklistChanged(
    ctx: StateContext<ITaskScreenStateModel>,
    { checklist }: TaskScreenAction.ChecklistChanged,
  ): Promise<void> {
    const state = ctx.getState();
    const previous = state.taskData.checklist;
    const status = state.taskData.status;
    ctx.patchState({
      taskData: {
        ...state.taskData,
        checklist,
      },
    });
    if (!state.taskData.id) {
      return;
    }

    await firstValueFrom(
      ctx.dispatch(
        new TasksAction.UpdateTask({
          taskId: state.taskData.id,
          changes: { checklist },
        }),
      ),
    );
    if (
      shouldOfferChecklistCompletion(status, previous, checklist) &&
      (status === ETaskStatus.Todo || status === ETaskStatus.Active)
    ) {
      this.checklistPrompts.offer({ taskId: state.taskData.id, status });
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
        status: formData.status ?? state.taskData.status,
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
    const beforeIds = new Set(this.store.selectSnapshot(TasksState.allTasks).map(task => task.id));
    await firstValueFrom(ctx.dispatch(new TasksAction.CreateTask(finalTaskData, userId)));
    const created = this.store
      .selectSnapshot(TasksState.allTasks)
      .find(task => !beforeIds.has(task.id));
    if (!created || !this.draftAudioSaved(finalTaskData.audioAttachments, created)) {
      return;
    }
    this.homeContentMode.showTask(created);
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
    this.homeContentMode.showTask(changes);
    await firstValueFrom(
      ctx.dispatch(
        new TasksAction.UpdateTask({
          taskId: taskData.id,
          changes,
        }),
      ),
    );
    ctx.dispatch(TaskScreenAction.Close);
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
        formData: {
          title: task.title,
          description: task.description ?? null,
          status: task.status,
        },
      },
    });
  }

  @Action(TaskScreenAction.CompleteTaskOptionSelected)
  async completeTask(ctx: StateContext<ITaskScreenStateModel>): Promise<void> {
    const taskUpdateData: Partial<Task> = { status: ETaskStatus.Done };
    await this.updateAndClose(ctx, taskUpdateData);
  }

  @Action(TaskScreenAction.CancelTaskOptionSelected)
  async cancelTask(ctx: StateContext<ITaskScreenStateModel>): Promise<void> {
    const taskUpdateData: Partial<Task> = { status: ETaskStatus.Cancel };
    await this.updateAndClose(ctx, taskUpdateData);
  }

  @Action(TaskScreenAction.ConvertOptionSelected)
  async convert(ctx: StateContext<ITaskScreenStateModel>): Promise<void> {
    const taskData = ctx.getState().taskData;
    const status = taskData.status;
    const next = status === ETaskStatus.Notes ? ETaskStatus.Todo : ETaskStatus.Notes;
    if (
      taskData.id &&
      shouldOfferChecklistCompletionOnNoteConversion(status, next, taskData.checklist)
    ) {
      ctx.patchState({ taskData: { ...taskData, status: next } });
      this.homeContentMode.showStatus(next);
      await firstValueFrom(
        ctx.dispatch(
          new TasksAction.UpdateTask({
            taskId: taskData.id,
            changes: { status: next },
          }),
        ),
      );
      this.checklistPrompts.offer({ taskId: taskData.id, status: ETaskStatus.Todo });
      return;
    }
    await this.updateAndClose(ctx, { status: next });
  }

  @Action(TaskScreenAction.DeleteTaskOptionSelected)
  async deleteTask(ctx: StateContext<ITaskScreenStateModel>): Promise<void> {
    const taskId = ctx.getState().taskData.id;
    if (taskId == null) {
      return;
    }
    await firstValueFrom(ctx.dispatch(new TasksAction.DeleteTask(taskId)));
    ctx.dispatch(AppAction.NavigateToHomeScreen);
  }

  @Action(TaskScreenAction.AudioAttachmentCaptured)
  async audioAttachmentCaptured(
    ctx: StateContext<ITaskScreenStateModel>,
    { blob, durationMs }: TaskScreenAction.AudioAttachmentCaptured,
  ): Promise<void> {
    const state = ctx.getState();
    if ((state.taskData.audioAttachments?.length ?? 0) >= TaskConst.AUDIO_ATTACHMENT_MAX_COUNT) {
      ctx.dispatch(new AppAction.ShowErrorInUI('You can attach up to 10 recordings.'));
      return;
    }

    let saved: Awaited<ReturnType<AudioService['saveBlob']>>;
    try {
      saved = await this.audioService.saveBlob(blob, durationMs);
    } catch {
      ctx.dispatch(new AppAction.ShowErrorInUI('Could not save the recording.', 'Not saved'));
      return;
    }

    const attachment: AudioAttachment = {
      id: saved.id,
      durationMs: saved.durationMs,
      mimeType: saved.mimeType,
      createdAt: saved.createdAt,
    };
    const next = [...(ctx.getState().taskData.audioAttachments ?? []), attachment];
    const taskId = state.taskData.id;
    if (state.mode === ETaskViewMode.Create || !taskId) {
      ctx.patchState({
        taskData: { ...ctx.getState().taskData, audioAttachments: next },
        uncommittedAudioIds: [...(ctx.getState().uncommittedAudioIds ?? []), attachment.id],
      });
      return;
    }

    const stored = await this.persistAttachments(ctx, taskId, next);
    if (!stored?.some(item => item.id === attachment.id)) {
      await this.audioService.deleteBlob(attachment.id);
      ctx.dispatch(new AppAction.ShowErrorInUI('Could not save the recording.', 'Not saved'));
      return;
    }
    ctx.patchState({
      taskData: { ...ctx.getState().taskData, audioAttachments: stored },
    });
  }

  @Action(TaskScreenAction.AudioAttachmentRemoved)
  async audioAttachmentRemoved(
    ctx: StateContext<ITaskScreenStateModel>,
    { id }: TaskScreenAction.AudioAttachmentRemoved,
  ): Promise<void> {
    const state = ctx.getState();
    const current = state.taskData.audioAttachments ?? [];
    if (!current.some(item => item.id === id)) {
      return;
    }
    const next = current.filter(item => item.id !== id);
    const taskId = state.taskData.id;
    if (state.mode === ETaskViewMode.Create || !taskId) {
      try {
        await this.audioService.discardDraft(id);
      } catch {
        ctx.dispatch(new AppAction.ShowErrorInUI('Could not remove the recording.', 'Not saved'));
        return;
      }
      const fresh = ctx.getState();
      ctx.patchState({
        taskData: { ...fresh.taskData, audioAttachments: next },
        uncommittedAudioIds: (fresh.uncommittedAudioIds ?? []).filter(audioId => audioId !== id),
      });
      return;
    }

    const stored = await this.persistAttachments(ctx, taskId, next);
    if (!stored || stored.some(item => item.id === id)) {
      ctx.dispatch(new AppAction.ShowErrorInUI('Could not remove the recording.', 'Not saved'));
      return;
    }
    ctx.patchState({
      taskData: { ...ctx.getState().taskData, audioAttachments: stored },
    });
    await this.audioService.deleteBlob(id);
    try {
      await this.audioService.deleteRemote(id);
    } catch {
      // The task no longer references the file. A later cleanup can drop the remote copy.
    }
  }

  @Action(TaskScreenAction.TranscribeAudioAttachment)
  async transcribeAudioAttachment(
    ctx: StateContext<ITaskScreenStateModel>,
    { id }: TaskScreenAction.TranscribeAudioAttachment,
  ): Promise<void> {
    if (!navigator.onLine) {
      ctx.dispatch(new AppAction.ShowErrorInUI('Transcription needs a connection.'));
      return;
    }
    const state = ctx.getState();
    const current = state.taskData.audioAttachments ?? [];
    const attachment = current.find(item => item.id === id);
    if (!attachment || attachment.transcription) {
      return;
    }

    const blob = await this.audioBlob(id);
    if (!blob) {
      ctx.dispatch(new AppAction.ShowErrorInUI('Could not read the recording.'));
      return;
    }

    let transcript = '';
    try {
      const response = await firstValueFrom(this.speechToText.uploadAudio(blob));
      transcript = response.transcript.trim();
    } catch {
      ctx.dispatch(new AppAction.ShowErrorInUI('Could not transcribe the recording.'));
      return;
    }
    if (!transcript) {
      ctx.dispatch(new AppAction.ShowErrorInUI('Could not transcribe the recording.'));
      return;
    }

    const latest = ctx.getState();
    const latestAttachments = latest.taskData.audioAttachments ?? [];
    if (!latestAttachments.some(item => item.id === id)) {
      return;
    }

    const next = latestAttachments.map(item =>
      item.id === id
        ? {
            ...item,
            transcription: {
              text: transcript,
              createdAt: new Date().toISOString(),
              model: 'whisper-1',
            },
          }
        : item,
    );
    const taskId = latest.taskData.id;
    if (latest.mode === ETaskViewMode.Create || !taskId) {
      ctx.patchState({
        taskData: { ...ctx.getState().taskData, audioAttachments: next },
      });
      return;
    }

    const stored = await this.persistAttachments(ctx, taskId, next);
    if (!stored) {
      ctx.dispatch(
        new AppAction.ShowErrorInUI('Could not save the task on this device.', 'Not saved'),
      );
      return;
    }
    const savedText = stored.find(item => item.id === id)?.transcription?.text;
    if (savedText !== transcript) {
      ctx.dispatch(
        new AppAction.ShowErrorInUI('Could not save the task on this device.', 'Not saved'),
      );
      return;
    }
    ctx.patchState({
      taskData: { ...ctx.getState().taskData, audioAttachments: stored },
    });
  }

  @Action(TaskScreenAction.AddTranscriptionToDescription)
  addTranscriptionToDescription(
    ctx: StateContext<ITaskScreenStateModel>,
    { text }: TaskScreenAction.AddTranscriptionToDescription,
  ): void {
    const description = appendTranscriptionToDescription(ctx.getState().taskData.description, text);
    if (!description) {
      ctx.dispatch(
        new AppAction.ShowErrorInUI('The description is too long for this transcription.'),
      );
      return;
    }
    this.editTask(ctx);
    const state = ctx.getState();
    ctx.patchState({
      taskData: { ...state.taskData, description },
      taskViewForm: {
        ...state.taskViewForm,
        formData: { ...state.taskViewForm.formData, description },
      },
    });
  }

  @Action(TaskScreenAction.CancelButtonPressed)
  async cancelChanges(ctx: StateContext<ITaskScreenStateModel>): Promise<void> {
    const { mode, uncommittedAudioIds } = ctx.getState();
    if (mode === ETaskViewMode.Create) {
      await Promise.all((uncommittedAudioIds ?? []).map(id => this.audioService.discardDraft(id)));
    }
    ctx.dispatch(TaskScreenAction.Close);
  }

  @Action(TaskScreenAction.Close)
  close(ctx: StateContext<ITaskScreenStateModel>): void {
    ctx.dispatch(new VoiceInputAction.Reset());
    ctx.setState(defaults);
  }

  @Action(TaskScreenAction.MarkActiveButtonPressed)
  async markActive(ctx: StateContext<ITaskScreenStateModel>): Promise<void> {
    const taskData = ctx.getState().taskData;
    if (taskData.status !== ETaskStatus.Todo || !taskHasTodoCondition(taskData)) {
      return;
    }
    await this.updateAndClose(ctx, { status: ETaskStatus.Active });
  }

  @Action(TaskScreenAction.MarkDoneButtonPressed)
  async markDone(ctx: StateContext<ITaskScreenStateModel>): Promise<void> {
    await this.updateAndClose(ctx, { status: ETaskStatus.Done });
  }

  @Action(TaskScreenAction.AddPictureBtnPressed)
  async selectPictureFromDevice(ctx: StateContext<ITaskScreenStateModel>): Promise<void> {
    const imageUri = await this.deviceCameraService.takePicture();
    if (!imageUri) {
      return;
    }
    const state = ctx.getState();
    const draftImages = [...(state.draftImages ?? []), { previewUrl: imageUri }];
    ctx.patchState({ draftImages });
    await this.persistViewGallery(ctx);
  }

  @Action(TaskScreenAction.ImageSelectedAsCover)
  async selectImageAsCover(
    ctx: StateContext<ITaskScreenStateModel>,
    { image }: TaskScreenAction.ImageSelectedAsCover,
  ): Promise<void> {
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
    await this.persistViewGallery(ctx);
  }

  @Action(TaskScreenAction.DraftImageRemoved)
  async removeDraftImage(
    ctx: StateContext<ITaskScreenStateModel>,
    { image }: TaskScreenAction.DraftImageRemoved,
  ): Promise<void> {
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
    await this.persistViewGallery(ctx);
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

  private async persistViewGallery(ctx: StateContext<ITaskScreenStateModel>): Promise<void> {
    const state = ctx.getState();
    if (state.mode !== ETaskViewMode.View || state.taskData.id === null) {
      return;
    }

    const saved = await this.savedImagesFromDrafts(
      state.draftImages,
      state.taskData.imageId,
      state.coverDraftKey,
    );
    const changes = { ...state.taskData, ...saved };
    ctx.patchState({
      taskData: changes,
      draftImages: draftsFromTask(changes),
      coverDraftKey: undefined,
    });
    await firstValueFrom(
      ctx.dispatch(
        new TasksAction.UpdateTask({
          taskId: state.taskData.id,
          changes,
        }),
      ),
    );
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

  private async persistAttachments(
    ctx: StateContext<ITaskScreenStateModel>,
    taskId: string,
    next: AudioAttachment[],
  ): Promise<AudioAttachment[] | null> {
    await firstValueFrom(
      ctx.dispatch(
        new TasksAction.UpdateTask({
          taskId,
          changes: { audioAttachments: next },
        }),
      ),
    );
    const stored = this.taskInStore(taskId)?.audioAttachments;
    return stored ?? null;
  }

  private draftAudioSaved(draft: AudioAttachment[] | undefined, created: Task): boolean {
    const saved = created.audioAttachments ?? [];
    return (draft ?? []).every(item => saved.some(stored => stored.id === item.id));
  }

  private taskInStore(taskId: string): Task | undefined {
    const entities = this.store.selectSnapshot<Task[]>(state => {
      const tasks = (state as { tasks?: { entities?: Task[] } }).tasks;
      return tasks?.entities ?? [];
    });
    return entities.find(task => task.id === taskId);
  }

  private async audioBlob(id: string): Promise<Blob | undefined> {
    const record = await this.audioService.getRecord(id);
    if (record?.blob) {
      return record.blob;
    }
    const url = await this.audioService.objectUrl(id);
    if (url) {
      URL.revokeObjectURL(url);
    }
    return (await this.audioService.getRecord(id))?.blob;
  }

  private async updateAndClose(
    ctx: StateContext<ITaskScreenStateModel>,
    updatedTaskData: Partial<Task>,
  ): Promise<void> {
    const taskId = ctx.getState().taskData.id;
    if (taskId == null) {
      return;
    }
    this.homeContentMode.showStatus(updatedTaskData.status ?? ctx.getState().taskData.status);
    await firstValueFrom(
      ctx.dispatch([
        new TasksAction.UpdateTask({ taskId, changes: updatedTaskData }),
        TaskScreenAction.Close,
      ]),
    );
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
