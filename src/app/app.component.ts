import { Component, OnInit, ViewChild } from "@angular/core";
import { Observable, filter, map, shareReplay } from "rxjs";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { Auth, authState, User } from "@angular/fire/auth";

import { RouterService } from "./core/router/router.service";
import { LoginService } from "./feature/login/shared/service/login.service";
import { InitAuthService } from "./core/base-auth/init-auth.service";
import { AlertaModel } from "./shared/model/alertas-model";
import { PayloadLogin } from "./feature/login/shared/model/payload-login";
import { RouterEnum } from "./core/router/router.enum";
import { SidenavService } from "./shared/service/sidenav/sidenav.service";
import { AccountService } from "./shared/service/account/account.service";
import { AnalyticsService } from "./shared/service/analytics/analytics.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  standalone: false,
})
export class AppComponent implements OnInit {
  @ViewChild("drawer") drawer: any;
  title = "fed-catalogo-controle-escolar";
  mensagemRespostaLogin: AlertaModel = new AlertaModel();

  routes = RouterEnum;
  user$!: Observable<User | null>;
  isLogged$!: Observable<boolean>;
  isMaster: boolean = false;
  showBtnMenu: boolean = true;
  isPublicView: boolean = false;

  private readonly routesWithToolbar: string[] = [];
  private readonly publicPathPrefixes: string[] = ["/c/"];

  constructor(
    private router: RouterService,
    private service: LoginService,
    private auth: InitAuthService,
    private activatedRoute: ActivatedRoute,
    private route: Router,
    private sidenavService: SidenavService,
    private fireAuth: Auth,
    private accountService: AccountService,
    private analyticsService: AnalyticsService
  ) {
    this.route.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        const url = event.urlAfterRedirects;
        this.isPublicView = this.publicPathPrefixes.some((p) => url.startsWith(p));
        this.showBtnMenu =
          !this.isPublicView &&
          !this.routesWithToolbar.some((r) => url.startsWith(r));
      });
  }

  ngOnInit(): void {
    this.user$ = authState(this.fireAuth).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.isLogged$ = this.user$.pipe(map((u) => !!u));

    this.sidenavService.toggle.subscribe(() => this.drawer?.toggle());

    this.user$.subscribe((user) => {
      if (user && !user.isAnonymous) {
        this.loadUserProfile(user.uid);
      } else {
        this.isMaster = false;
      }
    });

    this.initiByStorage();
  }

  private loadUserProfile(uid: string): void {
    this.accountService.getAccountByUidKey(uid).then((accounts) => {
      this.isMaster = accounts[0]?.perfil === "master";
      this.analyticsService.setUserProfile(accounts[0]?.perfil ?? null);
    });
  }

  initiByStorage() {
    const path = window.location.pathname;
    const url = window.location.href;
    const isPublicView = this.publicPathPrefixes.some((p) => path.startsWith(p));
    const isPublicRoute =
      isPublicView ||
      url.includes(RouterEnum.REDEFINE_PASSWORD) ||
      url.includes(RouterEnum.LOGIN);
    const usuario = this.auth.getToken();
    if (!usuario && !isPublicRoute) {
      this.analyticsService.markProfileReady();
      this.router.navigate(this.router.route.LOGIN);
    }
  }

  logout(rota: string) {
    sessionStorage.setItem("logout", "s");
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    this.isMaster = false;
    this.auth.logout();
    this.router.navigate(rota);
  }

  goTo(param?: string) {
    if (param) this.router.navigate(param);
    else this.router.navigate(this.router.route.FEED);
  }
}
