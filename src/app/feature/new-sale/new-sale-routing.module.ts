import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { NewSaleComponent } from "./new-sale.component";

const routes: Routes = [{ path: "", component: NewSaleComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NewSaleRoutingModule {}
