import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore, Store } from '@ngxs/store';
import { ETaskStatus, ETaskType } from '@brainassistant/contracts';
import { HomeScreenComponent } from 'src/app/mobile-app/components/screens/home-screen/home-screen.component';
import type { Task } from 'src/app/shared/models/task.model';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { AuthService } from 'src/app/shared/services/api/auth.service';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { AppState } from 'src/app/shared/state/app.state';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { EUserAuthState, UserState } from 'src/app/shared/state/user.state';

const userId = 'user-1';

const catTask: Task = {
  id: 'task-cat',
  userId,
  type: ETaskType.Basic,
  title: 'Buy cat food',
  status: ETaskStatus.Todo,
  createdAt: '2026-09-12T10:00:00.000Z',
  modifiedAt: '2026-09-12T10:00:00.000Z',
};

const lampTask: Task = {
  id: 'task-lamp',
  userId,
  type: ETaskType.Basic,
  title: 'Lamp photo',
  status: ETaskStatus.Todo,
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
        provideStore([AppState, TasksState, UserState]),
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
    expect(host.querySelector('[data-test="home-item-count"]')?.textContent).toContain('2 items');
    expect(host.querySelector('[data-test="home-search-clear"]')).not.toBeNull();
  });

  it('shows a plain empty line when nothing matches', () => {
    const host = openSearch(fixture);

    typeQuery(fixture, 'missing');

    expect(host.querySelector('[data-test="task-tile"]')).toBeNull();
    expect(host.querySelector('[data-test="home-search-empty"]')?.textContent).toContain(
      'No results',
    );
    expect(host.querySelector('[data-test="home-item-count"]')?.textContent).toContain('2 items');
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
