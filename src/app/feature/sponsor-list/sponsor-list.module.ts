import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MaterialModule } from "../../material.module";
import { SponsorListComponent } from "./sponsor-list.component";
import { SponsorListRoutingModule } from "./sponsor-list-routing.module";
import { ConfirmDeleteDialogModule } from "../../components/confirm-delete-dialog/confirm-delete-dialog.module";

@NgModule({
  declarations: [SponsorListComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SponsorListRoutingModule,
    ConfirmDeleteDialogModule,
  ],
})
export class SponsorListModule {}
