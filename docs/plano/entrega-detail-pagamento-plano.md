# Plano de Desenvolvimento: Status de Pagamento no Entrega Detail

**Data:** 2026-05-15
**Projeto:** fed-catalogo-controle-escolar
**Análise base:** [docs/analise/entrega-detail-pagamento-analise.md](../analise/entrega-detail-pagamento-analise.md)
**Branch alvo:** feature/entregas

---

## Visão Geral

A tela `entrega-detail` exibe o acompanhamento de entregas de uma venda, mas não expõe nenhuma informação financeira. O objetivo desta feature é adicionar ao card de cabeçalho: o saldo financeiro da venda (total, recebido, saldo devedor), um chip de status de pagamento condicional e um formulário inline para registrar recebimentos diretamente neste contexto.

Além disso, será adicionada uma seção "Recebimentos desta entrega" que lista apenas os pagamentos registrados por esta tela, vinculados pelo campo `entregaKey` (novo campo opcional no modelo `Recebimento`). Todos os dados já chegam dentro do objeto `Sale` retornado por `getSaleByKey()` — não há novas chamadas ao Firebase.

O comprovante de recebimento será gerado pela chamada existente `compartilharComprovante(client, sale, recKey, rec)`, sintetizando o objeto `Client` a partir dos dados da venda (`sale.clienteKey` + `sale.clienteNome`), sem necessidade de alteração no serviço.

---

## Convenções Obrigatórias

Seguir o padrão já estabelecido no componente:

- Componente `standalone: false` — não converter para standalone
- Injeção via **constructor** (não usar `inject()`)
- Sem `OnPush` — o componente usa a estratégia padrão
- Formulários via `FormBuilder` (`this.fb.group / this.fb.control`)
- Após qualquer mutação, chamar `this.recarregarVenda()` para recarregar o estado
- Getters puros para lógica derivada de `this.sale`
- `trackBy` em todos os `*ngFor`
- Chips com `[ngClass]` + classe CSS com `::ng-deep` para overrides do MDC
- Feedback via `MatSnackBar` no padrão já usado

---

## Fases de Implementação

### Fase 1 — Modelo

**Objetivo:** Adicionar o campo de vínculo `entregaKey` ao modelo `Recebimento`, sem breaking change (campo opcional).

#### Tarefa 1.1 — Adicionar `entregaKey` à interface `Recebimento`

**Arquivo a modificar:** `src/app/shared/model/sale.ts`

**O que fazer:**

```typescript
export interface Recebimento {
  data: string;
  valor: number;
  descricao: string;
  entregaKey?: string;   // preenchido quando criado via entrega-detail
}
```

**Critério:** TypeScript compila sem erros; todos os usos existentes de `Recebimento` continuam funcionando (campo é opcional).

---

### Fase 2 — Componente TypeScript

**Objetivo:** Adicionar getters derivados, estado do formulário de recebimento e os métodos de ação.

#### Tarefa 2.1 — Adicionar getters derivados

**Arquivo a modificar:** `src/app/feature/entrega-detail/entrega-detail.component.ts`

**O que fazer:** Adicionar após os getters existentes (`quantidadesEntregues`, `entregasArray`):

```typescript
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
```

Adicionar `Recebimento` aos imports do modelo no topo do arquivo.

**Critério:** Os três getters existem e retornam os tipos corretos; o TypeScript não reclama do `Recebimento` importado.

---

#### Tarefa 2.2 — Adicionar estado e FormGroup do formulário de recebimento

**Arquivo a modificar:** `src/app/feature/entrega-detail/entrega-detail.component.ts`

**O que fazer:** Adicionar ao bloco de propriedades da classe (junto com `showFormTotal`, `showFormParcial`):

```typescript
showFormRecebimento = false;
formRecebimento!: FormGroup;
```

**Critério:** As propriedades existem e são inicializadas no estado fechado.

---

#### Tarefa 2.3 — Adicionar métodos de recebimento

**Arquivo a modificar:** `src/app/feature/entrega-detail/entrega-detail.component.ts`

**O que fazer:** Adicionar uma nova seção `// ─── Recebimento ─────────────────────────────────────────────────────────` com os métodos abaixo:

```typescript
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
```

Adicionar `import { Client } from 'src/app/shared/model/client';` no topo do arquivo.

**Critério:** Os quatro métodos existem; o TypeScript compila sem erros; `addRecebimento` é chamado com `entregaKey` preenchido.

---

### Fase 3 — Template HTML

**Objetivo:** Exibir saldo financeiro, chip de pagamento, formulário inline e seção de recebimentos da entrega.

