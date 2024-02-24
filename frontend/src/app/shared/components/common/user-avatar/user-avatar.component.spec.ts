import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgxsModule } from '@ngxs/store';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { AuthService } from 'src/app/shared/serivces/rest/auth.service';
import { UserAvatarComponent } from './user-avatar.component';

describe('UserAvatarComponent', () => {
  let component: UserAvatarComponent;
  let fixture: ComponentFixture<UserAvatarComponent>;
  let authService: AuthService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([])],
      declarations: [UserAvatarComponent],
      providers: [MockProvider(AuthService)],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('.first-letter', () => {
    it('should exists', () => {
      const firstLetterDebugEl = fixture.debugElement.query(
        By.css('.first-letter')
      );
      expect(firstLetterDebugEl).toBeTruthy();
    });

    it("should contain letter 'K'", () => {
      const firstLetterStub = 'K';
      Object.defineProperty(component, 'userNameFirstLetter$', {
        writable: true,
      });
      component.userNameFirstLetter$ = of(firstLetterStub);

      fixture.detectChanges();

      const firstLetterEl: HTMLDivElement = fixture.debugElement.query(
        By.css('.first-letter')
      ).nativeElement;
      expect(firstLetterEl.innerText).toEqual(firstLetterStub);
    });

    it('should make letter size to fit to container', () => {
      const firstLetterEl: HTMLDivElement = fixture.debugElement.query(
        By.css('.first-letter')
      ).nativeElement;
      expect(firstLetterEl.style.fontSize).toBe(
        fixture.nativeElement.offsetHeight * 0.75 + 'px'
      );
    });
  });
});
