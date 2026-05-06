import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { SponsorListComponent } from "./sponsor-list.component";

const routes: Routes = [{ path: "", component: SponsorListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SponsorListRoutingModule {}
