import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';

const DISMISS_DRAG_DISTANCE = 48;

@Component({
  selector: 'ba-bottom-sheet',
  templateUrl: './bottom-sheet.component.html',
  styleUrl: './bottom-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomSheetComponent {
  readonly title = input.required<string>();
  readonly showBack = input(false);
  readonly dismissed = output<void>();
  readonly back = output<void>();
  readonly dragOffset = signal(0);

  private dragging = false;
  private dragStartY = 0;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.dismissed.emit();
  }

  onBackdropClick(): void {
    this.dismissed.emit();
  }

  onCloseClick(): void {
    this.dismissed.emit();
  }

  onBackClick(): void {
    this.back.emit();
  }

  onHandlePointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }
    this.dragging = true;
    this.dragStartY = event.clientY;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onHandlePointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.dragOffset.set(Math.max(0, event.clientY - this.dragStartY));
  }

  onHandlePointerUp(): void {
    if (!this.dragging) {
      return;
    }
    const shouldClose = this.dragOffset() >= DISMISS_DRAG_DISTANCE;
    this.dragging = false;
    this.dragOffset.set(0);
    if (shouldClose) {
      this.dismissed.emit();
    }
  }
}
