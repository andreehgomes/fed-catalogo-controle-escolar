import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NewAccountComponent } from "./new-account.component";
import { NewAccountRoutingModule } from "./new-account-routing.module";
import { FooterModule } from "../../components/footer/footer.module";
import { ToolbarModule } from "src/app/components/toolbar/toolbar.module";
import { MaterialModule } from "src/app/material.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CardAlertModule } from "../../components/card-alert/card-alert.module";
import { MAT_DATE_FORMATS } from "@angular/material/core";

@NgModule({
  declarations: [NewAccountComponent],
  imports: [
    CommonModule,
    NewAccountRoutingModule,
    FooterModule,
    ToolbarModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CardAlertModule,
  ],
})
export class NewAccountModule {}
