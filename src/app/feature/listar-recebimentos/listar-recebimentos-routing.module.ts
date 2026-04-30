import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ListarRecebimentosComponent } from "./listar-recebimentos.component";

const routes: Routes = [{ path: "", component: ListarRecebimentosComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ListarRecebimentosRoutingModule {}
