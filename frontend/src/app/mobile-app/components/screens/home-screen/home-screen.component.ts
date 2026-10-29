import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Store, createSelectMap } from '@ngxs/store';
import { AppAction } from 'src/app/shared/state/app.actions';
import { TagsState } from 'src/app/shared/state/tags.state';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { UserState } from 'src/app/shared/state/user.state';
import { IUserAvatarInputData } from 'src/app/shared/components/ui-elements/user-avatar/user-avatar.interface';
import { HomeBottomPanelComponent } from './home-bottom-panel/home-bottom-panel.component';
import { HomeAccountMenuComponent } from './home-account-menu/home-account-menu.component';
import { HomeContentModeComponent } from './home-content-mode/home-content-mode.component';
import { HomeContentModeService } from './home-content-mode.service';
import { HomeSyncStatusComponent } from './home-sync-status/home-sync-status.component';
import { TaskTilesPanelComponent } from '../../common/task-tiles-panel/task-tiles-panel.component';
import { filterHomeTasks } from './helpers/filter-home-tasks.function';
import {
  homeModeAfterSwipe,
  homeModeCounts,
  homeModeItemLabel,
  tasksForHomeMode,
  type HomeContentMode,
} from './helpers/home-content-mode.function';

@Component({
  selector: 'ba-home-screen',
  templateUrl: './home-screen.component.html',
  styleUrls: ['./home-screen.component.scss'],
  imports: [
    ReactiveFormsModule,
    HomeAccountMenuComponent,
    HomeBottomPanelComponent,
    HomeContentModeComponent,
    HomeSyncStatusComponent,
    TaskTilesPanelComponent,
  ],
})
export class HomeScreenComponent implements OnInit {
  selectors = createSelectMap({
    tasks: TasksState.actualTasks,
    tags: TagsState.forCurrentUser,
    isLoggedIn: UserState.isLoggedIn,
    isLocalAuthenticated: UserState.isLocalAuthenticated,
    userFullName: UserState.userFullName,
    userEmail: UserState.userEmail,
  });

  avatarInputData!: IUserAvatarInputData;

  readonly searchOpen = signal(false);
  readonly queryControl = new FormControl('', { nonNullable: true });
  readonly contentMode = inject(HomeContentModeService).mode;
  readonly modeCounts = computed(() => homeModeCounts(this.selectors.tasks()));
  readonly hasQuery = computed(() => this.query().trim().length > 0);
  readonly filteredTasks = computed(() =>
    filterHomeTasks(
      tasksForHomeMode(this.selectors.tasks(), this.contentMode()),
      this.query(),
      this.selectors.tags(),
    ),
  );
  readonly itemCountLabel = computed(() =>
    homeModeItemLabel(this.contentMode(), this.modeCounts()[this.contentMode()]),
  );
  readonly showNoResults = computed(
    () => this.searchOpen() && this.hasQuery() && this.filteredTasks().length === 0,
  );

  private readonly contentModeService = inject(HomeContentModeService);
  private readonly query = toSignal(this.queryControl.valueChanges, { initialValue: '' });
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private contentTouchStart: { x: number; y: number } | undefined;

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

  selectContentMode(mode: HomeContentMode): void {
    this.contentModeService.select(mode);
  }

  onContentTouchStart(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }
    this.contentTouchStart = { x: touch.clientX, y: touch.clientY };
  }

  onContentTouchEnd(event: TouchEvent): void {
    const start = this.contentTouchStart;
    const touch = event.changedTouches[0];
    this.contentTouchStart = undefined;
    if (!start || !touch) {
      return;
    }

    const next = homeModeAfterSwipe(
      this.contentMode(),
      touch.clientX - start.x,
      touch.clientY - start.y,
    );
    this.selectContentMode(next);
  }

  private setAvatarInputData(): void {
    const userNameFirstLetter = this.store.selectSnapshot(UserState.userNameFirstLetter);

    this.avatarInputData = {
      firstLetter: userNameFirstLetter,
    };
  }
}
