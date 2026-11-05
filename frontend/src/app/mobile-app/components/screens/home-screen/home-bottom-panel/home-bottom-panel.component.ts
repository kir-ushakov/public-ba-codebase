import { Component, input, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ETaskViewMode } from 'src/app/mobile-app/components/screens/task-screen/task-screen.state';

@Component({
  selector: 'ba-home-bottom-panel',
  templateUrl: './home-bottom-panel.component.html',
  styleUrls: ['./home-bottom-panel.component.scss'],
  imports: [RouterLink],
})
export class HomeBottomPanelComponent {
  readonly page = input<'home' | 'tags'>('home');
  readonly createTag = output<void>();

  constructor(private router: Router) {}

  onCreate(): void {
    if (this.page() === 'tags') {
      this.createTag.emit();
      return;
    }
    void this.router.navigate([`task/${ETaskViewMode.Create}`]);
  }
}
