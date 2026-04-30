import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ContasAReceberComponent } from "./contas-a-receber.component";

const routes: Routes = [{ path: "", component: ContasAReceberComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContasAReceberRoutingModule {}
