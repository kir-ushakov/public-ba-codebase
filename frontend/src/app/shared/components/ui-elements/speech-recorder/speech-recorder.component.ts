import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'ba-speech-recorder',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './speech-recorder.component.html',
  styleUrl: './speech-recorder.component.scss',
})
export class SpeechRecorderComponent {
  @ViewChild('progressCircle', { static: false }) circleRef!: ElementRef<SVGCircleElement>;

  constructor(private dialogRef: MatDialogRef<SpeechRecorderComponent>) {}

  private animationFrame: number | null = null;

  ngAfterViewInit(): void {
    // Ensure that the mic icon is initialized with the desired color
    const micIconWrapper = document.querySelector('.mic-icon-wrapper') as HTMLElement;
    if (micIconWrapper) {
      micIconWrapper.style.color = 'rgb(0, 255, 0, 0.7)';
    }
  }

  startRecording(duration = 10000) {
    const circle = this.circleRef.nativeElement;
    const micIconWrapper = document.querySelector('.mic-icon-wrapper') as HTMLElement;

    const radius = 47;
    const totalLength = 2 * Math.PI * radius; // = ~295.31
    circle.style.strokeDasharray = `${totalLength}`;
    circle.style.strokeDashoffset = `${totalLength}`;

    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      // Dash offset
      circle.style.strokeDashoffset = progress >= 1 ? '0' : `${totalLength * (1 - progress)}`;

      // Color interpolation (yellow → red)
      const red = Math.round(255 * progress);
      const green = Math.round(255 * (1 - progress));
      circle.style.stroke = `rgb(${red}, ${green}, 0)`;

      const color = `rgb(${red}, ${green}, 0)`;

      // Update the mic icon's parent wrapper color, which the mic icon inherits
      if (micIconWrapper) {
        micIconWrapper.style.color = color; // This will change the mic icon color
      }

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  stopRecording() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
