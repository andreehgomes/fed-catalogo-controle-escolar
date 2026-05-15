import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SaleService } from 'src/app/shared/service/sale/sale.service';
import { ComprovanteService } from 'src/app/shared/service/comprovante/comprovante.service';
import { LoaderService } from 'src/app/components/loader/loader.service';
import { Sale } from 'src/app/shared/model/sale';
import { RouterEnum } from 'src/app/core/router/router.enum';

@Component({
  selector: 'app-entrega-list',
  templateUrl: './entrega-list.component.html',
  styleUrls: ['./entrega-list.component.scss'],
  standalone: false,
})
export class EntregaListComponent implements OnInit {
  pendentes: Sale[] = [];
  entregues: Sale[] = [];
  carregando = true;
  routes = RouterEnum;
  filtroCtrl = new FormControl('');

  private todasSales: Sale[] = [];

  constructor(
    private saleService: SaleService,
    private comprovanteService: ComprovanteService,
    private loader: LoaderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loader.openDialog();
    this.saleService.getAllSales().subscribe({
      next: (sales) => {
        this.todasSales = sales;
        this.aplicarFiltro('');
        this.carregando = false;
        this.loader.closeDialog();
      },
      error: () => {
        this.carregando = false;
        this.loader.closeDialog();
      },
    });

    this.filtroCtrl.valueChanges.pipe(debounceTime(250), distinctUntilChanged()).subscribe((termo) => {
      this.aplicarFiltro(termo ?? '');
    });
  }

  private aplicarFiltro(termo: string): void {
    const t = termo.trim().toLowerCase();
    const filtradas = t
      ? this.todasSales.filter((s) => s.clienteNomeLower?.includes(t) || s.clienteNome?.toLowerCase().includes(t))
      : this.todasSales;
    this.pendentes = filtradas.filter((s) => s.entregaStatus !== 'entregue');
    this.entregues = filtradas.filter((s) => s.entregaStatus === 'entregue');
  }

  irParaDetalhe(sale: Sale): void {
    if (!sale.key) return;
    this.router.navigate([RouterEnum.ENTREGA_DETAIL, sale.key]);
  }

  chipColor(sale: Sale): string {
    switch (sale.entregaStatus) {
      case 'entregue': return 'entregue';
      case 'parcial': return 'parcial';
      default: return 'pendente';
    }
  }

  chipLabel(sale: Sale): string {
    switch (sale.entregaStatus) {
      case 'entregue': return 'Entregue';
      case 'parcial': return 'Parcial';
      default: return 'Pendente';
    }
  }

  trackBySaleKey(_: number, sale: Sale): string {
    return sale.key ?? '';
  }

  gerarComprovante(sale: Sale, event: Event): void {
    event.stopPropagation();
    this.comprovanteService.compartilharComprovanteCompleto(sale).subscribe({
      error: (err) => console.error('Erro ao gerar comprovante:', err),
    });
  }

  fmtDate(iso: string): string {
    const normalized = iso?.length <= 10 ? iso + 'T00:00:00' : iso;
    return new Date(normalized).toLocaleDateString('pt-BR');
  }
}
