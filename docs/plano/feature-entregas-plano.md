# Plano de Desenvolvimento: Feature de Entregas

**Data:** 2026-05-15
**Projeto:** fed-catalogo-controle-escolar
**Análise base:** [docs/analise/feature-entregas.md](../analise/feature-entregas.md)
**Branch alvo:** main

---

## Visão Geral

Adicionar um módulo de controle de entregas de itens das vendas, permitindo visualizar o status de entrega de cada venda, registrar entregas totais ou parciais, e gerar um comprovante de entrega por registro.

---

## Fases de Implementação

### Fase 1 — Modelos de dados

**Objetivo:** Estender os tipos existentes de `sale.ts` com os novos campos de entrega, sem quebrar nenhuma venda existente.

#### Tarefa 1.1 — Criar `src/app/shared/model/entrega.ts`

**Arquivo a criar:** `src/app/shared/model/entrega.ts`

**O que fazer:**

```typescript
export type EntregaStatus = 'pendente' | 'parcial' | 'entregue';

export interface EntregaItem {
  indice: number;
  descricao: string;
  quantidadeEntregue: number;
}

export interface Entrega {
  data: string;           // YYYY-MM-DD
  tipo: 'total' | 'parcial';
  itens: EntregaItem[];
  observacao?: string;
}
```

**Critério:** Arquivo compila sem erros; tipos são importáveis pelos componentes e service.

#### Tarefa 1.2 — Estender interface `Sale` em `sale.ts`

**Arquivo a modificar:** `src/app/shared/model/sale.ts`

**O que fazer:** Adicionar os seguintes campos opcionais à interface `Sale`:

```typescript
entregaStatus?: EntregaStatus;
entregas?: { [key: string]: Entrega };
quantidadesEntregues?: number[];
```

Importar `EntregaStatus` e `Entrega` do arquivo criado na Tarefa 1.1.

> Vendas sem `entregaStatus` devem ser tratadas como `'pendente'` em toda lógica de listagem e filtragem — nunca alterar dados existentes no banco.

**Critério:** Build sem erros; nenhuma venda existente é afetada.

---

### Fase 2 — Rotas

**Objetivo:** Registrar as duas novas rotas de entrega no enum e no roteamento da aplicação.

#### Tarefa 2.1 — Adicionar valores ao `RouterEnum`

**Arquivo a modificar:** `src/app/core/router/router.enum.ts`

**O que fazer:** Adicionar ao enum existente:

```typescript
ENTREGA_LIST = 'entrega-list',
ENTREGA_DETAIL = 'entrega-detail',
```

**Critério:** Enum compila; valores disponíveis para navegação.

#### Tarefa 2.2 — Registrar lazy routes em `app-routing.module.ts`

**Arquivo a modificar:** `src/app/app-routing.module.ts`

**O que fazer:** Adicionar as duas rotas com lazy loading:

```typescript
{ path: 'entrega-list', loadChildren: () => import('./feature/entrega-list/entrega-list.module').then(m => m.EntregaListModule) },
{ path: 'entrega-detail/:saleKey', loadChildren: () => import('./feature/entrega-detail/entrega-detail.module').then(m => m.EntregaDetailModule) },
```

**Critério:** Navegar para `/entrega-list` e `/entrega-detail/qualquer-key` carrega o módulo correto (mesmo que o componente ainda esteja vazio).

---

### Fase 3 — SaleService: método `addEntrega`

**Objetivo:** Persistir uma entrega de forma atômica no Firebase Realtime Database, atualizando os três campos em uma única operação `update`.

#### Tarefa 3.1 — Adicionar `addEntrega` ao `SaleService`

**Arquivo a modificar:** `src/app/shared/service/sale/sale.service.ts`

**O que fazer:** Adicionar o método abaixo:

```typescript
addEntrega(
  saleKey: string,
  entrega: Entrega,
  quantidadesEntregues: number[],
  novoStatus: EntregaStatus
): Promise<void>
```

**Implementação:**
1. Gerar um `novoId` via `push().key` no caminho `sales/${saleKey}/entregas` (ou usar timestamp como fallback).
2. Montar um objeto de update único:
   ```typescript
   {
     [`sales/${saleKey}/entregas/${novoId}`]: entrega,
     [`sales/${saleKey}/quantidadesEntregues`]: quantidadesEntregues,
     [`sales/${saleKey}/entregaStatus`]: novoStatus,
   }
   ```
3. Chamar `update(ref(db, '/'), updateObj)` dentro de `runInInjectionContext`.

