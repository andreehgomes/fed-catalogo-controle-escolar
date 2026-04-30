import { Injectable, Injector, runInInjectionContext } from "@angular/core";
import {
  Database, ref, push, update, get, remove, query,
  orderByChild, startAt, endAt, startAfter, limitToFirst,
} from "@angular/fire/database";
import { BehaviorSubject, Observable } from "rxjs";
import { Client } from "../../model/client";
import { Path } from "../../model/path.enum";

export const PAGE_SIZE = 50;

@Injectable({ providedIn: "root" })
export class ClientService {
  selectedClient$ = new BehaviorSubject<Client | null>(null);

  constructor(private database: Database, private readonly injector: Injector) {}

  newClient(client: Client): Observable<string> {
    const payload: Client = { ...client, nomeLower: client.nome.toLowerCase() };
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        push(ref(this.database, Path.CLIENT), payload)
          .then((result) => {
            observer.next(result.key!);
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  updateClient(key: string, client: Client): Observable<void> {
    const { key: _key, ...rest } = client;
    const clientData = { ...rest, nomeLower: client.nome.toLowerCase() };
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        update(ref(this.database, `${Path.CLIENT}/${key}`), clientData)
          .then(() => {
            observer.next();
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  getClients(
    term?: string,
    cursor?: { nomeLower: string; key: string }
  ): Observable<Client[]> {
    return new Observable((observer) => {
      const dbRef = ref(this.database, Path.CLIENT);
      let q;
      if (term) {
        const lower = term.toLowerCase();
        q = query(
          dbRef,
          orderByChild("nomeLower"),
          startAt(lower),
          endAt(lower + ""),
          limitToFirst(PAGE_SIZE)
        );
      } else if (cursor) {
        q = query(
          dbRef,
          orderByChild("nomeLower"),
          startAfter(cursor.nomeLower, cursor.key),
          limitToFirst(PAGE_SIZE)
        );
      } else {
        q = query(dbRef, orderByChild("nomeLower"), limitToFirst(PAGE_SIZE));
      }
      runInInjectionContext(this.injector, () =>
        get(q)
          .then((snapshot) => this.mapSnapshot(snapshot, observer))
          .catch((error) => observer.error(error))
      );
    });
  }

  getAllClients(): Observable<Client[]> {
    return new Observable((observer) => {
      const q = query(ref(this.database, Path.CLIENT), orderByChild("nomeLower"));
      runInInjectionContext(this.injector, () =>
        get(q)
          .then((snapshot) => this.mapSnapshot(snapshot, observer))
          .catch((error) => observer.error(error))
      );
    });
  }

  getClientByKey(key: string): Observable<Client> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        get(ref(this.database, `${Path.CLIENT}/${key}`))
          .then((snapshot) => {
            if (snapshot.exists()) {
              observer.next({ key: snapshot.key!, ...snapshot.val() } as Client);
            } else {
              observer.error(new Error("Cliente não encontrado"));
            }
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  deleteClient(key: string): Promise<void> {
    return runInInjectionContext(this.injector, () =>
      remove(ref(this.database, `${Path.CLIENT}/${key}`))
    );
  }

  private mapSnapshot(snapshot: any, observer: any): void {
    const items: Client[] = [];
    snapshot.forEach((child: any) => {
      items.push({ key: child.key, ...child.val() } as Client);
    });
    observer.next(items);
    observer.complete();
  }
}
