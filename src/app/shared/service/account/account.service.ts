import { Injectable } from "@angular/core";
import { Database, ref, push, get, query, orderByChild, equalTo, update, remove } from "@angular/fire/database";
import { Auth, createUserWithEmailAndPassword } from "@angular/fire/auth";
import {} from "firebase/database";
import { NewAccount } from "src/app/shared/model/new-account";
import { map } from "rxjs/operators";
import { Subscription, of, Observable, BehaviorSubject } from "rxjs";
import { AlertaModel } from "../../model/alertas-model";
import { AlertasType } from "../../model/alertas-type.enum";
import { LoaderService } from "src/app/components/loader/loader.service";
import { ResponseLogin } from "src/app/feature/login/shared/model/response-login";

@Injectable({
  providedIn: "root",
})
export class AccountService {
  public responseInsertNewAccount = new BehaviorSubject<AlertaModel>(null);
  pathAccount = "account";

  constructor(
    private angularFireAuth: Auth,
    private angularFireDataBase: Database,
    private loader: LoaderService
  ) {}

  insertNewAccountEmail(newAccount: NewAccount): Observable<any> {
    this.loader.openDialog();
    createUserWithEmailAndPassword(this.angularFireAuth, newAccount.email, newAccount.senha)
      .then((user) => {
        newAccount.uid = user.user.uid;
        let newAccountData = {
          celular: newAccount.celular,
          data_nascimento: newAccount.data_nascimento,
          nome: newAccount.nome,
          email: newAccount.email,
          uid: user.user.uid,
        };
        push(ref(this.angularFireDataBase, this.pathAccount), newAccountData)
          .then((account) => {
            this.responseInsertNewAccount.next({
              tipo: AlertasType.SUCESSO,
              codigo: "200",
              mensagem: "Cadastro realizado com sucesso!!!",
            });
            this.loader.closeDialog();
          })
          .catch((error) => {
            this.responseInsertNewAccount.next({
              codigo: error.code,
              mensagem: error.message,
              tipo: AlertasType.ERRO,
            });
            this.loader.closeDialog();
          });
      })
      .catch((error) => {
        this.responseInsertNewAccount.next({
          codigo: error.code,
          mensagem: error.message,
          tipo: AlertasType.ERRO,
        });
        this.loader.closeDialog();
      });
    return of("200");
  }

  getAccountByUidKey(uid: string) {
    const accountRef = ref(this.angularFireDataBase, "/account");
    const q = query(accountRef, orderByChild("uid"), equalTo(uid));
    return get(q).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({
          key: key,
          celular: data[key].celular,
          data_nascimento: data[key].data_nascimento,
          nome: data[key].nome,
          email: data[key].email,
          uid: data[key].uid,
          perfil: data[key].perfil ?? null,
        }));
      }
      return [];
    });
  }

  updateAccount(account: NewAccount, key: string) {
    const accountRef = ref(this.angularFireDataBase, `account/${key}`);
    update(accountRef, account);
  }

  getAllAccount() {
    const accountRef = ref(this.angularFireDataBase, "account");
    return get(accountRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({
          key: key,
          celular: data[key].celular,
          data_nascimento: data[key].data_nascimento,
          nome: data[key].nome,
          email: data[key].email,
          uid: data[key].uid
        }));
      }
      return [];
    });
  }

  deleteAccount(key: string) {
    const accountRef = ref(this.angularFireDataBase, `account/${key}`);
    remove(accountRef);
  }
}
