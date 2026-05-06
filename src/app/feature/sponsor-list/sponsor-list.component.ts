import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { CampaignService } from "src/app/shared/service/campaign/campaign.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { ConfirmDeleteDialogComponent } from "src/app/components/confirm-delete-dialog/confirm-delete-dialog.component";
import { Campaign, CampaignSponsor } from "src/app/shared/model/campaign";
import { RouterEnum } from "src/app/core/router/router.enum";

interface SponsorEntry {
  sponsor: CampaignSponsor;
  campaignKey: string;
  campaignNome: string;
  index: number;
}

@Component({
  selector: "app-sponsor-list",
  templateUrl: "./sponsor-list.component.html",
  styleUrls: ["./sponsor-list.component.scss"],
  standalone: false,
})
export class SponsorListComponent implements OnInit {
  campaigns: Campaign[] = [];
  allEntries: SponsorEntry[] = [];
  filtered: SponsorEntry[] = [];

  campaignCtrl = new FormControl<string>("");
  searchCtrl = new FormControl<string>("");

  constructor(
    private campaignService: CampaignService,
    private loader: LoaderService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loader.openDialog();
    this.campaignService.getAllCampaigns().subscribe({
      next: (campaigns) => {
        this.campaigns = campaigns;
        this.allEntries = [];
        campaigns.forEach((c) => {
          (c.patrocinadores ?? []).forEach((sponsor, index) => {
            this.allEntries.push({
              sponsor,
              campaignKey: c.key!,
              campaignNome: c.nome,
              index,
            });
          });
        });
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

    this.filtered = this.allEntries.filter((e) => {
      if (campKey && e.campaignKey !== campKey) return false;
      if (term && !e.sponsor.nome.toLowerCase().includes(term)) return false;
      return true;
    });
  }

  excluir(entry: SponsorEntry, event: Event): void {
    event.stopPropagation();
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        titulo: "Excluir patrocínio",
        mensagem: `Excluir o patrocínio de "${entry.sponsor.nome}" da campanha "${entry.campaignNome}"?`,
      },
    });
    ref.afterClosed().subscribe(async (confirm) => {
      if (!confirm) return;
      this.loader.openDialog();
      const campaign = this.campaigns.find((c) => c.key === entry.campaignKey);
      if (!campaign) {
        this.loader.closeDialog();
        return;
      }
      const novaLista = (campaign.patrocinadores ?? []).filter((_, i) => i !== entry.index);
      try {
        await this.campaignService.updatePatrocinadores(entry.campaignKey, novaLista);
        campaign.patrocinadores = novaLista;
        this.allEntries = this.allEntries.filter(
          (e) => !(e.campaignKey === entry.campaignKey && e.index === entry.index)
        );
        this.allEntries
          .filter((e) => e.campaignKey === entry.campaignKey && e.index > entry.index)
          .forEach((e) => e.index--);
        this.aplicarFiltro();
        this.snackBar.open("Patrocínio excluído.", "", {
          duration: 2500,
          panelClass: ["snack-sucesso"],
          verticalPosition: "top",
        });
      } catch {
        this.snackBar.open("Erro ao excluir patrocínio.", "", {
          duration: 3000,
          panelClass: ["snack-erro"],
          verticalPosition: "top",
        });
      } finally {
        this.loader.closeDialog();
      }
    });
  }

  irParaCampanha(campaignKey: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate([RouterEnum.CAMPAIGN_DETAIL, campaignKey]);
  }

  limparFiltros(): void {
    this.campaignCtrl.setValue("");
    this.searchCtrl.setValue("");
  }

  get totalValor(): number {
    return this.filtered
      .filter((e) => e.sponsor.tipo === "valor")
      .reduce((acc, e) => acc + (e.sponsor.valor ?? 0), 0);
  }

  get qtdProduto(): number {
    return this.filtered.filter((e) => e.sponsor.tipo === "produto").length;
  }

  fmt(v: number): string {
    return v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
