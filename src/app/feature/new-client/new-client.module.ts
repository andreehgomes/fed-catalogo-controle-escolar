import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MaterialModule } from "../../material.module";
import { NewClientComponent } from "./new-client.component";
import { NewClientRoutingModule } from "./new-client-routing.module";
import { CardAlertModule } from "../../components/card-alert/card-alert.module";

@NgModule({
  declarations: [NewClientComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    NewClientRoutingModule,
    CardAlertModule,
  ],
})
export class NewClientModule {}
