import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MaterialModule } from "../../material.module";
import { ClientListComponent } from "./client-list.component";
import { ClientListRoutingModule } from "./client-list-routing.module";
import { ConfirmDeleteDialogModule } from "../../components/confirm-delete-dialog/confirm-delete-dialog.module";

@NgModule({
  declarations: [ClientListComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    ClientListRoutingModule,
    ConfirmDeleteDialogModule,
  ],
})
export class ClientListModule {}
