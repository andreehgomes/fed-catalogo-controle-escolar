import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ClientDetailComponent } from "./client-detail.component";

const routes: Routes = [{ path: "", component: ClientDetailComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientDetailRoutingModule {}
