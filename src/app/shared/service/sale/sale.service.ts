import { Injectable, Injector, runInInjectionContext } from "@angular/core";
import {
  Database, ref, push, update, get, remove, query,
  orderByChild, equalTo, startAt, endAt, startAfter, limitToFirst, limitToLast,
} from "@angular/fire/database";
import { BehaviorSubject, Observable } from "rxjs";
import { Sale, Recebimento, SaleStatus } from "../../model/sale";
import { Path } from "../../model/path.enum";

@Injectable({ providedIn: "root" })
export class SaleService {
  selectedSale$ = new BehaviorSubject<Sale | null>(null);

  constructor(private database: Database, private readonly injector: Injector) {}

  newSale(sale: Sale): Observable<string> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        push(ref(this.database, Path.SALES), sale)
          .then((result) => {
            observer.next(result.key!);
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  updateSale(key: string, sale: Omit<Sale, "key">): Observable<void> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        update(ref(this.database, `${Path.SALES}/${key}`), sale as object)
          .then(() => {
            observer.next();
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  getSaleByKey(key: string): Observable<Sale> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        get(ref(this.database, `${Path.SALES}/${key}`))
          .then((snapshot) => {
            if (snapshot.exists()) {
              observer.next({ key: snapshot.key, ...snapshot.val() } as Sale);
            } else {
              observer.error(new Error("Venda não encontrada"));
            }
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  getAllSales(): Observable<Sale[]> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        const q = query(
          ref(this.database, Path.SALES),
          orderByChild("dataCriacao"),
          limitToLast(1000)
        );
        get(q)
          .then((snapshot) => {
            const items: Sale[] = [];
            snapshot.forEach((child) => {
              items.push({ key: child.key, ...child.val() } as Sale);
            });
            items.reverse();
            observer.next(items);
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  getSalesByCampaign(campaignKey: string): Observable<Sale[]> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        const q = query(
          ref(this.database, Path.SALES),
          orderByChild("campaignKey"),
          equalTo(campaignKey)
        );
        get(q)
          .then((snapshot) => {
            const items: Sale[] = [];
            snapshot.forEach((child) => {
              items.push({ key: child.key, ...child.val() } as Sale);
            });
            items.sort((a, b) =>
              (b.dataCriacao ?? "").localeCompare(a.dataCriacao ?? "")
            );
            observer.next(items);
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  getSalesByClientKey(clientKey: string): Observable<Sale[]> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        const q = query(
          ref(this.database, Path.SALES),
          orderByChild("clienteKey"),
          equalTo(clientKey)
        );
        get(q)
          .then((snapshot) => {
            const items: Sale[] = [];
            snapshot.forEach((child) => {
              items.push({ key: child.key, ...child.val() } as Sale);
            });
            items.sort((a, b) =>
              (b.dataCriacao ?? "").localeCompare(a.dataCriacao ?? "")
            );
            observer.next(items);
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  getSalesPage(params: {
    campaignKey?: string;
    nomePrefix: string;
    pageSize: number;
    afterValue?: string;
    afterKey?: string;
  }): Observable<{
    sales: Sale[];
    nextCursor?: { afterValue: string; afterKey: string };
  }> {
    const { campaignKey, nomePrefix, pageSize, afterValue, afterKey } = params;
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        const dbRef = ref(this.database, Path.SALES);
        let q;

        if (campaignKey) {
          q = query(dbRef, orderByChild("campaignKey"), equalTo(campaignKey), limitToFirst(500));
        } else if (nomePrefix) {
          const term = nomePrefix.toLowerCase();
          const end = term + "";
          q = afterValue && afterKey
            ? query(dbRef, orderByChild("clienteNomeLower"), startAfter(afterValue, afterKey), endAt(end), limitToFirst(pageSize + 1))
            : query(dbRef, orderByChild("clienteNomeLower"), startAt(term), endAt(end), limitToFirst(pageSize + 1));
        } else {
          q = afterValue && afterKey
            ? query(dbRef, orderByChild("clienteNomeLower"), startAfter(afterValue, afterKey), limitToFirst(pageSize + 1))
            : query(dbRef, orderByChild("clienteNomeLower"), limitToFirst(pageSize + 1));
        }

        get(q)
          .then((snapshot) => {
            let items: Sale[] = [];
            snapshot.forEach((child) => {
              items.push({ key: child.key, ...child.val() } as Sale);
            });

            if (campaignKey) {
              if (nomePrefix) {
                const term = nomePrefix.toLowerCase();
                items = items.filter((s) =>
                  (s.clienteNomeLower ?? "").startsWith(term)
                );
              }
              items.sort((a, b) =>
                (a.clienteNomeLower ?? "").localeCompare(b.clienteNomeLower ?? "")
              );
              const offset = afterKey
                ? items.findIndex((s) => s.key === afterKey) + 1
                : 0;
              const page = items.slice(offset, offset + pageSize);
              const hasMore = offset + pageSize < items.length;
              const last = page[page.length - 1];
              observer.next({
                sales: page,
                nextCursor:
                  hasMore && last?.key
                    ? { afterValue: campaignKey, afterKey: last.key }
                    : undefined,
              });
              observer.complete();
              return;
            }

            const hasMore = items.length > pageSize;
            const sales = hasMore ? items.slice(0, pageSize) : items;
            const last = sales[sales.length - 1];

            let nextCursor: { afterValue: string; afterKey: string } | undefined;
            if (hasMore && last?.key) {
              nextCursor = {
                afterValue: last.clienteNomeLower ?? "",
                afterKey: last.key,
              };
            }

            observer.next({ sales, nextCursor });
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  deleteSale(key: string): Promise<void> {
    return runInInjectionContext(this.injector, () =>
      remove(ref(this.database, `${Path.SALES}/${key}`))
    );
  }

  getSalesByStatus(status: SaleStatus): Observable<Sale[]> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        const q = query(
          ref(this.database, Path.SALES),
          orderByChild("status"),
          equalTo(status)
        );
        get(q)
          .then((snapshot) => {
            const items: Sale[] = [];
            snapshot.forEach((child) => {
              items.push({ key: child.key, ...child.val() } as Sale);
            });
            items.sort((a, b) => (b.dataCriacao ?? "").localeCompare(a.dataCriacao ?? ""));
            observer.next(items);
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  addRecebimento(
    saleKey: string,
    recebimento: Recebimento,
    novoValorRecebido: number,
    quitar: boolean
  ): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      const novoId = push(ref(this.database, Path.SALES)).key!;
      const updates: { [path: string]: any } = {};
      updates[`${Path.SALES}/${saleKey}/recebimentos/${novoId}`] = recebimento;
      updates[`${Path.SALES}/${saleKey}/valorRecebido`] = novoValorRecebido;
      updates[`${Path.SALES}/${saleKey}/status`] = quitar ? "quitado" : "pendente";
      return update(ref(this.database), updates);
    });
  }

  deleteRecebimento(
    saleKey: string,
    recebimentoKey: string,
    remainingRecebimentos: { [key: string]: Recebimento },
    valorTotal: number
  ): Promise<void> {
    const novoValorRecebido = Object.values(remainingRecebimentos).reduce(
      (sum, r) => sum + r.valor,
      0
    );
    const novoStatus: SaleStatus = novoValorRecebido >= valorTotal ? "quitado" : "pendente";
    const updates: { [path: string]: any } = {};
    updates[`${Path.SALES}/${saleKey}/recebimentos/${recebimentoKey}`] = null;
    updates[`${Path.SALES}/${saleKey}/valorRecebido`] = novoValorRecebido;
    updates[`${Path.SALES}/${saleKey}/status`] = novoStatus;
    return runInInjectionContext(this.injector, () =>
      update(ref(this.database), updates)
    );
  }
}
