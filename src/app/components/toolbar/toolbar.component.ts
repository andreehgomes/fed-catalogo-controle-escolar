import { Component, Input, OnInit } from "@angular/core";
import { SidenavService } from "src/app/shared/service/sidenav/sidenav.service";

@Component({
    selector: "app-toolbar",
    templateUrl: "./toolbar.component.html",
    styleUrls: ["./toolbar.component.scss"],
    standalone: false
})
export class ToolbarComponent {
  @Input() usuario?: any;
  @Input() labelComponente?: string;

  constructor(private sidenavService: SidenavService) {}

  toggleSidenav() {
    this.sidenavService.emit();
  }
}
