import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-delete-dialog',
  template: `
    <div class="ce-confirm-dialog">
      <div class="ce-confirm-icon">
        <mat-icon>warning_amber</mat-icon>
      </div>
      <div class="ce-confirm-body">
        <h2 mat-dialog-title class="ce-confirm-title">{{ data.titulo }}</h2>
        <p class="ce-confirm-msg">{{ data.mensagem }}</p>
      </div>
      <mat-dialog-actions class="ce-confirm-actions">
        <button type="button" class="ce-btn-ghost" (click)="cancel()">
          Cancelar
        </button>
        <button type="button" class="ce-btn-danger" (click)="confirm()">
          <mat-icon>delete</mat-icon>
          Excluir
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./confirm-delete-dialog.component.scss'],
  standalone: false,
})
export class ConfirmDeleteDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { titulo: string; mensagem: string }
  ) {}

  confirm(): void { this.dialogRef.close(true); }
  cancel(): void { this.dialogRef.close(false); }
}
