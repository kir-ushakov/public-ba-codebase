import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideLocationMocks } from "@angular/common/testing";
import { TestBed } from "@angular/core/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { MbHomeScreenComponent } from "src/app/mobile-app/components/screens/mb-home-screen/mb-home-screen.component";
import { MbTaskScreenComponent } from "src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.component";
import { ETaskViewMode, MbTaskScreenState } from "src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.state";
import { MobileAppState } from "src/app/mobile-app/mobile-app.state";
import { defaultTask } from "src/app/shared/models/task.model";
import { AppState } from "src/app/shared/state/app.state";
import { TasksState } from "src/app/shared/state/tasks.state";
import { UserState } from "src/app/shared/state/user.state";
import { DeviceCameraService } from "src/app/shared/services/pwa/device-camera.service";
import { FetchService } from "src/app/shared/services/infrastructure/fetch.service";
import { ImageDbService } from "src/app/shared/services/infrastructure/image-db.service";
import { ImageOptimizerService } from "src/app/shared/services/utility/image-optimizer.service";
import { ImageUploaderService } from "src/app/shared/services/api/image-uploader.service";
import { ImageService } from "src/app/shared/services/infrastructure/image.service";
import { DatabaseService } from "src/app/shared/services/infrastructure/database.service";
import { mockCameraService, mockFetchService, mockImageDbService, mockImageOptimizerService, mockImageUploaderService } from "../mock/services.mock";

export async function setupHarness(startUrl = '/') {
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
        { provide: DeviceCameraService, useValue: mockCameraService },
        ImageService,
        { provide: FetchService, useValue: mockFetchService },
        { provide: ImageDbService, useValue: mockImageDbService },
        { provide: ImageOptimizerService, useValue: mockImageOptimizerService },
        { provide: ImageUploaderService, useValue: mockImageUploaderService },
    ]
  });

  // Ensure IndexedDB is initialized before tests
  const dbService = TestBed.inject(DatabaseService);
  await dbService.getDatabase();

  const store = TestBed.inject(Store);
  store.reset({
    app: {},
    tasks: { entities: [] },
    user: { userData: { userId: 'test-user-id' } },
    mobileApp: {
      mbTaskViewState: {
        mode: ETaskViewMode.Create,
        taskData: defaultTask,
        taskViewForm: { formData: { title: '' }, status: false },
        isSideMenuOpened: false,
        voiceToTextConverting: false,
        imageUrl: null,
      },
    },
  });

  const router = TestBed.inject(Router);
  const harness = await RouterTestingHarness.create(startUrl);

  return { harness, store, router };
}