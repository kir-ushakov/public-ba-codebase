import { By } from '@angular/platform-browser';
import { MbTaskScreenComponent } from '../src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.component';
import { TasksState } from 'src/app/shared/state/tasks.state';
import {
  ETaskViewMode
} from '../src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.state';
import { setupHarness } from './utils/setup-harness';
import { TINY_TRANSPARENT_PNG_DATA_URL } from './mock/tiny-png-data-url.mock';
import { MOCK_IMAGE_ID, TEST_TASK_TITLE, TEST_CLIENT_ID } from './constants/test-constants';
import { EChangedEntity, EChangeAction } from 'src/app/shared/models/change.model';
import { Task } from 'src/app/shared/models/task.model';
import { ServerChangesService } from 'src/app/shared/services/api/server-changes.service';
import { ClientChangesService } from 'src/app/shared/services/api/client-changes.service';
import { TestBed } from '@angular/core/testing';

describe('Create Task With Image', () => {

  it('should create a task with an image', async () => {

     // --- SPEP 0: Setup Harness ---
     const { harness, router, store } = await setupHarness('/')

    // --- Step 0.1: 'New Task Button' is visible on home screen ---
    const newTaskBtnDe = harness.fixture.debugElement.query(By.css('[data-test=new-task-btn]'));
    expect(newTaskBtnDe).toBeTruthy(); // New task button should be visible on home screen

    // --- STEP 1: Click on 'New Task Button' ---
    newTaskBtnDe.nativeElement.click();
    harness.detectChanges();
    expect(router.url).toBe('/task/' + ETaskViewMode.Create);

    // --- Step 1.1: 'Task Screen' is rendered ---
    const taskDe = harness.fixture.debugElement.query(By.directive(MbTaskScreenComponent));
    expect(taskDe).toBeTruthy(); // Task screen component should be rendered after navigation

    // --- Step 1.2: Title input is visible ---
    const titleInputDe = harness.fixture.debugElement.query(By.css('#titleInput'));
    expect(titleInputDe).toBeTruthy(); // Title input should be visible

     // --- Step 2.2.2: Add task title to make 'Apply Button' enabled ---
    titleInputDe.nativeElement.value = TEST_TASK_TITLE;
    titleInputDe.nativeElement.dispatchEvent(new Event('input'));
    const applyChangesBtnDe = harness.fixture.debugElement.query(By.css('[data-test=apply-changes-btn]'));
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(applyChangesBtnDe.nativeElement.disabled).toBe(false); // Apply button should be enabled after title

    // --- Step 3.1: Find 'Add Image Button' ---
    const addImageBtnDe = harness.fixture.debugElement.query(By.css('[data-test=add-image-btn]'));
    expect(addImageBtnDe).toBeTruthy(); // Add image button should be visible on task screen

    // --- Step 3.2: Click Add Image and verify added image matches mock data ---
    addImageBtnDe.nativeElement.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    const taskImageDe = harness.fixture.debugElement.query(By.css('[data-test=task-picture]'));
    expect(taskImageDe.nativeElement.src).toBe(TINY_TRANSPARENT_PNG_DATA_URL); // Image source should match mock

    // --- STEP 4: CLICK APPLY BUTTON ---
    applyChangesBtnDe.nativeElement.click();
    await harness.fixture.whenStable();
    harness.detectChanges();

    // --- Step 4.1: Task is added in Tasks State ---
    const tasksState = store.selectSnapshot(TasksState.actualTasks);
    expect(tasksState.length).toBe(1); // One task should be created
    const createdTask = tasksState.find(t => t.title === TEST_TASK_TITLE);
    expect(createdTask).toBeTruthy(); // Task with correct title should exist
    expect(createdTask.imageId).toBeTruthy(); // Task should have an imageId
    expect(createdTask.imageId).toBe(MOCK_IMAGE_ID); // ImageId should match the mock

    // --- Step 4.2: Router was redirected to Home Screen ---
    expect(router.url).toBe('/');

    // --- Step 4.3: ServerChangesService.fetch was called with clientId ---
    const serverChangesService = TestBed.inject(ServerChangesService) as jest.Mocked<ServerChangesService>;
    expect(serverChangesService.fetch).toHaveBeenCalled();
    const fetchCallArgs = serverChangesService.fetch.mock.calls[0];
    const clientId = fetchCallArgs[0];
    expect(clientId).toBe(TEST_CLIENT_ID); // ClientId should match the test constant

    // --- Step 4.4: ClientChangesService.send was called ---
    const clientChangesService = TestBed.inject(ClientChangesService) as jest.Mocked<ClientChangesService>;
    expect(clientChangesService.send).toHaveBeenCalled();
    const sendCallArgs = clientChangesService.send.mock.calls[0];
    const sentChange = sendCallArgs[0];
    expect(sentChange).toBeTruthy(); // Change should be provided
    expect(sentChange.entity).toBe(EChangedEntity.Task); // Should be a Task entity
    expect(sentChange.action).toBe(EChangeAction.Created); // Should be a Created action
    const sentTask = sentChange.object as Task;
    expect(sentTask.title).toBe(TEST_TASK_TITLE); // Should have correct title
    expect(sentTask.imageId).toBe(MOCK_IMAGE_ID); // Should have correct imageId

    
  });
});
