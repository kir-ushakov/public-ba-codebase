import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeBottomPanelComponent } from 'src/app/mobile-app/components/screens/home-screen/home-bottom-panel/home-bottom-panel.component';

describe('HomeBottomPanelComponent', () => {
  let fixture: ComponentFixture<HomeBottomPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeBottomPanelComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeBottomPanelComponent);
    fixture.detectChanges();
  });

  it('exposes the create-task button and primary nav hooks', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="new-task-btn"]')).not.toBeNull();
    expect(host.querySelector('[data-test="bottom-nav-home"]')?.textContent).toContain('Home');
    expect(host.querySelector('[data-test="bottom-nav-tasks"]')).not.toBeNull();
    expect(host.querySelector('[data-test="bottom-nav-tags"]')).not.toBeNull();
    expect(host.querySelector('[data-test="bottom-nav-home"]')?.getAttribute('aria-current')).toBe(
      'page',
    );
  });

  it('marks Tags as the current destination and offers create tag', () => {
    fixture.componentRef.setInput('page', 'tags');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="bottom-nav-tags"]')?.getAttribute('aria-current')).toBe(
      'page',
    );
    expect(
      host.querySelector('[data-test="bottom-nav-home"]')?.getAttribute('aria-current'),
    ).toBeNull();
    expect(host.querySelector('[data-test="tags-create"]')?.getAttribute('aria-label')).toBe(
      'Create tag',
    );
    expect(host.querySelector('[data-test="new-task-btn"]')).toBeNull();
  });
});
