import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EntregaListComponent } from './entrega-list.component';

const routes: Routes = [{ path: '', component: EntregaListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EntregaListRoutingModule {}
