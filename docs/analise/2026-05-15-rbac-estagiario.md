# Análise: Controle de Acesso por Perfil (RBAC) — Perfil Estagiário

**Data:** 2026-05-15
**Branch:** feature/entregas

---

## Objetivo

Restringir o acesso do perfil `estagiario` para que ele veja e acesse apenas **Entregas** (menu e feed). Os perfis `admin` e `master` continuam com acesso total.

---

## Situação Atual

O sistema já persiste o campo `perfil` no Firebase Realtime Database e o carrega no `AppComponent` via `AccountService.getAccountByUidKey`. Porém, o controle de acesso se resume a um único boolean `isMaster`, que só protege o item **Usuários** no menu. Não há guard de perfil, e o feed exibe os mesmos 9 cards para todos os usuários.

---

## Matriz de Acesso

### Menu principal (`app.component.html`)

| Item              | master | admin | estagiario |
|-------------------|--------|-------|------------|
| Página Inicial    | Sim    | Sim   | Sim        |
| Nova campanha     | Sim    | Sim   | **Não**    |
| Listar campanhas  | Sim    | Sim   | **Não**    |
| Nova despesa      | Sim    | Sim   | **Não**    |
| Despesas          | Sim    | Sim   | **Não**    |
| Nova venda        | Sim    | Sim   | **Não**    |
| Listar vendas     | Sim    | Sim   | **Não**    |
| Contas a receber  | Sim    | Sim   | **Não**    |
| Recebimentos      | Sim    | Sim   | **Não**    |
| **Entregas**      | Sim    | Sim   | **Sim**    |
| Novo cliente      | Sim    | Sim   | **Não**    |
| Clientes          | Sim    | Sim   | **Não**    |
| Dashboard         | Sim    | Sim   | **Não**    |
| Cadastro usuário  | Sim    | Sim   | **Não**    |
| Usuários          | Sim    | Não   | **Não**    |
| Sair              | Sim    | Sim   | Sim        |

### Feed (`feed.component.ts`)

| Card              | master | admin | estagiario |
|-------------------|--------|-------|------------|
| Campanhas         | Sim    | Sim   | **Não**    |
| Nova venda        | Sim    | Sim   | **Não**    |
| Vendas            | Sim    | Sim   | **Não**    |
| A receber         | Sim    | Sim   | **Não**    |
| Despesas          | Sim    | Sim   | **Não**    |
| Clientes          | Sim    | Sim   | **Não**    |
| Patrocínios       | Sim    | Sim   | **Não**    |
| Dashboard         | Sim    | Sim   | **Não**    |
| **Entregas**      | Sim    | Sim   | **Sim**    |

### Rotas — guard de perfil necessário em todas exceto:
- `entrega-list`
- `entrega-detail/:saleKey`

---

## Pontos de Implementação

### 1. Enum de perfis
**Arquivo:** `src/app/shared/model/accout.enum.ts`

Atualmente vazio. Adicionar:

```ts
export enum PerfilEnum {
  MASTER     = 'master',
  ADMIN      = 'admin',
  ESTAGIARIO = 'estagiario',
}
```

Substituir as strings literais `'master'`, `'admin'`, `'estagiario'` espalhadas no código.

---

### 2. UserProfileService (novo)
**Arquivo sugerido:** `src/app/shared/service/user-profile/user-profile.service.ts`

Responsabilidade: armazenar e expor o perfil do usuário logado de forma reativa, evitando múltiplas consultas ao Firebase.

```ts
perfil$ = new BehaviorSubject<string | null>(null);

setPerfil(perfil: string | null): void
isPerfil(perfil: PerfilEnum): Observable<boolean>
```

O `AppComponent` chama `setPerfil` após `getAccountByUidKey` e o zera no logout. Guards e componentes injetam o serviço para ler o valor atual.

---

### 3. AppComponent
**Arquivo:** `src/app/app.component.ts`

