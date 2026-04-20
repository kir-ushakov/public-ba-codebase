import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

const MAX_RGB_COLOR_VALUE = 255;
const DEFAULT_STROKE_WIDTH = 3;
const DEFAULT_DURATION_MS = 10_000;
const DEFAULT_BLUR_STD_DEV = 1.5;

let nextId = 0;

/**
 * #VIWAI_FE_PROGRESS-RING:
 *
 * Progress ring: displays a progress ring with a customizable stroke width, duration, and blur standard deviation.
 * It emits a color change event as the progress advances.
 *
 * I extracted the progress ring into a separate component that renders an SVG-based progress indicator.
 * This keeps the recording logic separate from the animation, simplifies the code, and allows the component
 * to be modified or extended without affecting the main recording flow.
 */

@Component({
  selector: 'ba-progress-ring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-ring.component.html',
  styleUrl: './progress-ring.component.scss',
})
export class ProgressRingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('progressCircle', { static: true }) private circleRef!: ElementRef<SVGCircleElement>;

  @Input() strokeWidth = DEFAULT_STROKE_WIDTH;
  @Input() duration = DEFAULT_DURATION_MS;
  @Input() blurStdDev = DEFAULT_BLUR_STD_DEV;

  @Output() readonly colorChange = new EventEmitter<string>();

  readonly filterId = `baProgressRingBlur_${++nextId}`;

  private animationFrame: number | null = null;
  private autoRadius: number | null = null;
  private resizeObserver?: ResizeObserver;
  private pendingStart = false;

  constructor(
    private readonly hostRef: ElementRef<HTMLElement>,
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get viewBox(): string {
    const r = this.renderRadius;
    const size = r > 0 ? 2 * r : 0;
    return `0 0 ${size} ${size}`;
  }

  // used by template bindings (cx/cy/r)
  get renderRadius(): number {
    return this.autoRadius ?? 0;
  }

  ngAfterViewInit(): void {
    this.setupResizeObserver();
  }

  start(): void {
    const radius = this.renderRadius;
    if (!radius) {
      // radius may arrive later via ResizeObserver; start then
      this.pendingStart = true;
      return;
    }
    this.pendingStart = false;

    const circle = this.circleRef.nativeElement;
    const totalLength = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${totalLength}`;
    circle.style.strokeDashoffset = `${totalLength}`;

    const startAt = performance.now();

    /** Throttle Angular-bound color updates: full rAF for SVG, rare emits so mic capture (main thread) stays free. */
    const colorEmitEveryMs = 120;
    let lastColorEmitAt = 0;

    const animate = (now: number): void => {
      const elapsed = now - startAt;
      const progress = Math.min(elapsed / this.duration, 1);

      circle.style.strokeDashoffset = progress >= 1 ? '0' : `${totalLength * (1 - progress)}`;

      const red = Math.round(MAX_RGB_COLOR_VALUE * progress);
      const green = Math.round(MAX_RGB_COLOR_VALUE * (1 - progress));
      const color = `rgb(${red}, ${green}, 0)`;
      circle.style.stroke = color;

      if (now - lastColorEmitAt >= colorEmitEveryMs || progress >= 1) {
        lastColorEmitAt = now;
        this.zone.run(() => this.colorChange.emit(color));
      }

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.animationFrame = null;
      }
    };

    // Recording uses WebAudio `ScriptProcessor` on the main thread when AudioWorklet is unavailable;
    // keep this loop outside Angular to avoid zone + CD overhead every frame.
    this.zone.runOutsideAngular(() => {
      this.animationFrame = requestAnimationFrame(animate);
    });
  }

  stop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  ngOnDestroy(): void {
    this.stop();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
  }

  // Derive the ring radius from the host element size.
  // ResizeObserver callbacks run outside Angular, so we re-enter the Angular zone to update state
  // and trigger change detection. If `start()` ran before we had a non-zero radius, `pendingStart`
  // defers the animation until the first valid measurement arrives.
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const rect = entry.contentRect;
      const size = Math.min(rect.width, rect.height);
      const stroke = this.strokeWidth ?? 0;

      // ResizeObserver runs outside Angular; bring state updates back in
      this.zone.run(() => {
        this.autoRadius = Math.max(size / 2 - stroke / 2, 0);
        this.cdr.markForCheck();

        if (this.pendingStart && this.animationFrame === null && this.renderRadius > 0) {
          this.start();
        }
      });
    });

    this.resizeObserver.observe(this.hostRef.nativeElement);
  }
}

