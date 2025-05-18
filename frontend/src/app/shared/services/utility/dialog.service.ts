import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  public showFullScreenDialog<C extends ComponentType<unknown>>(componentClass: C) {
    return this.dialog.open(componentClass, {
      maxWidth: '100vw',
      width: '100vw',
      height: '100vh',
      autoFocus: false,
    });
  }
}
