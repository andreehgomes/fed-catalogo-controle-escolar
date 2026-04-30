import { Component, OnInit, OnDestroy } from "@angular/core";
import { UntypedFormControl, UntypedFormGroup, FormBuilder } from "@angular/forms";
import { Subscription } from "rxjs";
import { InitAuthService } from "src/app/core/base-auth/init-auth.service";
import { RouterService } from "src/app/core/router/router.service";
import { AlertaModel } from "src/app/shared/model/alertas-model";
import { OnloadService } from "src/app/shared/util/onload.service";
import { PayloadLogin } from "./shared/model/payload-login";
import { ResponseLogin } from "./shared/model/response-login";
import { LoginService } from "./shared/service/login.service";
import { RouterEnum } from "../../core/router/router.enum";
import { Token } from "src/app/shared/model/token";
import { AnalyticsService } from "src/app/shared/service/analytics/analytics.service";

@Component({
    selector: "app-login",
    templateUrl: "./login.component.html",
    styleUrls: ["./login.component.scss"],
    standalone: false
})
export class LoginComponent implements OnInit, OnDestroy {
  route: RouterEnum;
  token64: string | null;
  token: ResponseLogin | undefined;
  feedv1 = true;

  mensagemRespostaLogin: AlertaModel = new AlertaModel();
  subscribeLogin: Subscription = new Subscription(null);
  subscribeMensagem: Subscription = new Subscription(null);

  constructor(
    private service: LoginService,
    private auth: InitAuthService,
    private router: RouterService,
    private onLoadService: OnloadService,
    private analytics: AnalyticsService
  ) {}

  formControlUsuario = new UntypedFormGroup({
    emailFormGroup: new UntypedFormControl(),
    senhaFormGroup: new UntypedFormControl(),
  });

  ngOnInit(): void {
    this.analytics.pageView({ funcionalidade: 'login' });
    this.hideSplash();
    const logout = sessionStorage.getItem("logout");
    // if (logout != "s") {
    //   this.initiByStorage();
    // }
  }

  onSubmitLogin() {
    this.formControlUsuario.disable();
    const { emailFormGroup, senhaFormGroup } = this.formControlUsuario.controls;
    const payload: PayloadLogin = {
      email: emailFormGroup.value,
      senha: senhaFormGroup.value,
    };
    this.autenticarWithEmail(payload);
  }

  initiByStorage() {
    const usuario = this.auth.getToken();
    if (usuario) {
      this.formControlUsuario.controls["emailFormGroup"].setValue(
        usuario.email
      );
      this.formControlUsuario.controls["senhaFormGroup"].setValue(
        usuario.senha
      );
      this.autenticarWithEmail({
        email: usuario.email,
        senha: usuario.senha,
      });
    }
  }

  async autenticarWithEmail(payload: PayloadLogin) {
    await this.service.signWithEmail(payload.email, payload.senha);
    const logado = this.service.behaviorUsuarioLogado.getValue();
    if (logado) {
      localStorage.setItem("usuario", btoa(JSON.stringify(logado)));
      localStorage.setItem("token", btoa(JSON.stringify(payload)));
      this.auth.usuario$.next(payload as Token);
      this.mensagemRespostaLogin = null;
      this.formControlUsuario.reset();
      this.formControlUsuario.enable();
      this.router.navigate(this.router.route.FEED);
    } else {
      const mensagem = this.service.behaviorLoginMensagem.getValue();
      if (mensagem) {
        this.mensagemRespostaLogin = mensagem;
      }
      this.formControlUsuario.reset();
      this.formControlUsuario.enable();
    }
  }

  newPassword() {
    this.router.navigate(this.router.route.REDEFINE_PASSWORD);
  }
  newAccoumt() {
    this.router.navigate(this.router.route.NEW_ACCOUNT);
  }
  feed() {
    this.router.navigate(this.router.route.FEED);
  }

  goTo(rota: string) {
    this.router.navigate(rota);
  }

  ngOnDestroy(): void {
    this.service.behaviorUsuarioLogado.next(null);
  }

  hideSplash() {
    setTimeout(() => {
      this.onLoadService.onLoadBehavior.next(true);
    }, 500);
  }
}
