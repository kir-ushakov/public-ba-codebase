import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeSyncStatusComponent } from 'src/app/mobile-app/components/screens/home-screen/home-sync-status/home-sync-status.component';

describe('HomeSyncStatusComponent', () => {
  let fixture: ComponentFixture<HomeSyncStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeSyncStatusComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeSyncStatusComponent);
    fixture.detectChanges();
  });

  it('shows the signed-in-not-synced banner and a Sync now control', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="home-sync-status"]')).not.toBeNull();
    expect(host.textContent).toContain('Signed in, not synced');
    expect(host.querySelector('[data-test="home-sync-now"]')?.textContent).toContain('Sync now');
  });
});
