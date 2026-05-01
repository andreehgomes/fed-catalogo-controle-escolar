import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ExpenseListComponent } from "./expense-list.component";

const routes: Routes = [{ path: "", component: ExpenseListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ExpenseListRoutingModule {}
