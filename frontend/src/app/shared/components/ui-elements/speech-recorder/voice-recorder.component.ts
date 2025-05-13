import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MicIconComponent } from './mic-icon/mic-icon.component';

@Component({
  selector: 'ba-voice-recorder',
  imports: [MatIconModule, MatButtonModule, MicIconComponent],
  templateUrl: './voice-recorder.component.html',
  styleUrl: './voice-recorder.component.scss',
})
export class VoiceRecorderComponent {
  @ViewChild('progressCircle', { static: false }) circleRef!: ElementRef<SVGCircleElement>;
  @ViewChild('micWrapper', { static: false }) micWrapperRef!: ElementRef<HTMLElement>;

  micColor = signal('rgba(0, 255, 0, 0.7)');

  constructor(private dialogRef: MatDialogRef<VoiceRecorderComponent>) {}

  private animationFrame: number | null = null;

  ngAfterViewInit(): void {
    this.micWrapperRef.nativeElement.style.color = 'rgb(0, 255, 0, 0.7)';
  }

  startRecording(duration = 10000) {
    const circle = this.circleRef.nativeElement;

    const radius = 47;
    const totalLength = 2 * Math.PI * radius; // = ~295.31
    circle.style.strokeDasharray = `${totalLength}`;
    circle.style.strokeDashoffset = `${totalLength}`;

    this.animateProgress(circle, duration, totalLength);
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

  private animateProgress(circle, duration, totalLength) {
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

      this.micColor.set(color);

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }
}
