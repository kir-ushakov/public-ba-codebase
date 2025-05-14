import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MicIconComponent } from './mic-icon/mic-icon.component';
import { CommonModule } from '@angular/common';

const DEFAULT_MIC_COLOR = 'rgba(0, 255, 0, 0.7)';
const CIRCLE_RADIUS = 147;
const RECORDING_DURATION = 10000;

@Component({
  selector: 'ba-voice-recorder',
  imports: [CommonModule, MatIconModule, MatButtonModule, MicIconComponent],
  templateUrl: './voice-recorder.component.html',
  styleUrl: './voice-recorder.component.scss',
})
export class VoiceRecorderComponent {
  @ViewChild('progressCircle', { static: false }) circleRef!: ElementRef<SVGCircleElement>;

  radius = CIRCLE_RADIUS;
  micColor = signal(DEFAULT_MIC_COLOR);

  get radiusCssValue(): string {
    return `clamp(60px, 40vw, ${this.radius}px)`;
  }

  get micSizeCssValue(): string {
    return `clamp(60px, 40vw, ${this.radius / 2}px)`;
  }

  constructor(private dialogRef: MatDialogRef<VoiceRecorderComponent>) {}

  private animationFrame: number | null = null;

  ngOnInit() {}

  ngAfterViewInit() {}

  startRecording(duration = RECORDING_DURATION) {
    this.animateProgress(duration);
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

  ngOnDestroy(): void {
    this.stopRecording();
  }

  private animateProgress(duration: number) {
    const circle = this.circleRef.nativeElement;
    const totalLength = 2 * Math.PI * this.radius;
    circle.style.strokeDasharray = `${totalLength}`;
    circle.style.strokeDashoffset = `${totalLength}`;

    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      // Dash offset
      circle.style.strokeDashoffset = progress >= 1 ? '0' : `${totalLength * (1 - progress)}`;

      // Color interpolation (green → red)
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
