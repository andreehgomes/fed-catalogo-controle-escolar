import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { NewClientComponent } from "./new-client.component";

const routes: Routes = [{ path: "", component: NewClientComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NewClientRoutingModule {}
