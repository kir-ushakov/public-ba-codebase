import { Component, Input } from '@angular/core';

@Component({
  selector: 'ba-mic-icon',
  imports: [],
  templateUrl: './mic-icon.component.html',
  styleUrl: './mic-icon.component.scss',
})
export class MicIconComponent {
  @Input() color!: string;
}
