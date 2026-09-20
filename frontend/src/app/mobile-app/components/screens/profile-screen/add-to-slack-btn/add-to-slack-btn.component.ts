import { Component } from '@angular/core';
import { environment as env } from '../../../../../../environments/environment';

@Component({
  selector: 'app-add-to-slack-btn',
  templateUrl: './add-to-slack-btn.component.html',
  styleUrls: ['./add-to-slack-btn.component.scss'],
})
export class AddToSlackBtnComponent {
  readonly INSTALL_PATH = 'https://slack.com/oauth/v2/authorize';
  readonly REDIRECT_URI = 'https://brainas.net/integrations/slack/install';
  readonly SCOPES = [
    'chat:write',
    'channels:read',
    'groups:read',
    'mpim:read',
    'im:read',
    'channels:manage',
    'groups:write',
    'im:write',
    'mpim:write',
    'channels:join',
  ];
  readonly CLIENT_ID = env.slackAppClientId;

  get scopes() {
    return this.SCOPES.toString();
  }

  get installURI() {
    return `${this.INSTALL_PATH}?scope=${this.scopes}&redirect_uri=${this.REDIRECT_URI}&client_id=${this.CLIENT_ID}`;
  }
}
