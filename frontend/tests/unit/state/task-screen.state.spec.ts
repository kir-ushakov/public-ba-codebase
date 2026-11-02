import { TestBed } from '@angular/core/testing';
import { Actions, ofActionDispatched, provideStore, Store } from '@ngxs/store';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { firstValueFrom } from 'rxjs';
import {
  ETaskViewMode,
  TaskScreenState,
} from 'src/app/mobile-app/components/screens/task-screen/task-screen.state';
import { TaskScreenAction } from 'src/app/mobile-app/components/screens/task-screen/task-screen.actions';
import {
  ETaskCondition,
  ETaskStatus,
  ETaskType,
  Task,
  defaultTask,
} from 'src/app/shared/models/task.model';
import { AuthService } from 'src/app/shared/services/api/auth.service';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { HomeContentModeService } from 'src/app/mobile-app/components/screens/home-screen/home-content-mode.service';
import { ChecklistCompletionPromptService } from 'src/app/shared/services/application/checklist-completion-prompt.service';
import { DeviceCameraService } from 'src/app/shared/services/pwa/device-camera.service';
import { SyncAction } from 'src/app/shared/state/sync.action';
import { TasksAction } from 'src/app/shared/state/tasks.action';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { EUserAuthState, UserState } from 'src/app/shared/state/user.state';

