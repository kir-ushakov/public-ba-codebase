import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';

@Component({
    selector: 'ba-mb-task-side-menu',
    templateUrl: './mb-task-side-menu.component.html',
    styleUrl: './mb-task-side-menu.component.scss'
})
export class MbTaskSideMenuComponent {
  @ViewChild('menuDrawer', { static: true }) menuDrawer!: MatDrawer;

  @Output() editTask = new EventEmitter<void>();
  @Output() completeTask = new EventEmitter<void>();
  @Output() cancelTask = new EventEmitter<void>();
  @Output() deleteTask = new EventEmitter<void>();
}
