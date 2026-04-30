import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MaterialModule } from "../../material.module";
import { CampaignListComponent } from "./campaign-list.component";
import { CampaignListRoutingModule } from "./campaign-list-routing.module";
import { ConfirmDeleteDialogModule } from "../../components/confirm-delete-dialog/confirm-delete-dialog.module";

@NgModule({
  declarations: [CampaignListComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    CampaignListRoutingModule,
    ConfirmDeleteDialogModule,
  ],
})
export class CampaignListModule {}
