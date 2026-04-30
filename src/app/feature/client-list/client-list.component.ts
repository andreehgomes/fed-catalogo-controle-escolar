import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { ClientService } from "src/app/shared/service/client/client.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { ConfirmDeleteDialogComponent } from "src/app/components/confirm-delete-dialog/confirm-delete-dialog.component";
import { Client } from "src/app/shared/model/client";
import { RouterEnum } from "src/app/core/router/router.enum";

@Component({
  selector: "app-client-list",
  templateUrl: "./client-list.component.html",
  styleUrls: ["./client-list.component.scss"],
  standalone: false,
})
export class ClientListComponent implements OnInit {
  clients: Client[] = [];
  searchCtrl = new FormControl<string>("");

  constructor(
    private clientService: ClientService,
    private router: Router,
    private loader: LoaderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregar();
    this.searchCtrl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((term) => this.carregar(term ?? ""));
  }

  private carregar(term: string = ""): void {
    this.loader.openDialog();
    this.clientService.getClients(term || undefined).subscribe({
      next: (list) => {
        this.clients = list;
        this.loader.closeDialog();
      },
      error: () => this.loader.closeDialog(),
    });
  }

  novoCliente(): void {
    this.router.navigate([RouterEnum.NEW_CLIENT]);
  }

  abrirDetalhe(c: Client): void {
    if (!c.key) return;
    this.router.navigate([RouterEnum.CLIENT_DETAIL, c.key]);
  }

  editar(c: Client, event: Event): void {
    event.stopPropagation();
    this.clientService.selectedClient$.next(c);
    this.router.navigate([RouterEnum.NEW_CLIENT]);
  }

  excluir(c: Client, event: Event): void {
    event.stopPropagation();
    if (!c.key) return;
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        titulo: "Excluir cliente",
        mensagem: `Deseja excluir o cliente "${c.nome}"? As vendas associadas NÃO serão removidas.`,
      },
    });
    ref.afterClosed().subscribe((confirm) => {
      if (!confirm) return;
      this.loader.openDialog();
      this.clientService
        .deleteClient(c.key!)
        .then(() => {
          this.snackBar.open("Cliente excluído.", "", {
            duration: 2500,
            panelClass: ["snack-sucesso"],
            verticalPosition: "top",
          });
          this.clients = this.clients.filter((x) => x.key !== c.key);
          this.loader.closeDialog();
        })
        .catch(() => this.loader.closeDialog());
    });
  }
}
