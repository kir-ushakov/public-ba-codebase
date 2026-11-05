import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ContextMenuComponent } from 'src/app/shared/components/ui-elements/context-menu/context-menu.component';
import type { ContextMenuItem } from 'src/app/shared/components/ui-elements/context-menu/context-menu-item.type';
import {
  homeCategoryMenuModes,
  isHomeSecondaryMode,
  type HomeContentMode,
  type HomeContentModeCounts,
  type HomeSecondaryMode,
} from '../helpers/home-content-mode.function';

type HomeContentModeOption = {
  id: HomeContentMode;
  label: string;
  icon: string;
  iconFill: 0 | 1;
};

const HOME_CONTENT_MODE_OPTIONS: Record<HomeContentMode, HomeContentModeOption> = {
  active: { id: 'active', label: 'Active', icon: 'play_arrow', iconFill: 1 },
  todo: { id: 'todo', label: 'To do', icon: 'radio_button_unchecked', iconFill: 0 },
  waiting: { id: 'waiting', label: 'Waiting', icon: 'hourglass_empty', iconFill: 0 },
  notes: { id: 'notes', label: 'Notes', icon: 'article', iconFill: 0 },
};

@Component({
  selector: 'ba-home-content-mode',
  templateUrl: './home-content-mode.component.html',
  styleUrl: './home-content-mode.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContextMenuComponent],
})
export class HomeContentModeComponent {
  readonly selected = input.required<HomeContentMode>();
  readonly secondary = input.required<HomeSecondaryMode>();
  readonly counts = input.required<HomeContentModeCounts>();
  readonly modeChange = output<HomeContentMode>();

  readonly menuOpen = signal(false);
  readonly visibleOptions = computed(() => [
    HOME_CONTENT_MODE_OPTIONS.active,
    HOME_CONTENT_MODE_OPTIONS[this.secondary()],
  ]);
  readonly hiddenModes = computed(() => homeCategoryMenuModes(this.secondary()));
  readonly hiddenCount = computed(() =>
    this.hiddenModes().reduce((sum, mode) => sum + this.counts()[mode], 0),
  );
  readonly menuItems = computed((): ContextMenuItem[] =>
    this.hiddenModes().map(id => {
      const option = HOME_CONTENT_MODE_OPTIONS[id];
      return {
        id: option.id,
        label: `${option.label} ${this.counts()[id]}`,
        icon: option.icon,
        testId: `home-mode-option-${option.id}`,
      };
    }),
  );

  private readonly selectorButton = viewChild<ElementRef<HTMLButtonElement>>('selectorButton');

  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    this.selectorButton()?.nativeElement.focus();
  }

  onSelectorKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' && !this.menuOpen()) {
      event.preventDefault();
      this.menuOpen.set(true);
    }
  }

  onMenuSelected(id: string): void {
    if (!isHomeSecondaryMode(id)) {
      return;
    }
    this.select(id);
    this.selectorButton()?.nativeElement.focus();
  }

  select(mode: HomeContentMode): void {
    this.menuOpen.set(false);
    if (this.selected() === mode) {
      return;
    }
    this.modeChange.emit(mode);
  }
}
