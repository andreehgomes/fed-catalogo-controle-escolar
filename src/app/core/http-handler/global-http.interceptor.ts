import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { catchError, finalize } from "rxjs/operators";
import { LoaderService } from "../../components/loader/loader.service";

@Injectable()
export class GlobalHttpInterceptor implements HttpInterceptor {
  constructor(private loader: LoaderService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    this.loader.openDialog();

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        throw error;
      }),
      finalize(() => {
        this.loader.closeDialog();
      })
    );
  }
}
