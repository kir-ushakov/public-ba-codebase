import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MbHomeScreenComponent } from './mb-home-screen.component';
import { NgxsModule, Store } from '@ngxs/store';
import { TasksState } from '../../../../shared/state/tasks.state';
import { By } from '@angular/platform-browser';
import { Component, Input } from '@angular/core';
import { of } from 'rxjs';
import { TaskStatus, ITask } from 'src/app/shared/models/task.interface';
import { MockProvider } from 'ng-mocks';
import { MbHomeBottomPanelComponent } from './mb-home-bottom-panel/mb-home-bottom-panel.component';
import { ILoginResponseDTO } from 'src/app/shared/serivces/rest/auth.service';
import { UserState } from 'src/app/shared/state/user.state';
import { UserAvatarComponent } from '../../../../shared/components/common/user-avatar/user-avatar.component';
import { HttpClientModule } from '@angular/common/http';

describe('MbHomeScreenComponent', () => {
  let component: MbHomeScreenComponent;
  let fixture: ComponentFixture<MbHomeScreenComponent>;
  let store: Store;

  @Component({
    selector: 'ba-task-tiles-panel',
    template: '<p>Mock Mock Tiles Panel Component</p>',
  })
  class MockTaskTilesPanelComponent {
    @Input() tasks: Array<ITask>;
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([UserState]), HttpClientModule],
      declarations: [
        MbHomeScreenComponent,
        MockTaskTilesPanelComponent,
        MbHomeBottomPanelComponent,
        UserAvatarComponent,
      ],
      providers: [MockProvider(TasksState)],
    }).compileComponents();
    store = TestBed.inject(Store);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should pass 3 tasks into child TaskTilesPanelComponent', () => {
    Object.defineProperty(component, 'tasks$', { writable: true });

    component.tasks$ = of([
      { id: 'local_0', title: 'Test 1', status: TaskStatus.Todo } as ITask,
      { id: 'local_2', title: 'Test 2222', status: TaskStatus.Todo } as ITask,
      { id: 'local_3', title: 'Test 2222', status: TaskStatus.Todo } as ITask,
    ]);

    fixture.detectChanges();

    const mockTaskTilesPanelComponent = fixture.debugElement.query(
      By.css('ba-task-tiles-panel')
    ).componentInstance;
    expect(mockTaskTilesPanelComponent.tasks.length).toEqual(3);
  });

  describe('<ba-user-avatar>', () => {
    const userDateStub = {} as ILoginResponseDTO;
    it('should exists', async () => {
      Object.defineProperty(component, 'loggedIn$', { writable: true });
      component.loggedIn$ = of(true);

      fixture.detectChanges();

      const mbUserAvatarDebugEl = fixture.debugElement.query(
        By.css('ba-user-avatar')
      );
      expect(mbUserAvatarDebugEl).toBeTruthy();
    });

    describe('with UserState intergation', () => {
      it('should exists', async () => {
        store.reset({
          user: {
            userData: userDateStub,
          },
        });

        fixture.detectChanges();

        const mbUserAvatarDebugEl = fixture.debugElement.query(
          By.css('ba-user-avatar')
        );
        expect(mbUserAvatarDebugEl).toBeTruthy();
      });
    });
  });
});
