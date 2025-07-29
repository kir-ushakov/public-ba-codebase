import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { PwaInstallService } from 'src/app/shared/services/pwa/pwa-install.service';

@Component({
  selector: 'ba-pwa-install-dialog',
  templateUrl: './pwa-install-dialog.component.html',
  styleUrls: ['./pwa-install-dialog.component.scss'],
  imports: [CommonModule, MatButtonModule, MatIconModule],
  standalone: true,
})
export class PwaInstallDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<PwaInstallDialogComponent>);
  private readonly pwaInstallService = inject(PwaInstallService);

  public async installPWA(): Promise<void> {
    try {
      await this.pwaInstallService.installPWA();
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Failed to install PWA:', error);
      // Keep dialog open on error so user can try again
    }
  }

  public dismiss(): void {
    this.dialogRef.close(false);
  }
}
