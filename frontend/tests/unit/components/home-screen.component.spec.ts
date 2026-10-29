import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore, Store } from '@ngxs/store';
import { ETaskStatus, ETaskType } from '@brainassistant/contracts';
import { HomeScreenComponent } from 'src/app/mobile-app/components/screens/home-screen/home-screen.component';
import { HomeContentModeService } from 'src/app/mobile-app/components/screens/home-screen/home-content-mode.service';
import type { Task } from 'src/app/shared/models/task.model';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { AuthService } from 'src/app/shared/services/api/auth.service';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { TAG_COLOR } from 'src/app/shared/models/tag.model';
import { AppState } from 'src/app/shared/state/app.state';
import { TagsState } from 'src/app/shared/state/tags.state';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { EUserAuthState, UserState } from 'src/app/shared/state/user.state';

const userId = 'user-1';

const catTask: Task = {
  id: 'task-cat',
  userId,
  type: ETaskType.Basic,
  title: 'Buy cat food',
  status: ETaskStatus.Active,
  createdAt: '2026-09-12T10:00:00.000Z',
  modifiedAt: '2026-09-12T10:00:00.000Z',
};

const lampTask: Task = {
  id: 'task-lamp',
  userId,
  type: ETaskType.Basic,
  title: 'Lamp photo',
  tagIds: ['tag-errands', 'tag-other-user'],
  status: ETaskStatus.Active,
  createdAt: '2026-09-11T10:00:00.000Z',
  modifiedAt: '2026-09-11T10:00:00.000Z',
};

