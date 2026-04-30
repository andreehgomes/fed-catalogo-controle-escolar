import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';

@NgModule({
  declarations: [ConfirmDeleteDialogComponent],
  imports: [CommonModule, MaterialModule],
  exports: [ConfirmDeleteDialogComponent],
})
export class ConfirmDeleteDialogModule {}
