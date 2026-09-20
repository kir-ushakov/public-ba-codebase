import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ETaskViewMode } from 'src/app/mobile-app/components/screens/task-screen/task-screen.state';

@Component({
  selector: 'ba-home-bottom-panel',
  templateUrl: './home-bottom-panel.component.html',
  styleUrls: ['./home-bottom-panel.component.scss'],
  imports: [RouterLink],
})
export class HomeBottomPanelComponent {
  constructor(private router: Router) {}

  createTask(): void {
    void this.router.navigate(['task/' + ETaskViewMode.Create]);
  }
}
