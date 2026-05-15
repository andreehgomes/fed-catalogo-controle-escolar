# Análise: Status de Pagamento no Entrega Detail

**Data:** 2026-05-15
**Projeto:** fed-catalogo-controle-escolar
**Escopo:** Exibir status de pagamento da venda em `entrega-detail`, com tag condicional, opção de registrar recebimento inline e listagem dos recebimentos feitos durante a entrega.

---

## 1. Contexto

### Estado atual do `entrega-detail`

O componente `entrega-detail` já está implementado com:
- Cabeçalho com dados da venda (cliente, campanha, data) e chip de **status de entrega** (`entregaStatus`)
- Progresso de entrega por item (barra + percentual)
- Ações de entrega total e parcial (formulários inline)
- Histórico de entregas com edição inline, exclusão e geração de comprovante

### O que está ausente

O status de **pagamento** (`sale.status`, `sale.valorRecebido`) não é exibido em nenhum ponto do componente. A venda pode estar pendente ou quitada sem que o entregador tenha essa visibilidade. Além disso, não existe no fluxo de entrega nenhum mecanismo para registrar recebimento ou visualizar recebimentos feitos neste contexto.

### Interfaces relevantes

**`Sale` (`sale.ts`)**:
```typescript
status?: SaleStatus;          // 'pendente' | 'quitado'
valorTotal: number;
valorRecebido?: number;
recebimentos?: { [key: string]: Recebimento };
```

**`Recebimento` (`sale.ts`)**:
```typescript
export interface Recebimento {
  data: string;        // ISO date YYYY-MM-DD
  valor: number;
  descricao: string;
}
```

**`Entrega` (`entrega.ts`)**:
```typescript
export interface Entrega {
  data: string;
  tipo: 'total' | 'parcial';
  itens: EntregaItem[];
  observacao?: string;
}
```

### Problema de vínculo: recebimentos × entrega

`Recebimento` não possui nenhum campo que o vincule a uma `Entrega` específica. Para poder exibir "somente os recebimentos feitos durante a entrega", é necessário introduzir um campo de rastreamento. A abordagem recomendada é adicionar `entregaKey?: string` ao modelo `Recebimento`, preenchido somente quando o recebimento é criado a partir do contexto de `entrega-detail`.

---

## 2. Dados Disponíveis

| Fonte | Campo / Método | Disponível em |
|---|---|---|
| `sale.status` | `'pendente' \| 'quitado'` | `SaleService.getSaleByKey()` |
| `sale.valorTotal` | number | `SaleService.getSaleByKey()` |
| `sale.valorRecebido` | number (opcional) | `SaleService.getSaleByKey()` |
| `sale.recebimentos` | `{ [key]: Recebimento }` | `SaleService.getSaleByKey()` |
| `SaleService.addRecebimento()` | registra pagamento | Já implementado |
| `ComprovanteService.compartilharComprovante()` | gera comprovante de recebimento | Já implementado |

---

## 3. Requisitos Funcionais

**RF-01 — Status de pagamento no cabeçalho**
No card de cabeçalho da venda, exibir o saldo financeiro: valor total, valor recebido e saldo devedor. Esses dados devem ser exibidos sempre, independentemente do status.

**RF-02 — Tag/chip de status de pagamento condicional**
Se `sale.status !== 'quitado'`, exibir um `mat-chip` com o status de pagamento:
- `sale.valorRecebido > 0` → chip **"Pagamento Parcial"** (cor `warn`)
- `sale.valorRecebido` ausente ou `0` → chip **"Não Pago"** (cor `warn`)
- `sale.status === 'quitado'` → chip **"Quitado"** (cor `primary`) — exibido mesmo assim para completude visual

**RF-03 — Opção de registrar recebimento no contexto da entrega**
Se `sale.status !== 'quitado'`, exibir botão **"Registrar Recebimento"** no card de cabeçalho (ao lado ou abaixo dos chips de status). Ao clicar, abrir um formulário inline (padrão já usado para entregas) com:
- Campo **Data** (padrão: data de hoje)
- Campo **Valor** (padrão: saldo devedor; máx: saldo devedor)
- Campo **Descrição** (opcional)
- Botões "Salvar" e "Cancelar"

**RF-04 — Vínculo do recebimento com a entrega**
Ao salvar o recebimento via `entrega-detail`, passar `entregaKey` (chave do Firebase gerada localmente, referenciando `this.saleKey`) no objeto `Recebimento`. Isso requer adicionar `entregaKey?: string` ao modelo `Recebimento` e adaptar `addRecebimento` para aceitar esse campo opcional.

> `entregaKey` neste contexto é o `saleKey` da entrega em andamento — serve como identificador de que aquele recebimento foi registrado no contexto desta tela. Alternativamente, pode ser um UUID gerado em memória para identificar a sessão de entrega, mas `saleKey` é suficiente pois a tela opera sobre uma única venda.

**RF-05 — Seção de recebimentos feitos durante a entrega**
Abaixo do histórico de entregas (ou como subseção), listar apenas os recebimentos onde `recebimento.entregaKey === this.saleKey`. Para cada recebimento exibir: data, valor, descrição (se houver) e botão "Comprovante". Recebimentos sem `entregaKey` (registrados por outras telas) não aparecem aqui.

