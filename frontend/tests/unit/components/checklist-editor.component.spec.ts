import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChecklistEditorComponent } from 'src/app/mobile-app/components/screens/task-screen/task-edit/checklist-editor/checklist-editor.component';

describe('ChecklistEditorComponent', () => {
  let fixture: ComponentFixture<ChecklistEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChecklistEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChecklistEditorComponent);
    fixture.componentRef.setInput('items', [
      { id: 'a', text: 'Buy cat food', completed: false },
      { id: 'b', text: 'Check salmon variant', completed: false },
    ]);
    fixture.componentRef.setInput('canEdit', true);
    fixture.detectChanges();
  });

  it('keeps a new item local until it has text, then checks an existing one', () => {
    const emitted: Array<Array<{ id: string; text: string; completed: boolean }>> = [];
    fixture.componentInstance.itemsChange.subscribe(items => emitted.push(items));
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-test="checklist-add-item"]')?.click();
    fixture.detectChanges();
    const blank = host.querySelectorAll<HTMLInputElement>('[data-test="checklist-item-text"]');
    const addedInput = blank[blank.length - 1];
    expect(addedInput).toBeTruthy();
    expect(emitted).toEqual([]);

    if (addedInput) {
      addedInput.value = '   ';
      addedInput.dispatchEvent(new Event('input'));
    }
    expect(emitted).toEqual([]);

    if (addedInput) {
      addedInput.value = 'Milk';
      addedInput.dispatchEvent(new Event('input'));
    }
    expect(emitted[0]?.map(item => item.text)).toEqual([
      'Buy cat food',
      'Check salmon variant',
      'Milk',
    ]);
    expect(emitted[0]?.every(item => item.text.trim().length > 0)).toBe(true);

    host
      .querySelector<HTMLInputElement>('[data-test="checklist-item-check"]')
      ?.dispatchEvent(new Event('change'));
    expect(emitted.at(-1)?.[0]).toEqual({ id: 'a', text: 'Buy cat food', completed: true });
    fixture.componentRef.setInput('items', emitted.at(-1) ?? []);
    fixture.detectChanges();
    expect(host.querySelector('[data-test="checklist-item-mark"]')?.textContent).toContain('check');
  });

  it('does not check items while checks are disabled', () => {
    const emitted: unknown[] = [];
    fixture.componentInstance.itemsChange.subscribe(items => emitted.push(items));
    fixture.componentRef.setInput('canCheck', false);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const checkbox = host.querySelector<HTMLInputElement>('[data-test="checklist-item-check"]');

    checkbox?.dispatchEvent(new Event('change'));

    expect(checkbox?.disabled).toBe(true);
    expect(emitted).toEqual([]);
    expect(host.querySelector('[data-test="checklist-item-mark"]')).toBeNull();
  });

  it('moves an item down and deletes it from the item menu', () => {
    const emitted: Array<Array<{ id: string }>> = [];
    fixture.componentInstance.itemsChange.subscribe(items => emitted.push(items));
    const host = fixture.nativeElement as HTMLElement;

    const menus = host.querySelectorAll<HTMLButtonElement>('[data-test="checklist-item-more"]');
    menus[0]?.click();
    fixture.detectChanges();
    host.querySelector<HTMLButtonElement>('[data-test="checklist-item-down"]')?.click();

    expect(emitted[0]?.map(item => item.id)).toEqual(['b', 'a']);

    fixture.componentRef.setInput('items', [
      { id: 'b', text: 'Check salmon variant', completed: false },
      { id: 'a', text: 'Buy cat food', completed: false },
    ]);
    fixture.detectChanges();
    host.querySelectorAll<HTMLButtonElement>('[data-test="checklist-item-more"]')[1]?.click();
    fixture.detectChanges();
    host.querySelector<HTMLButtonElement>('[data-test="checklist-item-delete"]')?.click();

    expect(emitted[1]?.map(item => item.id)).toEqual(['b']);
  });

  it('hides adding and the item menu when the list is read-only', () => {
    fixture.componentRef.setInput('canEdit', false);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="checklist-add-item"]')).toBeNull();
    expect(host.querySelector('[data-test="checklist-item-more"]')).toBeNull();
    expect(host.querySelectorAll('[data-test="checklist-item-check"]')).toHaveLength(2);
    expect(host.querySelector('[data-test="checklist-item-text"]')?.textContent).toContain(
      'Buy cat food',
    );
  });
});
