import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  output,
  signal,
} from '@angular/core';
import { TaskConst } from '@brainassistant/contracts';
import { v4 as uuidv4 } from 'uuid';
import { ContextMenuComponent } from 'src/app/shared/components/ui-elements/context-menu/context-menu.component';
import type { ContextMenuItem } from 'src/app/shared/components/ui-elements/context-menu/context-menu-item.type';
import type { ChecklistItem } from 'src/app/shared/models/task.model';
import { moveChecklistItem } from 'src/app/shared/helpers/checklist.function';

@Component({
  selector: 'ba-checklist-editor',
  templateUrl: './checklist-editor.component.html',
  styleUrl: './checklist-editor.component.scss',
  imports: [ContextMenuComponent],
})
export class ChecklistEditorComponent {
  readonly items = input<ChecklistItem[]>([]);
  readonly canEdit = input(false);
  readonly canCheck = input(true);
  readonly itemsChange = output<ChecklistItem[]>();

  readonly itemMaxLength = TaskConst.CHECKLIST_ITEM_MAX_LENGTH;
  readonly openMenuId = signal<string | null>(null);
  readonly rows = computed(() => visibleRows(this.items(), this.draft()));

  private readonly draft = signal<ChecklistItem | null>(null);
  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      const draft = this.draft();
      if (!draft || draft.text.trim().length === 0) {
        return;
      }
      const echoed = this.items().find(item => item.id === draft.id);
      if (echoed && echoed.text === draft.text && echoed.completed === draft.completed) {
        this.draft.set(null);
      }
    });
  }

  menuItems(item: ChecklistItem, index: number): ContextMenuItem[] {
    const items = this.rows();
    return [
      { id: 'edit', label: 'Edit item', icon: 'edit', testId: 'checklist-item-edit' },
      {
        id: 'duplicate',
        label: 'Duplicate',
        icon: 'content_copy',
        testId: 'checklist-item-duplicate',
      },
      {
        id: 'up',
        label: 'Move up',
        icon: 'arrow_upward',
        testId: 'checklist-item-up',
        disabled: index === 0,
      },
      {
        id: 'down',
        label: 'Move down',
        icon: 'arrow_downward',
        testId: 'checklist-item-down',
        disabled: index === items.length - 1,
      },
      {
        id: 'delete',
        label: 'Delete item',
        icon: 'delete',
        testId: 'checklist-item-delete',
        danger: true,
        separatorBefore: true,
      },
    ];
  }

  toggle(item: ChecklistItem): void {
    if (!this.canCheck() || item.text.trim().length === 0) {
      return;
    }
    this.publish(
      this.rows().map(current =>
        current.id === item.id ? { ...current, completed: !current.completed } : current,
      ),
    );
  }

  editText(item: ChecklistItem, text: string): void {
    this.publish(
      this.rows().map(current => (current.id === item.id ? { ...current, text } : current)),
    );
  }

  onTextInput(item: ChecklistItem, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    this.editText(item, target.value);
  }

  addItem(): void {
    const empty = this.rows().find(item => item.text.trim().length === 0);
    if (empty) {
      this.focusItem(empty.id);
      return;
    }
    const draft: ChecklistItem = { id: uuidv4(), text: '', completed: false };
    this.draft.set(draft);
    this.focusItem(draft.id);
  }

  toggleMenu(itemId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId.update(open => (open === itemId ? null : itemId));
  }

  closeMenu(): void {
    this.openMenuId.set(null);
  }

  onMenuItem(item: ChecklistItem, id: string): void {
    this.closeMenu();
    const items = this.rows();
    if (id === 'edit') {
      this.focusItem(item.id);
      return;
    }
    if (id === 'duplicate') {
      if (item.text.trim().length === 0) {
        return;
      }
      const index = items.findIndex(current => current.id === item.id);
      const copy: ChecklistItem = {
        id: uuidv4(),
        text: item.text,
        completed: this.canCheck() ? item.completed : false,
      };
      const next = items.slice();
      next.splice(index + 1, 0, copy);
      this.publish(next);
      return;
    }
    if (id === 'up') {
      this.publish(moveChecklistItem(items, item.id, -1));
      return;
    }
    if (id === 'down') {
      this.publish(moveChecklistItem(items, item.id, 1));
      return;
    }
    if (id === 'delete') {
      this.publish(items.filter(current => current.id !== item.id));
    }
  }

  private publish(next: ChecklistItem[]): void {
    const empty = next.find(item => item.text.trim().length === 0) ?? null;
    const committed = next.filter(item => item.text.trim().length > 0);
    const echoed = this.items();
    const pending =
      committed.find(item => {
        const current = echoed.find(existing => existing.id === item.id);
        return !current || current.text !== item.text || current.completed !== item.completed;
      }) ?? null;
    this.draft.set(empty ?? pending);
    if (!sameItems(this.items(), committed)) {
      this.itemsChange.emit(committed);
    }
  }

  private focusItem(id: string): void {
    afterNextRender(
      () => {
        document.getElementById(`checklist-item-${id}`)?.focus();
      },
      { injector: this.injector },
    );
  }
}

function sameItems(current: ChecklistItem[], next: ChecklistItem[]): boolean {
  return (
    current.length === next.length &&
    current.every(
      (item, index) =>
        item.id === next[index]?.id &&
        item.text === next[index]?.text &&
        item.completed === next[index]?.completed,
    )
  );
}

function visibleRows(items: ChecklistItem[], draft: ChecklistItem | null): ChecklistItem[] {
  const committed = items.filter(item => item.text.trim().length > 0);
  if (!draft) {
    return committed;
  }
  if (draft.text.trim().length === 0) {
    return committed.some(item => item.id === draft.id) ? committed : [...committed, draft];
  }
  if (!committed.some(item => item.id === draft.id)) {
    return [...committed, draft];
  }
  return committed.map(item => (item.id === draft.id ? draft : item));
}
