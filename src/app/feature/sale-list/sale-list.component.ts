import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { combineLatest } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { SaleService } from "src/app/shared/service/sale/sale.service";
import { CampaignService } from "src/app/shared/service/campaign/campaign.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { ConfirmDeleteDialogComponent } from "src/app/components/confirm-delete-dialog/confirm-delete-dialog.component";
import { Sale } from "src/app/shared/model/sale";
import { Campaign } from "src/app/shared/model/campaign";
import { RouterEnum } from "src/app/core/router/router.enum";

@Component({
  selector: "app-sale-list",
  templateUrl: "./sale-list.component.html",
  styleUrls: ["./sale-list.component.scss"],
  standalone: false,
})
export class SaleListComponent implements OnInit {
  allSales: Sale[] = [];
  filtered: Sale[] = [];
  campaigns: Campaign[] = [];

  searchCtrl = new FormControl<string>("");
  campaignCtrl = new FormControl<string>("");

  constructor(
    private saleService: SaleService,
    private campaignService: CampaignService,
    private router: Router,
    private loader: LoaderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loader.openDialog();
    combineLatest([
      this.saleService.getAllSales(),
      this.campaignService.getAllCampaigns(),
    ]).subscribe({
      next: ([sales, campaigns]) => {
        this.allSales = sales;
        this.campaigns = campaigns;
        this.aplicarFiltro();
        this.loader.closeDialog();
      },
      error: () => this.loader.closeDialog(),
    });

    this.searchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.aplicarFiltro());

    this.campaignCtrl.valueChanges.subscribe(() => this.aplicarFiltro());
  }

  private aplicarFiltro(): void {
    const term = (this.searchCtrl.value ?? "").toLowerCase().trim();
    const campKey = this.campaignCtrl.value ?? "";

    this.filtered = this.allSales.filter((s) => {
      if (campKey && s.campaignKey !== campKey) return false;
      if (term && !(s.clienteNomeLower ?? "").includes(term)) return false;
      return true;
    });
  }

  novaVenda(): void {
    this.router.navigate([RouterEnum.NEW_SALE]);
  }

  editar(s: Sale): void {
    this.saleService.selectedSale$.next(s);
    this.router.navigate([RouterEnum.NEW_SALE]);
  }

  excluir(s: Sale, event: Event): void {
    event.stopPropagation();
    if (!s.key) return;
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        titulo: "Excluir venda",
        mensagem: `Deseja excluir esta venda de "${s.clienteNome}" no valor de R$ ${this.fmt(s.valorTotal)}?`,
      },
    });
    ref.afterClosed().subscribe((confirm) => {
      if (!confirm) return;
      this.loader.openDialog();
      this.saleService
        .deleteSale(s.key!)
        .then(() => {
          this.snackBar.open("Venda excluída.", "", {
            duration: 2500,
            panelClass: ["snack-sucesso"],
            verticalPosition: "top",
          });
          this.allSales = this.allSales.filter((x) => x.key !== s.key);
          this.aplicarFiltro();
          this.loader.closeDialog();
        })
        .catch(() => this.loader.closeDialog());
    });
  }

  limparFiltros(): void {
    this.searchCtrl.setValue("");
    this.campaignCtrl.setValue("");
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
}
