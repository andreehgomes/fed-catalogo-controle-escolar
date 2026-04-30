import { Injectable } from "@angular/core";
import { Auth, sendPasswordResetEmail } from "@angular/fire/auth";
import { BehaviorSubject } from "rxjs";
import { LoaderService } from "src/app/components/loader/loader.service";
import { AlertaModel } from "src/app/shared/model/alertas-model";
import { AlertasType } from "src/app/shared/model/alertas-type.enum";

@Injectable({
  providedIn: "root",
})
export class RedefinePasswordService {
  constructor(
    private angularFireAuth: Auth,
    private loder: LoaderService
  ) {}

  mensageRedefinirSenha: BehaviorSubject<AlertaModel> =
    new BehaviorSubject<AlertaModel>(null);

  async redefinirSenha(email: string) {
    this.loder.openDialog();
    sendPasswordResetEmail(this.angularFireAuth, email).then(
      () => {
        this.loder.closeDialog();
        this.mensageRedefinirSenha.next({
          tipo: AlertasType.SUCESSO,
          codigo: "200",
          mensagem: "Confira seu e-mail para redefirnir sua senha.",
        });
      },
      (error) => {
        this.loder.closeDialog();
        this.mensageRedefinirSenha.next({
          tipo: AlertasType.ERRO,
          codigo: error.code,
          mensagem: error.message,
        });
      }
    );
  }
}
