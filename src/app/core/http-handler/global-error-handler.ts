import { ErrorHandler, Injectable } from "@angular/core";
import { LoaderService } from "src/app/components/loader/loader.service";
import { PageErrorService } from "src/app/feature/page-error/shared/page-error.service";

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private pageErrorService: PageErrorService,
    private laoder: LoaderService
  ) {}

  handleError(error: any): void {
    console.error('ERROR: ', error);
    const mensagem1 = "Desulpe pelo ocorrido.";
    const mensagem2 = "Tente novamente mais tarde.";
    let mensagemTecnica = error;
    setTimeout(() => {
      if (error.message) {
        mensagemTecnica = error.message;
      }
      this.pageErrorService.goToError(mensagem1, mensagem2, mensagemTecnica);
      this.laoder.closeDialog();
    }, 300);
  }
}
