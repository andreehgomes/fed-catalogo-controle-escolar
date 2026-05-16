import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { ConfirmDeleteDialogModule } from '../../components/confirm-delete-dialog/confirm-delete-dialog.module';
import { AccountListRoutingModule } from './account-list-routing.module';
import { AccountListComponent } from './account-list.component';

@NgModule({
  declarations: [AccountListComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    AccountListRoutingModule,
    ConfirmDeleteDialogModule,
  ],
})
export class AccountListModule {}
