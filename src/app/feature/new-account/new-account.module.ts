import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NewAccountComponent } from "./new-account.component";
import { NewAccountRoutingModule } from "./new-account-routing.module";
import { MaterialModule } from "src/app/material.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CardAlertModule } from "../../components/card-alert/card-alert.module";

@NgModule({
  declarations: [NewAccountComponent],
  imports: [
    CommonModule,
    NewAccountRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CardAlertModule,
  ],
})
export class NewAccountModule {}
