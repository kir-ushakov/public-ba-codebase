import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TaskTileComponent } from './task-tile.component';
import { NgxsModule } from '@ngxs/store';
import { ITask } from 'src/app/shared/models/task.interface';

describe('TaskTileComponent', () => {
  const testTitle = 'Test Title';
  let component: TaskTileComponent;
  let fixture: ComponentFixture<TaskTileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([])],
      declarations: [TaskTileComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskTileComponent);
    component = fixture.componentInstance;
    component.task = { title: testTitle } as ITask;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it(`shoud have title = "${testTitle}"`, () => {
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('.task-tile-title').length
    ).toEqual(1);
    expect(
      fixture.nativeElement.querySelectorAll('.task-tile-title')[0].textContent
    ).toContain(testTitle);
  });
});
