import { Component, input, output } from '@angular/core';
import type { TagListItem } from '../helpers/tag-list.function';

@Component({
  selector: 'ba-tag-row',
  templateUrl: './tag-row.component.html',
  styleUrl: './tag-row.component.scss',
})
export class TagRowComponent {
  readonly tag = input.required<TagListItem>();
  readonly opened = output<string>();
  readonly pinned = output<{ id: string; isPinned: boolean }>();
}
