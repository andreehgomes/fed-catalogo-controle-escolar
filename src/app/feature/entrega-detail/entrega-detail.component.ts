import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { SaleService } from 'src/app/shared/service/sale/sale.service';
import { ComprovanteService } from 'src/app/shared/service/comprovante/comprovante.service';
import { LoaderService } from 'src/app/components/loader/loader.service';
import { ConfirmDeleteDialogComponent } from 'src/app/components/confirm-delete-dialog/confirm-delete-dialog.component';
import { Sale, Recebimento } from 'src/app/shared/model/sale';
import { Entrega, EntregaItem } from 'src/app/shared/model/entrega';
import { Client } from 'src/app/shared/model/client';
import { RouterEnum } from 'src/app/core/router/router.enum';

@Component({
  selector: 'app-entrega-detail',
  templateUrl: './entrega-detail.component.html',
  styleUrls: ['./entrega-detail.component.scss'],
  standalone: false,
})
export class EntregaDetailComponent implements OnInit {
  sale: Sale | null = null;
  saleKey = '';
  carregando = true;
  showFormParcial = false;
  showFormTotal = false;
  showFormRecebimento = false;
  editandoRecKey: string | null = null;
  formParcial!: FormGroup;
  formRecebimento!: FormGroup;
  formEditarRec!: FormGroup;
  obsTotalCtrl = new FormControl('');
  editandoKey: string | null = null;
  formEditar!: FormGroup;
  routes = RouterEnum;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private saleService: SaleService,
    private comprovanteService: ComprovanteService,
    private loader: LoaderService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private fireAuth: Auth
  ) {}

  ngOnInit(): void {
    this.saleKey = this.route.snapshot.paramMap.get('saleKey') ?? '';
    if (!this.saleKey) {
      this.router.navigate([RouterEnum.ENTREGA_LIST]);
      return;
    }
    this.loader.openDialog();
    this.saleService.getSaleByKey(this.saleKey).subscribe({
      next: (sale) => {
        this.sale = sale;
        this.carregando = false;
        this.loader.closeDialog();
      },
      error: () => {
        this.carregando = false;
        this.loader.closeDialog();
      },
    });
  }

  get quantidadesEntregues(): number[] {
    const raw = this.sale?.quantidadesEntregues;
    return raw
      ? Object.values(raw as unknown as { [k: string]: number }).map(Number)
      : this.sale?.itens.map(() => 0) ?? [];
  }

  get entregasArray(): { key: string; entrega: Entrega }[] {
    const raw = this.sale?.entregas ?? {};
    return Object.entries(raw).map(([key, entrega]) => ({ key, entrega }));
  }

  get statusPagamento(): 'nao-pago' | 'parcial' | 'quitado' {
    if (this.sale?.status === 'quitado') return 'quitado';
    if ((this.sale?.valorRecebido ?? 0) > 0) return 'parcial';
    return 'nao-pago';
  }

  get saldoDevedor(): number {
    return (this.sale?.valorTotal ?? 0) - (this.sale?.valorRecebido ?? 0);
  }

  get recebimentosDaEntrega(): { key: string; r: Recebimento }[] {
    const recs = this.sale?.recebimentos ?? {};
    return Object.entries(recs)
      .filter(([, r]) => r.entregaKey === this.saleKey)
      .map(([key, r]) => ({ key, r }));
  }

  saldoRestante(indice: number): number {
    return (this.sale?.itens[indice]?.quantidade ?? 0) - (this.quantidadesEntregues[indice] ?? 0);
  }

  progressoPct(indice: number): number {
    const total = this.sale?.itens[indice]?.quantidade ?? 0;
    return total > 0
      ? Math.min(100, Math.round(((this.quantidadesEntregues[indice] ?? 0) / total) * 100))
      : 0;
  }

  fmtDate(iso: string): string {
    const normalized = iso?.length <= 10 ? iso + 'T00:00:00' : iso;
    return new Date(normalized).toLocaleDateString('pt-BR');
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByEntregaKey(_: number, item: { key: string }): string {
    return item.key;
  }

  trackByRecebimentoKey(_: number, item: { key: string }): string {
    return item.key;
  }

  // ─── Entrega Total ────────────────────────────────────────────────────────

  abrirFormTotal(): void {
    this.showFormTotal = true;
    this.showFormParcial = false;
    this.editandoKey = null;
  }

  cancelarTotal(): void {
    this.showFormTotal = false;
    this.obsTotalCtrl.setValue('');
  }

  entregarTotal(): void {
    if (!this.sale) return;
    const quantidades = this.sale.itens.map((i) => i.quantidade);
    const entrega: Entrega = {
      data: new Date().toISOString().split('T')[0],
      tipo: 'total',
      itens: this.sale.itens
        .map((item, i) => ({
          indice: i,
          descricao: item.descricao,
          quantidadeEntregue: this.saldoRestante(i),
        }))
        .filter((item) => item.quantidadeEntregue > 0),
      ...(this.obsTotalCtrl.value ? { observacao: this.obsTotalCtrl.value } : {}),
    };
    this.loader.openDialog();
    this.saleService
      .addEntrega(this.saleKey, entrega, quantidades, 'entregue')
      .then(() => {
        this.obsTotalCtrl.setValue('');
        this.showFormTotal = false;
        this.snackBar.open('Entrega total registrada!', 'Ok', {
          duration: 3000,
          panelClass: ['snack-sucesso'],
          verticalPosition: 'top',
        });
        this.recarregarVenda();
      })
      .catch(() => this.loader.closeDialog());
  }

  // ─── Entrega Parcial ──────────────────────────────────────────────────────

  abrirFormParcial(): void {
    if (!this.sale) return;
    const controles = this.sale.itens.map((_, i) =>
      this.fb.control(0, [Validators.min(0), Validators.max(this.saldoRestante(i))])
    );
    this.formParcial = this.fb.group({
      quantidades: this.fb.array(controles),
      observacao: [''],
    });
    this.showFormParcial = true;
    this.showFormTotal = false;
    this.editandoKey = null;
  }

  cancelarParcial(): void {
    this.showFormParcial = false;
  }

  get quantidadesControles(): FormArray {
    return this.formParcial.get('quantidades') as FormArray;
  }

  salvarParcial(): void {
    if (!this.sale || this.formParcial.invalid) return;

    const qtdsForm: number[] = this.quantidadesControles.value.map(Number);
    const algumaMaiorQueZero = qtdsForm.some((q) => q > 0);
    if (!algumaMaiorQueZero) {
      this.snackBar.open('Informe pelo menos uma quantidade maior que zero.', 'Ok', { duration: 3000 });
      return;
    }

    const novasQuantidades = this.quantidadesEntregues.map(
      (atual, i) => atual + (qtdsForm[i] ?? 0)
    );

    const itensParcial: EntregaItem[] = this.sale.itens
      .map((item, i) => ({ indice: i, descricao: item.descricao, quantidadeEntregue: qtdsForm[i] ?? 0 }))
      .filter((item) => item.quantidadeEntregue > 0);

    const obs: string = this.formParcial.get('observacao')?.value?.trim() ?? '';
    const entrega: Entrega = {
      data: new Date().toISOString().split('T')[0],
      tipo: 'parcial',
      itens: itensParcial,
      ...(obs ? { observacao: obs } : {}),
    };

    const todasEntregues = this.sale.itens.every(
      (item, i) => novasQuantidades[i] >= item.quantidade
    );
    const novoStatus = todasEntregues ? 'entregue' : 'parcial';

    this.loader.openDialog();
    this.saleService
      .addEntrega(this.saleKey, entrega, novasQuantidades, novoStatus)
      .then(() => {
        this.showFormParcial = false;
        this.snackBar.open(
          todasEntregues ? 'Entrega total concluída!' : 'Entrega parcial registrada!',
          'Ok',
          { duration: 3000, panelClass: ['snack-sucesso'], verticalPosition: 'top' }
        );
        this.recarregarVenda();
      })
      .catch(() => this.loader.closeDialog());
  }

  // ─── Editar entrega existente ─────────────────────────────────────────────

  private getItensNormalizados(entrega: Entrega): EntregaItem[] {
    if (!entrega.itens) return [];
    return Object.values(entrega.itens as unknown as { [k: string]: EntregaItem });
  }

  private qtdNaEntrega(entrega: Entrega, indice: number): number {
    return this.getItensNormalizados(entrega).find((it) => it.indice === indice)?.quantidadeEntregue ?? 0;
  }

  maxParaEditar(entregaAtual: Entrega, indice: number): number {
    return this.saldoRestante(indice) + this.qtdNaEntrega(entregaAtual, indice);
  }

  excluirEntrega(key: string, entrega: Entrega): void {
    if (!this.sale) return;
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { titulo: 'Excluir entrega', mensagem: 'Deseja excluir este registro de entrega? Esta ação não pode ser desfeita.' },
    });
    ref.afterClosed().subscribe((confirmado) => {
      if (!confirmado || !this.sale) return;
      const novasQuantidades = this.quantidadesEntregues.map(
        (atual, i) => Math.max(0, atual - this.qtdNaEntrega(entrega, i))
      );
      const todasEntregues = this.sale.itens.every((item, i) => novasQuantidades[i] >= item.quantidade);
      const algumEntregue = novasQuantidades.some((q) => q > 0);
      const novoStatus = todasEntregues ? 'entregue' : algumEntregue ? 'parcial' : 'pendente';
      this.loader.openDialog();
      this.saleService
        .deleteEntrega(this.saleKey, key, novasQuantidades, novoStatus as 'pendente' | 'parcial' | 'entregue')
        .then(() => {
          this.snackBar.open('Entrega excluída.', 'Ok', { duration: 3000, verticalPosition: 'top' });
          this.recarregarVenda();
        })
        .catch(() => this.loader.closeDialog());
    });
  }

  abrirEditar(key: string, entrega: Entrega): void {
    if (!this.sale) return;
    const controles = this.sale.itens.map((_, i) =>
      this.fb.control(this.qtdNaEntrega(entrega, i), [
        Validators.min(0),
        Validators.max(this.maxParaEditar(entrega, i)),
      ])
    );
    this.formEditar = this.fb.group({
      quantidades: this.fb.array(controles),
      observacao: [entrega.observacao ?? ''],
    });
    this.editandoKey = key;
    this.showFormParcial = false;
  }

  cancelarEditar(): void {
    this.editandoKey = null;
  }

  get quantidadesEditarControles(): FormArray {
    return this.formEditar.get('quantidades') as FormArray;
  }

  salvarEditar(entregaOriginal: Entrega): void {
    if (!this.sale || this.formEditar.invalid || !this.editandoKey) return;

    const qtdsForm: number[] = this.quantidadesEditarControles.value.map(Number);

    // Recalcula quantidadesEntregues removendo a contribuição original e somando a nova
    const novasQuantidades = this.quantidadesEntregues.map((atual, i) => {
      const antigo = this.qtdNaEntrega(entregaOriginal, i);
      return atual - antigo + (qtdsForm[i] ?? 0);
    });

    // Impede ultrapassar o total de cada item
    const ultrapassou = this.sale.itens.some((item, i) => novasQuantidades[i] > item.quantidade);
    if (ultrapassou) {
      this.snackBar.open('Quantidade não pode ultrapassar o total do item.', 'Ok', { duration: 3000 });
      return;
    }

    const itensEditados: EntregaItem[] = this.sale.itens
      .map((item, i) => ({ indice: i, descricao: item.descricao, quantidadeEntregue: qtdsForm[i] ?? 0 }))
      .filter((item) => item.quantidadeEntregue > 0);

    const obs: string = this.formEditar.get('observacao')?.value?.trim() ?? '';
    const entregaEditada: Entrega = {
      ...entregaOriginal,
      itens: itensEditados,
      ...(obs ? { observacao: obs } : { observacao: undefined }),
    };

    const todasEntregues = this.sale.itens.every((item, i) => novasQuantidades[i] >= item.quantidade);
    const algumEntregue = novasQuantidades.some((q, i) => q > 0);
    const novoStatus = todasEntregues ? 'entregue' : algumEntregue ? 'parcial' : 'pendente';

    this.loader.openDialog();
    this.saleService
      .updateEntrega(this.saleKey, this.editandoKey, entregaEditada, novasQuantidades, novoStatus as 'pendente' | 'parcial' | 'entregue')
      .then(() => {
        this.editandoKey = null;
        this.snackBar.open('Entrega atualizada!', 'Ok', {
          duration: 3000,
          panelClass: ['snack-sucesso'],
          verticalPosition: 'top',
        });
        this.recarregarVenda();
      })
      .catch(() => this.loader.closeDialog());
  }

  // ─── Recebimento ─────────────────────────────────────────────────────────

  abrirFormRecebimento(): void {
    this.formRecebimento = this.fb.group({
      data: [new Date().toISOString().split('T')[0], Validators.required],
      valor: [this.saldoDevedor, [Validators.required, Validators.min(0.01), Validators.max(this.saldoDevedor)]],
      descricao: [''],
    });
    this.showFormRecebimento = true;
    this.showFormTotal = false;
    this.showFormParcial = false;
    this.editandoKey = null;
  }

  cancelarRecebimento(): void {
    this.showFormRecebimento = false;
  }

  salvarRecebimento(): void {
    if (!this.sale || this.formRecebimento.invalid) return;
    const { data, valor, descricao } = this.formRecebimento.value;
    const recebimento: Recebimento = {
      data,
      valor: Number(valor),
      descricao: descricao?.trim() ?? '',
      entregaKey: this.saleKey,
    };
    const novoValorRecebido = (this.sale.valorRecebido ?? 0) + recebimento.valor;
    const quitar = novoValorRecebido >= this.sale.valorTotal;
    this.loader.openDialog();
    this.saleService
      .addRecebimento(this.saleKey, recebimento, novoValorRecebido, quitar)
      .then(() => {
        this.showFormRecebimento = false;
        this.snackBar.open('Recebimento registrado!', 'Ok', {
          duration: 3000,
          panelClass: ['snack-sucesso'],
          verticalPosition: 'top',
        });
        this.recarregarVenda();
      })
      .catch(() => this.loader.closeDialog());
  }

  gerarComprovanteRecebimento(recKey: string, rec: Recebimento): void {
    if (!this.sale) return;
    const client: Client = { key: this.sale.clienteKey, nome: this.sale.clienteNome };
    this.comprovanteService.compartilharComprovante(client, this.sale, recKey, rec).subscribe({
      error: (err) => console.error('Erro ao gerar comprovante:', err),
    });
  }

  abrirEditarRec(key: string, rec: Recebimento): void {
    const maxValor = this.saldoDevedor + rec.valor;
    this.formEditarRec = this.fb.group({
      data: [rec.data, Validators.required],
      valor: [rec.valor, [Validators.required, Validators.min(0.01), Validators.max(maxValor)]],
      descricao: [rec.descricao ?? ''],
    });
    this.editandoRecKey = key;
    this.showFormRecebimento = false;
  }

  cancelarEditarRec(): void {
    this.editandoRecKey = null;
  }

  salvarEditarRec(recKey: string, recOriginal: Recebimento): void {
    if (!this.sale || this.formEditarRec.invalid) return;
    const { data, valor, descricao } = this.formEditarRec.value;
    const recebimento: Recebimento = {
      data,
      valor: Number(valor),
      descricao: descricao?.trim() ?? '',
      entregaKey: recOriginal.entregaKey,
    };
    this.loader.openDialog();
    this.saleService
      .updateRecebimento(this.saleKey, recKey, recebimento, this.sale.recebimentos ?? {}, this.sale.valorTotal)
      .then(() => {
        this.editandoRecKey = null;
        this.snackBar.open('Recebimento atualizado!', 'Ok', {
          duration: 3000,
          panelClass: ['snack-sucesso'],
          verticalPosition: 'top',
        });
        this.recarregarVenda();
      })
      .catch(() => this.loader.closeDialog());
  }

  excluirRecebimento(recKey: string): void {
    if (!this.sale?.recebimentos) return;
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { titulo: 'Excluir recebimento', mensagem: 'Deseja excluir este recebimento? Esta ação não pode ser desfeita.' },
    });
    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado || !this.sale?.recebimentos) return;
      const rec = this.sale.recebimentos[recKey];
      const remaining = Object.entries(this.sale.recebimentos)
        .filter(([k]) => k !== recKey)
        .reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {} as { [key: string]: Recebimento });
      const logEntry = {
        dataHora: new Date().toISOString(),
        clienteNome: this.sale.clienteNome,
        valor: rec?.valor ?? 0,
        email: this.fireAuth.currentUser?.email ?? '',
        saleKey: this.saleKey,
        recKey,
      };
      this.loader.openDialog();
      this.saleService
        .deleteRecebimento(this.saleKey, recKey, remaining, this.sale.valorTotal, logEntry)
        .then(() => {
          this.snackBar.open('Recebimento excluído.', 'Ok', { duration: 3000, verticalPosition: 'top' });
          this.recarregarVenda();
        })
        .catch(() => this.loader.closeDialog());
    });
  }

  // ─── Comprovante ──────────────────────────────────────────────────────────

  gerarComprovante(entrega: Entrega): void {
    if (!this.sale) return;
    this.comprovanteService.compartilharComprovanteEntrega(this.sale, entrega).subscribe({
      error: (err) => console.error('Erro ao gerar comprovante:', err),
    });
  }

  private recarregarVenda(): void {
    this.saleService.getSaleByKey(this.saleKey).subscribe({
      next: (sale) => {
        this.sale = sale;
        this.loader.closeDialog();
      },
      error: () => this.loader.closeDialog(),
    });
  }
}
