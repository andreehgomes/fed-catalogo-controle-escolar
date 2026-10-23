import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RedefinePasswordComponent } from "./redefine-password.component";
import { RedefinePasswordRoutingModule } from "./redefine-password-routing.module";
import { MaterialModule } from "src/app/material.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CardAlertModule } from "src/app/components/card-alert/card-alert.module";

@NgModule({
  declarations: [RedefinePasswordComponent],
  imports: [
    CommonModule,
    RedefinePasswordRoutingModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    CardAlertModule,
  ],
})
export class RedefinePasswordModule {}
