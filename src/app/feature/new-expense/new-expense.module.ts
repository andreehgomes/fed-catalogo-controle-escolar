import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MaterialModule } from "../../material.module";
import { NewExpenseComponent } from "./new-expense.component";
import { NewExpenseRoutingModule } from "./new-expense-routing.module";
import { CardAlertModule } from "../../components/card-alert/card-alert.module";
import { InputMoedaModule } from "../../components/input-moeda/input-moeda.module";

@NgModule({
  declarations: [NewExpenseComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    NewExpenseRoutingModule,
    CardAlertModule,
    InputMoedaModule,
  ],
})
export class NewExpenseModule {}