**Lógica de cálculo do `novoStatus`:**
- Se `quantidadesEntregues[i] >= sale.itens[i].quantidade` para **todos** os itens → `'entregue'`.
- Caso contrário → `'parcial'`.

> O cálculo do status deve ser feito no componente antes de chamar `addEntrega`, pois o componente já tem a venda carregada em memória.

**Critério:** Chamar `addEntrega` de um teste manual grava os três campos no RTDB atomicamente.

---

### Fase 4 — ComprovanteService: método `compartilharComprovanteEntrega`

**Objetivo:** Gerar e compartilhar um comprovante de entrega seguindo o mesmo padrão do `ComprovanteService` já existente.

#### Tarefa 4.1 — Adicionar `compartilharComprovanteEntrega`

**Arquivo a modificar:** `src/app/shared/service/comprovante/comprovante.service.ts`

**O que fazer:** Criar o método:

```typescript
compartilharComprovanteEntrega(sale: Sale, entrega: Entrega): Promise<void>
```

**Conteúdo do comprovante (HTML off-screen):**
- Título: **Comprovante de Entrega**
- Cliente, campanha, data da entrega, tipo (`Total` / `Parcial`)
- Tabela de itens: descrição + quantidade entregue
- Observação (se houver)
- Linha para assinatura do cliente
- Rodapé com data/hora de geração (`new Date().toLocaleString('pt-BR')`)

**Comportamento:**
- Mobile (`navigator.share` disponível): compartilhar como imagem PNG via `navigator.share`.
- Desktop: abrir PNG em nova aba.
- Seguir exatamente o padrão já usado nos outros métodos do serviço (`html2canvas`, elemento criado e removido do DOM).

**Critério:** Chamar o método em um componente gera o comprovante visualmente correto e o compartilha/abre conforme o dispositivo.

---

### Fase 5 — Feature `entrega-list`

**Objetivo:** Tela de listagem de vendas agrupadas por status de entrega, com abas "Pendentes" e "Entregues".

#### Tarefa 5.1 — Criar os arquivos da feature

**Arquivos a criar:**

```
src/app/feature/entrega-list/
  ├── entrega-list.module.ts
  ├── entrega-list-routing.module.ts
  ├── entrega-list.component.ts
  ├── entrega-list.component.html
  └── entrega-list.component.scss
```

#### Tarefa 5.2 — Implementar `entrega-list.component.ts`

**O que fazer:**
- Carregar todas as vendas via `saleService.getAllSales()` no `ngOnInit`.
- Separar em dois arrays:
  - `pendentes`: `entregaStatus !== 'entregue'` (inclui `undefined`, `null`, `'pendente'`, `'parcial'`).
  - `entregues`: `entregaStatus === 'entregue'`.
- Ao clicar num card, navegar para `entrega-detail/:saleKey`.

#### Tarefa 5.3 — Implementar `entrega-list.component.html`

**O que fazer:**
- `<mat-tab-group>` com duas abas: **Pendentes** e **Entregues**.
- Cada aba renderiza a lista de cards correspondente.
- Cada card exibe:
  - Nome do cliente
  - Nome da campanha
  - Data da venda (`dataCriacao`)
  - `mat-chip` de status: `pendente` (vermelho/cinza), `parcial` (amarelo), `entregue` (verde)
- Loader enquanto carrega.
- Mensagem "Nenhuma venda encontrada" se a lista estiver vazia.

**Critério:** Rota `/entrega-list` exibe as abas com os cards corretos e navega para o detalhe ao clicar.

---

### Fase 6 — Feature `entrega-detail`

**Objetivo:** Tela de detalhe de uma venda com progresso de entrega por item, ações de entrega total/parcial e histórico de entregas com geração de comprovante.

#### Tarefa 6.1 — Criar os arquivos da feature

**Arquivos a criar:**

```
src/app/feature/entrega-detail/
  ├── entrega-detail.module.ts
  ├── entrega-detail-routing.module.ts
  ├── entrega-detail.component.ts
  ├── entrega-detail.component.html
  └── entrega-detail.component.scss
```

#### Tarefa 6.2 — Implementar `entrega-detail.component.ts`

**O que fazer:**

**Carregamento:**
- Ler `saleKey` do `ActivatedRoute.params`.
- Carregar venda via `saleService.getSaleByKey(saleKey)`.

**Getters auxiliares:**

