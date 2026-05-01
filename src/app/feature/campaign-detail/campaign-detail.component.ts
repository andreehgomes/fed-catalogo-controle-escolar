import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { CampaignService } from "src/app/shared/service/campaign/campaign.service";
import { SaleService } from "src/app/shared/service/sale/sale.service";
import { ExpenseService } from "src/app/shared/service/expense/expense.service";
import { FileService } from "src/app/shared/service/file/file.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { ConfirmDeleteDialogComponent } from "src/app/components/confirm-delete-dialog/confirm-delete-dialog.component";
import { Campaign } from "src/app/shared/model/campaign";
import { Sale } from "src/app/shared/model/sale";
import { Expense } from "src/app/shared/model/expense";
import { RouterEnum } from "src/app/core/router/router.enum";

@Component({
  selector: "app-campaign-detail",
  templateUrl: "./campaign-detail.component.html",
  styleUrls: ["./campaign-detail.component.scss"],
  standalone: false,
})
export class CampaignDetailComponent implements OnInit {
  campaign?: Campaign;
  sales: Sale[] = [];
  expenses: Expense[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignService,
    private saleService: SaleService,
    private expenseService: ExpenseService,
    private fileService: FileService,
    private loader: LoaderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const key = this.route.snapshot.paramMap.get("key");
    if (!key) {
      this.router.navigate([RouterEnum.CAMPAIGN_LIST]);
      return;
    }
    this.loader.openDialog();
    this.campaignService.getCampaignByKey(key).subscribe({
      next: (c) => {
        this.campaign = c;
        this.carregarVendas(key);
      },
      error: () => {
        this.loader.closeDialog();
        this.router.navigate([RouterEnum.CAMPAIGN_LIST]);
      },
    });
  }

  private carregarVendas(key: string): void {
    this.saleService.getSalesByCampaign(key).subscribe({
      next: (s) => {
        this.sales = s;
        this.carregarDespesas(key);
      },
      error: () => this.loader.closeDialog(),
    });
  }

  private carregarDespesas(key: string): void {
    this.expenseService.getExpensesByCampaign(key).subscribe({
      next: (e) => {
        this.expenses = e;
        this.loader.closeDialog();
      },
      error: (err) => {
        console.error("Erro ao carregar despesas:", err);
        this.expenses = [];
        this.loader.closeDialog();
      },
    });
  }

  novaDespesa(): void {
    if (!this.campaign?.key) return;
    this.router.navigate([RouterEnum.NEW_EXPENSE], {
      queryParams: { campaignKey: this.campaign.key },
    });
  }

  editarDespesa(e: Expense): void {
    this.expenseService.selectedExpense$.next(e);
    this.router.navigate([RouterEnum.NEW_EXPENSE]);
  }

  excluirDespesa(e: Expense, event: Event): void {
    event.stopPropagation();
    if (!e.key) return;
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        titulo: "Excluir despesa",
        mensagem: `Excluir a despesa "${e.descricao}" no valor de R$ ${this.fmt(e.valor)}?`,
      },
    });
    ref.afterClosed().subscribe(async (confirm) => {
      if (!confirm) return;
      this.loader.openDialog();
      try {
        if (e.comprovanteFileName) {
          await new Promise((resolve) =>
            this.fileService.deleteFileStorage(e.comprovanteFileName!).subscribe(resolve)
          );
        }
        await this.expenseService.deleteExpense(e.key!);
        this.expenses = this.expenses.filter((x) => x.key !== e.key);
        this.snackBar.open("Despesa excluída.", "", {
          duration: 2500,
          panelClass: ["snack-sucesso"],
          verticalPosition: "top",
        });
      } finally {
        this.loader.closeDialog();
      }
    });
  }

  abrirComprovante(url: string, event: Event): void {
    event.stopPropagation();
    window.open(url, "_blank");
  }

  novaVenda(): void {
    if (!this.campaign?.key) return;
    this.router.navigate([RouterEnum.NEW_SALE], {
      queryParams: { campaignKey: this.campaign.key },
    });
  }

  editarVenda(s: Sale): void {
    this.saleService.selectedSale$.next(s);
    this.router.navigate([RouterEnum.NEW_SALE]);
  }

  voltar(): void {
    this.router.navigate([RouterEnum.CAMPAIGN_LIST]);
  }

  adicionarPatrocinio(): void {
    if (!this.campaign?.key) return;
    this.router.navigate(["campaign", this.campaign.key, "new-sponsor"]);
  }

  async compartilharPublico(): Promise<void> {
    if (!this.campaign?.key) return;
    const url = `${window.location.origin}/c/${this.campaign.key}`;
    const title = `Acompanhe a campanha ${this.campaign.nome}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
      } else {
        await navigator.clipboard.writeText(url);
        this.snackBar.open("Link copiado para a área de transferência!", "", {
          duration: 3000,
          panelClass: ["snack-sucesso"],
          verticalPosition: "top",
        });
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url);
          this.snackBar.open("Link copiado para a área de transferência!", "", {
            duration: 3000,
            panelClass: ["snack-sucesso"],
            verticalPosition: "top",
          });
        } catch {}
      }
    }
  }

  excluirPatrocinador(index: number): void {
    if (!this.campaign?.key || !this.campaign.patrocinadores) return;
    const patrocinador = this.campaign.patrocinadores[index];
    if (!patrocinador) return;

    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        titulo: "Remover patrocínio",
        mensagem: `Deseja remover o patrocínio de "${patrocinador.nome}"?`,
      },
    });
    ref.afterClosed().subscribe((confirm) => {
      if (!confirm) return;
      const novaLista = (this.campaign!.patrocinadores ?? []).filter((_, i) => i !== index);
      this.loader.openDialog();
      this.campaignService
        .updatePatrocinadores(this.campaign!.key!, novaLista)
        .then(() => {
          this.campaign!.patrocinadores = novaLista.length > 0 ? novaLista : undefined;
          this.snackBar.open("Patrocínio removido.", "", {
            duration: 2500,
            panelClass: ["snack-sucesso"],
            verticalPosition: "top",
          });
          this.loader.closeDialog();
        })
        .catch(() => this.loader.closeDialog());
    });
  }

  get totalArrecadado(): number {
    return this.sales.reduce((acc, s) => acc + s.valorTotal, 0);
  }

  get totalDespesas(): number {
    return this.expenses.reduce((acc, e) => acc + e.valor, 0);
  }

  get saldoLiquido(): number {
    return this.totalArrecadado - this.totalDespesas;
  }

  get totalPatrocinioValor(): number {
    if (!this.campaign?.patrocinadores) return 0;
    return this.campaign.patrocinadores
      .filter((p) => p.tipo === "valor")
      .reduce((acc, p) => acc + (p.valor ?? 0), 0);
  }

  get pctMeta(): number {
    if (!this.campaign?.meta || this.campaign.meta <= 0) return 0;
    return Math.min(100, Math.round((this.totalArrecadado / this.campaign.meta) * 100));
  }

  fmt(v: number): string {
    return v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  fmtData(iso: string): string {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  fmtDataInicio(iso?: string): string {
    if (!iso) return "";
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
  }
}
