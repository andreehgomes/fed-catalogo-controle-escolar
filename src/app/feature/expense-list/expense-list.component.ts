import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { combineLatest } from "rxjs";
import { ExpenseService } from "src/app/shared/service/expense/expense.service";
import { CampaignService } from "src/app/shared/service/campaign/campaign.service";
import { FileService } from "src/app/shared/service/file/file.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { ConfirmDeleteDialogComponent } from "src/app/components/confirm-delete-dialog/confirm-delete-dialog.component";
import { Expense } from "src/app/shared/model/expense";
import { Campaign } from "src/app/shared/model/campaign";
import { RouterEnum } from "src/app/core/router/router.enum";

@Component({
  selector: "app-expense-list",
  templateUrl: "./expense-list.component.html",
  styleUrls: ["./expense-list.component.scss"],
  standalone: false,
})
export class ExpenseListComponent implements OnInit {
  allExpenses: Expense[] = [];
  filtered: Expense[] = [];
  campaigns: Campaign[] = [];

  campaignCtrl = new FormControl<string>("");
  searchCtrl = new FormControl<string>("");

  constructor(
    private expenseService: ExpenseService,
    private campaignService: CampaignService,
    private fileService: FileService,
    private loader: LoaderService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loader.openDialog();
    combineLatest([
      this.expenseService.getAllExpenses(),
      this.campaignService.getAllCampaigns(),
    ]).subscribe({
      next: ([expenses, campaigns]) => {
        this.allExpenses = expenses;
        this.campaigns = campaigns;
        this.aplicarFiltro();
        this.loader.closeDialog();
      },
      error: () => this.loader.closeDialog(),
    });

    this.campaignCtrl.valueChanges.subscribe(() => this.aplicarFiltro());
    this.searchCtrl.valueChanges.subscribe(() => this.aplicarFiltro());
  }

  private aplicarFiltro(): void {
    const campKey = this.campaignCtrl.value ?? "";
    const term = (this.searchCtrl.value ?? "").toLowerCase().trim();

    this.filtered = this.allExpenses.filter((e) => {
      if (campKey && e.campaignKey !== campKey) return false;
      if (term && !(e.descricao ?? "").toLowerCase().includes(term)) return false;
      return true;
    });
  }

  novaDespesa(): void {
    this.router.navigate([RouterEnum.NEW_EXPENSE]);
  }

  editar(e: Expense): void {
    this.expenseService.selectedExpense$.next(e);
    this.router.navigate([RouterEnum.NEW_EXPENSE]);
  }

  excluir(e: Expense, event: Event): void {
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
        this.snackBar.open("Despesa excluída.", "", {
          duration: 2500,
          panelClass: ["snack-sucesso"],
          verticalPosition: "top",
        });
        this.allExpenses = this.allExpenses.filter((x) => x.key !== e.key);
        this.aplicarFiltro();
      } catch (err) {
        console.error("Erro ao excluir despesa:", err);
      } finally {
        this.loader.closeDialog();
      }
    });
  }

  abrirComprovante(url: string, event: Event): void {
    event.stopPropagation();
    window.open(url, "_blank");
  }

  limparFiltros(): void {
    this.campaignCtrl.setValue("");
    this.searchCtrl.setValue("");
  }

  get totalDespesas(): number {
    return this.filtered.reduce((acc, e) => acc + e.valor, 0);
  }

  fmt(v: number): string {
    return v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  fmtData(iso: string): string {
    if (!iso) return "";
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
  }
}
