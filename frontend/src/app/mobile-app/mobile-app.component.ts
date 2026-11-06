import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mobile',
  template: `<router-outlet></router-outlet>`,
  styleUrl: './mobile-app.component.scss',
  imports: [RouterModule],
})
export class MobileAppComponent {}
