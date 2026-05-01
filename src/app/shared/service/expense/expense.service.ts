import { Injectable, Injector, runInInjectionContext } from "@angular/core";
import {
  Database, ref, push, update, get, remove, query,
  orderByChild, equalTo, limitToLast,
} from "@angular/fire/database";
import { BehaviorSubject, Observable } from "rxjs";
import { Expense } from "../../model/expense";
import { Path } from "../../model/path.enum";

@Injectable({ providedIn: "root" })
export class ExpenseService {
  selectedExpense$ = new BehaviorSubject<Expense | null>(null);

  constructor(private database: Database, private readonly injector: Injector) {}

  newExpense(expense: Expense): Observable<string> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        push(ref(this.database, Path.EXPENSES), expense)
          .then((result) => {
            observer.next(result.key!);
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  updateExpense(key: string, expense: Omit<Expense, "key">): Observable<void> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        update(ref(this.database, `${Path.EXPENSES}/${key}`), expense as object)
          .then(() => {
            observer.next();
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  getAllExpenses(): Observable<Expense[]> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        const q = query(
          ref(this.database, Path.EXPENSES),
          orderByChild("dataCriacao"),
          limitToLast(1000)
        );
        get(q)
          .then((snapshot) => {
            const items: Expense[] = [];
            snapshot.forEach((child) => {
              items.push({ key: child.key, ...child.val() } as Expense);
            });
            items.reverse();
            observer.next(items);
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  getExpensesByCampaign(campaignKey: string): Observable<Expense[]> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        const q = query(
          ref(this.database, Path.EXPENSES),
          orderByChild("campaignKey"),
          equalTo(campaignKey)
        );
        get(q)
          .then((snapshot) => {
            const items: Expense[] = [];
            snapshot.forEach((child) => {
              items.push({ key: child.key, ...child.val() } as Expense);
            });
            items.sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
            observer.next(items);
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  getExpenseByKey(key: string): Observable<Expense> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        get(ref(this.database, `${Path.EXPENSES}/${key}`))
          .then((snapshot) => {
            if (snapshot.exists()) {
              observer.next({ key: snapshot.key, ...snapshot.val() } as Expense);
            } else {
              observer.error(new Error("Despesa não encontrada"));
            }
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  deleteExpense(key: string): Promise<void> {
    return runInInjectionContext(this.injector, () =>
      remove(ref(this.database, `${Path.EXPENSES}/${key}`))
    );
  }
}
