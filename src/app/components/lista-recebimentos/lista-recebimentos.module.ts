import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { ListaRecebimentosComponent } from './lista-recebimentos.component';
import { ConfirmDeleteDialogModule } from 'src/app/components/confirm-delete-dialog/confirm-delete-dialog.module';

@NgModule({
  declarations: [ListaRecebimentosComponent],
  imports: [CommonModule, MaterialModule, ConfirmDeleteDialogModule],
  exports: [ListaRecebimentosComponent],
})
export class ListaRecebimentosModule {}
