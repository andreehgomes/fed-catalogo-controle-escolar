import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MaterialModule } from "../../material.module";
import { NewCampaignComponent } from "./new-campaign.component";
import { NewCampaignRoutingModule } from "./new-campaign-routing.module";
import { CardAlertModule } from "../../components/card-alert/card-alert.module";
import { InputMoedaModule } from "../../components/input-moeda/input-moeda.module";

@NgModule({
  declarations: [NewCampaignComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    NewCampaignRoutingModule,
    CardAlertModule,
    InputMoedaModule,
  ],
})
export class NewCampaignModule {}
