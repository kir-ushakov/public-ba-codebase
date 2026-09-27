import { Component, HostListener, input, output } from '@angular/core';
import type { ContextMenuItem } from './context-menu-item.type';

@Component({
  selector: 'ba-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.scss',
})
export class ContextMenuComponent {
  readonly items = input.required<ContextMenuItem[]>();
  readonly testId = input.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly closed = output<void>();
  readonly selected = output<string>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  close(event: Event): void {
    event.stopPropagation();
    this.closed.emit();
  }

  selectItem(event: Event, item: ContextMenuItem): void {
    event.stopPropagation();
    if (item.disabled) {
      return;
    }
    this.selected.emit(item.id);
  }
}
