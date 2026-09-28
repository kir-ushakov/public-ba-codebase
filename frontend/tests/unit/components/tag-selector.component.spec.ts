import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { TagConst } from '@brainassistant/contracts';
import { TAG_COLOR, Tag } from 'src/app/shared/models/tag.model';
import { AuthService } from 'src/app/shared/services/api/auth.service';
import { GoogleOAuthConsentService } from 'src/app/shared/services/integrations/google-oauth-consent.service';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { TagsState } from 'src/app/shared/state/tags.state';
import { EUserAuthState, UserState } from 'src/app/shared/state/user.state';
import { TagSelectorComponent } from 'src/app/mobile-app/components/screens/task-screen/task-edit/tag-selector/tag-selector.component';

const userId = 'user-1';

describe('TagSelectorComponent', () => {
  let fixture: ComponentFixture<TagSelectorComponent>;
  let store: Store;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagSelectorComponent],
      providers: [
        provideStore([TagsState, UserState]),
        { provide: AuthService, useValue: {} },
        { provide: SlackService, useValue: {} },
        { provide: GoogleOAuthConsentService, useValue: {} },
      ],
    }).compileComponents();

    store = TestBed.inject(Store);
    store.reset({
      tags: { entities: [] },
      user: signedInUser(),
    });

    fixture = TestBed.createComponent(TagSelectorComponent);
    fixture.detectChanges();
  });

  it('shows the Tags label and the Add tags selector without default tags', () => {
    const host = fixture.nativeElement as HTMLElement;
    const selector = host.querySelector<HTMLButtonElement>('[data-test="task-tags-selector"]');

    expect(host.querySelector('[data-test="task-tags-section"]')?.textContent).toContain('Tags');
    expect(selector?.textContent).toContain('Add tags...');
    expect(selector?.tagName).toBe('BUTTON');
    expect(host.querySelector('[data-test="bottom-sheet"]')).toBeNull();
    expect(host.querySelector('[data-test="selected-tags"]')).toBeNull();
  });

  it('shows removable selected tags under the selector in create mode', () => {
    store.reset({
      tags: { entities: [tag('work', 'Work'), tag('ideas', 'Ideas')] },
      user: signedInUser(),
    });
    fixture.componentRef.setInput('showSelectedTags', true);
    fixture.componentRef.setInput('selectedIds', ['work', 'ideas']);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const selected = host.querySelector('[data-test="selected-tags"]');

    expect(selected?.textContent).toContain('Work');
    expect(selected?.textContent).toContain('Ideas');

    host.querySelector<HTMLButtonElement>('[aria-label="Remove Work"]')!.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="selected-tags"]')?.textContent).not.toContain('Work');
    expect(host.querySelector('[data-test="selected-tags"]')?.textContent).toContain('Ideas');
  });

  it('opens an empty selector and the create tag sheet', () => {
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-test="task-tags-selector"]')!.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="bottom-sheet-title"]')?.textContent).toContain(
      'Select tags',
    );
    expect(host.querySelector('[data-test="tag-chip"]')).toBeNull();
    expect(host.querySelector('[data-test="create-new-tag"]')?.textContent).toContain(
      'Create new tag',
    );

    host.querySelector<HTMLButtonElement>('[data-test="create-new-tag"]')!.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="bottom-sheet-title"]')?.textContent).toContain(
      'Create new tag',
    );
    expect(host.querySelector('[data-test="new-tag-name"]')?.getAttribute('placeholder')).toBe(
      'Enter tag name...',
    );
    expect(host.querySelector('[data-test="new-tag-helper"]')?.textContent).toContain(
      'Use a short name that helps you find this tag later.',
    );
    expect(host.querySelector('[data-test="new-tag-count"]')?.textContent).toContain(
      `0/${TagConst.NAME_MAX_LENGTH}`,
    );
    expect(host.querySelector<HTMLButtonElement>('[data-test="new-tag-submit"]')?.disabled).toBe(
      true,
    );

    host.querySelector<HTMLButtonElement>('[data-test="bottom-sheet-back"]')!.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="bottom-sheet-title"]')?.textContent).toContain(
      'Select tags',
    );
  });

  it('creates a tag optimistically and selects it in the list', () => {
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-test="task-tags-selector"]')!.click();
    fixture.detectChanges();
    host.querySelector<HTMLButtonElement>('[data-test="create-new-tag"]')!.click();
    fixture.detectChanges();

    const name = host.querySelector<HTMLInputElement>('[data-test="new-tag-name"]');
    name!.value = 'Errands';
    name!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.querySelector<HTMLButtonElement>('[data-test="new-tag-submit"]')?.disabled).toBe(
      false,
    );

    host.querySelector<HTMLButtonElement>('[data-test="new-tag-submit"]')!.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="bottom-sheet-title"]')?.textContent).toContain(
      'Select tags',
    );
    expect(chip(host, 'Errands')?.getAttribute('aria-pressed')).toBe('true');
    expect(store.selectSnapshot(TagsState.forCurrentUser)).toEqual([
      expect.objectContaining({ name: 'Errands', userId, color: TAG_COLOR }),
    ]);
  });

  it('filters tags from the search field and toggles selection', () => {
    store.reset({
      tags: { entities: [tag('travel', 'Travel'), tag('work', 'Work')] },
      user: signedInUser(),
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLButtonElement>('[data-test="task-tags-selector"]')!.click();
    fixture.detectChanges();

    const search = host.querySelector<HTMLInputElement>('[data-test="tag-selector-search"]');
    search!.value = 'tra';
    search!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const labels = [...host.querySelectorAll('[data-test="tag-chip"]')].map(item =>
      item.textContent?.trim(),
    );
    expect(labels).toEqual(['Travel']);

    chip(host, 'Travel')!.click();
    fixture.detectChanges();

    expect(chip(host, 'Travel')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows read-only tags and a dashed Add tag button that opens the same sheet', () => {
    store.reset({
      tags: { entities: [tag('work', 'Work')] },
      user: signedInUser(),
    });
    fixture.componentRef.setInput('presentation', 'inline');
    fixture.componentRef.setInput('selectedIds', ['work']);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const chips = [...host.querySelectorAll('[data-test="selected-tag"]')];
    const addTag = host.querySelector<HTMLButtonElement>('[data-test="task-tags-add"]');

    expect(host.querySelector('[data-test="task-tags-selector"]')).toBeNull();
    expect(host.querySelector('[data-test="selected-tag-remove"]')).toBeNull();
    expect(chips.map(item => item.textContent?.trim())).toEqual(['Work']);
    expect(addTag?.textContent).toContain('Add tag');
  });
});

function chip(host: HTMLElement, label: string): HTMLButtonElement | undefined {
  return [...host.querySelectorAll<HTMLButtonElement>('[data-test="tag-chip"]')].find(item =>
    item.textContent?.includes(label),
  );
}

function tag(id: string, name: string): Tag {
  return {
    id,
    userId,
    name,
    color: TAG_COLOR,
    createdAt: '2024-01-01T00:00:00.000Z',
    modifiedAt: '2024-01-01T00:00:00.000Z',
  };
}

function signedInUser() {
  return {
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
  };
}
