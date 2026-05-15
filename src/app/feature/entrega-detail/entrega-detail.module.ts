import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { ConfirmDeleteDialogModule } from '../../components/confirm-delete-dialog/confirm-delete-dialog.module';
import { InputMoedaModule } from '../../components/input-moeda/input-moeda.module';
import { EntregaDetailComponent } from './entrega-detail.component';
import { EntregaDetailRoutingModule } from './entrega-detail-routing.module';

@NgModule({
  declarations: [EntregaDetailComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    ConfirmDeleteDialogModule,
    InputMoedaModule,
    EntregaDetailRoutingModule,
  ],
})
export class EntregaDetailModule {}
