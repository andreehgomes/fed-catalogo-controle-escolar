import { Injectable, Injector, runInInjectionContext } from "@angular/core";
import {
  Database, ref, push, update, get, remove, query,
  orderByChild, equalTo, startAt, endAt, limitToFirst, limitToLast,
} from "@angular/fire/database";
import { BehaviorSubject, Observable } from "rxjs";
import { Campaign, CampaignStatus } from "../../model/campaign";
import { Path } from "../../model/path.enum";

export const PAGE_SIZE = 50;

@Injectable({ providedIn: "root" })
export class CampaignService {
  selectedCampaign$ = new BehaviorSubject<Campaign | null>(null);

  constructor(private database: Database, private readonly injector: Injector) {}

  newCampaign(campaign: Campaign): Observable<string> {
    const payload: Campaign = {
      ...campaign,
      nomeLower: campaign.nome.toLowerCase(),
    };
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        push(ref(this.database, Path.CAMPAIGN), payload)
          .then((result) => {
            observer.next(result.key!);
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  updateCampaign(key: string, campaign: Campaign): Observable<void> {
    const { key: _key, ...rest } = campaign;
    const payload = {
      ...rest,
      nomeLower: campaign.nome.toLowerCase(),
      dataAlteracao: new Date().toISOString(),
    };
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        update(ref(this.database, `${Path.CAMPAIGN}/${key}`), payload)
          .then(() => {
            observer.next();
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  getCampaigns(term?: string): Observable<Campaign[]> {
    return new Observable((observer) => {
      const dbRef = ref(this.database, Path.CAMPAIGN);
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

  getAllCampaigns(): Observable<Campaign[]> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        const q = query(
          ref(this.database, Path.CAMPAIGN),
          orderByChild("dataCriacao"),
          limitToLast(500)
        );
        get(q)
          .then((snapshot) => {
            const items: Campaign[] = [];
            snapshot.forEach((child) => {
              items.push({ key: child.key, ...child.val() } as Campaign);
            });
            items.reverse();
            observer.next(items);
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  getCampaignByKey(key: string): Observable<Campaign> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        get(ref(this.database, `${Path.CAMPAIGN}/${key}`))
          .then((snapshot) => {
            if (snapshot.exists()) {
              observer.next({ key: snapshot.key!, ...snapshot.val() } as Campaign);
            } else {
              observer.error(new Error("Campanha não encontrada"));
            }
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  getActiveCampaigns(): Observable<Campaign[]> {
    return new Observable((observer) => {
      runInInjectionContext(this.injector, () => {
        const q = query(
          ref(this.database, Path.CAMPAIGN),
          orderByChild("status"),
          equalTo("ativa" as CampaignStatus)
        );
        get(q)
          .then((snapshot) => {
            const items: Campaign[] = [];
            snapshot.forEach((child) => {
              items.push({ key: child.key, ...child.val() } as Campaign);
            });
            items.sort((a, b) => (a.nomeLower ?? "").localeCompare(b.nomeLower ?? ""));
            observer.next(items);
            observer.complete();
          })
          .catch((error) => observer.error(error));
      });
    });
  }

  deleteCampaign(key: string): Promise<void> {
    return runInInjectionContext(this.injector, () =>
      remove(ref(this.database, `${Path.CAMPAIGN}/${key}`))
    );
  }

  private mapSnapshot(snapshot: any, observer: any): void {
    const items: Campaign[] = [];
    snapshot.forEach((child: any) => {
      items.push({ key: child.key, ...child.val() } as Campaign);
    });
    observer.next(items);
    observer.complete();
  }
}
