import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MaterialModule } from "../../material.module";
import { NewSponsorComponent } from "./new-sponsor.component";
import { NewSponsorRoutingModule } from "./new-sponsor-routing.module";
import { CardAlertModule } from "../../components/card-alert/card-alert.module";
import { InputMoedaModule } from "../../components/input-moeda/input-moeda.module";

@NgModule({
  declarations: [NewSponsorComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    NewSponsorRoutingModule,
    CardAlertModule,
    InputMoedaModule,
  ],
})
export class NewSponsorModule {}
