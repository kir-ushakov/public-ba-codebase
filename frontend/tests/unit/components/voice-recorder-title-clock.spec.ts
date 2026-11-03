import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
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
            level: () => 0,
            capturedBytes: () => 0,
            cancelRecording: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VoiceRecorderComponent);
    fixture.detectChanges();
  });

  it('stays at 0 / 12 s until capture starts', () => {
    const host = fixture.nativeElement as HTMLElement;
    const apply = host.querySelector<HTMLButtonElement>('[data-test="voice-recorder-apply"]');

    expect(host.querySelector('[data-test="voice-recorder-clock"]')?.textContent).toContain(
      '0 / 12 s',
    );
    expect(apply?.disabled).toBe(true);
  });
});
