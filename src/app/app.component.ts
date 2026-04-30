import { ChangeDetectorRef, Component, NgZone, OnInit, ViewChild } from "@angular/core";
import { Subscription, Observable, filter } from "rxjs";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { Auth, authState } from "@angular/fire/auth";

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
  subscribeLogin: Subscription = new Subscription(null);
  subscribeMensagem: Subscription = new Subscription(null);

  routes = RouterEnum;
  state: boolean = false;
  isMaster: boolean = false;
  showBtnMenu: boolean = true;

  private readonly routesWithToolbar: string[] = [];

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
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.route.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        this.showBtnMenu = !this.routesWithToolbar.some((r) =>
          event.urlAfterRedirects.startsWith(r)
        );
      });
  }

  ngOnInit(): void {
    this.sidenavService.toggle.subscribe(() => this.drawer?.toggle());
    this.initiByStorage();

    authState(this.fireAuth).subscribe((user) => {
      this.ngZone.run(() => {
        if (user) {
          this.state = true;
          this.loadUserProfile();
        } else {
          this.state = false;
          this.isMaster = false;
        }
        this.cdr.detectChanges();
      });
    });
  }

  private loadUserProfile(): void {
    const uid = this.fireAuth.currentUser?.uid;
    if (!uid) return;
    this.accountService.getAccountByUidKey(uid).then((accounts) => {
      this.ngZone.run(() => {
        this.isMaster = accounts[0]?.perfil === "master";
        this.analyticsService.setUserProfile(accounts[0]?.perfil ?? null);
        this.cdr.detectChanges();
      });
    });
  }

  initiByStorage() {
    const url = window.location.href;
    const isPublicRoute =
      url.includes(RouterEnum.REDEFINE_PASSWORD) ||
      url.includes(RouterEnum.LOGIN);
    const usuario = this.auth.getToken();
    if (usuario) {
      this.autenticarWithEmail({
        email: usuario.email,
        senha: usuario.senha,
      }).subscribe(() => {
        if (!isPublicRoute) this.goTo();
      });
    } else {
      this.analyticsService.markProfileReady();
      if (!isPublicRoute) this.router.navigate(this.router.route.LOGIN);
    }
  }

  autenticarWithEmail(payload: PayloadLogin): Observable<any> {
    return new Observable((observer) => {
      this.service.signWithEmail(payload.email, payload.senha).then(
        () => {
          this.service.behaviorUsuarioLogado.subscribe((logado) => {
            if (logado) {
              localStorage.setItem("usuario", btoa(JSON.stringify(logado)));
              localStorage.setItem("token", btoa(JSON.stringify(payload)));
              this.mensagemRespostaLogin = null;
              this.state = true;
              this.loadUserProfile();
            } else {
              this.service.behaviorLoginMensagem.subscribe((mensagem) => {
                if (mensagem) {
                  this.mensagemRespostaLogin = mensagem;
                }
              });
              this.subscribeMensagem?.unsubscribe();
              this.state = false;
            }
            observer.next(logado);
          });
          this.subscribeLogin?.unsubscribe();
        },
        () => {}
      );
    });
  }

  logout(rota: string) {
    sessionStorage.setItem("logout", "s");
    localStorage.removeItem("token");
    this.state = false;
    this.isMaster = false;
    this.auth.logout();
    this.router.navigate(rota);
  }

  goTo(param?: string) {
    if (param) this.router.navigate(param);
    else this.router.navigate(this.router.route.FEED);
  }
}
