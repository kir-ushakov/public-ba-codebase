import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'ba-spinner',
  imports: [],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss'
})
export class SpinnerComponent {
  @ViewChild('spinner', { static: true }) spinnerRef!: ElementRef;

  getNativeElement(): HTMLElement {
    return this.spinnerRef.nativeElement;
  }
}
