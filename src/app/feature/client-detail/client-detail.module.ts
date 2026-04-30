import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MaterialModule } from "../../material.module";
import { ClientDetailComponent } from "./client-detail.component";
import { ClientDetailRoutingModule } from "./client-detail-routing.module";

@NgModule({
  declarations: [ClientDetailComponent],
  imports: [CommonModule, MaterialModule, ClientDetailRoutingModule],
})
export class ClientDetailModule {}
