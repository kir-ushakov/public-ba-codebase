import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { VoiceInputTriggerComponent } from 'src/app/shared/features/voice-input/components/voice-input-trigger/voice-input-trigger.component';
import { VoiceInputState } from 'src/app/shared/features/voice-input/state/voice-input.state';
import { VoiceRecordingFacade } from 'src/app/shared/features/voice-input/voice-recording.facade';
import { SpeechToTextService } from 'src/app/shared/features/voice-input/api/speech-to-text.service';
import { DialogService } from 'src/app/shared/services/utility/dialog.service';
import { AuthService } from 'src/app/shared/services/api/auth.service';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { GoogleOAuthConsentService } from 'src/app/shared/services/integrations/google-oauth-consent.service';
import { AppState } from 'src/app/shared/state/app.state';
import { EUserAuthState, UserState } from 'src/app/shared/state/user.state';

const userData = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  userId: 'user-1',
  googleId: 'g-1',
};

describe('VoiceInputTriggerComponent', () => {
  let fixture: ComponentFixture<VoiceInputTriggerComponent>;
  let store: Store;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoiceInputTriggerComponent],
      providers: [
        provideStore([VoiceInputState, UserState, AppState]),
        { provide: VoiceRecordingFacade, useValue: {} },
        { provide: SpeechToTextService, useValue: {} },
        { provide: DialogService, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: SlackService, useValue: {} },
        { provide: GoogleOAuthConsentService, useValue: {} },
      ],
    }).compileComponents();

    store = TestBed.inject(Store);
    fixture = TestBed.createComponent(VoiceInputTriggerComponent);
  });

  it('shows the microphone when the user is synced and online', () => {
    setSession(EUserAuthState.Authenticated, true);

    expect(micButton()).not.toBeNull();
  });

  it('hides the microphone when the user is signed in but not synced', () => {
    setSession(EUserAuthState.LocalAuthenticated, true);

    expect(micButton()).toBeNull();
  });

  it('hides the microphone when the device is offline', () => {
    setSession(EUserAuthState.Authenticated, false);

    expect(micButton()).toBeNull();
  });

  function setSession(authState: EUserAuthState, online: boolean): void {
    store.reset({
      app: { online },
      user: {
        userData,
        authState,
        authType: undefined,
        integrations: { isAddedToSlack: undefined },
      },
      voiceInput: { voiceToTextConverting: false },
    });
    fixture.detectChanges();
  }

  function micButton(): HTMLButtonElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector(
      '[data-test="voice-input-trigger"]',
    );
  }
});
