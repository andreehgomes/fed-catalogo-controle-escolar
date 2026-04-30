import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ClientService } from "src/app/shared/service/client/client.service";
import { SaleService } from "src/app/shared/service/sale/sale.service";
import { ComprovanteService } from "src/app/shared/service/comprovante/comprovante.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { Client } from "src/app/shared/model/client";
import { Sale, Recebimento } from "src/app/shared/model/sale";
import { RouterEnum } from "src/app/core/router/router.enum";

@Component({
  selector: "app-client-detail",
  templateUrl: "./client-detail.component.html",
  styleUrls: ["./client-detail.component.scss"],
  standalone: false,
})
export class ClientDetailComponent implements OnInit {
  client?: Client;
  sales: Sale[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService,
    private saleService: SaleService,
    private comprovanteService: ComprovanteService,
    private loader: LoaderService
  ) {}

  ngOnInit(): void {
    const key = this.route.snapshot.paramMap.get("key");
    if (!key) {
      this.router.navigate([RouterEnum.CLIENT_LIST]);
      return;
    }
    this.loader.openDialog();
    this.clientService.getClientByKey(key).subscribe({
      next: (c) => {
        this.client = c;
        this.carregarVendas(key);
      },
      error: () => {
        this.loader.closeDialog();
        this.router.navigate([RouterEnum.CLIENT_LIST]);
      },
    });
  }

  private carregarVendas(key: string): void {
    this.saleService.getSalesByClientKey(key).subscribe({
      next: (s) => {
        this.sales = s;
        this.loader.closeDialog();
      },
      error: () => this.loader.closeDialog(),
    });
  }

  voltar(): void {
    this.router.navigate([RouterEnum.CLIENT_LIST]);
  }

  novaVenda(): void {
    if (!this.client) return;
    this.clientService.selectedClient$.next(this.client);
    this.router.navigate([RouterEnum.NEW_SALE]);
  }

  editar(): void {
    if (!this.client) return;
    this.clientService.selectedClient$.next(this.client);
    this.router.navigate([RouterEnum.NEW_CLIENT]);
  }

  editarVenda(s: Sale): void {
    this.saleService.selectedSale$.next(s);
    this.router.navigate([RouterEnum.NEW_SALE]);
  }

  registrarRecebimento(s: Sale, event: Event): void {
    event.stopPropagation();
    if (!s.key) return;
    this.router.navigate([RouterEnum.RECEBIMENTO, s.key], {
      queryParams: { origem: RouterEnum.CLIENT_DETAIL },
    });
  }

  compartilharResumo(): void {
    if (!this.client) return;
    this.comprovanteService
      .compartilharResumo(this.client, this.sales)
      .subscribe({ error: (err) => console.error("Erro ao gerar resumo:", err) });
  }

  gerarComprovanteSale(s: Sale, event: Event): void {
    event.stopPropagation();
    if (!this.client) return;
    this.comprovanteService
      .compartilharComprovanteSale(this.client, s)
      .subscribe({ error: (err) => console.error("Erro ao gerar comprovante:", err) });
  }

  saleRecebimentos(sale: Sale): { key: string; r: Recebimento }[] {
    if (!sale.recebimentos) return [];
    return Object.entries(sale.recebimentos)
      .map(([key, r]) => ({ key, r }))
      .sort((a, b) => b.r.data.localeCompare(a.r.data));
  }

  gerarComprovanteRecebimento(sale: Sale, recKey: string, rec: Recebimento, event: Event): void {
    event.stopPropagation();
    if (!this.client) return;
    this.comprovanteService
      .compartilharComprovante(this.client, sale, recKey, rec)
      .subscribe({ error: (err) => console.error("Erro ao gerar comprovante:", err) });
  }

  get saldoPendente(): number {
    return this.sales
      .filter((s) => s.status === "pendente")
      .reduce((acc, s) => acc + (s.valorTotal - (s.valorRecebido ?? 0)), 0);
  }

  get totalGasto(): number {
    return this.sales.reduce((acc, s) => acc + s.valorTotal, 0);
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
