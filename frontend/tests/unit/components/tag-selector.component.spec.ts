import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TagSelectorComponent } from 'src/app/mobile-app/components/screens/task-screen/task-edit/tag-selector/tag-selector.component';

describe('TagSelectorComponent', () => {
  let fixture: ComponentFixture<TagSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TagSelectorComponent);
    fixture.detectChanges();
  });

  it('shows the Tags label and the Add tags selector', () => {
    const host = fixture.nativeElement as HTMLElement;
    const selector = host.querySelector<HTMLButtonElement>('[data-test="task-tags-selector"]');

    expect(host.querySelector('[data-test="task-tags-section"]')?.textContent).toContain('Tags');
    expect(selector?.textContent).toContain('Add tags...');
    expect(selector?.tagName).toBe('BUTTON');
  });
});
