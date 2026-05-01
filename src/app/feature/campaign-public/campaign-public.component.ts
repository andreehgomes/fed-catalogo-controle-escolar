import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Auth, signInAnonymously, authState } from "@angular/fire/auth";
import { firstValueFrom } from "rxjs";
import { filter, take } from "rxjs/operators";
import { CampaignService } from "src/app/shared/service/campaign/campaign.service";
import { SaleService } from "src/app/shared/service/sale/sale.service";
import { ExpenseService } from "src/app/shared/service/expense/expense.service";
import { Campaign } from "src/app/shared/model/campaign";
import { Sale } from "src/app/shared/model/sale";
import { Expense } from "src/app/shared/model/expense";

interface TopItem {
  descricao: string;
  qtdTotal: number;
  valorTotal: number;
}

@Component({
  selector: "app-campaign-public",
  templateUrl: "./campaign-public.component.html",
  styleUrls: ["./campaign-public.component.scss"],
  standalone: false,
})
export class CampaignPublicComponent implements OnInit {
  campaign?: Campaign;
  sales: Sale[] = [];
  expenses: Expense[] = [];
  loading = true;
  notFound = false;
  topItens: TopItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private fireAuth: Auth,
    private campaignService: CampaignService,
    private saleService: SaleService,
    private expenseService: ExpenseService
  ) {}

  async ngOnInit(): Promise<void> {
    const key = this.route.snapshot.paramMap.get("key");
    if (!key) {
      this.notFound = true;
      this.loading = false;
      return;
    }

    try {
      await this.ensureAnonymousAuth();
      this.campaign = await firstValueFrom(this.campaignService.getCampaignByKey(key));
      this.sales = await firstValueFrom(this.saleService.getSalesByCampaign(key));
      try {
        this.expenses = await firstValueFrom(
          this.expenseService.getExpensesByCampaign(key)
        );
      } catch (err) {
        console.error("Erro ao carregar despesas:", err);
        this.expenses = [];
      }
      this.calcularTopItens();
    } catch {
      this.notFound = true;
    } finally {
      this.loading = false;
    }
  }

  private async ensureAnonymousAuth(): Promise<void> {
    const current = await firstValueFrom(
      authState(this.fireAuth).pipe(take(1))
    );
    if (current) return;
    await signInAnonymously(this.fireAuth);
    await firstValueFrom(
      authState(this.fireAuth).pipe(filter((u) => !!u), take(1))
    );
  }

  private calcularTopItens(): void {
    const map = new Map<string, TopItem>();
    this.sales.forEach((s) => {
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

  get totalVendas(): number {
    return this.sales.length;
  }

  get totalVendido(): number {
    return this.sales.reduce((acc, s) => acc + s.valorTotal, 0);
  }

  get totalRecebido(): number {
    return this.sales.reduce((acc, s) => acc + (s.valorRecebido ?? 0), 0);
  }

  get totalAReceber(): number {
    return this.totalVendido - this.totalRecebido;
  }

  get totalDespesas(): number {
    return this.expenses.reduce((acc, e) => acc + e.valor, 0);
  }

  get saldoLiquido(): number {
    return this.totalRecebido - this.totalDespesas;
  }

  get totalPatrocinioValor(): number {
    if (!this.campaign?.patrocinadores) return 0;
    return this.campaign.patrocinadores
      .filter((p) => p.tipo === "valor")
      .reduce((acc, p) => acc + (p.valor ?? 0), 0);
  }

  get pctMeta(): number {
    if (!this.campaign?.meta || this.campaign.meta <= 0) return 0;
    return Math.min(100, Math.round((this.totalVendido / this.campaign.meta) * 100));
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

  fmtDataData(iso: string): string {
    if (!iso) return "";
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
  }
}
