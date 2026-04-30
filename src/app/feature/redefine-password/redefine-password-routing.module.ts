import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RedefinePasswordComponent } from "./redefine-password.component";
import { RouterModule, Routes } from "@angular/router";

const routes: Routes = [
  {
    path: "",
    component: RedefinePasswordComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RedefinePasswordRoutingModule {}
