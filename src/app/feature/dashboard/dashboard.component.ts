import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { combineLatest } from "rxjs";
import { CampaignService } from "src/app/shared/service/campaign/campaign.service";
import { SaleService } from "src/app/shared/service/sale/sale.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { Campaign, CampaignSponsor } from "src/app/shared/model/campaign";
import { Sale } from "src/app/shared/model/sale";

interface TopItem {
  descricao: string;
  qtdTotal: number;
  valorTotal: number;
}

interface SponsorEntry {
  sponsor: CampaignSponsor;
  campaignNome: string;
}

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
  standalone: false,
})
export class DashboardComponent implements OnInit {
  campaigns: Campaign[] = [];
  allSales: Sale[] = [];
  filteredSales: Sale[] = [];

  campaignCtrl = new FormControl<string>("");
  dataDeCtrl = new FormControl<string>("");
  dataAteCtrl = new FormControl<string>("");

  topItens: TopItem[] = [];
  ultimasVendas: Sale[] = [];

  constructor(
    private campaignService: CampaignService,
    private saleService: SaleService,
    private loader: LoaderService
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
        this.aplicarFiltros();
        this.loader.closeDialog();
      },
      error: () => this.loader.closeDialog(),
    });

    this.campaignCtrl.valueChanges.subscribe(() => this.aplicarFiltros());
    this.dataDeCtrl.valueChanges.subscribe(() => this.aplicarFiltros());
    this.dataAteCtrl.valueChanges.subscribe(() => this.aplicarFiltros());
  }

  private aplicarFiltros(): void {
    const campKey = this.campaignCtrl.value ?? "";
    const de = this.dataDeCtrl.value ? new Date(this.dataDeCtrl.value + "T00:00:00").toISOString() : null;
    const ate = this.dataAteCtrl.value ? new Date(this.dataAteCtrl.value + "T23:59:59").toISOString() : null;

    this.filteredSales = this.allSales.filter((s) => {
      if (campKey && s.campaignKey !== campKey) return false;
      if (de && s.dataCriacao < de) return false;
      if (ate && s.dataCriacao > ate) return false;
      return true;
    });

    this.calcularTopItens();
    this.calcularUltimasVendas();
  }

  private calcularTopItens(): void {
    const map = new Map<string, TopItem>();
    this.filteredSales.forEach((s) => {
      s.itens.forEach((it) => {
        const cur = map.get(it.descricao.toLowerCase()) ?? {
          descricao: it.descricao,
          qtdTotal: 0,
          valorTotal: 0,
        };
        cur.qtdTotal += it.quantidade;
        cur.valorTotal += it.valorSubtotal;
        map.set(it.descricao.toLowerCase(), cur);
      });
    });
    this.topItens = Array.from(map.values())
      .sort((a, b) => b.qtdTotal - a.qtdTotal)
      .slice(0, 10);
  }

  private calcularUltimasVendas(): void {
    this.ultimasVendas = [...this.filteredSales]
      .sort((a, b) => (b.dataCriacao ?? "").localeCompare(a.dataCriacao ?? ""))
      .slice(0, 10);
  }

  limparFiltros(): void {
    this.campaignCtrl.setValue("");
    this.dataDeCtrl.setValue("");
    this.dataAteCtrl.setValue("");
  }

  get totalVendas(): number {
    return this.filteredSales.length;
  }

  get totalVendido(): number {
    return this.filteredSales.reduce((acc, s) => acc + s.valorTotal, 0);
  }

  get totalRecebido(): number {
    return this.filteredSales.reduce((acc, s) => acc + (s.valorRecebido ?? 0), 0);
  }

  get totalAReceber(): number {
    return this.totalVendido - this.totalRecebido;
  }

  get campaignSelecionada(): Campaign | undefined {
    const key = this.campaignCtrl.value;
    if (!key) return undefined;
    return this.campaigns.find((c) => c.key === key);
  }

  get patrociniosFiltrados(): SponsorEntry[] {
    const campKey = this.campaignCtrl.value ?? "";
    const fonte = campKey
      ? this.campaigns.filter((c) => c.key === campKey)
      : this.campaigns;
    const result: SponsorEntry[] = [];
    fonte.forEach((c) => {
      (c.patrocinadores ?? []).forEach((sponsor) => {
        result.push({ sponsor, campaignNome: c.nome });
      });
    });
    return result;
  }

  get totalPatrocinioValor(): number {
    return this.patrociniosFiltrados
      .filter((p) => p.sponsor.tipo === "valor")
      .reduce((acc, p) => acc + (p.sponsor.valor ?? 0), 0);
  }

  get qtdPatrocinioProduto(): number {
    return this.patrociniosFiltrados.filter((p) => p.sponsor.tipo === "produto").length;
  }

  get pctMeta(): number {
    const c = this.campaignSelecionada;
    if (!c?.meta || c.meta <= 0) return 0;
    return Math.min(100, Math.round((this.totalVendido / c.meta) * 100));
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
