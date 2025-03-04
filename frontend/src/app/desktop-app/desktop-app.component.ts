import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'desktop-mobile',
  imports: [ RouterModule ],
  template: `<router-outlet></router-outlet>`
})
export class DesktopAppComponent {}