**RF-06 — Recalcular saldo após novo recebimento**
Após salvar um recebimento inline, recarregar a venda via `recarregarVenda()` (já existe no componente) para atualizar `valorRecebido`, `status` e a listagem.

---

## 4. Requisitos Não Funcionais

**RNF-01 — Desempenho**
Nenhuma chamada adicional ao Firebase é necessária: os dados de recebimento já chegam dentro do objeto `Sale` retornado por `getSaleByKey()`. Recarregar com `recarregarVenda()` após salvar é suficiente.

**RNF-02 — Responsividade**
O chip de status de pagamento e o botão de recebimento devem seguir o layout flex já usado no cabeçalho. No mobile, devem empilhar verticalmente (padrão do template atual).

**RNF-03 — Acessibilidade**
Os `mat-chip` devem ter `aria-label` descritivo (ex: `"Status de pagamento: Não Pago"`). O formulário inline de recebimento deve ter `mat-label` em todos os campos.

**RNF-04 — Manutenibilidade**
Seguir o padrão já estabelecido no componente: formulários via `FormBuilder`, controles individuais para campos simples, `FormGroup` para o formulário de recebimento. Reutilizar `recarregarVenda()` após qualquer mutação.

**RNF-05 — Testabilidade**
A lógica de status de pagamento (getter `statusPagamento`) deve ser um getter puro no componente, facilmente testável com `jasmine`. O filtro de recebimentos por `entregaKey` também deve ser um getter.

**RNF-06 — Segurança**
Nenhum dado sensível novo é exposto. Validação de `Validators.max(saldo)` no campo valor previne pagamento maior que o saldo devedor.

**RNF-07 — Internacionalização**
Não aplicável (projeto em português, sem ngx-translate).

---

## 5. Estrutura de Componentes Proposta

Não são necessários novos componentes. Todas as alterações ocorrem em arquivos existentes:

```
src/app/shared/model/
  └── sale.ts                         ← adicionar entregaKey?: string em Recebimento

src/app/shared/service/sale/
  └── sale.service.ts                 ← addRecebimento já aceita o objeto inteiro,
                                         nenhuma mudança de assinatura necessária

src/app/feature/entrega-detail/
  ├── entrega-detail.component.ts     ← getters + form inline de recebimento
  ├── entrega-detail.component.html   ← chip de pagamento + seção de recebimentos
  └── entrega-detail.component.scss   ← estilos do chip e da seção
```

### Getters a adicionar no componente

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

### Alteração no modelo `Recebimento`

```typescript
export interface Recebimento {
  data: string;
  valor: number;
  descricao: string;
  entregaKey?: string;   // preenchido quando criado via entrega-detail
}
```

---

## 6. Dependências e Pré-condições

| Item | Estado atual | Ação necessária |
|---|---|---|
| `sale.status` e `sale.valorRecebido` | Existem no modelo `Sale` | Nenhuma |
| `SaleService.addRecebimento()` | Implementado | Nenhuma (objeto `Recebimento` já é passado inteiro) |
| `ComprovanteService.compartilharComprovante()` | Implementado | Nenhuma |
| Campo `entregaKey` em `Recebimento` | **Ausente** | Adicionar ao modelo (`sale.ts`) |
| Formulário inline de recebimento | **Ausente** | Criar no componente (padrão existente) |
| Chip de status de pagamento | **Ausente** | Adicionar ao template HTML |
| Estilos de chip de pagamento | **Ausentes** | Adicionar ao SCSS (reusar padrão `status-chip`) |

---

## 7. Critérios de Aceitação

- [ ] O card de cabeçalho em `entrega-detail` exibe `valorTotal`, `valorRecebido` e `saldoDevedor` formatados em BRL
- [ ] Se `sale.status !== 'quitado'`, um chip de pagamento é exibido com label "Não Pago" ou "Pagamento Parcial"
- [ ] Se `sale.status === 'quitado'`, o chip exibe "Quitado" e o botão de recebimento não aparece
- [ ] O botão "Registrar Recebimento" só aparece se `sale.status !== 'quitado'`
- [ ] Ao clicar em "Registrar Recebimento", um formulário inline aparece com data (hoje), valor (saldo devedor), descrição opcional
- [ ] O formulário valida que o valor não excede o saldo devedor
- [ ] Ao salvar, `addRecebimento` é chamado com `entregaKey = this.saleKey` no objeto `Recebimento`
- [ ] Após salvar, `recarregarVenda()` atualiza os dados; chip e saldo refletem o novo estado
- [ ] A seção "Recebimentos desta entrega" lista apenas recebimentos com `recebimento.entregaKey === this.saleKey`
- [ ] Cada recebimento listado exibe: data, valor, descrição e botão "Comprovante"
- [ ] Recebimentos registrados por outras telas (sem `entregaKey`) não aparecem na seção
- [ ] O layout funciona corretamente em mobile (< 600px) e desktop
