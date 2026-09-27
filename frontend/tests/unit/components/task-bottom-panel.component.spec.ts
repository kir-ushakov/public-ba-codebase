import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
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
});
