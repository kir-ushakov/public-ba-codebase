import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MbTaskScreenComponent } from '../src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.component';
import { TasksState } from 'src/app/shared/state/tasks.state';
import {
  ETaskViewMode
} from '../src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.state';
import { DeviceCameraService } from 'src/app/shared/services/pwa/device-camera.service';
import { MbTaskScreenAction } from 'src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.actions';
import { firstValueFrom } from 'rxjs';
import { setupHarness } from './utils/setup-harness';
import { Store } from '@ngxs/store';
import { TINY_TRANSPARENT_PNG_DATA_URL } from './mock/tiny-png-data-url.mock';

// Test constants
const MOCK_IMAGE_ID = 'mock-image-id';
const TEST_TASK_TITLE = 'Test Task with Image';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-image-id'),
}));

describe('Create Task With Image', () => {

  it('should create a task with an image', async () => {
    const { harness, router, store } = await setupHarness('/')

    // --- Step 1.1: Find New Task Btn ---
    const newTaskBtnDe = harness.fixture.debugElement.query(By.css('[data-test=new-task-btn]'));
    expect(newTaskBtnDe).toBeTruthy(); // New task button should be visible on home screen

    // --- Step 1.2: Navigate to Task Creation ---
    newTaskBtnDe.nativeElement.click();
    harness.detectChanges();
    expect(router.url).toBe('/task/' + ETaskViewMode.Create);

    // --- Step 2.1: Verify Task screen is rendered ---
    const taskDe = harness.fixture.debugElement.query(By.directive(MbTaskScreenComponent));
    expect(taskDe).toBeTruthy(); // Task screen component should be rendered after navigation

    // --- Step 2.2: Add task title to make form valid ---
    const titleInputDe = harness.fixture.debugElement.query(By.css('#titleInput'));
    expect(titleInputDe).toBeTruthy(); // Title input should be visible
    titleInputDe.nativeElement.value = TEST_TASK_TITLE;
    titleInputDe.nativeElement.dispatchEvent(new Event('input'));
    harness.detectChanges();

    // --- Step 2.3: Find 'Add Image Button' ---
    const addImageBtnDe = harness.fixture.debugElement.query(By.css('[data-test=add-image-btn]'));
    expect(addImageBtnDe).toBeTruthy(); // Add image button should be visible on task screen

    // --- Step 3: Click Add Image and verify camera service invoked ---
    addImageBtnDe.nativeElement.click();
    const cameraService = TestBed.inject(DeviceCameraService) as jest.Mocked<DeviceCameraService>;
    expect(cameraService.takePicture).toHaveBeenCalled();

    // Wait for async state update to complete
    await harness.fixture.whenStable();
    harness.detectChanges();

    // --- Step 4: Verify added image matches mock data ---
    const taskImageDe = harness.fixture.debugElement.query(By.css('[data-test=task-picture]'));
    expect(taskImageDe).toBeTruthy(); // Added image should be visible
    expect(taskImageDe.nativeElement.src).toBe(TINY_TRANSPARENT_PNG_DATA_URL); // Image source should match mock

    // --- Step 5.1: Find create button and click---
    const applyChangesBtnDe = harness.fixture.debugElement.query(By.css('[data-test=apply-changes-btn]'));
    expect(applyChangesBtnDe).toBeTruthy(); // 'Apply Chnages Button' should be visible
    applyChangesBtnDe.nativeElement.click();
   
    
    // Wait for async state update to complete
    await harness.fixture.whenStable();
    await firstValueFrom(TestBed.inject(Store).dispatch(MbTaskScreenAction.ApplyButtonPressed));
    harness.detectChanges();

    expect(applyChangesBtnDe.nativeElement.disabled).toBe(false);

    // --- Step 5.2: Task should be added in Tasks State ---
    const tasksState = store.selectSnapshot(TasksState.actualTasks);
    expect(tasksState.length).toBe(1); // One task should be created
    expect(tasksState[0].imageId).toBeTruthy(); // Task should have an imageId
    expect(tasksState[0].imageId).toBe(MOCK_IMAGE_ID); // ImageId should match the mock
    expect(tasksState[0].title).toBe(TEST_TASK_TITLE); // Title should match the input
  });
});
