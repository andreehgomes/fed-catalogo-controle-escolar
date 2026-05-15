# Análise — Feature de Entregas

## Objetivo

Adicionar um módulo de controle de entregas de itens das vendas, permitindo:
- Listar todas as vendas com status de entrega
- Registrar entrega total ou parcial por venda
- Gerar comprovante para cada entrega registrada

---

## Modelo de dados

### Novos tipos em `sale.ts`

```typescript
export type EntregaStatus = 'pendente' | 'parcial' | 'entregue';

export interface EntregaItem {
  indice: number;         // posição do item no array sale.itens
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

### Campos adicionados à interface `Sale`

```typescript
entregaStatus?: EntregaStatus;
entregas?: { [key: string]: Entrega };
quantidadesEntregues?: number[];  // total acumulado por índice de item
```

> Vendas existentes sem `entregaStatus` são tratadas como `'pendente'` na listagem.

---

## Rotas novas

| Rota                        | Enum                  | Descrição                            |
|-----------------------------|-----------------------|--------------------------------------|
| `entrega-list`              | `ENTREGA_LIST`        | Listagem de vendas por entrega       |
| `entrega-detail/:saleKey`   | `ENTREGA_DETAIL`      | Detalhe + ações de entrega           |

---

## Componentes / Módulos

### `entrega-list`

- Carrega todas as vendas via `getAllSales()` e filtra no client
- **Aba "Pendentes"**: `entregaStatus !== 'entregue'` (inclui null/undefined/'parcial')
- **Aba "Entregues"**: `entregaStatus === 'entregue'`
- Cada card mostra: cliente, campanha, data, chip de status
- Clique navega para `entrega-detail/:saleKey`

### `entrega-detail`

- Carrega venda pelo `saleKey` via `getSaleByKey()`
- Exibe:
  - Dados da venda (cliente, campanha, data)
  - Itens com progresso de entrega (`qtd entregue / qtd total` + barra de progresso)
  - Botão **Entrega Total** — marca todos os itens como entregues
  - Botão **Entrega Parcial** — abre formulário com input por item (min: 0, max: saldo restante)
  - Histórico de entregas com botão de comprovante por registro

---

## Serviço — `SaleService`

### Novo método `addEntrega`

```typescript
addEntrega(
  saleKey: string,
  entrega: Entrega,
  quantidadesEntregues: number[],
  novoStatus: EntregaStatus
): Promise<void>
```

Atualiza atomicamente via Firebase `update()`:
- `sales/{saleKey}/entregas/{novoId}` = registro da entrega
- `sales/{saleKey}/quantidadesEntregues` = totais acumulados por item
- `sales/{saleKey}/entregaStatus` = novo status calculado

---

## Comprovante

Segue o padrão do `ComprovanteService` existente:
- Novo método `compartilharComprovanteEntrega(sale, entrega)` adicionado ao serviço
- Gera elemento DOM off-screen com os dados da entrega
- Captura com `html2canvas` → imagem PNG
- Mobile: `navigator.share()` | Desktop: abre em nova aba

### Conteúdo do comprovante

- Título: **Comprovante de Entrega**
- Cliente, campanha, data da entrega, tipo (Total / Parcial)
- Tabela de itens: descrição + quantidade entregue
- Observação (se houver)
- Linha para assinatura do cliente
- Rodapé com data/hora de geração

---

## Menu lateral (`app.component.html`)

Novo item na seção **Vendas & Clientes**:

```html
<a mat-list-item class="nav-item" (click)="goTo(routes.ENTREGA_LIST); drawer.toggle()">
  <mat-icon matListItemIcon>local_shipping</mat-icon>
  <span matListItemTitle>Entregas</span>
</a>
```

---

## Arquivos a criar

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

## Arquivos a modificar

```
src/app/shared/model/sale.ts              — adicionar campos entregaStatus, entregas, quantidadesEntregues
src/app/shared/service/sale/sale.service.ts — adicionar addEntrega()
src/app/shared/service/comprovante/comprovante.service.ts — adicionar compartilharComprovanteEntrega()
src/app/core/router/router.enum.ts        — ENTREGA_LIST, ENTREGA_DETAIL
src/app/app-routing.module.ts             — lazy routes
src/app/app.component.html                — item no menu
```

---

## Observações técnicas

- Firebase Realtime Database armazena arrays como objetos com chaves numéricas. Ao ler `quantidadesEntregues` e `entrega.itens` de volta, o componente usa `Object.values()` ou acesso por índice como string para normalizar.
- O cálculo de `entregaStatus` é feito no momento do save: se a soma de `quantidadesEntregues[i]` igualar `sale.itens[i].quantidade` para todos os itens, o status é `'entregue'`; caso contrário, `'parcial'`.
- Vendas sem nenhum campo de entrega são tratadas como `entregaStatus = 'pendente'` (compatibilidade com dados existentes).
