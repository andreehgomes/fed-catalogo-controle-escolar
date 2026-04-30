import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { NewSponsorComponent } from "./new-sponsor.component";

const routes: Routes = [{ path: "", component: NewSponsorComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NewSponsorRoutingModule {}
