import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { EntregaListComponent } from './entrega-list.component';
import { EntregaListRoutingModule } from './entrega-list-routing.module';

@NgModule({
  declarations: [EntregaListComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    EntregaListRoutingModule,
  ],
})
export class EntregaListModule {}
