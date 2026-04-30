import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { NewAccount } from "src/app/shared/model/new-account";

@Injectable({
  providedIn: "root",
})
export class AccountDataService {
  constructor() {}

  private accountSource = new BehaviorSubject({ account: null, key: "" });
  accountAtual = this.accountSource.asObservable();

  obtemAccount(account: NewAccount, key: string) {
    this.accountSource.next({ account: account, key: key });
  }
}
