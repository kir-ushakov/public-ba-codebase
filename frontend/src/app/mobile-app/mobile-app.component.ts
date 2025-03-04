import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mobile',
  template: `<router-outlet></router-outlet>`,
  imports: [ RouterModule ],
})
export class MobileAppComponent { }
