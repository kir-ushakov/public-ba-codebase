import { Component, computed, effect, ElementRef, OnInit, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Store, createSelectMap } from '@ngxs/store';
import { AppAction } from 'src/app/shared/state/app.actions';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { UserState } from 'src/app/shared/state/user.state';
import { IUserAvatarInputData } from 'src/app/shared/components/ui-elements/user-avatar/user-avatar.interface';
import { HomeBottomPanelComponent } from './home-bottom-panel/home-bottom-panel.component';
import { HomeAccountMenuComponent } from './home-account-menu/home-account-menu.component';
import { HomeSyncStatusComponent } from './home-sync-status/home-sync-status.component';
import { TaskTilesPanelComponent } from '../../common/task-tiles-panel/task-tiles-panel.component';
import { filterHomeTasks } from './helpers/filter-home-tasks.function';

@Component({
  selector: 'ba-home-screen',
  templateUrl: './home-screen.component.html',
  styleUrls: ['./home-screen.component.scss'],
  imports: [
    ReactiveFormsModule,
    HomeAccountMenuComponent,
    HomeBottomPanelComponent,
    HomeSyncStatusComponent,
    TaskTilesPanelComponent,
  ],
})
export class HomeScreenComponent implements OnInit {
  selectors = createSelectMap({
    tasks: TasksState.actualTasks,
    isLoggedIn: UserState.isLoggedIn,
    isLocalAuthenticated: UserState.isLocalAuthenticated,
    userFullName: UserState.userFullName,
    userEmail: UserState.userEmail,
  });

  avatarInputData!: IUserAvatarInputData;

  readonly searchOpen = signal(false);
  readonly queryControl = new FormControl('', { nonNullable: true });
  readonly hasQuery = computed(() => this.query().trim().length > 0);
  readonly filteredTasks = computed(() => filterHomeTasks(this.selectors.tasks(), this.query()));
  readonly showNoResults = computed(
    () => this.searchOpen() && this.hasQuery() && this.filteredTasks().length === 0,
  );

  private readonly query = toSignal(this.queryControl.valueChanges, { initialValue: '' });
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  get itemCountLabel(): string {
    return `${this.selectors.tasks().length} items`;
  }

  constructor(private store: Store) {
    effect(() => {
      if (!this.searchOpen()) {
        return;
      }

      this.searchInput()?.nativeElement.focus();
    });
  }

  ngOnInit(): void {
    this.store.dispatch(AppAction.Opened);
    this.setAvatarInputData();
  }

  openSearch(): void {
    this.searchOpen.set(true);
  }

  clearSearch(): void {
    this.queryControl.setValue('');
    this.searchInput()?.nativeElement.focus();
  }

  cancelSearch(): void {
    this.queryControl.setValue('');
    this.searchOpen.set(false);
  }

  private setAvatarInputData(): void {
    const userNameFirstLetter = this.store.selectSnapshot(UserState.userNameFirstLetter);

    this.avatarInputData = {
      firstLetter: userNameFirstLetter,
    };
  }
}
