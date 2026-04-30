import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

const routes: Routes = [
  {
    path: "login",
    loadChildren: () =>
      import("./feature/login/login.module").then((m) => m.LoginModule),
  },
  {
    path: "new-account",
    loadChildren: () =>
      import("./feature/new-account/new-account.module").then(
        (m) => m.NewAccountModule
      ),
  },
  {
    path: "redefine-password",
    loadChildren: () =>
      import("./feature/redefine-password/redefine-password.module").then(
        (m) => m.RedefinePasswordModule
      ),
  },
  {
    path: "error",
    loadChildren: () =>
      import("./feature/page-error/page-error.module").then(
        (m) => m.PageErrorModule
      ),
  },
  {
    path: "feed",
    loadChildren: () =>
      import("./feature/feed/feed.module").then((m) => m.FeedModule),
  },
  {
    path: "campaign-list",
    loadChildren: () =>
      import("./feature/campaign-list/campaign-list.module").then(
        (m) => m.CampaignListModule
      ),
  },
  {
    path: "new-campaign",
    loadChildren: () =>
      import("./feature/new-campaign/new-campaign.module").then(
        (m) => m.NewCampaignModule
      ),
  },
  {
    path: "campaign-detail/:key",
    loadChildren: () =>
      import("./feature/campaign-detail/campaign-detail.module").then(
        (m) => m.CampaignDetailModule
      ),
  },
  {
    path: "client-list",
    loadChildren: () =>
      import("./feature/client-list/client-list.module").then(
        (m) => m.ClientListModule
      ),
  },
  {
    path: "new-client",
    loadChildren: () =>
      import("./feature/new-client/new-client.module").then(
        (m) => m.NewClientModule
      ),
  },
  {
    path: "client-detail/:key",
    loadChildren: () =>
      import("./feature/client-detail/client-detail.module").then(
        (m) => m.ClientDetailModule
      ),
  },
  {
    path: "new-sale",
    loadChildren: () =>
      import("./feature/new-sale/new-sale.module").then(
        (m) => m.NewSaleModule
      ),
  },
  {
    path: "sale-list",
    loadChildren: () =>
      import("./feature/sale-list/sale-list.module").then(
        (m) => m.SaleListModule
      ),
  },
  {
    path: "contas-a-receber",
    loadChildren: () =>
      import("./feature/contas-a-receber/contas-a-receber.module").then(
        (m) => m.ContasAReceberModule
      ),
  },
  {
    path: "recebimento/:saleKey",
    loadChildren: () =>
      import("./feature/recebimento/recebimento.module").then(
        (m) => m.RecebimentoModule
      ),
  },
  {
    path: "dashboard",
    loadChildren: () =>
      import("./feature/dashboard/dashboard.module").then(
        (m) => m.DashboardModule
      ),
  },
  {
    path: "",
    loadChildren: () =>
      import("./feature/feed/feed.module").then((m) => m.FeedModule),
  },
  {
    path: "**",
    redirectTo: "",
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
