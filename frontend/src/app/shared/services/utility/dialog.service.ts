import type { ComponentType } from '@angular/cdk/portal';
import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private dialog = inject(MatDialog);

  public showFullScreenDialog<C extends ComponentType<unknown>>(componentClass: C) {
    return this.dialog.open(componentClass, {
      maxWidth: '100vw',
      width: '100vw',
      height: '100vh',
      autoFocus: false,
    });
  }

  public showModalDialog<C extends ComponentType<unknown>>(componentClass: C) {
    return this.dialog.open(componentClass, {
      maxWidth: '400px',
      width: '90vw',
      maxHeight: '90vh',
      panelClass: 'pwa-install-modal',
      hasBackdrop: true,
      backdropClass: 'pwa-install-backdrop',
      disableClose: false,
      autoFocus: false,
    });
  }
}
