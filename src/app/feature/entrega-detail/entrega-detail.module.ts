import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { ConfirmDeleteDialogModule } from '../../components/confirm-delete-dialog/confirm-delete-dialog.module';
import { EntregaDetailComponent } from './entrega-detail.component';
import { EntregaDetailRoutingModule } from './entrega-detail-routing.module';

@NgModule({
  declarations: [EntregaDetailComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    ConfirmDeleteDialogModule,
    EntregaDetailRoutingModule,
  ],
})
export class EntregaDetailModule {}
