import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { ETaskStatus, ETaskType } from '@brainassistant/contracts';
import { taskTileDayKey } from 'src/app/mobile-app/components/common/task-tiles-panel/task-tile/helpers/format-task-tile-date.function';
import { TaskTileCalendar } from 'src/app/mobile-app/components/common/task-tiles-panel/task-tile/task-tile-calendar.service';
import { TaskTileComponent } from 'src/app/mobile-app/components/common/task-tiles-panel/task-tile/task-tile.component';
import { TaskTileDatePipe } from 'src/app/mobile-app/components/common/task-tiles-panel/task-tile/task-tile-date.pipe';
import type { Task } from 'src/app/shared/models/task.model';
import { ImageService } from 'src/app/shared/services/application/image.service';

const dayKey = signal(taskTileDayKey(new Date()));
const retain = jest.fn();
const release = jest.fn();

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
    retain.mockClear();
    release.mockClear();
    dayKey.set(taskTileDayKey(new Date()));

    await TestBed.configureTestingModule({
      imports: [TaskTileComponent],
      providers: [
        { provide: Store, useValue: { dispatch: jest.fn() } },
        { provide: Router, useValue: { navigate: jest.fn() } },
        {
          provide: ImageService,
          useValue: {
            getImageRecord: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: TaskTileCalendar,
          useValue: {
            dayKey,
            retain,
            release,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskTileComponent);
    offsetWidthOf(fixture);
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();
  });

  it('renders the task title and the more-options control', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Buy milk');
    expect(host.querySelector('[data-test="task-tile-type-icon"]')?.textContent).toContain(
      'radio_button_unchecked',
    );
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

  it('shows Today for a task created on the current local day', () => {
    const now = new Date();
    fixture.componentRef.setInput('task', { ...task, createdAt: now.toISOString() });
    fixture.detectChanges();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    expect(dateText(fixture)).toBe(`Today, ${hours}:${minutes}`);
  });

  it('shows the short month date for an older task', () => {
    const createdAt = new Date(2026, 8, 11, 12, 0, 0).toISOString();
    fixture.componentRef.setInput('task', { ...task, createdAt });
    fixture.detectChanges();

    expect(dateText(fixture)).toBe('Sep 11, 2026');
  });

  it('does not format the date again when change detection runs with the same inputs', () => {
    const transform = jest.spyOn(TaskTileDatePipe.prototype, 'transform');

    fixture.detectChanges();

    expect(transform).not.toHaveBeenCalled();
    transform.mockRestore();
  });

  it('formats the date again when the task date changes', () => {
    const transform = jest.spyOn(TaskTileDatePipe.prototype, 'transform');
    const createdAt = new Date(2026, 0, 2, 8, 5, 0).toISOString();

    fixture.componentRef.setInput('task', { ...task, createdAt });
    fixture.detectChanges();

    expect(transform).toHaveBeenCalledTimes(1);
    expect(dateText(fixture)).toBe('Jan 2, 2026');
    transform.mockRestore();
  });

  it('releases the shared calendar when the tile is destroyed', () => {
    expect(retain).toHaveBeenCalledTimes(1);
    fixture.destroy();
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('replaces Today on every visible tile when the calendar day changes', () => {
    const createdAt = new Date(2026, 9, 31, 10, 24, 0);
    const clock = mockNow(createdAt);
    const second = TestBed.createComponent(TaskTileComponent);
    try {
      const tiles = [fixture, second];

      for (const tile of tiles) {
        tile.componentRef.setInput('task', { ...task, createdAt: createdAt.toISOString() });
        tile.detectChanges();
        expect(dateText(tile)).toBe('Today, 10:24');
      }

      clock.at(new Date(2026, 10, 1, 0, 5, 0));
      dayKey.set(taskTileDayKey(new Date()));
      for (const tile of tiles) {
        tile.detectChanges();
        expect(dateText(tile)).toBe('Oct 31, 2026');
      }
    } finally {
      second.destroy();
      clock.restore();
    }
  });

  it('does not measure a tile that has no image', () => {
    expect(offsetWidthReads(fixture)).toBe(0);
    expect(fixture.componentInstance.calculatedImageWidth()).toBeUndefined();
    expect((fixture.nativeElement as HTMLElement).querySelector('img')).toBeNull();
  });

  it('measures an image tile once', () => {
    const imageFixture = TestBed.createComponent(TaskTileComponent);
    const reads = offsetWidthOf(imageFixture);
    reads.mockReturnValue(180);

    imageFixture.componentRef.setInput('task', { ...task, imageId: 'img-1' });
    imageFixture.detectChanges();

    expect(reads).toHaveBeenCalledTimes(1);
    expect(imageFixture.componentInstance.calculatedImageWidth()).toBe(
      180 * (window.devicePixelRatio || 1),
    );
    expect((imageFixture.nativeElement as HTMLElement).querySelector('img')).not.toBeNull();

    imageFixture.detectChanges();
    expect(reads).toHaveBeenCalledTimes(1);
    imageFixture.destroy();
  });

  it('formats the date again when the calendar day changes', () => {
    const transform = jest.spyOn(TaskTileDatePipe.prototype, 'transform');

    dayKey.set(`${dayKey()} + 1`);
    fixture.detectChanges();

    expect(transform).toHaveBeenCalledTimes(1);
    transform.mockRestore();
  });

  it('uses the Notes icon on a Notes card', () => {
    fixture.componentRef.setInput('task', { ...task, status: ETaskStatus.Notes });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-test="task-tile-type-icon"]')?.textContent).toContain(
      'article',
    );
  });
});

const widthReads = new WeakMap<HTMLElement, jest.SpyInstance<number, []>>();

function offsetWidthOf(tile: ComponentFixture<TaskTileComponent>): jest.SpyInstance<number, []> {
  const element = tile.nativeElement as HTMLElement;
  const existing = widthReads.get(element);
  if (existing) {
    return existing;
  }
  const reads = jest.spyOn(element, 'offsetWidth', 'get');
  widthReads.set(element, reads);
  return reads;
}

function offsetWidthReads(tile: ComponentFixture<TaskTileComponent>): number {
  return offsetWidthOf(tile).mock.calls.length;
}

function mockNow(start: Date): { at(next: Date): void; restore(): void } {
  let current = start.getTime();
  const RealDate = Date;
  const spy = jest.spyOn(global, 'Date').mockImplementation((...args: unknown[]) => {
    if (args.length === 0) {
      return new RealDate(current);
    }
    return new RealDate(...(args as ConstructorParameters<typeof RealDate>));
  });
  return {
    at(next: Date): void {
      current = next.getTime();
    },
    restore(): void {
      spy.mockRestore();
    },
  };
}

function dateText(fixture: ComponentFixture<TaskTileComponent>): string {
  return (
    (fixture.nativeElement as HTMLElement).querySelector('[data-test="task-tile-date"]')
      ?.textContent ?? ''
  ).trim();
}
