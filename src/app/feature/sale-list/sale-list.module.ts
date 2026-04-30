import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MaterialModule } from "../../material.module";
import { SaleListComponent } from "./sale-list.component";
import { SaleListRoutingModule } from "./sale-list-routing.module";
import { ConfirmDeleteDialogModule } from "../../components/confirm-delete-dialog/confirm-delete-dialog.module";

@NgModule({
  declarations: [SaleListComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SaleListRoutingModule,
    ConfirmDeleteDialogModule,
  ],
})
export class SaleListModule {}
