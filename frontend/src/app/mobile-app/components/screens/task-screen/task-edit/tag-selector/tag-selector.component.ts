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
import { TagConst } from '@brainassistant/contracts';
import { v4 as uuidv4 } from 'uuid';
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
  readonly selectedIds = model<string[]>([]);
  readonly open = signal(false);
  readonly creating = signal(false);
  readonly query = signal('');
  readonly draftName = signal('');
  readonly nameMaxLength = TagConst.NAME_MAX_LENGTH;
  readonly nameLength = computed(() => this.draftName().length);
  readonly nameValid = computed(() => {
    const name = this.draftName().trim();
    return name.length >= TagConst.NAME_MIN_LENGTH && name.length <= TagConst.NAME_MAX_LENGTH;
  });
  readonly sheetTitle = computed(() => (this.creating() ? 'Create new tag' : 'Select tags'));
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
    this.draftName.set('');
  }

  openCreate(): void {
    this.draftName.set('');
    this.creating.set(true);
  }

  closeCreate(): void {
    this.draftName.set('');
    this.creating.set(false);
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
    this.createTag();
  }

  toggleTag(id: string): void {
    const selected = this.selectedIds();
    this.selectedIds.set(
      selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id],
    );
  }

  createTag(): void {
    const name = this.draftName().trim();
    if (name.length < TagConst.NAME_MIN_LENGTH || name.length > TagConst.NAME_MAX_LENGTH) {
      return;
    }

    const userId = this.store.selectSnapshot(UserState.userId);
    if (!userId) {
      return;
    }

    const id = uuidv4();
    this.store.dispatch(new TagsAction.CreateTag({ id, name }, userId));
    this.selectedIds.set([...this.selectedIds(), id]);
    this.draftName.set('');
    this.creating.set(false);
  }
}
