import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { ETaskStatus, ETaskType } from '@brainassistant/contracts';
import { TaskViewComponent } from 'src/app/mobile-app/components/screens/task-screen/task-view/task-view.component';
import {
  ETaskViewMode,
  TaskScreenState,
} from 'src/app/mobile-app/components/screens/task-screen/task-screen.state';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { DeviceCameraService } from 'src/app/shared/services/pwa/device-camera.service';

describe('TaskViewComponent title', () => {
  let fixture: ComponentFixture<TaskViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskViewComponent],
      providers: [
        provideStore([TaskScreenState]),
        { provide: ImageService, useValue: {} },
        { provide: DeviceCameraService, useValue: {} },
      ],
    }).compileComponents();

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
          type: ETaskType.Basic,
          title: 'Buy cat food',
          status: ETaskStatus.Todo,
          createdAt: '2020-01-15T12:00:00.000Z',
          modifiedAt: '2020-01-15T12:00:00.000Z',
        },
        draftImages: [],
      },
    });

    fixture = TestBed.createComponent(TaskViewComponent);
    fixture.detectChanges();
  });

  it('shows the task title as read-only text', () => {
    const title = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-test="task-view-title"]',
    );

    expect(title?.textContent).toContain('Buy cat food');
    expect(title?.tagName).toBe('H2');
    expect(title?.querySelector('input, textarea')).toBeNull();
  });

  it('hides the description card when the task has no description', () => {
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-test="task-view-description"]'),
    ).toBeNull();
  });

  it('shows the description as read-only text inside a card', () => {
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
          type: ETaskType.Basic,
          title: 'Buy cat food',
          status: ETaskStatus.Todo,
          description: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Remember to buy the usual dry food for the cat.' },
                ],
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Check if they have the new salmon variant.',
                    marks: [{ type: 'bold' }],
                  },
                ],
              },
            ],
          },
          createdAt: '2020-01-15T12:00:00.000Z',
          modifiedAt: '2020-01-15T12:00:00.000Z',
        },
        draftImages: [],
      },
    });
    fixture.detectChanges();

    const card = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-test="task-view-description"]',
    );

    expect(card?.textContent).toContain('Description');
    expect(card?.textContent).toContain('Remember to buy the usual dry food for the cat.');
    expect(card?.querySelector('strong')?.textContent).toContain('salmon variant');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-test="task-description-editor"]'),
    ).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('[contenteditable]')).toBeNull();
  });
});
