import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ba-home-sync-status',
  templateUrl: './home-sync-status.component.html',
  styleUrls: ['./home-sync-status.component.scss'],
  imports: [RouterLink],
})
export class HomeSyncStatusComponent {
  readonly title = input('Signed in, not synced');
  readonly body = input('Your changes will sync when connection is available.');
  readonly showAction = input(true);
  readonly testId = input('home-sync-status');
}
