import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Observable } from "rxjs";
import { debounceTime, distinctUntilChanged, map, switchMap } from "rxjs/operators";
import { SaleService } from "src/app/shared/service/sale/sale.service";
import { CampaignService } from "src/app/shared/service/campaign/campaign.service";
import { ClientService } from "src/app/shared/service/client/client.service";
import { ComprovanteService } from "src/app/shared/service/comprovante/comprovante.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { ConfirmDeleteDialogComponent } from "src/app/components/confirm-delete-dialog/confirm-delete-dialog.component";
import { Sale, Recebimento } from "src/app/shared/model/sale";
import { Campaign } from "src/app/shared/model/campaign";
import { RouterEnum } from "src/app/core/router/router.enum";

type StatusFiltro = "todos" | "pendente" | "quitado";

@Component({
  selector: "app-contas-a-receber",
  templateUrl: "./contas-a-receber.component.html",
  styleUrls: ["./contas-a-receber.component.scss"],
  standalone: false,
})
export class ContasAReceberComponent implements OnInit {
  filteredSales: Sale[] = [];
  campaigns: Campaign[] = [];

  filterControl = new FormControl<string>("");
  campaignCtrl = new FormControl<string>("");
  statusFiltro: StatusFiltro = "pendente";

  constructor(
    private saleService: SaleService,
    private campaignService: CampaignService,
    private clientService: ClientService,
    private comprovanteService: ComprovanteService,
    private loader: LoaderService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.campaignService.getAllCampaigns().subscribe((list) => (this.campaigns = list));

    const clienteFiltro = this.route.snapshot.queryParamMap.get("cliente");
    if (clienteFiltro) {
      this.filterControl.setValue(clienteFiltro, { emitEvent: false });
    }

    this.loadSales();

    this.filterControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.loadSales());

    this.campaignCtrl.valueChanges.subscribe(() => this.loadSales());
  }

  setStatus(status: StatusFiltro): void {
    this.statusFiltro = status;
    this.loadSales();
  }

  limparFiltros(): void {
    this.filterControl.setValue("", { emitEvent: false });
    this.campaignCtrl.setValue("", { emitEvent: false });
    this.statusFiltro = "pendente";
    this.loadSales();
  }

  editSale(sale: Sale): void {
    this.saleService.selectedSale$.next(sale);
    this.router.navigate([RouterEnum.NEW_SALE]);
  }

  receberSale(sale: Sale): void {
    if (!sale.key) return;
    this.router.navigate([RouterEnum.RECEBIMENTO, sale.key], {
      queryParams: { origem: RouterEnum.CONTAS_A_RECEBER },
    });
  }

  deleteSale(sale: Sale): void {
    if (!sale.key) return;

    const recCount = sale.recebimentos ? Object.keys(sale.recebimentos).length : 0;
    if (recCount > 0) {
      this.snackBar.open(
        `Esta venda tem ${recCount} ${recCount === 1 ? 'pagamento registrado' : 'pagamentos registrados'} e não pode ser excluída. Exclua os pagamentos primeiro.`,
        "Fechar",
        { duration: 6000, verticalPosition: "top" }
      );
      return;
    }

    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        titulo: "Excluir venda",
        mensagem: `Excluir a venda de ${sale.clienteNome} no valor de R$ ${this.fmt(sale.valorTotal)}?`,
      },
    });
    ref.afterClosed().subscribe((confirm) => {
      if (!confirm) return;
      this.loader.openDialog();
      this.saleService
        .deleteSale(sale.key!)
        .then(() => {
          this.snackBar.open("Venda excluída.", "", {
            duration: 2500,
            panelClass: ["snack-sucesso"],
            verticalPosition: "top",
          });
          this.loadSales();
          this.loader.closeDialog();
        })
        .catch(() => this.loader.closeDialog());
    });
  }

  getRecebimentos(sale: Sale): { key: string; data: string; valor: number; descricao: string }[] {
    if (!sale.recebimentos) return [];
    return Object.entries(sale.recebimentos)
      .map(([key, r]) => ({ key, ...r }))
      .sort((a, b) => a.data.localeCompare(b.data));
  }

  gerarComprovanteSale(sale: Sale): void {
    if (!sale.clienteKey) return;
    this.clientService
      .getClientByKey(sale.clienteKey)
      .pipe(
        switchMap((client) =>
          this.comprovanteService.compartilharComprovanteSale(client, sale)
        )
      )
      .subscribe({
        error: (err) => console.error("Erro ao gerar comprovante:", err),
      });
  }

  gerarComprovanteRecebimento(sale: Sale, recKey: string): void {
    const rec = sale.recebimentos?.[recKey];
    if (!rec || !sale.clienteKey) return;
    this.clientService
      .getClientByKey(sale.clienteKey)
      .pipe(
        switchMap((client) =>
          this.comprovanteService.compartilharComprovante(client, sale, recKey, rec)
        )
      )
      .subscribe({
        error: (err) => console.error("Erro ao gerar comprovante:", err),
      });
  }

  excluirRecebimento(sale: Sale, recebimentoKey: string): void {
    if (!sale.key || !sale.recebimentos) return;
    this.loader.openDialog();
    const remaining = Object.entries(sale.recebimentos)
      .filter(([k]) => k !== recebimentoKey)
      .reduce((acc, [k, v]) => {
        acc[k] = v;
        return acc;
      }, {} as { [key: string]: Recebimento });
    this.saleService
      .deleteRecebimento(sale.key, recebimentoKey, remaining, sale.valorTotal)
      .then(() => {
        this.loadSales();
        this.loader.closeDialog();
      })
      .catch(() => this.loader.closeDialog());
  }

  fmt(v: number): string {
    return v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  saldoVenda(sale: Sale): number {
    return sale.valorTotal - (sale.valorRecebido ?? 0);
  }

  get totalGeral(): number {
    return this.filteredSales.reduce((acc, s) => acc + s.valorTotal, 0);
  }

  get totalSaldo(): number {
    return this.filteredSales.reduce((acc, s) => acc + this.saldoVenda(s), 0);
  }

  private loadSales(): void {
    const term = this.filterControl.value?.trim().toLowerCase() ?? "";
    const campKey = this.campaignCtrl.value ?? "";
    const status = this.statusFiltro;

    this.loader.openDialog();
    let obs$: Observable<Sale[]>;
    if (status !== "todos") {
      obs$ = this.saleService.getSalesByStatus(status);
    } else {
      obs$ = this.saleService.getAllSales();
    }

    obs$
      .pipe(
        map((sales) => {
          let result = sales;
          if (campKey) result = result.filter((s) => s.campaignKey === campKey);
          if (term)
            result = result.filter(
              (s) =>
                (s.clienteNomeLower ?? "").includes(term) ||
                (s.clienteNome ?? "").toLowerCase().includes(term)
            );
          return result;
        })
      )
      .subscribe({
        next: (sales) => {
          this.filteredSales = sales;
          this.loader.closeDialog();
        },
        error: () => this.loader.closeDialog(),
      });
  }
}
