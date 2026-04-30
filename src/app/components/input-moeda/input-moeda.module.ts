import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputMoedaComponent } from './input-moeda.component';
import { InputMoedaPipe } from './inputMoeda.pipe';
import { SiglaMoedaPipe } from './sigla-moeda.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';

@NgModule({
  declarations: [InputMoedaComponent, InputMoedaPipe, SiglaMoedaPipe],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  exports: [InputMoedaComponent, InputMoedaPipe],
})
export class InputMoedaModule {}
