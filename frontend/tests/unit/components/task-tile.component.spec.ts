import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { ETaskStatus, ETaskType } from '@brainassistant/contracts';
import { TaskTileComponent } from 'src/app/mobile-app/components/common/task-tiles-panel/task-tile/task-tile.component';
import type { Task } from 'src/app/shared/models/task.model';
import { ImageService } from 'src/app/shared/services/application/image.service';

const task: Task = {
  id: 'task-1',
  userId: 'user-1',
  type: ETaskType.Basic,
  title: 'Buy milk',
  status: ETaskStatus.Todo,
  createdAt: '2020-01-15T12:00:00.000Z',
  modifiedAt: '2020-01-15T12:00:00.000Z',
};

describe('TaskTileComponent', () => {
  let fixture: ComponentFixture<TaskTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskTileComponent],
      providers: [
        { provide: Store, useValue: { dispatch: jest.fn() } },
        { provide: Router, useValue: { navigate: jest.fn() } },
        {
          provide: ImageService,
          useValue: {
            getImageRecord: jest.fn().mockResolvedValue(undefined),
            probeRemoteImage: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskTileComponent);
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();
  });

  it('renders the task title and the more-options control', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Buy milk');
    expect(host.querySelector('[data-test="task-tile-more"]')).not.toBeNull();
  });

  it('keeps the overflow menu closed until More is pressed', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="task-tile-menu"]')).toBeNull();

    const more = host.querySelector('[data-test="task-tile-more"]');
    expect(more).not.toBeNull();
    (more as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="task-tile-menu"]')).not.toBeNull();
    expect(host.querySelector('[data-test="task-tile-menu-edit"]')?.textContent).toContain('Edit');
    expect(host.querySelector('[data-test="task-tile-menu-delete"]')?.textContent).toContain(
      'Delete',
    );
  });
});
