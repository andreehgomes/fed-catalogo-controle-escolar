import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { CampaignListComponent } from "./campaign-list.component";

const routes: Routes = [{ path: "", component: CampaignListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CampaignListRoutingModule {}
