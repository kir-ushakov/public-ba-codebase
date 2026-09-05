import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import {
  ETaskViewMode,
  MbTaskScreenState,
} from 'src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.state';
import { MbTaskScreenAction } from 'src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.actions';
import { ETaskStatus, ETaskType, Task, defaultTask } from 'src/app/shared/models/task.model';
import { AuthService } from 'src/app/shared/services/api/auth.service';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { DeviceCameraService } from 'src/app/shared/services/pwa/device-camera.service';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { EUserAuthState, UserState } from 'src/app/shared/state/user.state';

describe('MbTaskScreenState', () => {
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
        provideStore([MbTaskScreenState, TasksState, UserState]),
        { provide: AuthService, useValue: {} },
        { provide: SlackService, useValue: {} },
        { provide: ImageService, useValue: imageService },
        { provide: DeviceCameraService, useValue: deviceCameraService },
      ],
    });

    store = TestBed.inject(Store);
    store.reset({
      mbTaskViewState: leftoverCreateState(),
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
    await firstValueFrom(store.dispatch(new MbTaskScreenAction.Opened(ETaskViewMode.Create, null)));

    expect(store.selectSnapshot(MbTaskScreenState.imageUri)).toBeNull();
    expect(store.selectSnapshot(MbTaskScreenState.task).imageId).toBeUndefined();
  });

  it('does not attach a previous photo when creating a title-only task', async () => {
    await firstValueFrom(store.dispatch(new MbTaskScreenAction.Opened(ETaskViewMode.Create, null)));
    await firstValueFrom(
      store.dispatch(new MbTaskScreenAction.UpdateFormData(true, { title: 'Fresh task title' })),
    );
    await firstValueFrom(store.dispatch(MbTaskScreenAction.ApplyButtonPressed));

    const created = store
      .selectSnapshot(TasksState.allTasks)
      .find(t => t.id !== existingWithPhoto.id);

    expect(imageService.saveImage).not.toHaveBeenCalled();
    expect(created).toMatchObject({ title: 'Fresh task title', userId });
    expect(created.imageId).toBeUndefined();
  });

  it('still saves a photo taken during the current create session', async () => {
    deviceCameraService.takePicture.mockResolvedValue('blob:current-session-photo');

    await firstValueFrom(store.dispatch(new MbTaskScreenAction.Opened(ETaskViewMode.Create, null)));
    await firstValueFrom(store.dispatch(MbTaskScreenAction.AddPictureBtnPressed));
    await firstValueFrom(
      store.dispatch(
        new MbTaskScreenAction.UpdateFormData(true, { title: 'Task with a new photo' }),
      ),
    );
    await firstValueFrom(store.dispatch(MbTaskScreenAction.ApplyButtonPressed));

    const created = store
      .selectSnapshot(TasksState.allTasks)
      .find(t => t.id !== existingWithPhoto.id);

    expect(imageService.saveImage).toHaveBeenCalledWith('blob:current-session-photo');
    expect(created.imageId).toBe('new-image-id');
  });

  it('loads the selected task when opening view mode', async () => {
    await firstValueFrom(
      store.dispatch(new MbTaskScreenAction.Opened(ETaskViewMode.View, existingWithPhoto.id)),
    );

    expect(store.selectSnapshot(MbTaskScreenState.task)).toEqual(existingWithPhoto);
    expect(store.selectSnapshot(MbTaskScreenState.imageUri)).toBeNull();
  });
});

function leftoverCreateState() {
  return {
    mode: ETaskViewMode.Create,
    taskViewForm: {
      formData: { title: '' },
      status: false,
    },
    taskData: { ...defaultTask, imageId: 'old-image-id' },
    isSideMenuOpened: false,
    imageUrl: 'blob:stale-camera-photo',
  };
}
