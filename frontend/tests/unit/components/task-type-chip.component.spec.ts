import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ETaskType } from '@brainassistant/contracts';
import { TaskTypeChipComponent } from 'src/app/mobile-app/components/screens/task-screen/task-type-chip/task-type-chip.component';

describe('TaskTypeChipComponent', () => {
  let fixture: ComponentFixture<TaskTypeChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskTypeChipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskTypeChipComponent);
  });

  it('shows Basic as To do', () => {
    fixture.componentRef.setInput('type', ETaskType.Basic);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const chip = host.querySelector('[data-test="task-type-chip"]');

    expect(host.querySelector('[data-test="task-type-section"]')?.textContent).toContain(
      'Task type',
    );
    expect(chip?.textContent).toContain('To do');
    expect(chip?.textContent).toContain('radio_button_unchecked');
  });

  it('shows Location and Calendar', () => {
    const host = fixture.nativeElement as HTMLElement;

    fixture.componentRef.setInput('type', ETaskType.Location);
    fixture.detectChanges();
    expect(host.querySelector('[data-test="task-type-chip"]')?.textContent).toContain('Location');
    expect(host.querySelector('[data-test="task-type-chip"]')?.textContent).toContain(
      'location_on',
    );

    fixture.componentRef.setInput('type', ETaskType.Calendar);
    fixture.detectChanges();
    expect(host.querySelector('[data-test="task-type-chip"]')?.textContent).toContain('Calendar');
    expect(host.querySelector('[data-test="task-type-chip"]')?.textContent).toContain(
      'calendar_month',
    );
  });
});
