import { Injectable } from "@angular/core";
import { PayloadLogin } from "../model/payload-login";
import { BehaviorSubject } from "rxjs";
import { Database, ref, get } from "@angular/fire/database";
import { AccountService } from "src/app/shared/service/account/account.service";
import { ResponseLogin } from "../model/response-login";
import { AlertaModel } from "src/app/shared/model/alertas-model";
import { AlertasType } from "src/app/shared/model/alertas-type.enum";
import { LoaderService } from "src/app/components/loader/loader.service";
import { Auth, signInWithEmailAndPassword } from "@angular/fire/auth";
import { InitAuthService } from "src/app/core/base-auth/init-auth.service";

@Injectable({
  providedIn: "root",
})
export class LoginService {
  public behaviorLoginMensagem = new BehaviorSubject<AlertaModel>(null);
  public behaviorUsuarioLogado = new BehaviorSubject<ResponseLogin>(null);
  private pathAccount = "/account";

  constructor(
    private accountService: AccountService,
    private angularFireAuth: Auth,
    private loader: LoaderService,
    private initAuthService: InitAuthService
  ) {}

  async signWithEmail(email: string, pass: string) {
    this.loader.openDialog();
    try {
      const login = await signInWithEmailAndPassword(this.angularFireAuth, email, pass);
      const accountData = await this.accountService.getAccountByUidKey(login.user.uid);
      if (!accountData || accountData.length === 0) {
        throw new Error("404");
      }
      const responseLogin: ResponseLogin = {
        key: accountData[0].key,
        celular: accountData[0].celular,
        data_nascimento: accountData[0].data_nascimento,
        nome: accountData[0].nome,
        email: accountData[0].email,
        uid: accountData[0].uid,
      };
      this.behaviorUsuarioLogado.next(responseLogin);
      this.behaviorLoginMensagem.next(null);
    } catch (error: any) {
      console.error('error: ', error)
      const is404 = error?.message === "404" || error?.code === "404";
      this.behaviorLoginMensagem.next({
        tipo: AlertasType.ERRO,
        codigo: is404 ? "404" : "403",
        mensagem: is404 ? "Dados não encontrados" : "E-mail ou senha incorretos!!",
      });
      this.behaviorUsuarioLogado.next(null);
    } finally {
      this.loader.closeDialog();
    }
  }
}