#### Tarefa 3.1 — Saldo financeiro e chip de pagamento no cabeçalho

**Arquivo a modificar:** `src/app/feature/entrega-detail/entrega-detail.component.html`

**O que fazer:** Dentro do card de cabeçalho (`.section-card` que contém `.cliente-nome`), adicionar após o chip de entrega existente:

```html
<!-- Saldo financeiro -->
<div class="saldo-financeiro">
  <span>Total: <strong>{{ sale.valorTotal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong></span>
  <span>Recebido: <strong class="valor-recebido">{{ (sale.valorRecebido ?? 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong></span>
  <span *ngIf="statusPagamento !== 'quitado'">
    Saldo: <strong class="valor-saldo">{{ saldoDevedor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
  </span>
</div>

<!-- Chip de status de pagamento -->
<mat-chip
  [ngClass]="'pagamento-chip pagamento-chip--' + statusPagamento"
  [attr.aria-label]="'Status de pagamento: ' + (statusPagamento === 'quitado' ? 'Quitado' : statusPagamento === 'parcial' ? 'Pagamento Parcial' : 'Não Pago')"
>
  {{ statusPagamento === 'quitado' ? 'Quitado' : statusPagamento === 'parcial' ? 'Pagamento Parcial' : 'Não Pago' }}
</mat-chip>

<!-- Botão registrar recebimento -->
<button
  *ngIf="statusPagamento !== 'quitado' && !showFormRecebimento"
  mat-stroked-button
  color="accent"
  class="btn-recebimento"
  (click)="abrirFormRecebimento()"
>
  <mat-icon>payments</mat-icon> Registrar Recebimento
</button>

<!-- Formulário inline de recebimento -->
<form *ngIf="showFormRecebimento" [formGroup]="formRecebimento" (ngSubmit)="salvarRecebimento()" class="form-recebimento">
  <mat-form-field appearance="outline">
    <mat-label>Data</mat-label>
    <input matInput type="date" formControlName="data" />
  </mat-form-field>
  <mat-form-field appearance="outline">
    <mat-label>Valor (R$)</mat-label>
    <input matInput type="number" formControlName="valor" min="0.01" [max]="saldoDevedor" step="0.01" />
    <mat-error *ngIf="formRecebimento.get('valor')?.hasError('max')">Máximo: {{ saldoDevedor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</mat-error>
    <mat-error *ngIf="formRecebimento.get('valor')?.hasError('min')">Valor deve ser maior que zero</mat-error>
  </mat-form-field>
  <mat-form-field appearance="outline" class="obs-field">
    <mat-label>Descrição (opcional)</mat-label>
    <input matInput formControlName="descricao" />
  </mat-form-field>
  <div class="form-acoes">
    <button mat-flat-button color="primary" type="submit" [disabled]="formRecebimento.invalid">Salvar</button>
    <button mat-button type="button" (click)="cancelarRecebimento()">Cancelar</button>
  </div>
</form>
```

**Critério:** O saldo aparece formatado em BRL; o chip exibe a cor e label corretos conforme `statusPagamento`; o botão e o formulário aparecem/somem corretamente.

---

#### Tarefa 3.2 — Seção "Recebimentos desta entrega"

**Arquivo a modificar:** `src/app/feature/entrega-detail/entrega-detail.component.html`

**O que fazer:** Adicionar um novo `mat-card` após o card de histórico de entregas:

```html
<!-- Recebimentos desta entrega -->
<mat-card class="section-card" *ngIf="recebimentosDaEntrega.length > 0">
  <mat-card-header>
    <mat-card-title>Recebimentos desta entrega</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div
      *ngFor="let item of recebimentosDaEntrega; trackBy: trackByRecebimentoKey"
      class="recebimento-item"
    >
      <div class="recebimento-header">
        <span class="recebimento-data">{{ fmtDate(item.r.data) }}</span>
        <span class="recebimento-valor">{{ item.r.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
      </div>
      <p *ngIf="item.r.descricao" class="historico-obs">{{ item.r.descricao }}</p>
      <div class="historico-acoes">
        <button mat-stroked-button color="primary" (click)="gerarComprovanteRecebimento(item.key, item.r)">
          <mat-icon>receipt</mat-icon> Comprovante
        </button>
      </div>
    </div>
  </mat-card-content>
</mat-card>
```

Adicionar também o `trackBy` correspondente no componente TypeScript (junto com os outros `trackBy`):

```typescript
trackByRecebimentoKey(_: number, item: { key: string }): string {
  return item.key;
}
```

**Critério:** A seção aparece somente quando há recebimentos com `entregaKey === this.saleKey`; recebimentos de outras telas não aparecem; o comprovante é gerado ao clicar.

