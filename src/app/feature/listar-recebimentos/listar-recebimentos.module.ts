import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MaterialModule } from "../../material.module";
import { ListarRecebimentosComponent } from "./listar-recebimentos.component";
import { ListarRecebimentosRoutingModule } from "./listar-recebimentos-routing.module";

@NgModule({
  declarations: [ListarRecebimentosComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    ListarRecebimentosRoutingModule,
  ],
})
export class ListarRecebimentosModule {}
