import { Component, HostListener, Input, inject, signal } from '@angular/core';
import { Store } from '@ngxs/store';
import { UserAvatarComponent } from 'src/app/shared/components/ui-elements/user-avatar/user-avatar.component';
import { IUserAvatarInputData } from 'src/app/shared/components/ui-elements/user-avatar/user-avatar.interface';
import { AppAction } from 'src/app/shared/state/app.actions';
import { MbHomeAccountMenuAction } from './mb-home-account-menu.actions';

@Component({
  selector: 'ba-mb-home-account-menu',
  templateUrl: './mb-home-account-menu.component.html',
  styleUrls: ['./mb-home-account-menu.component.scss'],
  imports: [UserAvatarComponent],
})
export class MbHomeAccountMenuComponent {
  private readonly store = inject(Store);

  @Input({ required: true }) avatarInputData!: IUserAvatarInputData;
  @Input() userFullName: string | null = null;
  @Input() userEmail: string | null = null;

  readonly isOpen = signal(false);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  toggle(): void {
    this.isOpen.update(isOpen => !isOpen);
  }

  close(): void {
    this.isOpen.set(false);
  }

  openProfile(): void {
    this.close();
    this.store.dispatch(AppAction.NavigateToProfileScreen);
  }

  signOut(): void {
    this.close();
    this.store.dispatch(new MbHomeAccountMenuAction.SignOut());
  }
}
