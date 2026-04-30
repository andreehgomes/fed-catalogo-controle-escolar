import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { RecebimentoComponent } from "./recebimento.component";

const routes: Routes = [{ path: "", component: RecebimentoComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecebimentoRoutingModule {}
