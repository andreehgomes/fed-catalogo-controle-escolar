import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MaterialModule } from "../../material.module";
import { RecebimentoComponent } from "./recebimento.component";
import { RecebimentoRoutingModule } from "./recebimento-routing.module";
import { CardAlertModule } from "../../components/card-alert/card-alert.module";
import { InputMoedaModule } from "../../components/input-moeda/input-moeda.module";

@NgModule({
  declarations: [RecebimentoComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    RecebimentoRoutingModule,
    CardAlertModule,
    InputMoedaModule,
  ],
})
export class RecebimentoModule {}
