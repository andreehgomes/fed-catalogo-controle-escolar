import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { RouterEnum } from "../../core/router/router.enum";
import { PerfilEnum } from "../../shared/model/accout.enum";
import { UserProfileService } from "../../shared/service/user-profile/user-profile.service";

interface FeedCard {
  label: string;
  icon: string;
  route: RouterEnum;
  color: "primary" | "accent" | "success" | "warn";
  allowedPerfis?: PerfilEnum[];
}

@Component({
  selector: "app-feed",
  templateUrl: "./feed.component.html",
  styleUrls: ["./feed.component.scss"],
  standalone: false,
})
export class FeedComponent implements OnInit, OnDestroy {
  cards: FeedCard[] = [];

  private readonly allCards: FeedCard[] = [
    { label: "Campanhas", icon: "campaign", route: RouterEnum.CAMPAIGN_LIST, color: "primary", allowedPerfis: [PerfilEnum.MASTER, PerfilEnum.ADMIN] },
    { label: "Nova venda", icon: "point_of_sale", route: RouterEnum.NEW_SALE, color: "accent", allowedPerfis: [PerfilEnum.MASTER, PerfilEnum.ADMIN] },
    { label: "Vendas", icon: "receipt_long", route: RouterEnum.SALE_LIST, color: "success", allowedPerfis: [PerfilEnum.MASTER, PerfilEnum.ADMIN] },
    { label: "A receber", icon: "request_quote", route: RouterEnum.CONTAS_A_RECEBER, color: "warn", allowedPerfis: [PerfilEnum.MASTER, PerfilEnum.ADMIN] },
    { label: "Despesas", icon: "receipt", route: RouterEnum.EXPENSE_LIST, color: "warn", allowedPerfis: [PerfilEnum.MASTER, PerfilEnum.ADMIN] },
    { label: "Clientes", icon: "people", route: RouterEnum.CLIENT_LIST, color: "primary", allowedPerfis: [PerfilEnum.MASTER, PerfilEnum.ADMIN] },
    { label: "Patrocínios", icon: "volunteer_activism", route: RouterEnum.SPONSOR_LIST, color: "accent", allowedPerfis: [PerfilEnum.MASTER, PerfilEnum.ADMIN] },
    { label: "Dashboard", icon: "dashboard", route: RouterEnum.DASHBOARD, color: "accent", allowedPerfis: [PerfilEnum.MASTER, PerfilEnum.ADMIN] },
    { label: "Entregas", icon: "local_shipping", route: RouterEnum.ENTREGA_LIST, color: "success" },
  ];

  private profileSub?: Subscription;

  constructor(private router: Router, private userProfileService: UserProfileService) {}

  ngOnInit(): void {
    this.profileSub = this.userProfileService.perfil$.subscribe((perfil) => {
      this.cards = this.allCards.filter(
        (c) => !c.allowedPerfis || c.allowedPerfis.includes(perfil as PerfilEnum)
      );
    });
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
  }

  goTo(rota: string): void {
    this.router.navigate([rota]);
  }
}
