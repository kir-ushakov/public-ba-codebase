import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ETaskViewMode } from 'src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.state';

@Component({
  selector: 'ba-mb-home-bottom-panel',
  templateUrl: './mb-home-bottom-panel.component.html',
  styleUrls: ['./mb-home-bottom-panel.component.scss'],
  imports: [RouterLink],
})
export class MbHomeBottomPanelComponent {
  constructor(private router: Router) {}

  createTask(): void {
    void this.router.navigate(['task/' + ETaskViewMode.Create]);
  }
}
