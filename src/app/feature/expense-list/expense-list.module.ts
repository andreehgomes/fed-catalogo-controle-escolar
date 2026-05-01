import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MaterialModule } from "../../material.module";
import { ExpenseListComponent } from "./expense-list.component";
import { ExpenseListRoutingModule } from "./expense-list-routing.module";
import { ConfirmDeleteDialogModule } from "../../components/confirm-delete-dialog/confirm-delete-dialog.module";

@NgModule({
  declarations: [ExpenseListComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    ExpenseListRoutingModule,
    ConfirmDeleteDialogModule,
  ],
})
export class ExpenseListModule {}
