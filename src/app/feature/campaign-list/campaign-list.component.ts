import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { CampaignService } from "src/app/shared/service/campaign/campaign.service";
import { SaleService } from "src/app/shared/service/sale/sale.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { ConfirmDeleteDialogComponent } from "src/app/components/confirm-delete-dialog/confirm-delete-dialog.component";
import { Campaign } from "src/app/shared/model/campaign";
import { Sale } from "src/app/shared/model/sale";
import { RouterEnum } from "src/app/core/router/router.enum";

@Component({
  selector: "app-campaign-list",
  templateUrl: "./campaign-list.component.html",
  styleUrls: ["./campaign-list.component.scss"],
  standalone: false,
})
export class CampaignListComponent implements OnInit {
  campaigns: Campaign[] = [];
  totalsByCampaign: Map<string, { total: number; count: number }> = new Map();
  searchCtrl = new FormControl<string>("");

  constructor(
    private campaignService: CampaignService,
    private saleService: SaleService,
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
    const obs = term
      ? this.campaignService.getCampaigns(term)
      : this.campaignService.getAllCampaigns();
    obs.subscribe({
      next: (list) => {
        this.campaigns = list;
        this.carregarTotais();
        this.loader.closeDialog();
      },
      error: () => this.loader.closeDialog(),
    });
  }

  private carregarTotais(): void {
    if (this.campaigns.length === 0) return;
    this.saleService.getAllSales().subscribe({
      next: (sales) => {
        const map = new Map<string, { total: number; count: number }>();
        sales.forEach((s) => {
          const cur = map.get(s.campaignKey) ?? { total: 0, count: 0 };
          cur.total += s.valorTotal;
          cur.count += 1;
          map.set(s.campaignKey, cur);
        });
        this.totalsByCampaign = map;
      },
    });
  }

  novaCampanha(): void {
    this.router.navigate([RouterEnum.NEW_CAMPAIGN]);
  }

  abrirDetalhe(c: Campaign): void {
    if (!c.key) return;
    this.router.navigate([RouterEnum.CAMPAIGN_DETAIL, c.key]);
  }

  editar(c: Campaign, event: Event): void {
    event.stopPropagation();
    this.campaignService.selectedCampaign$.next(c);
    this.router.navigate([RouterEnum.NEW_CAMPAIGN]);
  }

  excluir(c: Campaign, event: Event): void {
    event.stopPropagation();
    if (!c.key) return;

    this.loader.openDialog();
    this.saleService.getSalesByCampaign(c.key).subscribe({
      next: (sales) => {
        this.loader.closeDialog();
        if (sales.length > 0) {
          this.snackBar.open(
            `Esta campanha tem ${sales.length} ${sales.length === 1 ? 'venda' : 'vendas'} registrada(s) e não pode ser excluída. Encerre a campanha ou exclua as vendas primeiro.`,
            "Fechar",
            { duration: 6000, verticalPosition: "top" }
          );
          return;
        }
        this.confirmarExclusao(c);
      },
      error: () => this.loader.closeDialog(),
    });
  }

  private confirmarExclusao(c: Campaign): void {
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        titulo: "Excluir campanha",
        mensagem: `Deseja excluir a campanha "${c.nome}"?`,
      },
    });
    ref.afterClosed().subscribe((confirm) => {
      if (!confirm) return;
      this.loader.openDialog();
      this.campaignService
        .deleteCampaign(c.key!)
        .then(() => {
          this.snackBar.open("Campanha excluída.", "", {
            duration: 2500,
            panelClass: ["snack-sucesso"],
            verticalPosition: "top",
          });
          this.campaigns = this.campaigns.filter((x) => x.key !== c.key);
          this.loader.closeDialog();
        })
        .catch(() => this.loader.closeDialog());
    });
  }

  totalArrecadado(key?: string): number {
    if (!key) return 0;
    return this.totalsByCampaign.get(key)?.total ?? 0;
  }

  qtdVendas(key?: string): number {
    if (!key) return 0;
    return this.totalsByCampaign.get(key)?.count ?? 0;
  }

  fmt(value: number): string {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  fmtData(iso: string): string {
    if (!iso) return "";
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
  }

  pctMeta(c: Campaign): number {
    if (!c.meta || c.meta <= 0) return 0;
    const total = this.totalArrecadado(c.key);
    return Math.min(100, Math.round((total / c.meta) * 100));
  }
}
