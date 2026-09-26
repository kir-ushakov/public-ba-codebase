import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import {
  ETaskViewMode,
  TaskScreenState,
} from 'src/app/mobile-app/components/screens/task-screen/task-screen.state';
import { TaskScreenAction } from 'src/app/mobile-app/components/screens/task-screen/task-screen.actions';
import { ETaskStatus, ETaskType, Task, defaultTask } from 'src/app/shared/models/task.model';
import { AuthService } from 'src/app/shared/services/api/auth.service';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { DeviceCameraService } from 'src/app/shared/services/pwa/device-camera.service';
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
    deviceCameraService.takePicture
      .mockResolvedValueOnce('blob:first-photo')
      .mockResolvedValueOnce('blob:second-photo');
    imageService.saveImage.mockResolvedValueOnce('second-image-id');

    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Create, null)));
    await firstValueFrom(store.dispatch(TaskScreenAction.AddPictureBtnPressed));
    await firstValueFrom(store.dispatch(TaskScreenAction.AddPictureBtnPressed));
    await firstValueFrom(
      store.dispatch(new TaskScreenAction.DraftImageRemoved({ previewUrl: 'blob:first-photo' })),
    );
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, {
          title: 'Task with the remaining photo',
          description: null,
        }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    const created = store
      .selectSnapshot(TasksState.allTasks)
      .find(t => t.id !== existingWithPhoto.id);

    expect(imageService.saveImage).toHaveBeenCalledTimes(1);
    expect(imageService.saveImage).toHaveBeenCalledWith('blob:second-photo');
    expect(created?.imageId).toBe('second-image-id');
    expect(created?.images).toEqual(['second-image-id']);
  });

  it('keeps the cover when a later photo is removed', async () => {
    deviceCameraService.takePicture
      .mockResolvedValueOnce('blob:first-photo')
      .mockResolvedValueOnce('blob:second-photo');
    imageService.saveImage.mockResolvedValueOnce('first-image-id');

    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Create, null)));
    await firstValueFrom(store.dispatch(TaskScreenAction.AddPictureBtnPressed));
    await firstValueFrom(store.dispatch(TaskScreenAction.AddPictureBtnPressed));
    await firstValueFrom(
      store.dispatch(new TaskScreenAction.DraftImageRemoved({ previewUrl: 'blob:second-photo' })),
    );
    await firstValueFrom(
      store.dispatch(
        new TaskScreenAction.UpdateFormData(true, {
          title: 'Task that kept its cover',
          description: null,
        }),
      ),
    );
    await firstValueFrom(store.dispatch(TaskScreenAction.ApplyButtonPressed));

    const created = store
      .selectSnapshot(TasksState.allTasks)
      .find(t => t.id !== existingWithPhoto.id);

    expect(created?.imageId).toBe('first-image-id');
    expect(created?.images).toEqual(['first-image-id']);
  });

  it('loads the selected task when opening view mode', async () => {
    await firstValueFrom(
      store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.View, existingWithPhoto.id)),
    );

    expect(store.selectSnapshot(TaskScreenState.task)).toEqual(existingWithPhoto);
    expect(store.selectSnapshot(TaskScreenState.draftImages)).toEqual([]);
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
});

function leftoverCreateState() {
  return {
    mode: ETaskViewMode.Create,
    taskViewForm: {
      formData: { title: '', description: null },
      status: false,
    },
    taskData: { ...defaultTask, imageId: 'old-image-id' },
    isSideMenuOpened: false,
    draftImages: [{ previewUrl: 'blob:stale-camera-photo' }],
  };
}
