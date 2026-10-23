import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageErrorComponent } from './page-error.component';
import { PageErrorRoutingModule } from './page-error-routing.module';
import { MaterialModule } from 'src/app/material.module';


@NgModule({
  declarations: [PageErrorComponent],
  imports: [
    CommonModule,
    PageErrorRoutingModule,
    MaterialModule,
  ]
})
export class PageErrorModule { }
