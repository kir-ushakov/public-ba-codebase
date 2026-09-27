import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusSelectorComponent } from 'src/app/mobile-app/components/screens/task-screen/task-edit/status-selector/status-selector.component';

describe('StatusSelectorComponent', () => {
  let fixture: ComponentFixture<StatusSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusSelectorComponent);
    fixture.detectChanges();
  });

  it('shows To do selected and Active unselected', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="task-status-section"]')?.textContent).toContain(
      'Status',
    );
    expect(host.querySelector('[data-test="task-status-todo"]')?.textContent).toContain('To do');
    expect(host.querySelector('[data-test="task-status-active"]')?.textContent).toContain('Active');
    expect(host.querySelector('[data-test="task-status-todo"]')?.getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(
      host.querySelector('[data-test="task-status-active"]')?.getAttribute('aria-pressed'),
    ).toBe('false');
  });

  it('selects Active and keeps a single selection', () => {
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-test="task-status-active"]')!.click();
    fixture.detectChanges();

    expect(
      host.querySelector('[data-test="task-status-active"]')?.getAttribute('aria-pressed'),
    ).toBe('true');
    expect(host.querySelector('[data-test="task-status-todo"]')?.getAttribute('aria-pressed')).toBe(
      'false',
    );

    host.querySelector<HTMLButtonElement>('[data-test="task-status-active"]')!.click();
    fixture.detectChanges();

    expect(
      host.querySelector('[data-test="task-status-active"]')?.getAttribute('aria-pressed'),
    ).toBe('true');
  });
});