describe('TaskScreenState', () => {
  let store: Store;
  let imageService: { saveImage: jest.Mock };
  let deviceCameraService: { takePicture: jest.Mock };

  const userId = 'user-1';
  const existingWithPhoto: Task = {
    id: 'task-1',
    userId,
    type: ETaskType.Basic,
    title: 'Task with a photo',
    imageId: 'old-image-id',
    status: ETaskStatus.Todo,
    createdAt: '2024-06-01T10:00:00.000Z',
    modifiedAt: '2024-06-01T10:00:00.000Z',
  };

  beforeEach(() => {
    imageService = { saveImage: jest.fn().mockResolvedValue('new-image-id') };
    deviceCameraService = { takePicture: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideStore([TaskScreenState, TasksState, UserState]),
        { provide: AuthService, useValue: {} },
        { provide: SlackService, useValue: {} },
        { provide: ImageService, useValue: imageService },
        { provide: DeviceCameraService, useValue: deviceCameraService },
      ],
    });

    store = TestBed.inject(Store);
    TestBed.inject(HomeContentModeService).select('active');
    store.reset({
      taskViewState: leftoverCreateState(),
      tasks: { entities: [existingWithPhoto] },
      user: {
        userData: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          userId,
          googleId: 'g-1',
        },
        authState: EUserAuthState.Authenticated,
        authType: undefined,
        integrations: { isAddedToSlack: undefined },
      },
    });
  });

  it('clears a leftover camera photo when the create screen is opened', async () => {
    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Create, null)));

    expect(store.selectSnapshot(TaskScreenState.draftImages)).toEqual([]);
    expect(store.selectSnapshot(TaskScreenState.task).imageId).toBeUndefined();
  });

  it('does not attach a previous photo when creating a title-only task', async () => {
    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Create, null)));
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, {
          title: 'Fresh task title',
          description: null,
        }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    const created = store
      .selectSnapshot(TasksState.allTasks)
      .find(t => t.id !== existingWithPhoto.id);

    expect(imageService.saveImage).not.toHaveBeenCalled();
    expect(created).toBeDefined();
    expect(created).toMatchObject({ title: 'Fresh task title', userId });
    expect(created?.imageId).toBeUndefined();
  });

  it('creates a task with a description from the form', async () => {
    const description = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'Contact supplier' }],
        },
      ],
    };

    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Create, null)));
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, { title: 'Task with details', description }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    const created = store
      .selectSnapshot(TasksState.allTasks)
      .find(t => t.id !== existingWithPhoto.id);

    expect(created?.title).toBe('Task with details');
    expect(created?.description).toEqual(description);
    expect(created?.status).toBe(ETaskStatus.Active);
    expect(TestBed.inject(HomeContentModeService).mode()).toBe('active');
  });

  it('attaches selected tag ids when creating a task', async () => {
    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Create, null)));
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, {
          title: 'Tagged task',
          description: null,
          tagIds: ['tag-1'],
        }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    const created = store
      .selectSnapshot(TasksState.allTasks)
      .find(t => t.id !== existingWithPhoto.id);

    expect(created?.tagIds).toEqual(['tag-1']);
  });

  it('queues a task update when view-mode tags are added or removed', async () => {
    const synced: SyncAction.ChangeForSyncOccurred[] = [];
    const subscription = TestBed.inject(Actions)
      .pipe(ofActionDispatched(SyncAction.ChangeForSyncOccurred))
      .subscribe(action => synced.push(action));

    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, existingWithPhoto.id)),
    );
    await firstValueFrom(store.dispatch(new TaskScreenAction.TagIdsChanged(['tag-1', 'tag-2'])));

    expect(store.selectSnapshot(TaskScreenState.task).tagIds).toEqual(['tag-1', 'tag-2']);
    expect(
      store.selectSnapshot(TasksState.allTasks).find(task => task.id === existingWithPhoto.id)
        ?.tagIds,
    ).toEqual(['tag-1', 'tag-2']);
    expect(synced.map(action => action.entry.change)).toEqual([
      expect.objectContaining({
        entity: EChangedEntity.Task,
        action: EChangeAction.Updated,
        object: expect.objectContaining({
          id: existingWithPhoto.id,
          tagIds: ['tag-1', 'tag-2'],
        }),
      }),
    ]);

    await firstValueFrom(store.dispatch(new TaskScreenAction.TagIdsChanged(['tag-2'])));

    expect(store.selectSnapshot(TaskScreenState.task).tagIds).toEqual(['tag-2']);
    expect(synced[1]?.entry.change.object).toEqual(
      expect.objectContaining({ id: existingWithPhoto.id, tagIds: ['tag-2'] }),
    );
    subscription.unsubscribe();
  });

  it('creates an Active task when the form status is Active', async () => {
    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Create, null)));
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, {
          title: 'Task in progress',
          description: null,
          status: ETaskStatus.Active,
        }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    const created = store
      .selectSnapshot(TasksState.actualTasks)
      .find(t => t.id !== existingWithPhoto.id);

    expect(created).toMatchObject({
      title: 'Task in progress',
      status: ETaskStatus.Active,
    });
  });

  it('still saves a photo taken during the current create session', async () => {
    deviceCameraService.takePicture.mockResolvedValue('blob:current-session-photo');

    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Create, null)));
    await firstValueFrom(store.dispatch(TaskScreenAction.AddPictureBtnPressed));
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, {
          title: 'Task with a new photo',
          description: null,
        }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    const created = store
      .selectSnapshot(TasksState.allTasks)
      .find(t => t.id !== existingWithPhoto.id);

    expect(imageService.saveImage).toHaveBeenCalledWith('blob:current-session-photo');
    expect(created?.imageId).toBe('new-image-id');
    expect(created?.images).toEqual(['new-image-id']);
  });

  it('keeps the first photo as the cover when a second photo is added', async () => {
    deviceCameraService.takePicture
      .mockResolvedValueOnce('blob:first-photo')
      .mockResolvedValueOnce('blob:second-photo');
    imageService.saveImage
      .mockResolvedValueOnce('first-image-id')
      .mockResolvedValueOnce('second-image-id');

    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Create, null)));
    await firstValueFrom(store.dispatch(TaskScreenAction.AddPictureBtnPressed));
    await firstValueFrom(store.dispatch(TaskScreenAction.AddPictureBtnPressed));
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, {
          title: 'Task with two photos',
          description: null,
        }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    const created = store
      .selectSnapshot(TasksState.allTasks)
      .find(t => t.id !== existingWithPhoto.id);

    expect(imageService.saveImage).toHaveBeenNthCalledWith(1, 'blob:first-photo');
    expect(imageService.saveImage).toHaveBeenNthCalledWith(2, 'blob:second-photo');
    expect(created?.imageId).toBe('first-image-id');
    expect(created?.images).toEqual(['first-image-id', 'second-image-id']);
  });

  it('saves the clicked photo as the cover without reordering attachments', async () => {
    deviceCameraService.takePicture
      .mockResolvedValueOnce('blob:first-photo')
      .mockResolvedValueOnce('blob:second-photo');
    imageService.saveImage
      .mockResolvedValueOnce('first-image-id')
      .mockResolvedValueOnce('second-image-id');

    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Create, null)));
    await firstValueFrom(store.dispatch(TaskScreenAction.AddPictureBtnPressed));
    await firstValueFrom(store.dispatch(TaskScreenAction.AddPictureBtnPressed));
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.ImageSelectedAsCover({ previewUrl: 'blob:second-photo' }),
      ),
    );
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, {
          title: 'Task with a chosen cover',
          description: null,
        }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    const created = store
      .selectSnapshot(TasksState.allTasks)
      .find(t => t.id !== existingWithPhoto.id);

    expect(created?.imageId).toBe('second-image-id');
    expect(created?.images).toEqual(['first-image-id', 'second-image-id']);
  });

  it('drops a removed photo and makes the next one the cover', async () => {
    imageService.saveImage.mockResolvedValueOnce('second-image-id');

    const created = await saveCreatedTaskWithTwoPhotos(
      new TaskScreenAction.DraftImageRemoved({ previewUrl: 'blob:first-photo' }),
    );

    expect(imageService.saveImage).toHaveBeenCalledTimes(1);
    expect(imageService.saveImage).toHaveBeenCalledWith('blob:second-photo');
    expect(created?.imageId).toBe('second-image-id');
    expect(created?.images).toEqual(['second-image-id']);
  });

  it('keeps the cover when a later photo is removed', async () => {
    imageService.saveImage.mockResolvedValueOnce('first-image-id');

    const created = await saveCreatedTaskWithTwoPhotos(
      new TaskScreenAction.DraftImageRemoved({ previewUrl: 'blob:second-photo' }),
    );

    expect(created?.imageId).toBe('first-image-id');
    expect(created?.images).toEqual(['first-image-id']);
  });

  it('loads the selected task when opening view mode', async () => {
    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, existingWithPhoto.id)),
    );

    expect(store.selectSnapshot(TaskScreenState.task)).toEqual(existingWithPhoto);
    expect(store.selectSnapshot(TaskScreenState.draftImages)).toEqual([
      { imageId: 'old-image-id' },
    ]);
  });

  it('saves a photo added from task view without leaving the view', async () => {
    deviceCameraService.takePicture.mockResolvedValue('blob:view-photo');

    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, existingWithPhoto.id)),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.AddPictureBtnPressed));

    expect(imageService.saveImage).toHaveBeenCalledWith('blob:view-photo');
    const updated = store
      .selectSnapshot(TasksState.allTasks)
      .find(t => t.id === existingWithPhoto.id);
    expect(updated?.imageId).toBe('old-image-id');
    expect(updated?.images).toEqual(['old-image-id', 'new-image-id']);
    expect(store.selectSnapshot(TaskScreenState.mode)).toBe(ETaskViewMode.View);
    expect(store.selectSnapshot(TaskScreenState.draftImages)).toEqual([
      { imageId: 'old-image-id' },
      { imageId: 'new-image-id' },
    ]);
  });

  it('saves a cover chosen from task view', async () => {
    const withGallery: Task = {
      ...existingWithPhoto,
      id: 'task-gallery',
      imageId: 'cover-id',
      images: ['cover-id', 'second-id'],
    };
    store.reset({
      ...store.snapshot(),
      tasks: { entities: [existingWithPhoto, withGallery] },
    });

    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, withGallery.id)),
    );
    await firstValueFrom(
      store.dispatch(new TaskScreenAction.ImageSelectedAsCover({ imageId: 'second-id' })),
    );

    const updated = store.selectSnapshot(TasksState.allTasks).find(t => t.id === withGallery.id);
    expect(imageService.saveImage).not.toHaveBeenCalled();
    expect(updated?.imageId).toBe('second-id');
    expect(updated?.images).toEqual(['cover-id', 'second-id']);
    expect(store.selectSnapshot(TaskScreenState.mode)).toBe(ETaskViewMode.View);
  });

  it('saves a removed photo from task view and keeps the next image as cover', async () => {
    const withGallery: Task = {
      ...existingWithPhoto,
      id: 'task-gallery',
      imageId: 'cover-id',
      images: ['cover-id', 'second-id'],
    };
    store.reset({
      ...store.snapshot(),
      tasks: { entities: [existingWithPhoto, withGallery] },
    });

    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, withGallery.id)),
    );
    await firstValueFrom(
      store.dispatch(new TaskScreenAction.DraftImageRemoved({ imageId: 'cover-id' })),
    );

    const updated = store.selectSnapshot(TasksState.allTasks).find(t => t.id === withGallery.id);
    expect(imageService.saveImage).not.toHaveBeenCalled();
    expect(updated?.imageId).toBe('second-id');
    expect(updated?.images).toEqual(['second-id']);
    expect(store.selectSnapshot(TaskScreenState.mode)).toBe(ETaskViewMode.View);
  });

  it('closes the screen after saving an edit', async () => {
    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Edit, existingWithPhoto.id)),
    );
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, {
          title: 'Edited title',
          description: null,
        }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    const updated = store
      .selectSnapshot(TasksState.allTasks)
      .find(task => task.id === existingWithPhoto.id);
    expect(updated?.title).toBe('Edited title');
    expect(store.selectSnapshot(TaskScreenState.mode)).toBe(ETaskViewMode.Create);
    expect(store.selectSnapshot(TaskScreenState.task).id).toBeNull();
  });

  it('shows the saved image as the cover draft when edit mode opens', async () => {
    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Edit, existingWithPhoto.id)),
    );

    expect(store.selectSnapshot(TaskScreenState.draftImages)).toEqual([
      { imageId: 'old-image-id' },
    ]);
  });

  it('keeps the existing cover when a new photo is added in edit', async () => {
    deviceCameraService.takePicture.mockResolvedValue('blob:edited-photo');

    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, existingWithPhoto.id)),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.EditTaskOptionSelected));
    await firstValueFrom(store.dispatch(TaskScreenAction.AddPictureBtnPressed));
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, {
          title: existingWithPhoto.title,
          description: null,
        }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    expect(imageService.saveImage).toHaveBeenCalledWith('blob:edited-photo');
    const updated = store
      .selectSnapshot(TasksState.allTasks)
      .find(t => t.id === existingWithPhoto.id);
    expect(updated?.imageId).toBe('old-image-id');
    expect(updated?.images).toEqual(['old-image-id', 'new-image-id']);
  });

  it('appends a photo without replacing a cover that is already in the images list', async () => {
    const withGallery: Task = {
      ...existingWithPhoto,
      id: 'task-gallery',
      imageId: 'cover-id',
      images: ['cover-id', 'second-id'],
    };
    store.reset({
      ...store.snapshot(),
      tasks: { entities: [existingWithPhoto, withGallery] },
    });
    deviceCameraService.takePicture.mockResolvedValue('blob:third-photo');

    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Edit, withGallery.id)),
    );
    expect(store.selectSnapshot(TaskScreenState.draftImages)).toEqual([
      { imageId: 'cover-id' },
      { imageId: 'second-id' },
    ]);

    await firstValueFrom(store.dispatch(TaskScreenAction.AddPictureBtnPressed));
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, {
          title: withGallery.title,
          description: null,
        }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    const updated = store.selectSnapshot(TasksState.allTasks).find(t => t.id === withGallery.id);
    expect(imageService.saveImage).toHaveBeenCalledTimes(1);
    expect(imageService.saveImage).toHaveBeenCalledWith('blob:third-photo');
    expect(updated?.imageId).toBe('cover-id');
    expect(updated?.images).toEqual(['cover-id', 'second-id', 'new-image-id']);
  });

  it('changes the cover to another saved image without reordering the list', async () => {
    const withGallery: Task = {
      ...existingWithPhoto,
      id: 'task-gallery',
      imageId: 'cover-id',
      images: ['cover-id', 'second-id'],
    };
    store.reset({
      ...store.snapshot(),
      tasks: { entities: [existingWithPhoto, withGallery] },
    });

    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Edit, withGallery.id)),
    );
    await firstValueFrom(
      store.dispatch(new TaskScreenAction.ImageSelectedAsCover({ imageId: 'second-id' })),
    );
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, {
          title: withGallery.title,
          description: null,
        }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    const updated = store.selectSnapshot(TasksState.allTasks).find(t => t.id === withGallery.id);
    expect(imageService.saveImage).not.toHaveBeenCalled();
    expect(updated?.imageId).toBe('second-id');
    expect(updated?.images).toEqual(['cover-id', 'second-id']);
  });

  it('moves the cover to the first remaining image when the cover is removed', async () => {
    const withGallery: Task = {
      ...existingWithPhoto,
      id: 'task-gallery',
      imageId: 'cover-id',
      images: ['cover-id', 'second-id'],
    };
    store.reset({
      ...store.snapshot(),
      tasks: { entities: [existingWithPhoto, withGallery] },
    });

    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Edit, withGallery.id)),
    );
    await firstValueFrom(
      store.dispatch(new TaskScreenAction.DraftImageRemoved({ imageId: 'cover-id' })),
    );
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, {
          title: withGallery.title,
          description: null,
        }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    const updated = store.selectSnapshot(TasksState.allTasks).find(t => t.id === withGallery.id);
    expect(imageService.saveImage).not.toHaveBeenCalled();
    expect(updated?.imageId).toBe('second-id');
    expect(updated?.images).toEqual(['second-id']);
  });

  it('clears the task image when the last draft photo is removed', async () => {
    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Edit, existingWithPhoto.id)),
    );
    await firstValueFrom(
      store.dispatch(new TaskScreenAction.DraftImageRemoved({ imageId: 'old-image-id' })),
    );
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, {
          title: existingWithPhoto.title,
          description: null,
        }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    const updated = store
      .selectSnapshot(TasksState.allTasks)
      .find(t => t.id === existingWithPhoto.id);
    expect(updated?.imageId).toBeUndefined();
    expect(updated?.images).toEqual([]);
  });

  it('marks a viewed task active and closes the view', async () => {
    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, existingWithPhoto.id)),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.MarkActiveButtonPressed));

    const updated = store
      .selectSnapshot(TasksState.allTasks)
      .find(task => task.id === existingWithPhoto.id);
    expect(updated?.status).toBe(ETaskStatus.Active);
    expect(store.selectSnapshot(TaskScreenState.mode)).toBe(ETaskViewMode.Create);
    expect(
      store.selectSnapshot(TasksState.actualTasks).some(task => task.id === existingWithPhoto.id),
    ).toBe(true);
  });

  it('does not mark a calendar-only task active', async () => {
    const calendarTask: Task = {
      ...existingWithPhoto,
      id: 'task-calendar',
      type: ETaskType.Calendar,
      conditions: [ETaskCondition.Calendar],
    };
    store.reset({
      ...store.snapshot(),
      tasks: { entities: [existingWithPhoto, calendarTask] },
    });

    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, calendarTask.id)),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.MarkActiveButtonPressed));

    const updated = store
      .selectSnapshot(TasksState.allTasks)
      .find(task => task.id === calendarTask.id);
    expect(updated?.status).toBe(ETaskStatus.Todo);
    expect(store.selectSnapshot(TaskScreenState.mode)).toBe(ETaskViewMode.View);
  });

  it('marks a viewed task done and drops it from the active list', async () => {
    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, existingWithPhoto.id)),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.MarkDoneButtonPressed));

    const updated = store
      .selectSnapshot(TasksState.allTasks)
      .find(task => task.id === existingWithPhoto.id);
    expect(updated?.status).toBe(ETaskStatus.Done);
    expect(store.selectSnapshot(TaskScreenState.mode)).toBe(ETaskViewMode.Create);
    expect(
      store.selectSnapshot(TasksState.actualTasks).some(task => task.id === existingWithPhoto.id),
    ).toBe(false);
  });

  it('converts a to-do task into a note and keeps its type and image', async () => {
    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, existingWithPhoto.id)),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ConvertOptionSelected));

    const updated = store
      .selectSnapshot(TasksState.allTasks)
      .find(task => task.id === existingWithPhoto.id);
    expect(updated?.status).toBe(ETaskStatus.Notes);
    expect(updated?.type).toBe(ETaskType.Basic);
    expect(updated?.imageId).toBe(existingWithPhoto.imageId);
    expect(updated?.id).toBe(existingWithPhoto.id);
  });

  it('converts a note back into a to-do task', async () => {
    const note: Task = { ...existingWithPhoto, id: 'note-1', status: ETaskStatus.Notes };
    store.reset({
      ...store.snapshot(),
      tasks: { entities: [note] },
    });

    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, note.id)));
    await firstValueFrom(store.dispatch(TaskScreenAction.ConvertOptionSelected));

    const updated = store.selectSnapshot(TasksState.allTasks).find(task => task.id === note.id);
    expect(updated?.status).toBe(ETaskStatus.Todo);
    expect(updated?.type).toBe(ETaskType.Basic);
    expect(updated?.imageId).toBe(note.imageId);
  });

  it('converts an active calendar task into a note and keeps the calendar type', async () => {
    const calendarTask: Task = {
      ...existingWithPhoto,
      id: 'task-calendar-active',
      type: ETaskType.Calendar,
      status: ETaskStatus.Active,
    };
    store.reset({
      ...store.snapshot(),
      tasks: { entities: [calendarTask] },
    });

    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, calendarTask.id)),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ConvertOptionSelected));

    const updated = store
      .selectSnapshot(TasksState.allTasks)
      .find(task => task.id === calendarTask.id);
    expect(updated?.status).toBe(ETaskStatus.Notes);
    expect(updated?.type).toBe(ETaskType.Calendar);
  });

  it('checks an item without offering completion until the last one is checked', async () => {
    const checklist = [
      { id: 'a', text: 'Buy cat food', completed: false },
      { id: 'b', text: 'Check salmon variant', completed: false },
    ];
    store.reset({
      ...store.snapshot(),
      tasks: { entities: [{ ...existingWithPhoto, checklist }] },
    });
    const prompts = TestBed.inject(ChecklistCompletionPromptService);

    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, existingWithPhoto.id)),
    );
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.ChecklistChanged([
          { id: 'a', text: 'Buy cat food', completed: true },
          { id: 'b', text: 'Check salmon variant', completed: false },
        ]),
      ),
    );

    expect(prompts.prompt()).toBeNull();
    expect(store.selectSnapshot(TasksState.allTasks)[0]?.status).toBe(ETaskStatus.Todo);

    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.ChecklistChanged([
          { id: 'a', text: 'Buy cat food', completed: true },
          { id: 'b', text: 'Check salmon variant', completed: true },
        ]),
      ),
    );

    expect(prompts.prompt()).toEqual({ taskId: existingWithPhoto.id, status: ETaskStatus.Todo });
    expect(store.selectSnapshot(TasksState.allTasks)[0]?.status).toBe(ETaskStatus.Todo);
    prompts.dismiss();
  });

  it('offers completion when the last item of an active task is checked', async () => {
    const checklist = [{ id: 'a', text: 'Buy cat food', completed: false }];
    store.reset({
      ...store.snapshot(),
      tasks: {
        entities: [
          { ...existingWithPhoto, id: 'task-active', status: ETaskStatus.Active, checklist },
        ],
      },
    });
    const prompts = TestBed.inject(ChecklistCompletionPromptService);

    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, 'task-active')),
    );
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.ChecklistChanged([{ id: 'a', text: 'Buy cat food', completed: true }]),
      ),
    );

    expect(prompts.prompt()).toEqual({ taskId: 'task-active', status: ETaskStatus.Active });
    expect(store.selectSnapshot(TasksState.allTasks)[0]?.status).toBe(ETaskStatus.Active);
    prompts.dismiss();
  });

  it('does not offer completion when the last item of a note is checked', async () => {
    const checklist = [{ id: 'a', text: 'Buy cat food', completed: false }];
    store.reset({
      ...store.snapshot(),
      tasks: {
        entities: [{ ...existingWithPhoto, id: 'note-1', status: ETaskStatus.Notes, checklist }],
      },
    });
    const prompts = TestBed.inject(ChecklistCompletionPromptService);

    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, 'note-1')));
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.ChecklistChanged([{ id: 'a', text: 'Buy cat food', completed: true }]),
      ),
    );

    expect(prompts.prompt()).toBeNull();
    expect(store.selectSnapshot(TasksState.allTasks)[0]?.status).toBe(ETaskStatus.Notes);
  });

  it('does not offer completion for an empty checklist or an already completed one', async () => {
    const checklist = [{ id: 'a', text: 'Buy cat food', completed: true }];
    store.reset({
      ...store.snapshot(),
      tasks: { entities: [{ ...existingWithPhoto, checklist }] },
    });
    const prompts = TestBed.inject(ChecklistCompletionPromptService);

    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, existingWithPhoto.id)),
    );
    expect(prompts.prompt()).toBeNull();

    await firstValueFrom(store.dispatch(new TaskScreenAction.ChecklistChanged([])));
    expect(prompts.prompt()).toBeNull();
    expect(store.selectSnapshot(TasksState.allTasks)[0]?.status).toBe(ETaskStatus.Todo);
  });

  it('converts an incomplete note to to-do without a dialog and keeps item ids', async () => {
    const checklist = [
      { id: 'a', text: 'Buy cat food', completed: true },
      { id: 'b', text: 'Check salmon variant', completed: false },
    ];
    const note: Task = {
      ...existingWithPhoto,
      id: 'note-open',
      status: ETaskStatus.Notes,
      checklist,
    };
    store.reset({ ...store.snapshot(), tasks: { entities: [note] } });
    const prompts = TestBed.inject(ChecklistCompletionPromptService);

    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, note.id)));
    await firstValueFrom(store.dispatch(TaskScreenAction.ConvertOptionSelected));

    const updated = store.selectSnapshot(TasksState.allTasks).find(task => task.id === note.id);
    expect(updated?.status).toBe(ETaskStatus.Todo);
    expect(updated?.checklist).toEqual(checklist);
    expect(prompts.prompt()).toBeNull();
  });

  it('offers completion when a fully completed note becomes a to-do, and Mark as Done finishes it', async () => {
    const checklist = [
      { id: 'a', text: 'Buy cat food', completed: true },
      { id: 'b', text: 'Check salmon variant', completed: true },
    ];
    const note: Task = {
      ...existingWithPhoto,
      id: 'note-done-list',
      status: ETaskStatus.Notes,
      checklist,
    };
    store.reset({ ...store.snapshot(), tasks: { entities: [note] } });
    const prompts = TestBed.inject(ChecklistCompletionPromptService);

    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, note.id)));
    await firstValueFrom(store.dispatch(TaskScreenAction.ConvertOptionSelected));

    expect(prompts.prompt()).toEqual({ taskId: note.id, status: ETaskStatus.Todo });
    expect(store.selectSnapshot(TaskScreenState.mode)).toBe(ETaskViewMode.View);
    let updated = store.selectSnapshot(TasksState.allTasks).find(task => task.id === note.id);
    expect(updated?.status).toBe(ETaskStatus.Todo);
    expect(updated?.checklist).toEqual(checklist);

    await firstValueFrom(
      store.dispatch(
        new TasksAction.UpdateTask({ taskId: note.id, changes: { status: ETaskStatus.Done } }),
      ),
    );
    prompts.dismiss();

    updated = store.selectSnapshot(TasksState.allTasks).find(task => task.id === note.id);
    expect(updated?.status).toBe(ETaskStatus.Done);
    expect(updated?.checklist).toEqual(checklist);
    expect(prompts.prompt()).toBeNull();
  });

  it('keeps to-do when the completion dialog is dismissed after converting a completed note', async () => {
    const checklist = [{ id: 'a', text: 'Buy cat food', completed: true }];
    const note: Task = {
      ...existingWithPhoto,
      id: 'note-keep',
      status: ETaskStatus.Notes,
      checklist,
    };
    store.reset({ ...store.snapshot(), tasks: { entities: [note] } });
    const prompts = TestBed.inject(ChecklistCompletionPromptService);

    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, note.id)));
    await firstValueFrom(store.dispatch(TaskScreenAction.ConvertOptionSelected));
    prompts.dismiss();

    const updated = store.selectSnapshot(TasksState.allTasks).find(task => task.id === note.id);
    expect(updated?.status).toBe(ETaskStatus.Todo);
    expect(updated?.checklist).toEqual(checklist);
    expect(prompts.prompt()).toBeNull();
  });

  it('converts a completed to-do back to a note without a dialog, then offers again on the way back', async () => {
    const checklist = [{ id: 'a', text: 'Buy cat food', completed: true }];
    const task: Task = { ...existingWithPhoto, id: 'task-roundtrip', checklist };
    store.reset({ ...store.snapshot(), tasks: { entities: [task] } });
    const prompts = TestBed.inject(ChecklistCompletionPromptService);

    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, task.id)));
    await firstValueFrom(store.dispatch(TaskScreenAction.ConvertOptionSelected));

    let updated = store.selectSnapshot(TasksState.allTasks).find(item => item.id === task.id);
    expect(updated?.status).toBe(ETaskStatus.Notes);
    expect(updated?.checklist).toEqual(checklist);
    expect(prompts.prompt()).toBeNull();

    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, task.id)));
    await firstValueFrom(store.dispatch(TaskScreenAction.ConvertOptionSelected));

    updated = store.selectSnapshot(TasksState.allTasks).find(item => item.id === task.id);
    expect(updated?.status).toBe(ETaskStatus.Todo);
    expect(updated?.checklist).toEqual(checklist);
    expect(prompts.prompt()).toEqual({ taskId: task.id, status: ETaskStatus.Todo });
    prompts.dismiss();
  });

  async function saveCreatedTaskWithTwoPhotos(
    action: TaskScreenAction.DraftImageRemoved,
  ): Promise<Task | undefined> {
    deviceCameraService.takePicture
      .mockResolvedValueOnce('blob:first-photo')
      .mockResolvedValueOnce('blob:second-photo');

    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Create, null)));
    await firstValueFrom(store.dispatch(TaskScreenAction.AddPictureBtnPressed));
    await firstValueFrom(store.dispatch(TaskScreenAction.AddPictureBtnPressed));
    await firstValueFrom(store.dispatch(action));
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, {
          title: 'Task with photos',
          description: null,
        }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    return store.selectSnapshot(TasksState.allTasks).find(task => task.id !== existingWithPhoto.id);
  }
});

function leftoverCreateState() {
  return {
    mode: ETaskViewMode.Create,
    taskViewForm: {
      formData: { title: '', description: null },
      status: false,
    },
    taskData: { ...defaultTask, imageId: 'old-image-id' },
    draftImages: [{ previewUrl: 'blob:stale-camera-photo' }],
  };
}
