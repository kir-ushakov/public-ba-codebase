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

  it('shows Add photo before the attached images', () => {
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
          imageId: 'cover-id',
          images: ['cover-id', 'second-id'],
          createdAt: '2020-01-15T12:00:00.000Z',
          modifiedAt: '2020-01-15T12:00:00.000Z',
        },
        draftImages: [{ imageId: 'cover-id' }, { imageId: 'second-id' }],
      },
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const addButton = host.querySelector('[data-test="add-image-btn"]');
    const firstTile = host.querySelector('[data-test="task-image-tile"]');

    expect(host.querySelector('[data-test="task-images-section"]')?.textContent).toContain(
      'Images (2)',
    );
    expect(addButton?.textContent).toContain('Add photo');
    expect(host.querySelectorAll('[data-test="task-image-tile"]').length).toBe(2);
    expect(host.querySelector('[data-test="task-image-cover"]')?.textContent).toContain('COVER');
    expect(host.querySelectorAll('[data-test="task-image-select"]').length).toBe(2);
    expect(host.querySelectorAll('[data-test="task-image-remove"]').length).toBe(2);
    expect(
      addButton !== null &&
        firstTile !== null &&
        (addButton.compareDocumentPosition(firstTile) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
    ).toBe(true);
  });

  it('shows read-only tags and an Add tag button instead of the create selector', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="task-tags-selector"]')).toBeNull();
    expect(host.querySelector('[data-test="task-tags-add"]')?.textContent).toContain('Add tag');
    expect(host.querySelector('[data-test="selected-tag-remove"]')).toBeNull();
    expect(host.querySelector('[data-test="selected-tags"]')?.textContent).toContain('Work');
  });
});
