import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContextMenuComponent } from 'src/app/shared/components/ui-elements/context-menu/context-menu.component';
import type { ContextMenuItem } from 'src/app/shared/components/ui-elements/context-menu/context-menu-item.type';

const items: ContextMenuItem[] = [
  { id: 'edit', label: 'Edit task', icon: 'edit', testId: 'task-menu-edit' },
  {
    id: 'duplicate',
    label: 'Duplicate',
    icon: 'content_copy',
    testId: 'task-menu-duplicate',
    disabled: true,
  },
  {
    id: 'delete',
    label: 'Delete task',
    icon: 'delete',
    testId: 'task-menu-delete',
    danger: true,
    separatorBefore: true,
  },
];

describe('ContextMenuComponent', () => {
  let fixture: ComponentFixture<ContextMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContextMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContextMenuComponent);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('testId', 'task-options-menu');
    fixture.componentRef.setInput('ariaLabel', 'Task options');
    fixture.detectChanges();
  });

  it('renders the menu items, with Duplicate disabled', () => {
    const host = fixture.nativeElement as HTMLElement;
    const duplicate = host.querySelector<HTMLButtonElement>('[data-test="task-menu-duplicate"]');

    expect(host.querySelector('[data-test="task-options-menu"]')?.getAttribute('aria-label')).toBe(
      'Task options',
    );
    expect(host.querySelector('[data-test="task-menu-edit"]')?.textContent).toContain('Edit task');
    expect(duplicate?.textContent).toContain('Duplicate');
    expect(duplicate?.disabled).toBe(true);
    expect(host.querySelector('[data-test="task-menu-delete"]')?.textContent).toContain(
      'Delete task',
    );
  });

  it('emits the selected item id', () => {
    const selected = jest.fn();
    fixture.componentInstance.selected.subscribe(selected);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-test="task-menu-edit"]')
      ?.click();

    expect(selected).toHaveBeenCalledWith('edit');
  });

  it('does not emit when a disabled item is activated', () => {
    const selected = jest.fn();
    fixture.componentInstance.selected.subscribe(selected);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-test="task-menu-duplicate"]')
      ?.click();

    expect(selected).not.toHaveBeenCalled();
  });
});
