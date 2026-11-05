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
import { Router } from '@angular/router';
import { createSelectMap, Store } from '@ngxs/store';
import { HomeAccountMenuComponent } from '../home-screen/home-account-menu/home-account-menu.component';
import { HomeBottomPanelComponent } from '../home-screen/home-bottom-panel/home-bottom-panel.component';
import { HomeContentModeService } from '../home-screen/home-content-mode.service';
import { TagSelectorComponent } from '../task-screen/task-edit/tag-selector/tag-selector.component';
import { IUserAvatarInputData } from 'src/app/shared/components/ui-elements/user-avatar/user-avatar.interface';
import { TagsAction } from 'src/app/shared/state/tags.action';
import { TagsState } from 'src/app/shared/state/tags.state';
import { TasksState } from 'src/app/shared/state/tasks.state';
import { UserState } from 'src/app/shared/state/user.state';
import { buildTagRows, filterTagRows, tagsPageSubtitle } from './helpers/tag-list.function';
import { TagRowComponent } from './tag-row/tag-row.component';

@Component({
  selector: 'ba-tags-screen',
  templateUrl: './tags-screen.component.html',
  styleUrl: './tags-screen.component.scss',
  imports: [
    ReactiveFormsModule,
    HomeAccountMenuComponent,
    HomeBottomPanelComponent,
    TagRowComponent,
    TagSelectorComponent,
  ],
})
export class TagsScreenComponent implements OnInit {
  selectors = createSelectMap({
    tags: TagsState.forCurrentUser,
    tasks: TasksState.actualTasks,
    isLoggedIn: UserState.isLoggedIn,
    userFullName: UserState.userFullName,
    userEmail: UserState.userEmail,
  });

  avatarInputData!: IUserAvatarInputData;

  readonly searchOpen = signal(false);
  readonly queryControl = new FormControl('', { nonNullable: true });
  readonly rows = computed(() => buildTagRows(this.selectors.tags(), this.selectors.tasks()));
  readonly subtitle = computed(() =>
    tagsPageSubtitle(this.rows().length, this.rows().filter(row => row.isPinned).length),
  );
  readonly hasQuery = computed(() => this.query().trim().length > 0);
  readonly visibleRows = computed(() => filterTagRows(this.rows(), this.query()));
  readonly pinnedRows = computed(() => this.rows().filter(row => row.isPinned));
  readonly otherRows = computed(() => this.rows().filter(row => !row.isPinned));

  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly contentMode = inject(HomeContentModeService);
  private readonly query = toSignal(this.queryControl.valueChanges, { initialValue: '' });
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly tagCreator = viewChild.required(TagSelectorComponent);

  constructor() {
    effect(() => {
      if (!this.searchOpen()) {
        return;
      }
      this.searchInput()?.nativeElement.focus();
    });

    effect(() => {
      this.contentMode.notePinned(this.pinnedRows().map(row => row.id));
    });
  }

  ngOnInit(): void {
    this.contentMode.bindUser(this.store.selectSnapshot(UserState.userId));
    const userNameFirstLetter = this.store.selectSnapshot(UserState.userNameFirstLetter);
    this.avatarInputData = { firstLetter: userNameFirstLetter };
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

  openTag(tagId: string): void {
    this.contentMode.showTag(tagId);
    void this.router.navigate(['/home']);
  }

  togglePin(change: { id: string; isPinned: boolean }): void {
    this.store.dispatch(new TagsAction.SetPinned(change.id, !change.isPinned));
  }

  openCreate(): void {
    this.tagCreator().openCreateSheet();
  }
}
