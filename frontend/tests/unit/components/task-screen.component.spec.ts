import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSidenavModule } from '@angular/material/sidenav';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideStore, Store } from '@ngxs/store';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TaskScreenComponent } from 'src/app/mobile-app/components/screens/task-screen/task-screen.component';
import { TaskScreenAction } from 'src/app/mobile-app/components/screens/task-screen/task-screen.actions';
import {
  ETaskViewMode,
  TaskScreenState,
} from 'src/app/mobile-app/components/screens/task-screen/task-screen.state';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { DeviceCameraService } from 'src/app/shared/services/pwa/device-camera.service';

describe('TaskScreenComponent create header', () => {
  async function render(mode: ETaskViewMode): Promise<ComponentFixture<TaskScreenComponent>> {
    TestBed.overrideComponent(TaskScreenComponent, {
      set: {
        imports: [CommonModule, MatSidenavModule],
        schemas: [NO_ERRORS_SCHEMA],
      },
    });

    await TestBed.configureTestingModule({
      imports: [TaskScreenComponent],
      providers: [
        provideNoopAnimations(),
        provideStore([TaskScreenState]),
        { provide: ImageService, useValue: {} },
        { provide: DeviceCameraService, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ mode })),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskScreenComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the Create Task title and back control, without an overflow menu', async () => {
    const fixture = await render(ETaskViewMode.Create);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="create-task-title"]')?.textContent).toContain(
      'Create Task',
    );
    expect(host.querySelector('[data-test="create-task-back"]')?.getAttribute('aria-label')).toBe(
      'Back',
    );
    expect(host.querySelector('[data-test="create-task-more"]')).toBeNull();
  });

  it('goes back when the back control is pressed', async () => {
    const fixture = await render(ETaskViewMode.Create);
    const store = TestBed.inject(Store);
    const dispatch = jest.spyOn(store, 'dispatch');

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-test="create-task-back"]')
      ?.click();

    expect(dispatch).toHaveBeenCalledWith(TaskScreenAction.CancelButtonPressed);
  });

  it('keeps the create header off task view', async () => {
    const fixture = await render(ETaskViewMode.View);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="create-task-title"]')).toBeNull();
    expect(host.querySelector('ba-task-top-panel')).not.toBeNull();
  });
});
