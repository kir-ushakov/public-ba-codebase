import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { MbTaskScreenAction } from './mb-task-screen.actions';
import { Observable, Subject } from 'rxjs';
import { MbTaskScreenState, ETaskViewMode } from './mb-task-screen.state';
import { ActivatedRoute } from '@angular/router';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { MbTaskTopPanelComponent } from './mb-task-top-panel/mb-task-top-panel.component';
import { MbTaskEditComponent } from './mb-task-edit/mb-task-edit.component';
import { MbTaskViewComponent } from './mb-task-view/mb-task-view.component';
import { MbTaskSideMenuComponent } from './mb-task-side-menu/mb-task-side-menu.component';
import { MbTaskBottomPanelComponent } from 'src/app/mobile-app/components/screens/mb-task-screen/mb-task-bottom-panel/mb-task-bottom-panel.component';

@Component({
    selector: 'ba-mb-task-screen',
    templateUrl: './mb-task-screen.component.html',
    styleUrls: ['./mb-task-screen.component.scss'],
    imports: [ 
      CommonModule, 
      MatSidenavModule,
      MbTaskBottomPanelComponent,
      MbTaskTopPanelComponent,
      MbTaskEditComponent,
      MbTaskViewComponent,
      MbTaskSideMenuComponent
    ]
})
export class MbTaskScreenComponent implements OnInit, OnDestroy {
  @ViewChild('menuDrawer') menuDrawer: MatDrawer;
  @ViewChild('titleInput') set titleInput(titleInputElRef: ElementRef) {
    if (titleInputElRef) {
      const titleInput: HTMLInputElement = titleInputElRef.nativeElement;
      titleInput.focus();
      this.cdr.detectChanges();
    }
  }

  mode$: Observable<ETaskViewMode> = inject(Store).select(MbTaskScreenState.mode);
  isSideMenuOpened$: Observable<boolean> = inject(Store).select(MbTaskScreenState.isSideMenuOpened);

  ETaskViewMode = ETaskViewMode;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscribeToRouteParams();
    this.subscribeToSelectors();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  openTaksOptions() {
    this.store.dispatch(MbTaskScreenAction.OpenTaskOptions);
  }

  private subscribeToRouteParams() {
    this.route.paramMap.subscribe((params) => {
      this.store.dispatch(
        new MbTaskScreenAction.Opened(
          <ETaskViewMode>params.get('mode'),
          params.get('id')
        )
      );
    });
  }

  private subscribeToSelectors() {
    this.isSideMenuOpened$.subscribe(
      isSideMenuOpened => this.menuDrawer?.toggle(isSideMenuOpened));
  }
}
