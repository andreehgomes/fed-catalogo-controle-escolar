import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { debounceTime, distinctUntilChanged, map, switchMap } from "rxjs/operators";
import { SaleService } from "src/app/shared/service/sale/sale.service";
import { ClientService } from "src/app/shared/service/client/client.service";
import { ComprovanteService } from "src/app/shared/service/comprovante/comprovante.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { Sale } from "src/app/shared/model/sale";
import { RouterEnum } from "src/app/core/router/router.enum";

export interface RecebimentoItem {
  recebimentoKey: string;
  saleKey: string;
  clienteKey: string;
  clienteNome: string;
  clienteNomeLower: string;
  campaignNome: string;
  data: string;
  valor: number;
  descricao: string;
  valorTotalVenda: number;
}

@Component({
  selector: "app-listar-recebimentos",
  templateUrl: "./listar-recebimentos.component.html",
  styleUrls: ["./listar-recebimentos.component.scss"],
  standalone: false,
})
export class ListarRecebimentosComponent implements OnInit {
  filteredRecebimentos: RecebimentoItem[] = [];
  filterControl = new FormControl<string>("");
  dataInicio = new FormControl<string>("");
  dataFim = new FormControl<string>("");

  totalRecebido = 0;

  private salesByKey = new Map<string, Sale>();

  constructor(
    private saleService: SaleService,
    private clientService: ClientService,
    private comprovanteService: ComprovanteService,
    private loader: LoaderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRecebimentos();

    this.filterControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.loadRecebimentos());

    this.dataInicio.valueChanges
      .pipe(debounceTime(200))
      .subscribe(() => this.loadRecebimentos());

    this.dataFim.valueChanges
      .pipe(debounceTime(200))
      .subscribe(() => this.loadRecebimentos());
  }

  limparFiltros(): void {
    this.filterControl.setValue("", { emitEvent: false });
    this.dataInicio.setValue("", { emitEvent: false });
    this.dataFim.setValue("", { emitEvent: false });
    this.loadRecebimentos();
  }

  goToClientDetail(item: RecebimentoItem): void {
    this.router.navigate([RouterEnum.CLIENT_DETAIL, item.clienteKey]);
  }

  gerarComprovante(item: RecebimentoItem): void {
    const sale = this.salesByKey.get(item.saleKey);
    const rec = sale?.recebimentos?.[item.recebimentoKey];
    if (!sale || !rec) return;

    this.clientService
      .getClientByKey(item.clienteKey)
      .pipe(
        switchMap((client) =>
          this.comprovanteService.compartilharComprovante(client, sale, item.recebimentoKey, rec)
        )
      )
      .subscribe({
        error: (err) => console.error("Erro ao gerar comprovante:", err),
      });
  }

  fmt(value: number): string {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private loadRecebimentos(): void {
    const term = this.filterControl.value?.trim().toLowerCase() ?? "";
    const inicio = this.dataInicio.value ?? "";
    const fim = this.dataFim.value ?? "";

    const obs$: Observable<Sale[]> = this.saleService.getAllSales();

    this.loader.openDialog();
    obs$
      .pipe(
        map((sales) => {
          this.salesByKey.clear();
          for (const s of sales) {
            if (s.key) this.salesByKey.set(s.key, s);
          }
          return this.flatten(sales);
        }),
        map((items) => this.applyFilters(items, term, inicio, fim)),
        map((items) =>
          items.sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""))
        )
      )
      .subscribe({
        next: (items) => {
          this.filteredRecebimentos = items;
          this.totalRecebido = items.reduce((sum, i) => sum + (i.valor ?? 0), 0);
          this.loader.closeDialog();
        },
        error: () => this.loader.closeDialog(),
      });
  }

  private flatten(sales: Sale[]): RecebimentoItem[] {
    const items: RecebimentoItem[] = [];
    for (const sale of sales) {
      if (!sale.recebimentos || !sale.key) continue;
      for (const [recKey, rec] of Object.entries(sale.recebimentos)) {
        items.push({
          recebimentoKey: recKey,
          saleKey: sale.key,
          clienteKey: sale.clienteKey,
          clienteNome: sale.clienteNome,
          clienteNomeLower: sale.clienteNomeLower ?? (sale.clienteNome ?? "").toLowerCase(),
          campaignNome: sale.campaignNome,
          data: rec.data,
          valor: rec.valor,
          descricao: rec.descricao,
          valorTotalVenda: sale.valorTotal,
        });
      }
    }
    return items;
  }

  private toLocalDate(iso: string): string {
    if (!iso) return "";
    if (iso.length <= 10) return iso;
    return new Date(iso).toLocaleDateString("en-CA");
  }

  private applyFilters(
    items: RecebimentoItem[],
    term: string,
    inicio: string,
    fim: string
  ): RecebimentoItem[] {
    let result = items;
    if (inicio) result = result.filter((i) => this.toLocalDate(i.data ?? "") >= inicio);
    if (fim) result = result.filter((i) => this.toLocalDate(i.data ?? "") <= fim);
    if (term) {
      result = result.filter(
        (i) =>
          (i.clienteNomeLower ?? "").includes(term) ||
          (i.clienteNome ?? "").toLowerCase().includes(term)
      );
    }
    return result;
  }
}
