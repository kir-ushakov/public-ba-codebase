import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Actions, ofActionSuccessful, provideStore, Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { TagsScreenComponent } from 'src/app/mobile-app/components/screens/tags-screen/tags-screen.component';
import { HomeContentModeService } from 'src/app/mobile-app/components/screens/home-screen/home-content-mode.service';
import { TAG_COLOR } from 'src/app/shared/models/tag.model';
import type { Tag } from 'src/app/shared/models/tag.model';
import { AuthService } from 'src/app/shared/services/api/auth.service';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { TagsAction } from 'src/app/shared/state/tags.action';
import { TagsState } from 'src/app/shared/state/tags.state';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { EUserAuthState, UserState } from 'src/app/shared/state/user.state';

const userId = 'user-1';

function tag(id: string, name: string, isPinned = false): Tag {
  return {
    id,
    userId,
    name,
    color: TAG_COLOR,
    isPinned,
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('TagsScreenComponent', () => {
  let fixture: ComponentFixture<TagsScreenComponent>;
  let store: Store;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagsScreenComponent],
      providers: [
        provideRouter([]),
        provideStore([TagsState, TasksState, UserState]),
        { provide: AuthService, useValue: {} },
        { provide: SlackService, useValue: {} },
      ],
    }).compileComponents();

    store = TestBed.inject(Store);
    store.reset({
      tags: {
        entities: [tag('work', 'Work', true), tag('ideas', 'Ideas'), tag('personal', 'Personal')],
      },
      tasks: { entities: [] },
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
    TestBed.inject(HomeContentModeService).bindUser(null);

    fixture = TestBed.createComponent(TagsScreenComponent);
    fixture.detectChanges();
  });

  it('splits pinned tags from the others and keeps Tags current in the nav', () => {
    const host = fixture.nativeElement as HTMLElement;
    const pinned = host.querySelector('[data-test="tags-pinned-section"]');
    const others = host.querySelector('[data-test="tags-other-section"]');

    expect(host.querySelector('[data-test="tags-title"]')?.textContent).toContain('Tags');
    expect(host.querySelector('[data-test="tags-subtitle"]')?.textContent).toContain(
      '3 tags · 1 pinned',
    );
    expect(pinned?.textContent).toContain('Pinned');
    expect(pinned?.textContent).toContain('Shown on Home');
    expect(pinned?.textContent).toContain('Work');
    expect(pinned?.textContent).not.toContain('Ideas');
    expect(others?.textContent).toContain('Other tags');
    expect(others?.textContent).toContain('Ideas');
    expect(others?.textContent).toContain('Personal');
    expect(others?.textContent).toContain('0 tasks');
    expect(host.querySelector('[data-test="bottom-nav-tags"]')?.getAttribute('aria-current')).toBe(
      'page',
    );
    expect(host.querySelector('[data-test="tags-create"]')?.getAttribute('aria-label')).toBe(
      'Create tag',
    );
  });

  it('searches by name in one list and says when nothing matches', () => {
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-test="tags-search"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const input = host.querySelector('[data-test="tags-search-input"]') as HTMLInputElement;
    input.value = 'idea';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.querySelector('[data-test="tags-pinned-section"]')).toBeNull();
    expect(host.querySelector('[data-test="tags-other-section"]')).toBeNull();
    expect(host.querySelector('[data-test="tags-search-results"]')?.textContent).toContain('Ideas');
    expect(host.querySelector('[data-test="tags-search-results"]')?.textContent).not.toContain(
      'Work',
    );

    input.value = 'missing';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.querySelector('[data-test="tags-search-empty"]')?.textContent).toContain(
      'No results',
    );
  });

  it('pins from the row without opening Home, and opens Home when the row is clicked', async () => {
    const host = fixture.nativeElement as HTMLElement;
    const router = TestBed.inject(Router);
    const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const ideasRow = Array.from(host.querySelectorAll('[data-test="tag-row"]')).find(row =>
      row.textContent?.includes('Ideas'),
    );
    const pin = ideasRow?.querySelector('[data-test="tag-pin"]') as HTMLButtonElement;
    const saved = firstValueFrom(
      TestBed.inject(Actions).pipe(ofActionSuccessful(TagsAction.SetPinned)),
    );

    expect(pin.getAttribute('aria-label')).toBe('Pin tag');
    expect(pin.getAttribute('aria-pressed')).toBe('false');
    pin.click();
    await saved;
    fixture.detectChanges();

    expect(navigate).not.toHaveBeenCalled();
    const pinned = host.querySelector('[data-test="tags-pinned-section"]');
    expect(pinned?.textContent).toContain('Ideas');
    expect(host.querySelector('[data-test="tags-subtitle"]')?.textContent).toContain('2 pinned');

    const workRow = Array.from(host.querySelectorAll('[data-test="tag-row"]')).find(row =>
      row.textContent?.includes('Work'),
    );
    (workRow?.querySelector('[data-test="tag-open"]') as HTMLButtonElement).click();

    expect(navigate).toHaveBeenCalledWith(['/home']);
    expect(TestBed.inject(HomeContentModeService).selectedTagId()).toBe('work');
  });

  it('clears the Home filter when the selected tag is unpinned', async () => {
    const host = fixture.nativeElement as HTMLElement;
    const modes = TestBed.inject(HomeContentModeService);
    modes.showTag('work');
    const saved = firstValueFrom(
      TestBed.inject(Actions).pipe(ofActionSuccessful(TagsAction.SetPinned)),
    );
    const workRow = Array.from(host.querySelectorAll('[data-test="tag-row"]')).find(row =>
      row.textContent?.includes('Work'),
    );

    (workRow?.querySelector('[data-test="tag-pin"]') as HTMLButtonElement).click();
    await saved;
    fixture.detectChanges();

    expect(modes.selectedTagId()).toBeNull();
    expect(host.querySelector('[data-test="tags-pinned-section"]')).toBeNull();
  });

  it('opens the create tag sheet and lists the new tag unpinned', async () => {
    const host = fixture.nativeElement as HTMLElement;

    (host.querySelector('[data-test="tags-create"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="bottom-sheet-title"]')?.textContent).toContain(
      'Create new tag',
    );
    expect(host.querySelector('[data-test="task-tags-selector"]')).toBeNull();

    const input = host.querySelector('[data-test="new-tag-name"]') as HTMLInputElement;
    input.value = 'Health';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const saved = firstValueFrom(
      TestBed.inject(Actions).pipe(ofActionSuccessful(TagsAction.CreateTag)),
    );
    (host.querySelector('[data-test="new-tag-submit"]') as HTMLButtonElement).click();
    await saved;
    fixture.detectChanges();

    expect(host.querySelector('[data-test="bottom-sheet"]')).toBeNull();
    const others = host.querySelector('[data-test="tags-other-section"]');
    expect(others?.textContent).toContain('Health');
    expect(host.querySelector('[data-test="tags-pinned-section"]')?.textContent).not.toContain(
      'Health',
    );
  });
});
