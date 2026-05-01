import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { RouterEnum } from "../../core/router/router.enum";

interface FeedCard {
  label: string;
  icon: string;
  route: RouterEnum;
  color: "primary" | "accent" | "success" | "warn";
}

@Component({
  selector: "app-feed",
  templateUrl: "./feed.component.html",
  styleUrls: ["./feed.component.scss"],
  standalone: false,
})
export class FeedComponent {
  cards: FeedCard[] = [
    { label: "Campanhas", icon: "campaign", route: RouterEnum.CAMPAIGN_LIST, color: "primary" },
    { label: "Nova venda", icon: "point_of_sale", route: RouterEnum.NEW_SALE, color: "accent" },
    { label: "Vendas", icon: "receipt_long", route: RouterEnum.SALE_LIST, color: "success" },
    { label: "A receber", icon: "request_quote", route: RouterEnum.CONTAS_A_RECEBER, color: "warn" },
    { label: "Despesas", icon: "receipt", route: RouterEnum.EXPENSE_LIST, color: "warn" },
    { label: "Clientes", icon: "people", route: RouterEnum.CLIENT_LIST, color: "primary" },
    { label: "Dashboard", icon: "dashboard", route: RouterEnum.DASHBOARD, color: "accent" },
  ];

  constructor(private router: Router) {}

  goTo(rota: string): void {
    this.router.navigate([rota]);
  }
}
