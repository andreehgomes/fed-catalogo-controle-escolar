import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MaterialModule } from "../../material.module";
import { ContasAReceberComponent } from "./contas-a-receber.component";
import { ContasAReceberRoutingModule } from "./contas-a-receber-routing.module";
import { ConfirmDeleteDialogModule } from "../../components/confirm-delete-dialog/confirm-delete-dialog.module";
import { ListaRecebimentosModule } from "../../components/lista-recebimentos/lista-recebimentos.module";

@NgModule({
  declarations: [ContasAReceberComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    ContasAReceberRoutingModule,
    ConfirmDeleteDialogModule,
    ListaRecebimentosModule,
  ],
})
export class ContasAReceberModule {}