```typescript
get quantidadesEntregues(): number[] {
  // Normalizar do Firebase (objeto com chaves numéricas → array)
  const raw = this.sale?.quantidadesEntregues;
  return raw ? Object.values(raw).map(Number) : this.sale?.itens.map(() => 0) ?? [];
}

get entregasArray(): { key: string; entrega: Entrega }[] {
  const raw = this.sale?.entregas ?? {};
  return Object.entries(raw).map(([key, entrega]) => ({ key, entrega }));
}

saldoRestante(indice: number): number {
  return (this.sale?.itens[indice]?.quantidade ?? 0) - (this.quantidadesEntregues[indice] ?? 0);
}

progressoPct(indice: number): number {
  const total = this.sale?.itens[indice]?.quantidade ?? 0;
  return total > 0 ? Math.round(((this.quantidadesEntregues[indice] ?? 0) / total) * 100) : 0;
}
```

**Ação — Entrega Total:**

```typescript
entregarTotal(): void {
  const quantidades = this.sale!.itens.map(i => i.quantidade);
  const entrega: Entrega = {
    data: new Date().toISOString().split('T')[0],
    tipo: 'total',
    itens: this.sale!.itens.map((item, i) => ({
      indice: i,
      descricao: item.descricao,
      quantidadeEntregue: item.quantidade,
    })),
  };
  this.saleService.addEntrega(this.saleKey, entrega, quantidades, 'entregue')
    .then(() => this.snackBar.open('Entrega registrada!', 'Ok', { duration: 3000 }));
}
```

**Ação — Entrega Parcial:**
- Flag booleana `showFormParcial` controlada pelos botões **Entrega Parcial** / **Cancelar**.
- FormGroup com um `FormControl` por item do array `itens`, validado com `min: 0` e `max: saldoRestante(i)`.
- Ao salvar:
  1. Calcular `novasQuantidades[i] = quantidadesEntregues[i] + controles[i].value`.
  2. Montar objeto `Entrega` com `tipo: 'parcial'` e apenas os itens com `quantidadeEntregue > 0`.
  3. Calcular `novoStatus`: se `novasQuantidades[i] >= itens[i].quantidade` para todos → `'entregue'`, senão `'parcial'`.
  4. Chamar `saleService.addEntrega(...)`.
  5. Fechar formulário + snackbar.

**Ação — Comprovante:**

```typescript
gerarComprovante(entrega: Entrega): void {
  this.comprovanteService.compartilharComprovanteEntrega(this.sale!, entrega);
}
```

#### Tarefa 6.3 — Implementar `entrega-detail.component.html`

**O que fazer:**

**Seção: cabeçalho da venda**
- Cliente, campanha, data.

**Seção: itens com progresso**
- Para cada item: descrição, `qtd entregue / qtd total`, `mat-progress-bar` com `value = progressoPct(i)`.

**Seção: ações (ocultas se `entregaStatus === 'entregue'`)**
- Botão **Entrega Total** — chama `entregarTotal()`.
- Botão **Entrega Parcial** — exibe formulário com input por item.
- Formulário parcial: inputs numéricos (min 0, max saldo) por item + botão Salvar.

**Seção: histórico de entregas**
- Lista `entregasArray` com data, tipo (chip), itens entregues e botão de comprovante.
- Mensagem "Nenhuma entrega registrada ainda." se vazio.

**Critério:** Rota `/entrega-detail/:saleKey` exibe os dados corretos, registra entregas no RTDB e atualiza a UI em tempo real via Observable.

---

### Fase 7 — Menu lateral

**Objetivo:** Expor a funcionalidade de entregas no menu lateral da aplicação.

#### Tarefa 7.1 — Adicionar item ao sidenav

**Arquivo a modificar:** `src/app/app.component.html`

**O que fazer:** Adicionar o item abaixo na seção **Vendas & Clientes** do `<mat-nav-list>`:

```html
<a mat-list-item class="nav-item" (click)="goTo(routes.ENTREGA_LIST); drawer.toggle()">
  <mat-icon matListItemIcon>local_shipping</mat-icon>
  <span matListItemTitle>Entregas</span>
</a>
```

**Critério:** Menu lateral exibe o item "Entregas" e navega corretamente para `/entrega-list`.

---

### Fase 8 — Validação manual

**Objetivo:** Verificar o fluxo completo end-to-end no browser.

#### Tarefa 8.1 — Smoke test

**Checklist:**

