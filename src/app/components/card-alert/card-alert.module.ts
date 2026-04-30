import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardAlertComponent } from './card-alert.component';
import { MaterialModule } from 'src/app/material.module';



@NgModule({
  declarations: [
    CardAlertComponent
  ],
  imports: [
    CommonModule,
    MaterialModule
  ],
  exports: [CardAlertComponent]
})
export class CardAlertModule { }
