import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { NewExpenseComponent } from "./new-expense.component";

const routes: Routes = [{ path: "", component: NewExpenseComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NewExpenseRoutingModule {}