1. Abrir `/entrega-list` → aba **Pendentes** exibe vendas sem entrega e com status `parcial`; aba **Entregues** exibe as quitadas.
2. Clicar em uma venda pendente → navega para `/entrega-detail/:saleKey`.
3. Verificar que os itens exibem `0 / qtd_total` e barra de progresso em 0%.
4. Clicar **Entrega Total** → snackbar aparece; RTDB atualiza `entregaStatus = 'entregue'`, `quantidadesEntregues` e `entregas/{id}`; barras de progresso vão a 100%; botões de ação somem.
5. Gerar comprovante de uma entrega → imagem é compartilhada (mobile) ou aberta em nova aba (desktop) com os dados corretos.
6. Voltar para `/entrega-list` → venda passou para aba **Entregues**.
7. Em outra venda com múltiplos itens, usar **Entrega Parcial** → informar quantidade menor que o saldo → salvar → progresso reflete a quantidade parcial; status muda para `parcial`.
8. Repetir entrega parcial até cobrir todos os itens → status muda para `entregue` automaticamente.
9. Confirmar que o menu lateral exibe "Entregas" e que a rota funciona.

**Critério:** Todos os 9 passos passam sem erros no console.

---

## Arquivos a Criar

```
src/app/shared/model/entrega.ts
src/app/feature/entrega-list/
  ├── entrega-list.module.ts
  ├── entrega-list-routing.module.ts
  ├── entrega-list.component.ts
  ├── entrega-list.component.html
  └── entrega-list.component.scss
src/app/feature/entrega-detail/
  ├── entrega-detail.module.ts
  ├── entrega-detail-routing.module.ts
  ├── entrega-detail.component.ts
  ├── entrega-detail.component.html
  └── entrega-detail.component.scss
```

## Arquivos a Modificar

```
src/app/shared/model/sale.ts                               — campos entregaStatus, entregas, quantidadesEntregues
src/app/shared/service/sale/sale.service.ts               — método addEntrega()
src/app/shared/service/comprovante/comprovante.service.ts — método compartilharComprovanteEntrega()
src/app/core/router/router.enum.ts                        — ENTREGA_LIST, ENTREGA_DETAIL
src/app/app-routing.module.ts                             — lazy routes das duas novas features
src/app/app.component.html                                — item "Entregas" no menu lateral
```

---

## Observações Técnicas

- **Normalização do Firebase:** arrays salvos como `number[]` voltam do RTDB como objetos `{ "0": x, "1": y, ... }`. Sempre usar `Object.values(raw).map(Number)` ao ler `quantidadesEntregues` e `entrega.itens` de volta.
- **Cálculo do status no componente:** o `novoStatus` é calculado no componente antes de chamar `addEntrega`, pois a venda já está carregada em memória — evita uma leitura extra do banco.
- **Compatibilidade com dados existentes:** vendas sem `entregaStatus` são exibidas na aba "Pendentes". Nenhum script de migração é necessário.
- **Entrega Parcial — validação de inputs:** o `max` de cada input deve ser recalculado dinamicamente como `saldoRestante(i)` para impedir sobre-entrega.
- **Histórico em tempo real:** usar o Observable do `getSaleByKey` diretamente no template com `async pipe` garante que o histórico e as barras de progresso se atualizam sem reload após cada `addEntrega`.

---

## Ordem de Execução Recomendada

```
Fase 1 (Modelos)
   └─→ Fase 2 (Rotas)
         └─→ Fase 3 (SaleService: addEntrega)
               └─→ Fase 4 (ComprovanteService)
                     ├─→ Fase 5 (entrega-list)
                     └─→ Fase 6 (entrega-detail)
                           └─→ Fase 7 (Menu lateral)
                                 └─→ Fase 8 (Validação manual)
```

Fase 5 e Fase 6 podem ser desenvolvidas em paralelo após Fase 4, pois não se dependem.

---

## Critérios de Aceitação Globais

- [ ] Build (`ng build`) sem erros e sem warnings de TypeScript.
- [ ] `/entrega-list` exibe abas "Pendentes" e "Entregues" com os cards e chips de status corretos.
- [ ] Entrega total registra `entregaStatus = 'entregue'` e `quantidadesEntregues` no RTDB em uma única operação atômica.
- [ ] Entrega parcial registra `entregaStatus = 'parcial'` e acumula corretamente as quantidades entregues.
- [ ] Após a última entrega parcial que cobre todos os itens, o status muda automaticamente para `'entregue'`.
- [ ] Comprovante gerado contém: cliente, campanha, data, tipo, itens entregues, observação (se houver), linha de assinatura e rodapé com data/hora.
- [ ] Vendas sem campo `entregaStatus` aparecem na aba "Pendentes" sem erro.
- [ ] Menu lateral exibe "Entregas" e navega para `/entrega-list`.