---

### Fase 4 — Estilos SCSS

**Objetivo:** Adicionar os estilos para o chip de pagamento, saldo financeiro, botão de recebimento e itens de recebimento.

#### Tarefa 4.1 — Estilos do chip de pagamento e saldo

**Arquivo a modificar:** `src/app/feature/entrega-detail/entrega-detail.component.scss`

**O que fazer:** Adicionar ao final do arquivo:

```scss
// ─── Pagamento ──────────────────────────────────────────────────────────────

.saldo-financeiro {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #555;
  margin: 8px 0;
}

.valor-recebido {
  color: #2e7d32;
}

.valor-saldo {
  color: #c62828;
}

.pagamento-chip {
  font-size: 12px;
  margin-top: 4px;
}

::ng-deep .pagamento-chip--nao-pago {
  background-color: #fce4ec !important;
  .mdc-evolution-chip__text-label { color: #c62828 !important; }
}

::ng-deep .pagamento-chip--parcial {
  background-color: #fff3e0 !important;
  .mdc-evolution-chip__text-label { color: #c04000 !important; }
}

::ng-deep .pagamento-chip--quitado {
  background-color: #e8f5e9 !important;
  .mdc-evolution-chip__text-label { color: #2e7d32 !important; }
}

.btn-recebimento {
  margin-top: 8px;
}

.form-recebimento {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 12px;

  mat-form-field {
    width: 100%;
  }
}

// ─── Recebimentos da entrega ─────────────────────────────────────────────────

.recebimento-item {
  padding: 12px 0;
  border-bottom: 1px solid #e0e0e0;

  &:last-child {
    border-bottom: none;
  }
}

.recebimento-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.recebimento-data {
  font-weight: 500;
  font-size: 14px;
}

.recebimento-valor {
  font-weight: 600;
  font-size: 14px;
  color: #2e7d32;
}
```

**Critério:** Os chips de pagamento exibem as cores corretas; o saldo devedor aparece em vermelho; o valor recebido em verde; a seção de recebimentos tem layout consistente com o histórico de entregas.

---

## Estrutura Final de Arquivos

```
src/app/shared/model/
  └── sale.ts                              ← Fase 1 — adiciona entregaKey?: string

src/app/feature/entrega-detail/
  ├── entrega-detail.component.ts          ← Fase 2 — getters, estado, métodos
  ├── entrega-detail.component.html        ← Fase 3 — chip, saldo, form, seção
  └── entrega-detail.component.scss        ← Fase 4 — estilos de pagamento
```

---

## Ordem de Execução Recomendada

```
Fase 1 (modelo)
    └── Fase 2.1 (getters)
            └── Fase 2.2 (estado do form)
                    └── Fase 2.3 (métodos)
                            ├── Fase 3.1 (cabeçalho HTML)
                            ├── Fase 3.2 (seção recebimentos HTML)
                            └── Fase 4.1 (estilos SCSS)
```

Cada fase depende da anterior. As tarefas 3.1, 3.2 e 4.1 podem ser feitas em paralelo após a Fase 2 concluída.

---

## Critérios de Aceitação Globais

- [ ] O card de cabeçalho exibe `valorTotal`, `valorRecebido` e `saldoDevedor` formatados em BRL
- [ ] Se `sale.status !== 'quitado'`, o chip de pagamento exibe "Não Pago" (vermelho) ou "Pagamento Parcial" (laranja)
- [ ] Se `sale.status === 'quitado'`, o chip exibe "Quitado" (verde)
- [ ] O botão "Registrar Recebimento" aparece somente quando `statusPagamento !== 'quitado'`
- [ ] Ao clicar no botão, o formulário inline abre com data de hoje e valor = saldo devedor
- [ ] O campo valor valida que não excede o saldo devedor (`Validators.max`)
- [ ] Ao salvar, `addRecebimento` é chamado com `entregaKey = this.saleKey` no objeto `Recebimento`
- [ ] Após salvar, `recarregarVenda()` é chamado e chip + saldo refletem o novo estado
- [ ] A seção "Recebimentos desta entrega" aparece somente quando há ao menos um recebimento com `entregaKey === this.saleKey`
- [ ] Cada recebimento listado exibe data, valor e botão "Comprovante"
- [ ] Recebimentos de outras telas (sem `entregaKey` ou com `entregaKey` diferente) não aparecem na seção
- [ ] O botão "Comprovante" gera o comprovante via `compartilharComprovante` com o client sintetizado da venda
- [ ] O layout funciona em mobile (< 600px) e desktop sem quebra de layout
