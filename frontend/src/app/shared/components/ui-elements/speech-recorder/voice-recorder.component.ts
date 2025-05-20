import { Component, inject, output, signal, ViewChild } from '@angular/core';
import type { ElementRef } from '@angular/core';
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

  readonly started = output<void>();
  readonly stopped = output<void>();
  readonly canceled = output<void>();

  readonly dialogRef = inject(MatDialogRef<VoiceRecorderComponent>);

  radius = CIRCLE_RADIUS;
  micColor = signal(DEFAULT_MIC_COLOR);

  get radiusCssValue(): string {
    return `clamp(60px, 40vw, ${this.radius}px)`;
  }

  get micSizeCssValue(): string {
    return `clamp(60px, 40vw, ${this.radius / 2}px)`;
  }

  private animationFrame: number | null = null;
  private recordingTimeout: number | null = null;

  ngAfterViewInit(): void {
    this.startRecording();
  }

  startRecording(duration = RECORDING_DURATION): void {
    this.started.emit();
    this.animateProgress(duration);
    this.recordingTimeout = window.setTimeout(() => this.stopRecording(), duration);
  }

  stopRecording(): void {
    this.stopped.emit();
    this.finalize();
  }

  cancel(): void {
    this.canceled.emit();
    this.finalize();
  }

  private animateProgress(duration: number): void {
    const circle = this.circleRef.nativeElement;
    const totalLength = 2 * Math.PI * this.radius;
    circle.style.strokeDasharray = `${totalLength}`;
    circle.style.strokeDashoffset = `${totalLength}`;

    const start = performance.now();

    const animate = (now: number): void => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      // Dash offset
      circle.style.strokeDashoffset = progress >= 1 ? '0' : `${totalLength * (1 - progress)}`;

      // Color interpolation (green → red)
      const MAX_RGB_COLOR_VALUE = 255;
      const red = Math.round(MAX_RGB_COLOR_VALUE * progress);
      const green = Math.round(MAX_RGB_COLOR_VALUE * (1 - progress));
      circle.style.stroke = `rgb(${red}, ${green}, 0)`;

      const color = `rgb(${red}, ${green}, 0)`;

      this.micColor.set(color);

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private finalize(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
    }
    this.dialogRef.close();
  }
}
