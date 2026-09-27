import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ba-tag-selector',
  templateUrl: './tag-selector.component.html',
  styleUrl: './tag-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagSelectorComponent {}
