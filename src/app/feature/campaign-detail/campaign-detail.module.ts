import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MaterialModule } from "../../material.module";
import { CampaignDetailComponent } from "./campaign-detail.component";
import { CampaignDetailRoutingModule } from "./campaign-detail-routing.module";
import { ConfirmDeleteDialogModule } from "../../components/confirm-delete-dialog/confirm-delete-dialog.module";

@NgModule({
  declarations: [CampaignDetailComponent],
  imports: [CommonModule, MaterialModule, CampaignDetailRoutingModule, ConfirmDeleteDialogModule],
})
export class CampaignDetailModule {}
