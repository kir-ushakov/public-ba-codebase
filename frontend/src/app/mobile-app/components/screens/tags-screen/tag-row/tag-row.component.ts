import { Component, input, output } from '@angular/core';
import { ContextMenuComponent } from 'src/app/shared/components/ui-elements/context-menu/context-menu.component';
import type { ContextMenuItem } from 'src/app/shared/components/ui-elements/context-menu/context-menu-item.type';
import type { TagListItem } from '../helpers/tag-list.function';

const TAG_MENU: ContextMenuItem[] = [
  { id: 'edit', label: 'Edit tag', icon: 'edit', testId: 'tag-menu-edit' },
  { id: 'delete', label: 'Delete tag', icon: 'delete', testId: 'tag-menu-delete', danger: true },
];

@Component({
  selector: 'ba-tag-row',
  templateUrl: './tag-row.component.html',
  styleUrl: './tag-row.component.scss',
  imports: [ContextMenuComponent],
})
export class TagRowComponent {
  readonly tag = input.required<TagListItem>();
  readonly chosen = input(false);
  readonly menuOpen = input(false);
  readonly opened = output<string>();
  readonly pinned = output<{ id: string; isPinned: boolean }>();
  readonly menuRequested = output<string>();
  readonly menuClosed = output<void>();
  readonly edit = output<string>();
  readonly remove = output<string>();

  readonly menuItems = TAG_MENU;

  onMenu(itemId: string): void {
    this.menuClosed.emit();
    if (itemId === 'edit') {
      this.edit.emit(this.tag().id);
      return;
    }
    if (itemId === 'delete') {
      this.remove.emit(this.tag().id);
    }
  }
}