describe('HomeScreenComponent search', () => {
  let fixture: ComponentFixture<HomeScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeScreenComponent],
      providers: [
        provideRouter([]),
        provideStore([AppState, TasksState, TagsState, UserState]),
        { provide: AuthService, useValue: {} },
        { provide: SlackService, useValue: {} },
        {
          provide: ImageService,
          useValue: {
            getImageRecord: jest.fn().mockResolvedValue(undefined),
            probeRemoteImage: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    const store = TestBed.inject(Store);
    store.reset({
      app: { online: false },
      tasks: { entities: [catTask, lampTask] },
      tags: {
        entities: [
          {
            id: 'tag-errands',
            userId,
            name: 'Errands',
            color: TAG_COLOR,
            createdAt: '2026-09-10T10:00:00.000Z',
            modifiedAt: '2026-09-10T10:00:00.000Z',
          },
          {
            id: 'tag-other-user',
            userId: 'someone-else',
            name: 'Secret',
            color: TAG_COLOR,
            createdAt: '2026-09-10T10:00:00.000Z',
            modifiedAt: '2026-09-10T10:00:00.000Z',
          },
        ],
      },
      user: {
        userData: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          userId,
          googleId: 'g-1',
        },
        authState: EUserAuthState.Authenticated,
        authType: undefined,
        integrations: { isAddedToSlack: undefined },
      },
    });

    TestBed.inject(HomeContentModeService).select('active');
    fixture = TestBed.createComponent(HomeScreenComponent);
    fixture.detectChanges();
  });

  it('opens a search field and hides the header icon buttons', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="home-search-input"]')).toBeNull();

    (host.querySelector('[data-test="home-search"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="home-search-input"]')).not.toBeNull();
    expect(host.querySelector('[data-test="home-search-cancel"]')?.textContent).toContain('Cancel');
    expect(host.querySelector('[data-test="home-search"]')).toBeNull();
    expect(host.querySelector('[data-test="home-more"]')).toBeNull();
  });

  it('hides tiles that do not match and keeps the full item count', () => {
    const host = openSearch(fixture);

    typeQuery(fixture, 'cat');

    expect(tileText(host)).toContain('Buy cat food');
    expect(tileText(host)).not.toContain('Lamp photo');
    expect(host.querySelector('[data-test="home-item-count"]')?.textContent).toContain(
      '2 active items',
    );
    expect(host.querySelector('[data-test="home-search-clear"]')).not.toBeNull();
  });

  it('keeps a tile when the query matches its tag name', () => {
    const host = openSearch(fixture);

    typeQuery(fixture, 'errand');

    expect(tileText(host)).toContain('Lamp photo');
    expect(tileText(host)).not.toContain('Buy cat food');
  });

  it('ignores a tag that belongs to another user', () => {
    const host = openSearch(fixture);

    typeQuery(fixture, 'secret');

    expect(host.querySelector('[data-test="task-tile"]')).toBeNull();
    expect(host.querySelector('[data-test="home-search-empty"]')?.textContent).toContain(
      'No results',
    );
  });

  it('shows a plain empty line when nothing matches', () => {
    const host = openSearch(fixture);

    typeQuery(fixture, 'missing');

    expect(host.querySelector('[data-test="task-tile"]')).toBeNull();
    expect(host.querySelector('[data-test="home-search-empty"]')?.textContent).toContain(
      'No results',
    );
    expect(host.querySelector('[data-test="home-empty"]')).toBeNull();
    expect(host.querySelector('[data-test="home-item-count"]')?.textContent).toContain(
      '2 active items',
    );
  });

  it('clears the query without leaving search', () => {
    const host = openSearch(fixture);
    typeQuery(fixture, 'cat');

    (host.querySelector('[data-test="home-search-clear"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="home-search-input"]')).not.toBeNull();
    expect(host.querySelector('[data-test="home-search"]')).toBeNull();
    expect(tileText(host)).toContain('Buy cat food');
    expect(tileText(host)).toContain('Lamp photo');
    expect(host.querySelector('[data-test="home-search-clear"]')).toBeNull();
  });

  it('restores the icon buttons and the full list on cancel', () => {
    const host = openSearch(fixture);
    typeQuery(fixture, 'cat');

    (host.querySelector('[data-test="home-search-cancel"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="home-search-input"]')).toBeNull();
    expect(host.querySelector('[data-test="home-search"]')).not.toBeNull();
    expect(host.querySelector('[data-test="home-more"]')).not.toBeNull();
    expect(tileText(host)).toContain('Buy cat food');
    expect(tileText(host)).toContain('Lamp photo');
  });

  it('defaults to Active and filters the grid when another mode is selected', () => {
    const host = fixture.nativeElement as HTMLElement;
    const store = TestBed.inject(Store);
    const todo: Task = {
      ...catTask,
      id: 'task-todo',
      title: 'Write the brief',
      status: ETaskStatus.Todo,
    };
    const notes: Task = {
      ...catTask,
      id: 'task-notes',
      title: 'Saved article',
      status: ETaskStatus.Notes,
    };
    const done: Task = {
      ...catTask,
      id: 'task-done',
      title: 'Finished task',
      status: ETaskStatus.Done,
    };

    store.reset({
      app: { online: false },
      tasks: { entities: [catTask, todo, notes, done] },
      tags: { entities: [] },
      user: {
        userData: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          userId,
          googleId: 'g-1',
        },
        authState: EUserAuthState.Authenticated,
        authType: undefined,
        integrations: { isAddedToSlack: undefined },
      },
    });
    fixture.detectChanges();

    expect(
      host.querySelector('[data-test="home-mode-active"]')?.getAttribute('aria-selected'),
    ).toBe('true');
    expect(host.querySelector('[data-test="home-mode-count-active"]')?.textContent).toContain('1');
    expect(host.querySelector('[data-test="home-mode-count-todo"]')?.textContent).toContain('1');
    expect(host.querySelector('[data-test="home-mode-count-notes"]')?.textContent).toContain('1');
    expect(host.querySelector('[data-test="home-item-count"]')?.textContent).toContain(
      '1 active item',
    );
    expect(tileText(host)).toContain('Buy cat food');
    expect(tileText(host)).not.toContain('Write the brief');
    expect(tileText(host)).not.toContain('Saved article');
    expect(tileText(host)).not.toContain('Finished task');

    (host.querySelector('[data-test="home-mode-todo"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="home-mode-todo"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(host.querySelector('[data-test="home-item-count"]')?.textContent).toContain(
      '1 to do item',
    );
    expect(tileText(host)).toContain('Write the brief');
    expect(tileText(host)).not.toContain('Buy cat food');
    expect(tileText(host)).not.toContain('Finished task');

    (host.querySelector('[data-test="home-mode-notes"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="home-item-count"]')?.textContent).toContain('1 note');
    expect(tileText(host)).toContain('Saved article');
    expect(tileText(host)).not.toContain('Finished task');
  });

  it('replaces an empty mode with its mascot and keeps the create button', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="home-empty"]')).toBeNull();
    expect(tileText(host)).toContain('Buy cat food');
    expect(host.querySelector('[data-test="new-task-btn"]')).not.toBeNull();

    (host.querySelector('[data-test="home-mode-todo"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="home-empty-title"]')?.textContent).toContain(
      'Your to-do list is empty.',
    );
    expect(host.querySelector('[data-test="home-empty-body"]')?.textContent).toContain(
      'Add a new task, capture an idea or move something from notes.',
    );
    expect(host.querySelector('[data-test="home-empty-art"]')?.getAttribute('src')).toContain(
      'empty-todo.svg',
    );
    expect(host.querySelector('[data-test="task-tile"]')).toBeNull();
    expect(host.querySelector('[data-test="new-task-btn"]')).not.toBeNull();
    expect(host.querySelector('[data-test="home-item-count"]')?.textContent).toContain(
      '0 to do items',
    );

    (host.querySelector('[data-test="home-mode-notes"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="home-empty-title"]')?.textContent).toContain(
      'No notes yet.',
    );
    expect(host.querySelector('[data-test="home-empty-art"]')?.getAttribute('src')).toContain(
      'empty-notes.svg',
    );

    (host.querySelector('[data-test="home-mode-active"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="home-empty"]')).toBeNull();
    expect(tileText(host)).toContain('Buy cat food');
  });
});

function openSearch(fixture: ComponentFixture<HomeScreenComponent>): HTMLElement {
  const host = fixture.nativeElement as HTMLElement;
  (host.querySelector('[data-test="home-search"]') as HTMLButtonElement).click();
  fixture.detectChanges();
  return host;
}

function typeQuery(fixture: ComponentFixture<HomeScreenComponent>, value: string): void {
  const input = fixture.nativeElement.querySelector(
    '[data-test="home-search-input"]',
  ) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function tileText(host: HTMLElement): string {
  return Array.from(host.querySelectorAll('[data-test="task-tile"]'))
    .map(tile => tile.textContent ?? '')
    .join('\n');
}
