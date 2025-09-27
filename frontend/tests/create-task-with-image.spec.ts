import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { MbHomeScreenComponent } from '../src/app/mobile-app/components/screens/mb-home-screen/mb-home-screen.component';
import { MbTaskScreenComponent } from '../src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.component';
import { NgxsModule, Store } from '@ngxs/store';
import { AppState } from 'src/app/shared/state/app.state';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { UserState } from 'src/app/shared/state/user.state';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MobileAppState } from '../src/app/mobile-app/mobile-app.state';
import {
  ETaskViewMode,
  MbTaskScreenState,
} from '../src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.state';
import { defaultTask } from 'src/app/shared/models/task.model';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DatabaseService } from 'src/app/shared/services/infrastructure/database.service';

describe('Create Task With Image', () => {
  let fixture: ComponentFixture<MbHomeScreenComponent>;
  let component: MbHomeScreenComponent;
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    // --- Configure TestBed ---
    await TestBed.configureTestingModule({
      imports: [
        MbHomeScreenComponent,
        NgxsModule.forRoot([AppState, TasksState, UserState, MobileAppState, MbTaskScreenState]),
      ],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', component: MbHomeScreenComponent },
          { path: 'task/:mode', component: MbTaskScreenComponent },
          { path: 'task/:mode/:id', component: MbTaskScreenComponent },
        ]),
        provideLocationMocks(),
        provideNoopAnimations(),
        // TaskService,
        // { provide: CameraService, useClass: FakeCameraService },
        // { provide: IndexedDbService, useClass: InMemoryDbService },
      ],
    }).compileComponents();

    // --- Ensure IndexedDB is initialized before tests ---
    const dbService = TestBed.inject(DatabaseService);
    await dbService.getDatabase();

    // --- Reset NGXS store state for predictable tests ---
    const store = TestBed.inject(Store);
    store.reset({
      app: {},
      tasks: {
        entities: [],
      },
      user: {
        userData: { userId: 'test-user-id' },
      },
      mobileApp: {
        mbTaskViewState: {
          mode: ETaskViewMode.Create,
          taskData: defaultTask,
          taskViewForm: {
            formData: { title: '' },
            status: false,
          },
          isSideMenuOpened: false,
          voiceToTextConverting: false,
          imageUrl: null,
        },
      },
    });

    // --- Router harness ---
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create('/');
  });

  it('should create a task with an image', async () => {
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

    // --- Step 2.2: Find Add Image Button ---
    const addImageBtnDe = harness.fixture.debugElement.query(By.css('[data-test=add-image-btn]'));
    expect(addImageBtnDe).toBeTruthy(); // Add image button should be visible on task screen

    // --- Step 3: Simulate adding image (to be implemented later) ---
    // taskDe.query(By.css('[data-test=task-submit]')).nativeElement.click();
    // harness.detectChanges();
  });
});
