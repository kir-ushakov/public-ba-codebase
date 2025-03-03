import { Routes } from '@angular/router';
import { DtHomeScreenComponent } from './components/screens/dt-home-screen/dt-home-screencomponent';
import { DesktopAppComponent } from './desktop-app.components';

export const desktopRoutes: Routes = [
  {
    path: '',
    component: DesktopAppComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: DtHomeScreenComponent },
    ],
  },
];
