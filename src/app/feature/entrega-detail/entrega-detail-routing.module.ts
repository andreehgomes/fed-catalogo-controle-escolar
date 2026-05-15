import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EntregaDetailComponent } from './entrega-detail.component';

const routes: Routes = [{ path: '', component: EntregaDetailComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EntregaDetailRoutingModule {}