Mudanças:
- Injetar `UserProfileService`.
- Manter `isMaster` (ou derivar de `UserProfileService`) para o `*ngIf` existente do item **Usuários**.
- Adicionar propriedade `isEstagiario: boolean` (ou `isEstagiario$: Observable<boolean>`) para controlar a visibilidade dos demais itens.
- Em `loadUserProfile`, chamar `userProfileService.setPerfil(accounts[0]?.perfil)`.
- Em `logout`, chamar `userProfileService.setPerfil(null)`.

---

### 4. Menu — app.component.html
**Arquivo:** `src/app/app.component.html`

Adicionar `*ngIf="!isEstagiario"` em todos os itens da tabela de acesso marcados como **Não** para estagiário (exceto **Usuários**, que já tem `*ngIf="isMaster"`).

Itens que ficam sem `*ngIf` (visíveis a todos): Página Inicial, Entregas, Sair.

---

### 5. FeedComponent
**Arquivo:** `src/app/feature/feed/feed.component.ts`

O array `cards` é estático. Mudanças:
- Injetar `UserProfileService`.
- Ao inicializar, filtrar `cards` com base no perfil. Estagiário recebe apenas o card **Entregas**; demais perfis recebem todos.

Alternativa: adicionar propriedade `allowedPerfis: PerfilEnum[]` em cada card e filtrar dinamicamente.

---

### 6. Role Guard (novo)
**Arquivo sugerido:** `src/app/core/guards/role.guard.ts`

Lógica:
1. Ler o perfil via `UserProfileService`.
2. Se o perfil for `estagiario` e a rota não estiver na lista de rotas permitidas → redirecionar para `entrega-list`.
3. Qualquer outro perfil → liberar acesso.

Rotas permitidas para estagiário: `entrega-list`, `entrega-detail/:saleKey`.

---

### 7. Rotas
**Arquivo:** `src/app/app-routing.module.ts`

Adicionar `roleGuard` em `canActivate` de todas as rotas restritas. Rotas `entrega-list` e `entrega-detail/:saleKey` mantêm apenas `authGuard`.

Rotas que recebem `roleGuard`:
- `feed` (estagiário pode acessar, mas o guard não precisa barrar — o feed já mostra apenas o card de Entregas)
- `campaign-list`, `new-campaign`, `campaign-detail/:key`, `campaign/:key/new-sponsor`
- `client-list`, `new-client`, `client-detail/:key`
- `new-sale`, `sale-list`
- `contas-a-receber`, `recebimento/:saleKey`, `listar-recebimentos`
- `expense-list`, `new-expense`
- `sponsor-list`
- `dashboard`
- `new-account`, `account-list`

> **Observação:** A rota `feed` não precisa ser bloqueada, pois o feed do estagiário será filtrado para mostrar apenas Entregas. O guard só precisa atuar nas rotas diretas.

---

### 8. Formulário de Cadastro de Usuário
**Arquivo:** `src/app/feature/new-account/new-account.component.html`

O `<mat-select>` de perfil lista `admin` e `estagiario`, mas não `master`. Ponto em aberto: o perfil `master` deve ser atribuível via tela ou apenas diretamente no banco de dados?

---

## Arquivos Impactados

| Arquivo | Tipo de alteração |
|---|---|
| `src/app/shared/model/accout.enum.ts` | Alteração |
| `src/app/app.component.ts` | Alteração |
| `src/app/app.component.html` | Alteração |
| `src/app/feature/feed/feed.component.ts` | Alteração |
| `src/app/app-routing.module.ts` | Alteração |
| `src/app/shared/service/user-profile/user-profile.service.ts` | Novo |
| `src/app/core/guards/role.guard.ts` | Novo |

---

## Ponto em Aberto

- O perfil `master` deve aparecer como opção no formulário de cadastro de usuário, ou só é atribuído diretamente no banco?
