import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskSideMenuItemComponent } from 'src/app/mobile-app/components/screens/task-screen/task-side-menu/task-side-menu-item/task-side-menu-item.component';

describe('TaskSideMenuItemComponent', () => {
  let fixture: ComponentFixture<TaskSideMenuItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskSideMenuItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskSideMenuItemComponent);
    fixture.componentRef.setInput('optionItem', {
      label: 'Edit',
      icon: 'assets/edit.png',
      callback: jest.fn(),
    });
    fixture.detectChanges();
  });

  it('renders the option label and a data-test hook from it', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Edit');
    expect(host.querySelector('[data-test="task-menu-edit"]')).not.toBeNull();
  });
});
