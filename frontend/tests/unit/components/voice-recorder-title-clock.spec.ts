import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { of, throwError } from 'rxjs';
import { VoiceRecorderComponent } from 'src/app/shared/features/voice-input/components/voice-recorder/voice-recorder.component';
import { VoiceRecordingFacade } from 'src/app/shared/features/voice-input/voice-recording.facade';

describe('VoiceRecorderComponent title clock', () => {
  let fixture: ComponentFixture<VoiceRecorderComponent>;

  beforeEach(async () => {
    global.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as typeof ResizeObserver;

    await TestBed.configureTestingModule({
      imports: [VoiceRecorderComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'title' } },
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        {
          provide: Store,
          useValue: {
            dispatch: () => new Promise(() => undefined),
          },
        },
        {
          provide: VoiceRecordingFacade,
          useValue: {
            engine: 'media-recorder',
            isRecording: false,
            level: () => 0,
            capturedBytes: () => 0,
            cancelRecording: jest.fn(),
            whenCaptureEnds: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VoiceRecorderComponent);
    fixture.detectChanges();
  });

  it('shows Preparing microphone and hides the timer until capture starts', () => {
    const host = fixture.nativeElement as HTMLElement;
    const apply = host.querySelector<HTMLButtonElement>('[data-test="voice-recorder-apply"]');
    const cancel = host.querySelector<HTMLButtonElement>('[data-test="voice-recorder-cancel"]');

    expect(host.querySelector('[data-test="voice-recorder-preparing"]')?.textContent).toContain(
      'Preparing microphone...',
    );
    expect(host.querySelector('[data-test="voice-recorder-clock"]')).toBeNull();
    expect(apply?.disabled).toBe(true);
    expect(cancel?.disabled).toBe(false);
  });

  it('releases the microphone when the recorder is destroyed during preparation', () => {
    const recorder = TestBed.inject(VoiceRecordingFacade) as { cancelRecording: jest.Mock };

    fixture.destroy();

    expect(recorder.cancelRecording).toHaveBeenCalled();
  });
});

describe('VoiceRecorderComponent attachment', () => {
  const cancelRecording = jest.fn();
  const close = jest.fn();
  let fixture: ComponentFixture<VoiceRecorderComponent>;

  beforeEach(async () => {
    global.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as typeof ResizeObserver;
    cancelRecording.mockReset();
    close.mockReset();

    await TestBed.configureTestingModule({
      imports: [VoiceRecorderComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'attachment' } },
        { provide: MatDialogRef, useValue: { close } },
        {
          provide: Store,
          useValue: {
            dispatch: () => of(undefined),
          },
        },
        {
          provide: VoiceRecordingFacade,
          useValue: {
            engine: 'media-recorder',
            isRecording: true,
            level: () => 0,
            levels: () => Array.from({ length: 16 }, (_, index) => (index + 1) / 16),
            capturedBytes: () => 1200,
            cancelRecording,
            whenCaptureEnds: () => undefined,
            pauseRecording: () => Promise.resolve(),
            resumeRecording: () => Promise.resolve(),
            stopRecording: () => Promise.resolve(new Blob(['a'])),
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  async function render(): Promise<ComponentFixture<VoiceRecorderComponent>> {
    fixture = TestBed.createComponent(VoiceRecorderComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('shows Voice attachment with labeled actions and no header close', async () => {
    const host = (await render()).nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="voice-recorder-dismiss"]')).toBeNull();
    expect(host.textContent).toContain('Voice attachment');
    expect(host.textContent).toContain('Cancel');
    expect(host.querySelector('[data-test="voice-recorder-pause-label"]')?.textContent).toContain(
      'Pause',
    );
    expect(host.textContent).toContain('Save');
    expect(host.querySelector('[data-test="voice-recorder-status"]')?.textContent).toContain(
      'Recording',
    );
    expect(host.querySelector('[data-test="voice-recorder-waveform"]')).not.toBeNull();
  });

  it('asks before discarding captured audio', async () => {
    const host = (await render()).nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-test="voice-recorder-cancel"]')?.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="voice-recorder-keep"]')?.textContent).toContain(
      'Keep recording',
    );
    expect(host.querySelector('[data-test="voice-recorder-discard"]')?.textContent).toContain(
      'Discard recording',
    );

    host.querySelector<HTMLButtonElement>('[data-test="voice-recorder-keep"]')?.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="voice-recorder-discard"]')).toBeNull();
    expect(close).not.toHaveBeenCalled();
  });

  it('switches Pause to Resume and freezes the status', async () => {
    const host = (await render()).nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-test="voice-recorder-pause"]')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="voice-recorder-pause-label"]')?.textContent).toContain(
      'Resume',
    );
    expect(host.querySelector('[data-test="voice-recorder-status"]')?.textContent).toContain(
      'Paused',
    );
  });
});

describe('VoiceRecorderComponent microphone failure', () => {
  const dispatch = jest.fn();

  beforeEach(async () => {
    dispatch.mockReset();
    dispatch.mockReturnValue(throwError(() => new DOMException('denied', 'NotAllowedError')));
    global.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as typeof ResizeObserver;

    await TestBed.configureTestingModule({
      imports: [VoiceRecorderComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'attachment' } },
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: Store, useValue: { dispatch } },
        {
          provide: VoiceRecordingFacade,
          useValue: {
            engine: 'media-recorder',
            isRecording: false,
            capturedBytes: () => 0,
            cancelRecording: jest.fn(),
            whenCaptureEnds: () => undefined,
          },
        },
      ],
    }).compileComponents();
  });

  it('shows Retry and Cancel instead of staying on Preparing microphone', async () => {
    const fixture = TestBed.createComponent(VoiceRecorderComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="voice-recorder-preparing"]')).toBeNull();
    expect(host.querySelector('[data-test="voice-recorder-error"]')?.textContent).toContain(
      'Microphone access was denied.',
    );
    expect(host.querySelector('[data-test="voice-recorder-retry"]')?.textContent).toContain(
      'Retry',
    );
    expect(
      host.querySelector<HTMLButtonElement>('[data-test="voice-recorder-cancel"]')?.disabled,
    ).toBe(false);
    expect(
      host.querySelector<HTMLButtonElement>('[data-test="voice-recorder-pause"]')?.disabled,
    ).toBe(true);

    dispatch.mockReturnValue(new Promise(() => undefined));
    host.querySelector<HTMLButtonElement>('[data-test="voice-recorder-retry"]')?.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="voice-recorder-preparing"]')?.textContent).toContain(
      'Preparing microphone...',
    );
    expect(dispatch).toHaveBeenCalledTimes(2);
    fixture.destroy();
  });
});

describe('VoiceRecorderComponent startup that does not begin capture', () => {
  let endCapture: () => void;

  beforeEach(async () => {
    endCapture = () => undefined;
    global.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as typeof ResizeObserver;

    await TestBed.configureTestingModule({
      imports: [VoiceRecorderComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'title' } },
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        {
          provide: Store,
          useValue: {
            dispatch: () => {
              endCapture();
              return of(undefined);
            },
          },
        },
        {
          provide: VoiceRecordingFacade,
          useValue: {
            engine: 'media-recorder',
            isRecording: false,
            capturedBytes: () => 0,
            cancelRecording: jest.fn(),
            whenCaptureEnds: (handler: () => void) => {
              endCapture = handler;
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('leaves Preparing when the microphone disconnects before capture starts', async () => {
    const fixture = TestBed.createComponent(VoiceRecorderComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="voice-recorder-preparing"]')).toBeNull();
    expect(host.querySelector('[data-test="voice-recorder-error"]')?.textContent).toContain(
      'The microphone disconnected.',
    );
    expect(host.querySelector('[data-test="voice-recorder-clock"]')).toBeNull();
    fixture.destroy();
  });
});
