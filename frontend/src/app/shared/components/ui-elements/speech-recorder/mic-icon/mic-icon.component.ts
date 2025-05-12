import { Component, Input, Signal } from '@angular/core';

@Component({
  selector: 'ba-mic-icon',
  standalone: true,
  imports: [],
  templateUrl: './mic-icon.component.html',
  styleUrl: './mic-icon.component.scss',
})
export class MicIconComponent {
  @Input() color!: Signal<string>;
}
