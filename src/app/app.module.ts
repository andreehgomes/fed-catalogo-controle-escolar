import { environment } from "src/environments/environment";
import { BrowserModule } from "@angular/platform-browser";
import {
  DEFAULT_CURRENCY_CODE,
  ErrorHandler,
  Injectable,
  LOCALE_ID,
  NgModule,
} from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { LoaderComponent } from "./components/loader/loader.component";
import { PageErrorComponent } from "./feature/page-error/page-error.component";
import { MaterialModule } from "./material.module";
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideFirebaseApp, initializeApp } from "@angular/fire/app";
import { provideFirestore, getFirestore } from "@angular/fire/firestore";
import { provideDatabase, getDatabase } from "@angular/fire/database";
import { provideAuth, getAuth } from "@angular/fire/auth";
import { provideStorage, getStorage } from "@angular/fire/storage";
import { GlobalHttpInterceptor } from "./core/http-handler/global-http.interceptor";
import { GlobalErrorHandler } from "./core/http-handler/global-error-handler";
import { registerLocaleData, DatePipe } from "@angular/common";
import localePt from "@angular/common/locales/pt";
import { ToolbarModule } from "./components/toolbar/toolbar.module";
import { MatPaginatorIntl } from "@angular/material/paginator";
import { Subject } from "rxjs";

@Injectable()
export class MyCustomPaginatorIntl implements MatPaginatorIntl {
  changes = new Subject<void>();

  firstPageLabel = $localize`Primeira página`;
  itemsPerPageLabel = $localize`Itens por página:`;
  lastPageLabel = $localize`Última página`;

  nextPageLabel = "Próxima página";
  previousPageLabel = "Página anterior";

  mountPage(page: number, pageSize: number, length: number): number {
    if (page * pageSize + 10 <= length) {
      return page * pageSize + 10;
    } else if (page * pageSize + 10 > length) {
      return length;
    }
    return length;
  }

  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0) {
      return $localize`1 de 1`;
    }
    return $localize`${page * pageSize + 1} - ${this.mountPage(
      page,
      pageSize,
      length
    )} de ${length}`;
  }
}

registerLocaleData(localePt, "pt");

@NgModule({
  declarations: [AppComponent, LoaderComponent, PageErrorComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MaterialModule,
    BrowserAnimationsModule,
    ToolbarModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: GlobalHttpInterceptor,
      multi: true,
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: LOCALE_ID, useValue: "pt-br" },
    { provide: DEFAULT_CURRENCY_CODE, useValue: "BRL" },
    { provide: MatPaginatorIntl, useClass: MyCustomPaginatorIntl },
    DatePipe,
    provideHttpClient(withInterceptorsFromDi()),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideDatabase(() => getDatabase()),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage()),
  ],
})
export class AppModule {}
