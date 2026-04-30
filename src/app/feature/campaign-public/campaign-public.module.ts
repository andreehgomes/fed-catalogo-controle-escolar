import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MaterialModule } from "../../material.module";
import { CampaignPublicComponent } from "./campaign-public.component";
import { CampaignPublicRoutingModule } from "./campaign-public-routing.module";

@NgModule({
  declarations: [CampaignPublicComponent],
  imports: [CommonModule, MaterialModule, CampaignPublicRoutingModule],
})
export class CampaignPublicModule {}
