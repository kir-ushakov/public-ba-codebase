import {
  afterNextRender,
  Component,
  ElementRef,
  HostListener,
  input,
  output,
  viewChildren,
} from '@angular/core';
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

  private readonly itemRefs = viewChildren<ElementRef<HTMLButtonElement>>('menuItem');

  constructor() {
    afterNextRender(() => {
      this.focusAt(0);
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }
    event.preventDefault();
    const buttons = this.enabledButtons();
    const current = buttons.findIndex(button => button === document.activeElement);
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    this.focusAt(current === -1 ? (direction === 1 ? 0 : -1) : current + direction);
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

  private enabledButtons(): HTMLButtonElement[] {
    return this.itemRefs()
      .map(ref => ref.nativeElement)
      .filter(button => !button.disabled);
  }

  private focusAt(index: number): void {
    const buttons = this.enabledButtons();
    if (!buttons.length) {
      return;
    }
    const wrapped = (index + buttons.length) % buttons.length;
    buttons[wrapped]?.focus();
  }
}
