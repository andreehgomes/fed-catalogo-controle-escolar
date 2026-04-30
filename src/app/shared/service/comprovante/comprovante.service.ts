import { Injectable } from '@angular/core';
import { Observable, from, of, switchMap, finalize, map } from 'rxjs';
import { Client } from '../../model/client';
import { Sale, SaleItem, Recebimento } from '../../model/sale';
import { LoaderService } from '../../../components/loader/loader.service';

@Injectable({ providedIn: 'root' })
export class ComprovanteService {
  constructor(private loader: LoaderService) {}

  // ─── Formatadores ────────────────────────────────────────────────────────────

  fmt(value: number): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtDate(iso: string): string {
    const normalized = iso?.length <= 10 ? iso + 'T00:00:00' : iso;
    return new Date(normalized).toLocaleDateString('pt-BR');
  }

  saldo(sale: Sale): number {
    return sale.valorTotal - (sale.valorRecebido ?? 0);
  }

  saleRecebimentos(sale: Sale): { key: string; r: Recebimento }[] {
    if (!sale.recebimentos) return [];
    return Object.entries(sale.recebimentos)
      .map(([key, r]) => ({ key, r }))
      .sort((a, b) => b.r.data.localeCompare(a.r.data));
  }

  // ─── Resumo de vendas pendentes ───────────────────────────────────────────

  compartilharResumo(client: Client, sales: Sale[]): Observable<void> {
    const pendentes = sales
      .filter((s) => s.status !== 'quitado')
      .sort((a, b) => a.dataCriacao.localeCompare(b.dataCriacao));

    const totalComprado = pendentes.reduce((s, v) => s + v.valorTotal, 0);
    const totalPago = pendentes.reduce((s, v) => s + (v.valorRecebido ?? 0), 0);
    const saldoDevedor = totalComprado - totalPago;

    const el = this.criarElementoResumo(client, pendentes, totalComprado, totalPago, saldoDevedor);
    const slug = client.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const data = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    return this.capturarECompartilhar(
      el,
      `resumo-${slug}-${data}.png`,
      `Resumo — ${client.nome}`,
      `Saldo devedor: R$ ${this.fmt(saldoDevedor)}`,
    );
  }

  // ─── Comprovante completo da venda ───────────────────────────────────────

  compartilharComprovanteSale(client: Client, sale: Sale): Observable<void> {
    const el = this.criarElementoComprovanteSale(client, sale);
    const slug = client.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const data = sale.dataCriacao.slice(0, 10).replace(/-/g, '');

    return this.capturarECompartilhar(
      el,
      `venda-${slug}-${data}.png`,
      `Venda — ${client.nome}`,
      `Total: R$ ${this.fmt(sale.valorTotal)} | Saldo: R$ ${this.fmt(this.saldo(sale))}`,
    );
  }

  // ─── Comprovante de recebimento individual ────────────────────────────────

  compartilharComprovante(
    client: Client,
    sale: Sale,
    recKey: string,
    rec: Recebimento,
  ): Observable<void> {
    const el = this.criarElementoComprovante(client, sale, recKey, rec);
    const slug = client.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const recData = rec.data.slice(0, 10).replace(/-/g, '');

    return this.capturarECompartilhar(
      el,
      `comprovante-${slug}-${recData}.png`,
      `Comprovante — ${client.nome}`,
      `Pagamento de R$ ${this.fmt(rec.valor)} em ${this.fmtDate(rec.data)}`,
    );
  }

  // ─── Captura html2canvas e compartilha / abre ─────────────────────────────

