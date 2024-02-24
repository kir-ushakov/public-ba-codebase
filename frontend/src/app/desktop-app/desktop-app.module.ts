import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DesktopAppRoutingModule } from './desktop-app-routing.module';
import { DtHomeScreenComponent } from './components/screens/dt-home-screen/dt-home-screencomponent';
import { DtProfileScreenComponent } from './components/screens/dt-profile-screen/dt-profile-screen.component';

@NgModule({
  imports: [CommonModule, DesktopAppRoutingModule],
  declarations: [DtHomeScreenComponent, DtProfileScreenComponent],
})
export class DesktopAppModule {}
