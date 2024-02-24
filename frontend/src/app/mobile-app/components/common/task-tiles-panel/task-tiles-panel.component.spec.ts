import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';

import { TaskTilesPanelComponent } from './task-tiles-panel.component';
import { TaskTileComponent } from './task-tile/task-tile.component';
import { By } from '@angular/platform-browser';
import { ITask } from 'src/app/shared/models/task.interface';
describe('TaskTilesPanelComponent', () => {
  let component: TaskTilesPanelComponent;
  let fixture: ComponentFixture<TaskTilesPanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [TaskTilesPanelComponent, MockComponent(TaskTileComponent)],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskTilesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shoud contains zero tiles', () => {
    const tasks: Array<ITask> = [];

    component.tasks = tasks;
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('ba-task-tile').length
    ).toEqual(0);
  });

  it('shoud create 1 tile', () => {
    const tasks: Array<ITask> = [{ title: 'Test 1' } as ITask];
    component.tasks = tasks;
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('ba-task-tile').length
    ).toEqual(1);
  });

  it('shoud create 5 tiles', () => {
    const tasks: Array<ITask> = [
      { title: 'Test 1' } as ITask,
      { title: 'Test 2' } as ITask,
      { title: 'Test 3' } as ITask,
      { title: 'Test 4' } as ITask,
      { title: 'Test 5' } as ITask,
    ];
    component.tasks = tasks;
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('ba-task-tile').length
    ).toEqual(5);
  });

  // maybe add intagration test with involving task-tiles or test with ng-mock
  it('shoud pass task object to TaskTile', () => {
    const testTask = { title: 'Test 1' } as ITask;
    const tasks: Array<ITask> = [testTask];

    component.tasks = tasks;
    fixture.detectChanges();

    const taskTile = fixture.debugElement.query(By.css('ba-task-tile'))
      .componentInstance as TaskTileComponent;
    expect(taskTile.task).toBeTruthy();
    expect(taskTile.task).toEqual(testTask);
  });
});
