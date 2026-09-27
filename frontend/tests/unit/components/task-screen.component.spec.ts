import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideStore, Store } from '@ngxs/store';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TaskScreenComponent } from 'src/app/mobile-app/components/screens/task-screen/task-screen.component';
import { ContextMenuComponent } from 'src/app/shared/components/ui-elements/context-menu/context-menu.component';
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
        imports: [CommonModule, ContextMenuComponent],
        schemas: [NO_ERRORS_SCHEMA],
      },
    });

    await TestBed.configureTestingModule({
      imports: [TaskScreenComponent],
      providers: [
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

  it('shows the Task title, back control, and options menu on task view', async () => {
    const fixture = await render(ETaskViewMode.View);
    const host = fixture.nativeElement as HTMLElement;
    const menu = host.querySelector('[data-test="task-options-btn"]');

    expect(host.querySelector('[data-test="task-title"]')?.textContent).toContain('Task');
    expect(host.querySelector('[data-test="task-back"]')?.getAttribute('aria-label')).toBe('Back');
    expect(menu?.getAttribute('aria-label')).toBe('Task options');
    expect(menu?.textContent).toContain('more_vert');
    expect(host.querySelector('[data-test="create-task-title"]')).toBeNull();
    expect(host.querySelector('#completeTask')).toBeNull();
  });

  it('opens Edit task, Duplicate, and Delete task from the header menu', async () => {
    const fixture = await render(ETaskViewMode.View);
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-test="task-options-btn"]')?.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="task-options-menu"]')).not.toBeNull();
    expect(host.querySelector('[data-test="task-menu-edit"]')?.textContent).toContain('Edit task');
    const duplicate = host.querySelector<HTMLButtonElement>('[data-test="task-menu-duplicate"]');
    expect(duplicate?.textContent).toContain('Duplicate');
    expect(duplicate?.disabled).toBe(true);
    expect(host.querySelector('[data-test="task-menu-delete"]')?.textContent).toContain(
      'Delete task',
    );
    expect(host.textContent).not.toContain('Done');
  });

  it('edits the task from the options menu', async () => {
    const fixture = await render(ETaskViewMode.View);
    const host = fixture.nativeElement as HTMLElement;
    const store = TestBed.inject(Store);
    const dispatch = jest.spyOn(store, 'dispatch');

    host.querySelector<HTMLButtonElement>('[data-test="task-options-btn"]')?.click();
    fixture.detectChanges();
    host.querySelector<HTMLButtonElement>('[data-test="task-menu-edit"]')?.click();
    fixture.detectChanges();

    expect(dispatch).toHaveBeenCalledWith(TaskScreenAction.EditTaskOptionSelected);
    expect(host.querySelector('[data-test="task-options-menu"]')).toBeNull();
  });

  it('deletes the task from the options menu', async () => {
    const fixture = await render(ETaskViewMode.View);
    const host = fixture.nativeElement as HTMLElement;
    const store = TestBed.inject(Store);
    const dispatch = jest.spyOn(store, 'dispatch');

    host.querySelector<HTMLButtonElement>('[data-test="task-options-btn"]')?.click();
    fixture.detectChanges();
    host.querySelector<HTMLButtonElement>('[data-test="task-menu-delete"]')?.click();

    expect(dispatch).toHaveBeenCalledWith(TaskScreenAction.DeleteTaskOptionSelected);
  });

  it('shows the Edit Task title and more menu', async () => {
    const fixture = await render(ETaskViewMode.Edit);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="edit-task-title"]')?.textContent).toContain('Edit Task');
    expect(host.querySelector('[data-test="edit-task-back"]')?.getAttribute('aria-label')).toBe(
      'Back',
    );
    expect(host.querySelector('[data-test="edit-task-more"]')?.getAttribute('aria-label')).toBe(
      'More options',
    );
    expect(host.querySelector('[data-test="task-options-btn"]')).toBeNull();
  });
});
