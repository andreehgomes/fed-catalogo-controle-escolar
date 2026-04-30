import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MaterialModule } from "../../material.module";
import { NewSaleComponent } from "./new-sale.component";
import { NewSaleRoutingModule } from "./new-sale-routing.module";
import { CardAlertModule } from "../../components/card-alert/card-alert.module";
import { InputMoedaModule } from "../../components/input-moeda/input-moeda.module";

@NgModule({
  declarations: [NewSaleComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    NewSaleRoutingModule,
    CardAlertModule,
    InputMoedaModule,
  ],
})
export class NewSaleModule {}
