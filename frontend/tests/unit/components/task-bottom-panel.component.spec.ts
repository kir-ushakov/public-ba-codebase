import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { ETaskStatus, ETaskType } from '@brainassistant/contracts';
import { firstValueFrom } from 'rxjs';
import { TaskBottomPanelComponent } from 'src/app/mobile-app/components/screens/task-screen/task-bottom-panel/task-bottom-panel.component';
import { TaskScreenAction } from 'src/app/mobile-app/components/screens/task-screen/task-screen.actions';
import {
  ETaskViewMode,
  TaskScreenState,
} from 'src/app/mobile-app/components/screens/task-screen/task-screen.state';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { DeviceCameraService } from 'src/app/shared/services/pwa/device-camera.service';

describe('TaskBottomPanelComponent', () => {
  let fixture: ComponentFixture<TaskBottomPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskBottomPanelComponent],
      providers: [
        provideStore([TaskScreenState]),
        { provide: ImageService, useValue: {} },
        { provide: DeviceCameraService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskBottomPanelComponent);
    fixture.detectChanges();
  });

  it('shows Cancel and Create Task on the create screen', () => {
    const host = fixture.nativeElement as HTMLElement;
    const apply = host.querySelector<HTMLButtonElement>('[data-test="apply-changes-btn"]');

    expect(host.querySelector('[data-test="cancel-changes-btn"]')?.textContent).toContain('Cancel');
    expect(apply?.textContent).toContain('Create Task');
    expect(apply?.tagName).toBe('BUTTON');
    expect(apply?.disabled).toBe(true);
    expect(host.querySelector('img')).toBeNull();
  });

  it('labels the primary action Save Changes while editing', async () => {
    const store = TestBed.inject(Store);

    await firstValueFrom(store.dispatch(new TaskScreenAction.Opened(ETaskViewMode.Edit, null)));
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-test="apply-changes-btn"]')
        ?.textContent,
    ).toContain('Save Changes');
  });

  it('shows Mark as Active and Done for a to-do task', () => {
    showViewTask(ETaskStatus.Todo);
    const host = fixture.nativeElement as HTMLElement;
    const markActive = host.querySelector('[data-test="mark-task-active-btn"]');
    const markDone = host.querySelector('[data-test="mark-task-done-btn"]');

    expect(markActive?.tagName).toBe('BUTTON');
    expect(markActive?.textContent).toContain('Mark as Active');
    expect(markActive?.textContent).toContain('play_arrow');
    expect(markDone?.tagName).toBe('BUTTON');
    expect(markDone?.textContent).toContain('Done');
    expect(markDone?.textContent).toContain('check');
    expect(host.querySelector('[data-test="cancel-changes-btn"]')).toBeNull();
    expect(host.querySelector('img')).toBeNull();
  });

  it('hides Mark as Active for calendar and location tasks', () => {
    for (const type of [ETaskType.Calendar, ETaskType.Location]) {
      showViewTask(ETaskStatus.Todo, type);
      const host = fixture.nativeElement as HTMLElement;

      expect(host.querySelector('[data-test="mark-task-active-btn"]')).toBeNull();
      expect(host.querySelector('[data-test="mark-task-done-btn"]')?.textContent).toContain('Done');
    }
  });

  it('hides Mark as Active once the task is already active', () => {
    showViewTask(ETaskStatus.Active);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="mark-task-active-btn"]')).toBeNull();
    expect(host.querySelector('[data-test="mark-task-done-btn"]')?.textContent).toContain('Done');
  });

  it('hides both status actions once the task is done', () => {
    showViewTask(ETaskStatus.Done);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="mark-task-active-btn"]')).toBeNull();
    expect(host.querySelector('[data-test="mark-task-done-btn"]')).toBeNull();
    expect(host.querySelector('[data-test="task-view-actions"]')).toBeNull();
  });

  it('marks the task active or done from the view actions', () => {
    showViewTask(ETaskStatus.Todo);
    const store = TestBed.inject(Store);
    const dispatch = jest.spyOn(store, 'dispatch');
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-test="mark-task-active-btn"]')?.click();
    host.querySelector<HTMLButtonElement>('[data-test="mark-task-done-btn"]')?.click();

    expect(dispatch).toHaveBeenCalledWith(TaskScreenAction.MarkActiveButtonPressed);
    expect(dispatch).toHaveBeenCalledWith(TaskScreenAction.MarkDoneButtonPressed);
  });

  function showViewTask(status: ETaskStatus, type: ETaskType = ETaskType.Basic): void {
    const store = TestBed.inject(Store);
    store.reset({
      taskViewState: {
        mode: ETaskViewMode.View,
        taskViewForm: {
          formData: { title: '', description: null },
          status: false,
        },
        taskData: {
          id: 'task-1',
          userId: 'user-1',
          type,
          title: 'Buy cat food',
          status,
          createdAt: '2020-01-15T12:00:00.000Z',
          modifiedAt: '2020-01-15T12:00:00.000Z',
        },
        draftImages: [],
      },
    });
    fixture.detectChanges();
  }
});
