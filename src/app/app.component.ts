import { Component, HostListener, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Observable, filter, map, shareReplay } from "rxjs";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { Auth, authState, User } from "@angular/fire/auth";

import { RouterService } from "./core/router/router.service";
import { LoginService } from "./feature/login/shared/service/login.service";
import { InitAuthService } from "./core/base-auth/init-auth.service";
import { AlertaModel } from "./shared/model/alertas-model";
import { RouterEnum } from "./core/router/router.enum";
import { SidenavService } from "./shared/service/sidenav/sidenav.service";
import { AccountService } from "./shared/service/account/account.service";
import { AnalyticsService } from "./shared/service/analytics/analytics.service";
import { UserProfileService } from "./shared/service/user-profile/user-profile.service";
import { PerfilEnum } from "./shared/model/accout.enum";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild("drawer") drawer: any;
  title = "fed-catalogo-controle-escolar";
  mensagemRespostaLogin: AlertaModel = new AlertaModel();

  routes = RouterEnum;
  user$!: Observable<User | null>;
  isLogged$!: Observable<boolean>;
  isMaster = false;
  isEstagiario = false;

  // Shell: três estados do `<aside>`.
  // - `rail`: desktop (≥ 900px) com o aside recolhido em 76px, só ícone.
  // - `expanded`: aside aberto (264px no desktop, 272px overlay no mobile).
  // - `narrow`: viewport < 900px — o aside vira drawer sobreposto.
  rail = true;
  expanded = false;
  narrow = false;

  // Rotas fora do shell. Mantidas como prefixos para pegar params em sub-rotas.
  showBtnMenu = true;
  isPublicView = false;
  private readonly outOfShellPrefixes: string[] = [
    "/" + RouterEnum.LOGIN,
    "/" + RouterEnum.NEW_ACCOUNT,
    "/" + RouterEnum.REDEFINE_PASSWORD,
    "/" + RouterEnum.RESET_PASSWORD,
    "/" + RouterEnum.ERROR,
  ];
  private readonly publicPathPrefixes: string[] = ["/c/"];

  private sidenavSub?: { unsubscribe(): void };

  constructor(
    private router: RouterService,
    private service: LoginService,
    private auth: InitAuthService,
    private activatedRoute: ActivatedRoute,
    private route: Router,
    private sidenavService: SidenavService,
    private fireAuth: Auth,
    private accountService: AccountService,
    private analyticsService: AnalyticsService,
    private userProfileService: UserProfileService
  ) {
    this.route.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        const url = event.urlAfterRedirects;
        this.isPublicView = this.publicPathPrefixes.some((p) => url.startsWith(p));
        const isOutOfShell =
          this.isPublicView ||
          this.outOfShellPrefixes.some((p) => url === p || url.startsWith(p + "/") || url.startsWith(p + "?"));
        this.showBtnMenu = !isOutOfShell;
        // Fecha o drawer ao trocar de rota em tela estreita.
        if (this.narrow) {
          this.expanded = false;
        }
      });
  }

  ngOnInit(): void {
    this.user$ = authState(this.fireAuth).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.isLogged$ = this.user$.pipe(map((u) => !!u));

    this.sidenavSub = this.sidenavService.toggle.subscribe(() => this.alternarNav());

    this.user$.subscribe((user) => {
      if (user && !user.isAnonymous) {
        this.loadUserProfile(user.uid);
      } else {
        this.isMaster = false;
        this.isEstagiario = false;
      }
    });

    this.initiByStorage();
    this.aplicarLargura();
  }

  ngOnDestroy(): void {
    this.sidenavSub?.unsubscribe();
  }

  @HostListener("window:resize")
  onResize(): void {
    this.aplicarLargura();
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.narrow && this.expanded) {
      this.fecharNav();
    }
  }

  // Alterna entre rail e expandido no desktop; abre e fecha o drawer no mobile.
  alternarNav(): void {
    if (this.narrow) {
      this.expanded = !this.expanded;
    } else {
      this.rail = !this.rail;
      this.expanded = !this.rail;
    }
  }

  fecharNav(): void {
    this.expanded = false;
    if (!this.narrow) {
      this.rail = true;
    }
  }

  private aplicarLargura(): void {
    const narrow = window.innerWidth < 900;
    const trocou = narrow !== this.narrow;
    this.narrow = narrow;
    if (trocou) {
      if (narrow) {
        this.rail = false;
        this.expanded = false;
      } else {
        this.rail = true;
        this.expanded = false;
      }
    }
  }

  private loadUserProfile(uid: string): void {
    this.accountService.getAccountByUidKey(uid).then((accounts) => {
      const perfil = accounts[0]?.perfil ?? null;
      this.userProfileService.setPerfil(perfil);
      this.isMaster = this.userProfileService.getPerfil() === PerfilEnum.MASTER;
      this.isEstagiario = this.userProfileService.isEstagiario();
      this.analyticsService.setUserProfile(perfil);
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
    this.isEstagiario = false;
    this.userProfileService.setPerfil(null);
    this.auth.logout();
    this.router.navigate(rota);
    if (this.narrow) this.expanded = false;
  }

  goTo(param?: string) {
    if (param) this.router.navigate(param);
    else this.router.navigate(this.router.route.FEED);
    if (this.narrow) this.expanded = false;
  }
}
