import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { BottomSheetComponent } from 'src/app/shared/components/ui-elements/bottom-sheet/bottom-sheet.component';

type TagChoice = {
  id: string;
  label: string;
};

const TAG_CHOICES: TagChoice[] = [
  { id: 'work', label: 'Work' },
  { id: 'personal', label: 'Personal' },
  { id: 'ideas', label: 'Ideas' },
  { id: 'ai', label: 'AI' },
  { id: 'health', label: 'Health' },
  { id: 'finance', label: 'Finance' },
  { id: 'home', label: 'Home' },
  { id: 'travel', label: 'Travel' },
  { id: 'product', label: 'Product' },
  { id: 'learning', label: 'Learning' },
  { id: 'hobby', label: 'Hobby' },
  { id: 'reading', label: 'Reading' },
  { id: 'family', label: 'Family' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'shopping', label: 'Shopping' },
];

@Component({
  selector: 'ba-tag-selector',
  imports: [BottomSheetComponent],
  templateUrl: './tag-selector.component.html',
  styleUrl: './tag-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagSelectorComponent {
  readonly open = signal(false);
  readonly query = signal('');
  readonly selectedIds = signal<string[]>(['work', 'ideas']);
  readonly visibleTags = computed(() => {
    const query = this.query().trim().toLowerCase();
    const selected = new Set(this.selectedIds());
    return TAG_CHOICES.filter(tag => tag.label.toLowerCase().includes(query)).map(tag => ({
      ...tag,
      selected: selected.has(tag.id),
    }));
  });

  openSheet(): void {
    this.query.set('');
    this.open.set(true);
  }

  closeSheet(): void {
    this.open.set(false);
  }

  onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  toggleTag(id: string): void {
    const selected = this.selectedIds();
    this.selectedIds.set(
      selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id],
    );
  }
}
