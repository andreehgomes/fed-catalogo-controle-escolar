import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { SaleListComponent } from "./sale-list.component";

const routes: Routes = [{ path: "", component: SaleListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SaleListRoutingModule {}
