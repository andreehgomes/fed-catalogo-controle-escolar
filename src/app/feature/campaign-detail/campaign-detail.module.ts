import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MaterialModule } from "../../material.module";
import { CampaignDetailComponent } from "./campaign-detail.component";
import { CampaignDetailRoutingModule } from "./campaign-detail-routing.module";

@NgModule({
  declarations: [CampaignDetailComponent],
  imports: [CommonModule, MaterialModule, CampaignDetailRoutingModule],
})
export class CampaignDetailModule {}
