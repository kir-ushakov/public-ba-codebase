import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { canonicalTagColor, TagConst } from '@brainassistant/contracts';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { displayTagColor } from 'src/app/shared/models/tag.model';
import { BottomSheetComponent } from 'src/app/shared/components/ui-elements/bottom-sheet/bottom-sheet.component';
import { TagsAction } from 'src/app/shared/state/tags.action';
import { TagsState } from 'src/app/shared/state/tags.state';
import { UserState } from 'src/app/shared/state/user.state';

@Component({
  selector: 'ba-tag-selector',
  imports: [BottomSheetComponent],
  templateUrl: './tag-selector.component.html',
  styleUrl: './tag-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagSelectorComponent {
  readonly showSelectedTags = input(false);
  readonly presentation = input<'field' | 'inline'>('field');
  readonly flow = input<'select' | 'create'>('select');
  readonly selectedIds = model<string[]>([]);
  readonly open = signal(false);
  readonly creating = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly query = signal('');
  readonly draftName = signal('');
  readonly draftColor = signal<string>(TagConst.DEFAULT_COLOR);
  readonly saving = signal(false);
  readonly tagIconColor = displayTagColor;
  readonly colors = TagConst.COLORS;
  readonly nameMaxLength = TagConst.NAME_MAX_LENGTH;
  readonly nameLength = computed(() => this.draftName().length);
  readonly nameValid = computed(() => {
    const name = this.draftName().trim();
    return name.length >= TagConst.NAME_MIN_LENGTH && name.length <= TagConst.NAME_MAX_LENGTH;
  });
  readonly sheetTitle = computed(() => {
    if (this.editingId()) {
      return 'Edit tag';
    }
    return this.creating() ? 'Create new tag' : 'Select tags';
  });
  readonly submitLabel = computed(() => (this.editingId() ? 'Save changes' : 'Create tag'));
  readonly previewName = computed(() => this.draftName().trim() || 'Tag name');
  readonly selectedTags = computed(() => {
    const selected = new Set(this.selectedIds());
    return this.tags().filter(tag => selected.has(tag.id));
  });
  readonly visibleTags = computed(() => {
    const query = this.query().trim().toLowerCase();
    const selected = new Set(this.selectedIds());
    return this.tags()
      .filter(tag => tag.name.toLowerCase().includes(query))
      .map(tag => ({
        ...tag,
        selected: selected.has(tag.id),
      }));
  });
  readonly isInline = computed(() => this.presentation() === 'inline');

  private readonly store = inject(Store);
  private readonly tags = this.store.selectSignal(TagsState.forCurrentUser);

  openSheet(): void {
    this.query.set('');
    this.creating.set(false);
    this.open.set(true);
  }

  closeSheet(): void {
    this.open.set(false);
    this.creating.set(false);
    this.editingId.set(null);
    this.draftName.set('');
    this.draftColor.set(TagConst.DEFAULT_COLOR);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.draftName.set('');
    this.draftColor.set(TagConst.DEFAULT_COLOR);
    this.creating.set(true);
  }

  openCreateSheet(): void {
    this.openCreate();
    this.open.set(true);
  }

  openEditSheet(tag: { id: string; name: string; color: string }): void {
    this.editingId.set(tag.id);
    this.draftName.set(tag.name);
    this.draftColor.set(canonicalTagColor(tag.color) ?? TagConst.DEFAULT_COLOR);
    this.creating.set(true);
    this.open.set(true);
  }

  back(): void {
    if (this.flow() === 'create') {
      this.closeSheet();
      return;
    }
    this.closeCreate();
  }

  closeCreate(): void {
    this.draftName.set('');
    this.draftColor.set(TagConst.DEFAULT_COLOR);
    this.editingId.set(null);
    this.creating.set(false);
  }

  selectColor(color: string): void {
    const canonical = canonicalTagColor(color);
    if (canonical) {
      this.draftColor.set(canonical);
    }
  }

  onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  onNameInput(event: Event): void {
    this.draftName.set((event.target as HTMLInputElement).value);
  }

  onNameKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    this.onSave();
  }

  onSave(): void {
    void this.saveTag();
  }

  toggleTag(id: string): void {
    const selected = this.selectedIds();
    this.selectedIds.set(
      selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id],
    );
  }

  async saveTag(): Promise<void> {
    if (this.saving() || !this.nameValid()) {
      return;
    }

    const name = this.draftName().trim();
    const userId = this.store.selectSnapshot(UserState.userId);
    if (!userId) {
      return;
    }

    const color = canonicalTagColor(this.draftColor()) ?? TagConst.DEFAULT_COLOR;
    const editingId = this.editingId();
    this.saving.set(true);
    try {
      if (editingId) {
        await firstValueFrom(
          this.store.dispatch(new TagsAction.UpdateTag({ tagId: editingId, name, color })),
        );
        this.closeSheet();
        return;
      }

      const id = uuidv4();
      await firstValueFrom(
        this.store.dispatch(new TagsAction.CreateTag({ id, name, color }, userId)),
      );
      if (this.flow() === 'create') {
        this.closeSheet();
        return;
      }
      this.selectedIds.set([...this.selectedIds(), id]);
      this.draftName.set('');
      this.draftColor.set(TagConst.DEFAULT_COLOR);
      this.creating.set(false);
    } catch {
      return;
    } finally {
      this.saving.set(false);
    }
  }
}
