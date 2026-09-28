import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TagSelectorComponent } from 'src/app/mobile-app/components/screens/task-screen/task-edit/tag-selector/tag-selector.component';

describe('TagSelectorComponent', () => {
  let fixture: ComponentFixture<TagSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TagSelectorComponent);
    fixture.detectChanges();
  });

  it('shows the Tags label and the Add tags selector', () => {
    const host = fixture.nativeElement as HTMLElement;
    const selector = host.querySelector<HTMLButtonElement>('[data-test="task-tags-selector"]');

    expect(host.querySelector('[data-test="task-tags-section"]')?.textContent).toContain('Tags');
    expect(selector?.textContent).toContain('Add tags...');
    expect(selector?.tagName).toBe('BUTTON');
    expect(host.querySelector('[data-test="bottom-sheet"]')).toBeNull();
    expect(host.querySelector('[data-test="selected-tags"]')).toBeNull();
  });

  it('shows removable selected tags under the selector in create mode', () => {
    fixture.componentRef.setInput('showSelectedTags', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const selected = host.querySelector('[data-test="selected-tags"]');

    expect(selected?.textContent).toContain('Work');
    expect(selected?.textContent).toContain('Ideas');
    expect(selected?.textContent).not.toContain('Personal');

    host.querySelector<HTMLButtonElement>('[aria-label="Remove Work"]')!.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="selected-tags"]')?.textContent).not.toContain('Work');
    expect(host.querySelector('[data-test="selected-tags"]')?.textContent).toContain('Ideas');
  });

  it('opens the selector sheet and closes it from the close button', () => {
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-test="task-tags-selector"]')!.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="bottom-sheet-title"]')?.textContent).toContain(
      'Select tags',
    );
    expect(
      host.querySelector('[data-test="tag-selector-search"]')?.getAttribute('placeholder'),
    ).toBe('Search tags...');
    expect(host.querySelector('[data-test="create-new-tag"]')?.textContent).toContain(
      'Create new tag',
    );
    expect(chip(host, 'Work')?.getAttribute('aria-pressed')).toBe('true');
    expect(chip(host, 'Personal')?.getAttribute('aria-pressed')).toBe('false');

    host.querySelector<HTMLButtonElement>('[data-test="bottom-sheet-close"]')!.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="bottom-sheet"]')).toBeNull();
  });

  it('filters tags from the search field and toggles selection', () => {
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
    fixture.componentRef.setInput('presentation', 'inline');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const chips = [...host.querySelectorAll('[data-test="selected-tag"]')];
    const addTag = host.querySelector<HTMLButtonElement>('[data-test="task-tags-add"]');

    expect(host.querySelector('[data-test="task-tags-selector"]')).toBeNull();
    expect(host.querySelector('[data-test="selected-tag-remove"]')).toBeNull();
    expect(chips.map(chip => chip.textContent?.trim())).toEqual(['Work', 'Ideas']);
    expect(addTag?.textContent).toContain('Add tag');
    expect(
      chips.at(-1) !== undefined &&
        addTag !== null &&
        (chips.at(-1)!.compareDocumentPosition(addTag) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
    ).toBe(true);

    addTag!.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="bottom-sheet-title"]')?.textContent).toContain(
      'Select tags',
    );
  });
});

function chip(host: HTMLElement, label: string): HTMLButtonElement | undefined {
  return [...host.querySelectorAll<HTMLButtonElement>('[data-test="tag-chip"]')].find(item =>
    item.textContent?.includes(label),
  );
}
