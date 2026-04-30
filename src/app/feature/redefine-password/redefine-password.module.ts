import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RedefinePasswordComponent } from "./redefine-password.component";
import { RedefinePasswordRoutingModule } from "./redefine-password-routing.module";
import { MaterialModule } from "src/app/material.module";
import { ToolbarModule } from "src/app/components/toolbar/toolbar.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FooterModule } from "src/app/components/footer/footer.module";
import { CardAlertModule } from "src/app/components/card-alert/card-alert.module";

@NgModule({
  declarations: [RedefinePasswordComponent],
  imports: [
    CommonModule,
    RedefinePasswordRoutingModule,
    ToolbarModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    FooterModule,
    CardAlertModule,
  ],
})
export class RedefinePasswordModule {}
