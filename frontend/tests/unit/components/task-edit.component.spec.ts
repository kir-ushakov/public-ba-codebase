import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore } from '@ngxs/store';
import { TaskEditComponent } from 'src/app/mobile-app/components/screens/task-screen/task-edit/task-edit.component';
import { TaskScreenState } from 'src/app/mobile-app/components/screens/task-screen/task-screen.state';
import { VoiceInputState } from 'src/app/shared/features/voice-input/state/voice-input.state';
import { VoiceRecordingFacade } from 'src/app/shared/features/voice-input/voice-recording.facade';
import { SpeechToTextService } from 'src/app/shared/features/voice-input/api/speech-to-text.service';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { DeviceCameraService } from 'src/app/shared/services/pwa/device-camera.service';
import { DialogService } from 'src/app/shared/services/utility/dialog.service';
import { AuthService } from 'src/app/shared/services/api/auth.service';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { GoogleOAuthConsentService } from 'src/app/shared/services/integrations/google-oauth-consent.service';
import { AppState } from 'src/app/shared/state/app.state';
import { UserState } from 'src/app/shared/state/user.state';

describe('TaskEditComponent title field', () => {
  let fixture: ComponentFixture<TaskEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskEditComponent],
      providers: [
        provideStore([TaskScreenState, VoiceInputState, UserState, AppState]),
        { provide: ImageService, useValue: {} },
        { provide: DeviceCameraService, useValue: {} },
        { provide: VoiceRecordingFacade, useValue: {} },
        { provide: SpeechToTextService, useValue: {} },
        { provide: DialogService, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: SlackService, useValue: {} },
        { provide: GoogleOAuthConsentService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskEditComponent);
    fixture.detectChanges();
  });

  it('shows the Title label, placeholder, and character count', () => {
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector<HTMLTextAreaElement>('[data-test="task-title-input"]');

    expect(host.querySelector('label')?.textContent).toContain('Title');
    expect(input?.getAttribute('placeholder')).toBe('Task title here...');
    expect(host.querySelector('[data-test="task-title-count"]')?.textContent).toContain('0/100');
    expect(host.textContent).toContain('Description');
    expect(host.querySelector('[data-test="task-description-count"]')?.textContent).toContain(
      '0/4000',
    );
    expect(host.querySelector('[data-test="task-description-strike-btn"]')).toBeNull();
    expect(host.querySelector('[data-test="task-description-bold-btn"]')).not.toBeNull();
    expect(host.querySelector('[data-test="task-images-section"]')?.textContent).toContain(
      'Images',
    );
    expect(host.querySelector('[data-test="add-image-btn"]')?.textContent).toContain('Add image');
    expect(host.querySelector('[data-test="task-images-count"]')).toBeNull();
  });

  it('updates the character count as the title changes', () => {
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector<HTMLTextAreaElement>('[data-test="task-title-input"]');

    input!.value = 'Lamp';
    input!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.querySelector('[data-test="task-title-count"]')?.textContent).toContain('4/100');
  });
});