  private capturarECompartilhar(
    el: HTMLElement,
    fileName: string,
    title: string,
    text: string,
  ): Observable<void> {
    document.body.appendChild(el);
    this.loader.openDialog();

    const cleanup = () => {
      this.loader.closeDialog();
      if (document.body.contains(el)) document.body.removeChild(el);
    };

    return from(import('html2canvas')).pipe(
      map((m) => m.default),
      switchMap((html2canvas) =>
        from(html2canvas(el, { backgroundColor: '#ffffff', scale: 2 })),
      ),
      switchMap(
        (canvas) =>
          new Observable<Blob>((observer) => {
            canvas.toBlob((blob) => {
              if (blob) {
                observer.next(blob);
                observer.complete();
              } else {
                observer.error(new Error('Falha ao gerar blob da imagem'));
              }
            }, 'image/png');
          }),
      ),
      switchMap((blob) => {
        const file = new File([blob], fileName, { type: 'image/png' });
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );

        if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
          return from(
            navigator.share({ files: [file], title, text }).catch((e: any) => {
              if (e?.name !== 'AbortError') console.error(e);
            }),
          ).pipe(map(() => void 0 as void));
        }

        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        return of(void 0 as void);
      }),
      finalize(cleanup),
    );
  }

  // ─── Builder: resumo de vendas pendentes ──────────────────────────────────

  private criarElementoResumo(
    client: Client,
    pendentes: Sale[],
    totalComprado: number,
    totalPago: number,
    saldo: number,
  ): HTMLElement {
    const horaGeracao = new Date().toLocaleString('pt-BR');
    const dataGeracao = new Date().toLocaleDateString('pt-BR');

    const root = this.div({
      position: 'fixed', left: '-9999px', top: '0', width: '400px',
      backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif',
      fontSize: '14px', color: '#1a1a1a', padding: '16px', boxSizing: 'border-box',
    });
    root.className = 'resumo-snapshot';

    const header = this.div({ padding: '0 0 12px 0', borderBottom: '2px solid #e0e0e0', marginBottom: '12px' });
    const nomeEl = document.createElement('strong');
    nomeEl.textContent = client.nome;
    nomeEl.style.cssText = 'display: block; font-size: 17px; margin-bottom: 4px;';
    header.appendChild(nomeEl);
    header.appendChild(this.span(`Resumo gerado em ${dataGeracao}`, { fontSize: '12px', color: '#666' }));
    root.appendChild(header);

    root.appendChild(this.sectionLabel('Resumo financeiro'));
    root.appendChild(this.row('Total das vendas pendentes', `R$ ${this.fmt(totalComprado)}`));
    root.appendChild(this.row('Total pago', `R$ ${this.fmt(totalPago)}`, { color: '#2e7d32' }));
    root.appendChild(this.row('Saldo devedor', `R$ ${this.fmt(saldo)}`, { color: '#c62828' }));

    for (const sale of pendentes) {
      const vendaWrap = this.div({ marginTop: '14px', borderTop: '2px solid #e0e0e0', paddingTop: '10px' });

      const vendaHeader = this.div({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' });
      vendaHeader.appendChild(this.span(`${sale.campaignNome} — ${this.fmtDate(sale.dataCriacao)}`, { fontWeight: '700', fontSize: '13px' }));
      vendaHeader.appendChild(this.badge('Pendente', '#fce4ec', '#c62828'));
      vendaWrap.appendChild(vendaHeader);

      vendaWrap.appendChild(this.row('Total', `R$ ${this.fmt(sale.valorTotal)}`));
      vendaWrap.appendChild(this.row('Recebido', `R$ ${this.fmt(sale.valorRecebido ?? 0)}`, { color: '#2e7d32' }));
      vendaWrap.appendChild(this.row('Saldo', `R$ ${this.fmt(this.saldo(sale))}`, { color: '#c62828' }));

      if (sale.itens && sale.itens.length > 0) {
        vendaWrap.appendChild(this.sectionLabel('Itens', '8px 0 4px 0'));
        for (const item of sale.itens) {
          vendaWrap.appendChild(this.itemRow(item));
        }
      }

      const recs = this.saleRecebimentos(sale);
      if (recs.length > 0) {
        vendaWrap.appendChild(this.sectionLabel('Pagamentos recebidos', '8px 0 4px 0'));
        for (const { r } of recs) {
          vendaWrap.appendChild(this.row(
            `${this.fmtDate(r.data)}${r.descricao ? ' — ' + r.descricao : ''}`,
            `R$ ${this.fmt(r.valor)}`,
            { color: '#2e7d32' },
          ));
        }
      }

      root.appendChild(vendaWrap);
    }

    root.appendChild(this.footer(`Gerado em ${horaGeracao}`));
    return root;
  }

  // ─── Builder: comprovante de recebimento individual ───────────────────────

  private criarElementoComprovante(
    client: Client,
    sale: Sale,
    recKey: string,
    rec: Recebimento,
  ): HTMLElement {
    const horaGeracao = new Date().toLocaleString('pt-BR');
    const dataGeracao = new Date().toLocaleDateString('pt-BR');
    const saldoAtual = this.saldo(sale);

    const root = this.div({
      position: 'fixed', left: '-9999px', top: '0', width: '400px',
      backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif',
      fontSize: '14px', color: '#1a1a1a', padding: '16px', boxSizing: 'border-box',
    });
    root.className = 'comprovante-snapshot';

    const header = this.div({ padding: '0 0 12px 0', borderBottom: '2px solid #e0e0e0', marginBottom: '12px' });
    const titulo = document.createElement('strong');
    titulo.textContent = 'Comprovante de Pagamento';
    titulo.style.cssText = 'display: block; font-size: 17px; margin-bottom: 4px;';
    header.appendChild(titulo);
    header.appendChild(this.span(client.nome, { display: 'block', fontSize: '14px', color: '#444', marginBottom: '2px' }));
    header.appendChild(this.span(`Campanha: ${sale.campaignNome}`, { display: 'block', fontSize: '12px', color: '#666', marginBottom: '2px' }));
    header.appendChild(this.span(`Emitido em ${dataGeracao}`, { fontSize: '12px', color: '#666' }));
    root.appendChild(header);

    const recBox = this.div({
      backgroundColor: '#f1f8e9', border: '1px solid #a5d6a7',
      borderRadius: '8px', padding: '10px 12px', marginBottom: '14px',
    });
    recBox.appendChild(this.sectionLabel('Recebimento'));

    const recValorRow = this.div({ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' });
    recValorRow.appendChild(this.span(this.fmtDate(rec.data), { fontSize: '13px', color: '#1a1a1a' }));
    const valorEl = document.createElement('strong');
    valorEl.textContent = `R$ ${this.fmt(rec.valor)}`;
    valorEl.style.cssText = 'font-size: 18px; color: #2e7d32;';
    recValorRow.appendChild(valorEl);
    recBox.appendChild(recValorRow);

    if (rec.descricao) {
      recBox.appendChild(this.span(rec.descricao, { display: 'block', fontSize: '12px', color: '#555', marginTop: '4px' }));
    }
    root.appendChild(recBox);

    root.appendChild(this.sectionLabel('Venda'));
    root.appendChild(this.row(`Data da venda`, this.fmtDate(sale.dataCriacao)));
    root.appendChild(this.row('Total da venda', `R$ ${this.fmt(sale.valorTotal)}`));
    root.appendChild(this.row('Total recebido', `R$ ${this.fmt(sale.valorRecebido ?? 0)}`, { color: '#2e7d32' }));
    root.appendChild(this.row(
      'Saldo restante',
      `R$ ${this.fmt(saldoAtual)}`,
      saldoAtual > 0 ? { color: '#c62828' } : { color: '#2e7d32' },
    ));

    const statusVal = sale.status === 'quitado'
      ? { label: 'Quitado', bg: '#e8f5e9', color: '#2e7d32' }
      : { label: 'Pendente', bg: '#fce4ec', color: '#c62828' };
    const statusRow = this.div({
      display: 'flex', justifyContent: 'space-between', padding: '4px 0',
      borderBottom: '1px solid #e0e0e0', fontSize: '13px', color: '#1a1a1a', marginTop: '2px',
    });
    statusRow.appendChild(this.span('Status'));
    statusRow.appendChild(this.badge(statusVal.label, statusVal.bg, statusVal.color));
    root.appendChild(statusRow);

    if (sale.itens && sale.itens.length > 0) {
      root.appendChild(this.div({ marginTop: '14px' }));
      root.appendChild(this.sectionLabel('Itens da venda'));
      for (const item of sale.itens) {
        root.appendChild(this.itemRow(item));
      }
    }

    const recs = this.saleRecebimentos(sale);
    if (recs.length > 0) {
      const recsWrap = this.div({ marginTop: '14px' });
      recsWrap.appendChild(this.sectionLabel('Histórico de pagamentos'));

      for (const { key, r } of recs) {
        const isAtual = key === recKey;
        const recRow = this.div({
          display: 'flex', justifyContent: 'space-between', padding: '4px 0',
          borderBottom: '1px solid #e0e0e0', fontSize: '13px',
          ...(isAtual ? { backgroundColor: '#f1f8e9', borderRadius: '4px', padding: '4px 6px' } : {}),
        });
        const info = this.div({ display: 'flex', flexDirection: 'column', gap: '1px' });
        info.appendChild(this.span(
          `${this.fmtDate(r.data)}${r.descricao ? ' — ' + r.descricao : ''}${isAtual ? ' ✓' : ''}`,
          { fontWeight: isAtual ? '700' : '400', color: '#1a1a1a' },
        ));
        recRow.appendChild(info);
        recRow.appendChild(this.span(`R$ ${this.fmt(r.valor)}`, { fontWeight: '600', color: '#2e7d32' }));
        recsWrap.appendChild(recRow);
      }

      root.appendChild(recsWrap);
    }

    root.appendChild(this.footer(`Gerado em ${horaGeracao}`));
    return root;
  }

  // ─── Builder: comprovante completo da venda ───────────────────────────────

  private criarElementoComprovanteSale(client: Client, sale: Sale): HTMLElement {
    const horaGeracao = new Date().toLocaleString('pt-BR');
    const dataGeracao = new Date().toLocaleDateString('pt-BR');
    const saldoAtual = this.saldo(sale);
    const isQuitado = sale.status === 'quitado';

    const root = this.div({
      position: 'fixed', left: '-9999px', top: '0', width: '400px',
      backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif',
      fontSize: '14px', color: '#1a1a1a', padding: '16px', boxSizing: 'border-box',
    });
    root.className = 'comprovante-venda-snapshot';

    const header = this.div({ padding: '0 0 12px 0', borderBottom: '2px solid #e0e0e0', marginBottom: '12px' });
    const titulo = document.createElement('strong');
    titulo.textContent = 'Comprovante da Venda';
    titulo.style.cssText = 'display: block; font-size: 17px; margin-bottom: 4px;';
    header.appendChild(titulo);
    header.appendChild(this.span(client.nome, { display: 'block', fontSize: '14px', color: '#444', marginBottom: '2px' }));
    header.appendChild(this.span(`Campanha: ${sale.campaignNome}`, { display: 'block', fontSize: '12px', color: '#666', marginBottom: '2px' }));
    header.appendChild(this.span(`Emitido em ${dataGeracao}`, { fontSize: '12px', color: '#666' }));
    root.appendChild(header);

    root.appendChild(this.sectionLabel('Resumo financeiro'));
    root.appendChild(this.row('Data da venda', this.fmtDate(sale.dataCriacao)));
    root.appendChild(this.row('Total da venda', `R$ ${this.fmt(sale.valorTotal)}`));
    root.appendChild(this.row('Total recebido', `R$ ${this.fmt(sale.valorRecebido ?? 0)}`, { color: '#2e7d32' }));
    root.appendChild(this.row(
      'Saldo restante',
      `R$ ${this.fmt(saldoAtual)}`,
      saldoAtual > 0 ? { color: '#c62828' } : { color: '#2e7d32' },
    ));

    const statusVal = isQuitado
      ? { label: 'Quitado', bg: '#e8f5e9', color: '#2e7d32' }
      : { label: 'Pendente', bg: '#fce4ec', color: '#c62828' };
    const statusRow = this.div({
      display: 'flex', justifyContent: 'space-between', padding: '4px 0',
      borderBottom: '1px solid #e0e0e0', fontSize: '13px', color: '#1a1a1a',
    });
    statusRow.appendChild(this.span('Status'));
    statusRow.appendChild(this.badge(statusVal.label, statusVal.bg, statusVal.color));
    root.appendChild(statusRow);

    if (sale.itens && sale.itens.length > 0) {
      const itensWrap = this.div({ marginTop: '14px' });
      itensWrap.appendChild(this.sectionLabel('Itens da venda'));
      for (const item of sale.itens) {
        itensWrap.appendChild(this.itemRow(item));
      }
      root.appendChild(itensWrap);
    }

    const recs = this.saleRecebimentos(sale);
    if (recs.length > 0) {
      const recsWrap = this.div({ marginTop: '14px' });
      recsWrap.appendChild(this.sectionLabel('Pagamentos recebidos'));
      for (const { r } of recs) {
        recsWrap.appendChild(this.row(
          `${this.fmtDate(r.data)}${r.descricao ? ' — ' + r.descricao : ''}`,
          `R$ ${this.fmt(r.valor)}`,
          { color: '#2e7d32' },
        ));
      }
      root.appendChild(recsWrap);
    }

    root.appendChild(this.footer(`Gerado em ${horaGeracao}`));
    return root;
  }

  // ─── Helpers DOM ──────────────────────────────────────────────────────────

  private div(styles: Partial<CSSStyleDeclaration> = {}): HTMLElement {
    const el = document.createElement('div');
    Object.assign(el.style, styles);
    return el;
  }

  private span(text: string, styles: Partial<CSSStyleDeclaration> = {}): HTMLElement {
    const el = document.createElement('span');
    el.textContent = text;
    Object.assign(el.style, styles);
    return el;
  }

  private row(label: string, value: string, valueStyles: Partial<CSSStyleDeclaration> = {}): HTMLElement {
    const r = this.div({
      display: 'flex', justifyContent: 'space-between', padding: '4px 0',
      borderBottom: '1px solid #e0e0e0', fontSize: '13px', color: '#1a1a1a',
    });
    r.appendChild(this.span(label));
    r.appendChild(this.span(value, { fontWeight: '600', ...valueStyles }));
    return r;
  }

  private itemRow(item: SaleItem): HTMLElement {
    const r = this.div({
      display: 'flex', justifyContent: 'space-between', padding: '4px 0',
      borderBottom: '1px solid #e0e0e0', fontSize: '13px', color: '#1a1a1a',
    });
    const left = this.div({ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: '0', flex: '1' });
    left.appendChild(this.span(item.descricao, { fontWeight: '500' }));
    left.appendChild(this.span(
      `${item.quantidade} × R$ ${this.fmt(item.valorUnitario)}`,
      { fontSize: '11px', color: '#777' },
    ));
    r.appendChild(left);
    r.appendChild(this.span(`R$ ${this.fmt(item.valorSubtotal)}`, { fontWeight: '600' }));
    return r;
  }

  private sectionLabel(text: string, margin = '0 0 6px 0'): HTMLElement {
    const el = this.div({
      fontWeight: '700', fontSize: '11px', color: '#555',
      textTransform: 'uppercase', letterSpacing: '0.4px', margin,
    });
    el.textContent = text;
    return el;
  }

  private badge(text: string, bg: string, color: string): HTMLElement {
    return this.span(text, {
      fontSize: '11px', fontWeight: '600', padding: '2px 8px',
      borderRadius: '10px', backgroundColor: bg, color,
    });
  }

  private footer(text: string): HTMLElement {
    const el = this.div({
      marginTop: '16px', paddingTop: '8px', borderTop: '1px solid #e0e0e0',
      fontSize: '11px', color: '#999', textAlign: 'center',
    });
    el.textContent = text;
    return el;
  }
}
