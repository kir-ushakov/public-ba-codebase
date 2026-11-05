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
import { AppAction } from 'src/app/shared/state/app.actions';
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

    const modes = TestBed.inject(HomeContentModeService);
    modes.bindUser(null);
    modes.select('todo');
    modes.select('active');
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

  it('shows a persistence error on the home banner', () => {
    const host = fixture.nativeElement as HTMLElement;
    TestBed.inject(Store).dispatch(
      new AppAction.ShowErrorInUI('Could not save the task on this device.', 'Not saved'),
    );
    fixture.detectChanges();

    const banner = host.querySelector('[data-test="home-persistence-error"]');
    expect(banner?.textContent).toContain('Not saved');
    expect(banner?.textContent).toContain('Could not save the task on this device.');
    expect(banner?.querySelector('[data-test="home-sync-now"]')).toBeNull();
  });

  it('updates every tab count to matches while the open list stays on the selected mode', () => {
    const host = fixture.nativeElement as HTMLElement;
    const litter: Task = {
      ...catTask,
      id: 'task-litter',
      title: 'Cat litter later',
      status: ETaskStatus.Todo,
    };
    TestBed.inject(Store).reset({
      app: { online: false },
      tasks: { entities: [catTask, lampTask, litter] },
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

    expect(host.querySelector('[data-test="home-mode-count-active"]')?.textContent).toContain('2');
    expect(host.querySelector('[data-test="home-mode-count-todo"]')?.textContent).toContain('1');

    openSearch(fixture);
    typeQuery(fixture, 'cat');

    expect(tileText(host)).toContain('Buy cat food');
    expect(tileText(host)).not.toContain('Lamp photo');
    expect(tileText(host)).not.toContain('Cat litter later');
    expect(host.querySelector('[data-test="home-mode-count-active"]')?.textContent).toContain('1');
    expect(host.querySelector('[data-test="home-mode-count-todo"]')?.textContent).toContain('1');
    expect(host.querySelector('[data-test="home-item-count"]')?.textContent).toContain(
      '1 active item',
    );

    typeQuery(fixture, 'litter');

    expect(host.querySelector('[data-test="task-tile"]')).toBeNull();
    expect(host.querySelector('[data-test="home-search-empty"]')?.textContent).toContain(
      'No results',
    );
    expect(host.querySelector('[data-test="home-empty"]')).toBeNull();
    expect(host.querySelector('[data-test="home-mode-count-active"]')?.textContent).toContain('0');
    expect(host.querySelector('[data-test="home-mode-count-todo"]')?.textContent).toContain('1');
    expect(host.querySelector('[data-test="home-item-count"]')?.textContent).toContain(
      '0 active items',
    );
  });

  it('hides tiles that do not match and shows the found item count', () => {
    const host = openSearch(fixture);

    typeQuery(fixture, 'cat');

    expect(tileText(host)).toContain('Buy cat food');
    expect(tileText(host)).not.toContain('Lamp photo');
    expect(host.querySelector('[data-test="home-item-count"]')?.textContent).toContain(
      '1 active item',
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
      '0 active items',
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

    const tabs = host.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]?.getAttribute('data-test')).toBe('home-mode-active');
    expect(tabs[1]?.getAttribute('data-test')).toBe('home-mode-todo');
    expect(
      host.querySelector('[data-test="home-mode-active"]')?.getAttribute('aria-selected'),
    ).toBe('true');
    expect(host.querySelector('[data-test="home-mode-count-active"]')?.textContent).toContain('1');
    expect(host.querySelector('[data-test="home-mode-count-todo"]')?.textContent).toContain('1');
    expect(host.querySelector('[data-test="home-mode-waiting"]')).toBeNull();
    expect(host.querySelector('[data-test="home-mode-notes"]')).toBeNull();
    expect(host.querySelector('[data-test="home-mode-active"]')?.textContent).toContain(
      'play_arrow',
    );
    expect(host.querySelector('[data-test="home-mode-todo"]')?.textContent).toContain(
      'radio_button_unchecked',
    );
    expect(
      host.querySelector('[data-test="home-category-selector"]')?.getAttribute('aria-label'),
    ).toBe('Choose task category');
    expect(
      host.querySelector('[data-test="home-category-selector"]')?.getAttribute('aria-expanded'),
    ).toBe('false');
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

    chooseHomeCategory(fixture, 'notes');

    expect(host.querySelector('[data-test="home-mode-notes"]')?.textContent).toContain('article');
    expect(host.querySelector('[data-test="home-mode-notes"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(host.querySelector('[data-test="home-mode-count-notes"]')?.textContent).toContain('1');
    expect(host.querySelector('[data-test="home-mode-todo"]')).toBeNull();
    expect(host.querySelector('[data-test="home-category-menu"]')).toBeNull();
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
    expect(host.querySelector('[data-test="home-empty-art"] use')?.getAttribute('href')).toContain(
      'empty-states.svg#empty-todo',
    );
    expect(host.querySelector('[data-test="task-tile"]')).toBeNull();
    expect(host.querySelector('[data-test="new-task-btn"]')).not.toBeNull();
    expect(host.querySelector('[data-test="home-item-count"]')?.textContent).toContain(
      '0 to do items',
    );

    chooseHomeCategory(fixture, 'notes');

    expect(host.querySelector('[data-test="home-empty-title"]')?.textContent).toContain(
      'No notes yet.',
    );
    expect(host.querySelector('[data-test="home-empty-art"] use')?.getAttribute('href')).toContain(
      'empty-states.svg#empty-notes',
    );

    (host.querySelector('[data-test="home-mode-active"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="home-empty"]')).toBeNull();
    expect(tileText(host)).toContain('Buy cat food');
    expect(host.querySelector('[data-test="home-mode-notes"]')).not.toBeNull();
  });

  it('replaces only the second tab and restores that choice when Home opens again', () => {
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-test="home-category-selector"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(
      host.querySelector('[data-test="home-category-selector"]')?.getAttribute('aria-expanded'),
    ).toBe('true');
    expect(host.querySelector('[data-test="home-category-menu"]')).not.toBeNull();
    expect(host.querySelector('[data-test="home-mode-option-todo"]')).toBeNull();
    expect(host.querySelector('[data-test="home-mode-option-waiting"]')?.textContent).toContain(
      'Waiting',
    );
    expect(host.querySelector('[data-test="home-mode-option-waiting"]')?.textContent).toContain(
      'hourglass_empty',
    );
    expect(host.querySelector('[data-test="home-mode-option-notes"]')?.textContent).toContain(
      'Notes',
    );
    expect(host.querySelector('[data-test="home-mode-option-active"]')).toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(host.querySelector('[data-test="home-category-menu"]')).toBeNull();
    expect(document.activeElement).toBe(host.querySelector('[data-test="home-category-selector"]'));

    chooseHomeCategory(fixture, 'waiting');

    expect(
      host.querySelector('[data-test="home-mode-waiting"]')?.getAttribute('aria-selected'),
    ).toBe('true');
    expect(host.querySelector('[data-test="home-mode-todo"]')).toBeNull();
    expect(host.querySelector('[data-test="home-category-menu"]')).toBeNull();

    (host.querySelector('[data-test="home-mode-active"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(
      host.querySelector('[data-test="home-mode-active"]')?.getAttribute('aria-selected'),
    ).toBe('true');
    expect(
      host.querySelector('[data-test="home-mode-waiting"]')?.getAttribute('aria-selected'),
    ).toBe('false');

    (host.querySelector('[data-test="home-category-selector"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-test="home-mode-option-waiting"]')).toBeNull();
    expect(host.querySelector('[data-test="home-mode-option-todo"]')?.textContent).toContain(
      'To do',
    );
    expect(host.querySelector('[data-test="home-mode-option-notes"]')?.textContent).toContain(
      'Notes',
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    fixture.destroy();
    fixture = TestBed.createComponent(HomeScreenComponent);
    fixture.detectChanges();
    const restored = fixture.nativeElement as HTMLElement;

    expect(restored.querySelector('[data-test="home-mode-waiting"]')).not.toBeNull();
    expect(restored.querySelector('[data-test="home-mode-todo"]')).toBeNull();
    expect(
      restored.querySelector('[data-test="home-mode-active"]')?.getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('filters the current category by selected tags and updates every category count', () => {
    const store = TestBed.inject(Store);
    const todoErrand: Task = {
      id: 'task-brief',
      userId,
      type: ETaskType.Basic,
      title: 'Write the brief',
      tagIds: ['tag-errands'],
      status: ETaskStatus.Todo,
      createdAt: '2026-09-10T10:00:00.000Z',
      modifiedAt: '2026-09-10T10:00:00.000Z',
    };
    const todoOther: Task = {
      id: 'task-other',
      userId,
      type: ETaskType.Basic,
      title: 'Other todo',
      status: ETaskStatus.Todo,
      createdAt: '2026-09-09T10:00:00.000Z',
      modifiedAt: '2026-09-09T10:00:00.000Z',
    };
    store.reset({
      app: { online: false },
      tasks: { entities: [catTask, lampTask, todoErrand, todoOther] },
      tags: {
        entities: [
          {
            id: 'tag-errands',
            userId,
            name: 'Errands',
            color: TAG_COLOR,
            isPinned: true,
            createdAt: '2026-09-10T10:00:00.000Z',
            modifiedAt: '2026-09-10T10:00:00.000Z',
          },
          {
            id: 'tag-ideas',
            userId,
            name: 'Ideas',
            color: TAG_COLOR,
            isPinned: false,
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
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const chip = (): HTMLButtonElement =>
      host.querySelector('[data-test="home-pinned-tag"]') as HTMLButtonElement;

    expect(host.querySelector('[data-test="home-pinned-tags"]')?.textContent).toContain('Errands');
    expect(chip().querySelector('[data-test="home-tag-pin"]')?.textContent?.trim()).toBe(
      'push_pin',
    );
    expect(host.querySelector('[data-test="home-pinned-tags"]')?.textContent).not.toContain(
      'Ideas',
    );
    expect(host.querySelector('[data-test="home-mode-count-active"]')?.textContent).toContain('2');
    expect(tileText(host)).toContain('Buy cat food');
    expect(tileText(host)).toContain('Lamp photo');

    chip().click();
    fixture.detectChanges();

    expect(chip().getAttribute('aria-pressed')).toBe('true');
    expect(tileText(host)).toContain('Lamp photo');
    expect(tileText(host)).not.toContain('Buy cat food');
    expect(host.querySelector('[data-test="home-item-count"]')?.textContent).toContain(
      '1 active item',
    );
    expect(host.querySelector('[data-test="home-mode-count-active"]')?.textContent).toContain('1');
    expect(host.querySelector('[data-test="home-category-count"]')?.textContent).toContain('0');

    (host.querySelector('[data-test="home-mode-todo"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(chip().getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('[data-test="home-item-count"]')?.textContent).toContain(
      '1 to do item',
    );
    expect(tileText(host)).toContain('Write the brief');
    expect(tileText(host)).not.toContain('Other todo');

    chip().click();
    fixture.detectChanges();

    expect(chip().getAttribute('aria-pressed')).toBe('false');
    expect(tileText(host)).toContain('Write the brief');
    expect(tileText(host)).toContain('Other todo');

    TestBed.inject(HomeContentModeService).showTag('tag-ideas');
    (host.querySelector('[data-test="home-mode-active"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const chips = [...host.querySelectorAll('[data-test="home-pinned-tag"]')];
    expect(chips.map(item => item.textContent?.trim())).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Ideas'),
        expect.stringContaining('Errands'),
      ]),
    );
    expect(
      chips.find(item => item.textContent?.includes('Ideas'))?.getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      chips
        .find(item => item.textContent?.includes('Errands'))
        ?.querySelector('[data-test="home-tag-pin"]')?.textContent,
    ).toContain('push_pin');
    expect(
      chips
        .find(item => item.textContent?.includes('Ideas'))
        ?.querySelector('[data-test="home-tag-pin"]'),
    ).toBeNull();
    expect(host.querySelector('[data-test="home-empty-title"]')?.textContent).toContain(
      'Nothing active right now.',
    );
    expect(host.querySelector('[data-test="home-item-count"]')?.textContent).toContain(
      '0 active items',
    );
    expect(host.querySelector('[data-test="task-tile"]')).toBeNull();
  });
});

function chooseHomeCategory(fixture: ComponentFixture<HomeScreenComponent>, mode: string): void {
  const host = fixture.nativeElement as HTMLElement;
  const tab = host.querySelector(`[data-test="home-mode-${mode}"]`) as HTMLButtonElement | null;
  if (tab) {
    tab.click();
    fixture.detectChanges();
    return;
  }

  (host.querySelector('[data-test="home-category-selector"]') as HTMLButtonElement).click();
  fixture.detectChanges();
  (host.querySelector(`[data-test="home-mode-option-${mode}"]`) as HTMLButtonElement).click();
  fixture.detectChanges();
}

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
