import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { deleteTagMessage } from '../helpers/tag-list.function';

export type DeleteTagDialogData = {
  name: string;
  taskCount: number;
};

@Component({
  selector: 'ba-delete-tag-dialog',
  templateUrl: './delete-tag-dialog.component.html',
  styleUrl: './delete-tag-dialog.component.scss',
})
export class DeleteTagDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<DeleteTagDialogComponent, boolean>);
  readonly data = inject<DeleteTagDialogData>(MAT_DIALOG_DATA);
  readonly message = deleteTagMessage(this.data.name, this.data.taskCount);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
