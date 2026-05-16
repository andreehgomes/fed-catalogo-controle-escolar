# Plano de Desenvolvimento: RBAC — Perfil Estagiário

**Data:** 2026-05-15
**Projeto:** fed-catalogo-controle-escolar
**Análise base:** [docs/analise/2026-05-15-rbac-estagiario.md](../analise/2026-05-15-rbac-estagiario.md)
**Branch alvo:** feature/entregas

---

## Visão Geral

Implementar controle de acesso por perfil (RBAC) restringindo o perfil `estagiario` para visualizar e navegar apenas para a área de **Entregas**. Os perfis `admin` e `master` mantêm acesso integral ao sistema.

A implementação se apoia em um novo `UserProfileService` que armazena reativamente o perfil do usuário logado via `BehaviorSubject`, eliminando consultas repetidas ao Firebase. O `AppComponent` alimenta o serviço após o carregamento do perfil e o reseta no logout. Um guard funcional (`roleGuard`) bloqueia rotas restritas redirecionando o estagiário para `entrega-list`. O menu lateral e o feed de cards também são filtrados via propriedade `isEstagiario` exposta no componente raiz.

---

## Convenções Obrigatórias

O projeto usa Angular v20 com NgModule (não standalone). Padrões do código existente a seguir:

- Serviços com `constructor` injection (padrão do projeto — não alterar para `inject()` em componentes/serviços existentes)
- Guards funcionais com `inject()` (já usado em `auth.guard.ts` — seguir o mesmo padrão)
- `BehaviorSubject` para estado reativo nos serviços (padrão de `AccountService`)
- `*ngIf` para controle de visibilidade no template (padrão atual do menu)
- `ng-container` para agrupar blocos sem introduzir elemento DOM extra
- Não adicionar `standalone: true` — todos os componentes existentes usam `standalone: false`

---

## Fases de Implementação

### Fase 1 — Fundação: Enum e UserProfileService

**Objetivo:** Criar a base tipada do perfil e o serviço central de estado, do qual todas as demais fases dependem.

---

#### Tarefa 1.1 — Adicionar PerfilEnum

**Arquivo:** `src/app/shared/model/accout.enum.ts`

**O que fazer:**  
Adicionar o enum `PerfilEnum` ao arquivo existente (que atualmente contém apenas `AccountModel`):

```ts
export enum PerfilEnum {
  MASTER     = 'master',
  ADMIN      = 'admin',
  ESTAGIARIO = 'estagiario',
}
```

**Critério:** `PerfilEnum.ESTAGIARIO` importável e sem erro de compilação.

---

#### Tarefa 1.2 — Criar UserProfileService

**Arquivo:** `src/app/shared/service/user-profile/user-profile.service.ts`

**O que fazer:**  
Criar novo serviço com `providedIn: 'root'`. Expõe o perfil via `BehaviorSubject` e um getter síncrono para uso nos guards.

```ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PerfilEnum } from '../../model/accout.enum';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly _perfil$ = new BehaviorSubject<PerfilEnum | null>(null);

  readonly perfil$ = this._perfil$.asObservable();

  setPerfil(perfil: string | null): void {
    const parsed = Object.values(PerfilEnum).includes(perfil as PerfilEnum)
      ? (perfil as PerfilEnum)
      : null;
    this._perfil$.next(parsed);
  }

  getPerfil(): PerfilEnum | null {
    return this._perfil$.getValue();
  }

  isEstagiario(): boolean {
    return this._perfil$.getValue() === PerfilEnum.ESTAGIARIO;
  }
}
```

**Critério:** Serviço injetável sem erros; `isEstagiario()` retorna `true` quando o perfil for `'estagiario'`.

---

### Fase 2 — AppComponent: integração com UserProfileService

**Objetivo:** Fazer o `AppComponent` alimentar o `UserProfileService` e expor `isEstagiario` para o template.

---

#### Tarefa 2.1 — Atualizar app.component.ts

**Arquivo:** `src/app/app.component.ts`

**O que fazer:**

1. Injetar `UserProfileService` no construtor.
2. Adicionar propriedade `isEstagiario: boolean = false`.
3. Em `loadUserProfile`, após resolver `accounts`, chamar `userProfileService.setPerfil(accounts[0]?.perfil ?? null)` e atualizar `isEstagiario` e `isMaster` a partir do serviço:

```ts
private loadUserProfile(uid: string): void {
  this.accountService.getAccountByUidKey(uid).then((accounts) => {
    const perfil = accounts[0]?.perfil ?? null;
    this.userProfileService.setPerfil(perfil);
    this.isMaster = this.userProfileService.getPerfil() === PerfilEnum.MASTER;
    this.isEstagiario = this.userProfileService.isEstagiario();
    this.analyticsService.setUserProfile(perfil);
  });
}
```

4. Em `logout`, chamar `this.userProfileService.setPerfil(null)` e resetar `isEstagiario = false`.

**Critério:** Logar com conta `estagiario` → `isEstagiario` é `true` no componente; logar com `admin` → `false`.

---

#### Tarefa 2.2 — Atualizar app.component.html (menu)

**Arquivo:** `src/app/app.component.html`

**O que fazer:**  
Envolver seções restritas com `ng-container *ngIf="!isEstagiario"`. Manter **Página inicial**, **Entregas** e **Sair** sem condição.

Estrutura das seções após a alteração:

```
Página inicial            → sem *ngIf (sempre visível)

ng-container *ngIf="!isEstagiario"
  mat-divider
  div.nav-section-label "Campanhas"
  Nova campanha
  Listar campanhas
  Nova despesa
  Despesas
/ng-container

mat-divider               → sempre visível (separa do bloco de Entregas)
div.nav-section-label "Vendas & Clientes"  → sempre visível

ng-container *ngIf="!isEstagiario"
  Nova venda
  Listar vendas
  Contas a receber
  Recebimentos
/ng-container

Entregas                  → sem *ngIf (sempre visível)

ng-container *ngIf="!isEstagiario"
  Novo cliente
  Clientes
/ng-container

ng-container *ngIf="!isEstagiario"
  mat-divider
  div.nav-section-label "Gestão"
  Dashboard
  Cadastro de usuário
/ng-container

a *ngIf="isMaster" Usuários   → sem alteração (já existente)

mat-divider
Sair                      → sem *ngIf (sempre visível)
```

**Critério:** Logar como estagiário → menu exibe apenas Página inicial, Entregas e Sair.

---

### Fase 3 — FeedComponent filtrado

**Objetivo:** O estagiário vê apenas o card de Entregas no feed.

---

#### Tarefa 3.1 — Filtrar cards no FeedComponent

**Arquivo:** `src/app/feature/feed/feed.component.ts`

**O que fazer:**

1. Injetar `UserProfileService` no construtor.
2. Adicionar campo `allowedPerfis: PerfilEnum[]` a cada card da interface `FeedCard`:

```ts
interface FeedCard {
  label: string;
  icon: string;
  route: RouterEnum;
  color: 'primary' | 'accent' | 'success' | 'warn';
  allowedPerfis?: PerfilEnum[]; // undefined = todos os perfis
}
```

3. Marcar os cards restritos com `allowedPerfis: [PerfilEnum.MASTER, PerfilEnum.ADMIN]`. O card **Entregas** fica sem a propriedade (ou com todos os perfis).

4. No construtor, após definir o array estático, filtrar com base no perfil atual:

```ts
constructor(private router: Router, private userProfileService: UserProfileService) {
  const perfil = this.userProfileService.getPerfil();
  this.cards = this.allCards.filter(
    (c) => !c.allowedPerfis || c.allowedPerfis.includes(perfil as PerfilEnum)
  );
}
```

Mover o array completo para `private readonly allCards` e deixar `cards` como resultado do filtro.

**Critério:** Estagiário vê apenas 1 card (Entregas); admin/master veem todos os 9 cards.

---

### Fase 4 — Role Guard e Rotas

**Objetivo:** Bloquear navegação direta a rotas restritas via URL para o perfil estagiário.

---

#### Tarefa 4.1 — Criar roleGuard

**Arquivo:** `src/app/core/guards/role.guard.ts`

**O que fazer:**  
Guard funcional seguindo o mesmo padrão de `auth.guard.ts`:

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserProfileService } from '../../shared/service/user-profile/user-profile.service';
import { RouterEnum } from '../router/router.enum';

export const roleGuard: CanActivateFn = () => {
  const userProfileService = inject(UserProfileService);
  const router = inject(Router);

  if (userProfileService.isEstagiario()) {
    return router.createUrlTree([RouterEnum.ENTREGA_LIST]);
  }
  return true;
};
```

**Critério:** Estagiário que tenta acessar `/dashboard` via URL é redirecionado para `/entrega-list`.

---

#### Tarefa 4.2 — Adicionar roleGuard nas rotas

**Arquivo:** `src/app/app-routing.module.ts`

**O que fazer:**  
Importar `roleGuard` e adicioná-lo em `canActivate` de todas as rotas restritas. As rotas `entrega-list` e `entrega-detail/:saleKey` mantêm apenas `authGuard`.

Rotas que recebem `canActivate: [authGuard, roleGuard]`:

| Rota | Caminho atual |
|---|---|
| `new-account` | linha 12 |
| `feed` | linha 42 |
| `campaign-list` | linha 48 |
| `new-campaign` | linha 55 |
| `campaign-detail/:key` | linha 63 |
| `campaign/:key/new-sponsor` | linha 71 |
| `client-list` | linha 79 |
| `new-client` | linha 86 |
| `client-detail/:key` | linha 93 |
| `new-sale` | linha 102 |
| `sale-list` | linha 110 |
| `contas-a-receber` | linha 118 |
| `recebimento/:saleKey` | linha 126 |
| `listar-recebimentos` | linha 133 |
| `expense-list` | linha 141 |
| `new-expense` | linha 149 |
| `sponsor-list` | linha 157 |
| `dashboard` | linha 164 |
| `account-list` | linha 191 |

> A rota `feed` recebe o guard mas não redireciona o estagiário — ele pode ver o feed filtrado. Portanto, o `roleGuard` para `feed` pode ser omitido se preferir; o feed já trata o acesso internamente. Mantê-lo garante consistência futura.

**Critério:** Todas as rotas listadas com `roleGuard` no `canActivate`; compilação sem erros.

---

## Estrutura Final de Arquivos

```
src/app/
├── shared/
│   ├── model/
│   │   └── accout.enum.ts              ← [FASE 1] + PerfilEnum
│   └── service/
│       └── user-profile/
│           └── user-profile.service.ts ← [FASE 1] NOVO
├── core/
│   └── guards/
│       ├── auth.guard.ts               (sem alteração)
│       └── role.guard.ts               ← [FASE 4] NOVO
├── feature/
│   └── feed/
│       └── feed.component.ts           ← [FASE 3]
├── app.component.ts                    ← [FASE 2]
├── app.component.html                  ← [FASE 2]
└── app-routing.module.ts               ← [FASE 4]
```

---

## Ordem de Execução Recomendada

```
Tarefa 1.1 (PerfilEnum)
       ↓
Tarefa 1.2 (UserProfileService)
       ↓
Tarefa 2.1 (AppComponent .ts)  →  Tarefa 2.2 (menu HTML)
       ↓
Tarefa 3.1 (FeedComponent)
       ↓
Tarefa 4.1 (roleGuard)
       ↓
Tarefa 4.2 (Rotas)
```

As tarefas 2.1 e 2.2 podem ser feitas em paralelo após a Fase 1. A Fase 4 depende do `UserProfileService` mas é independente das Fases 2 e 3.

---

## Critérios de Aceitação Globais

- [ ] Login com perfil `estagiario`: menu exibe apenas Página inicial, Entregas e Sair
- [ ] Login com perfil `estagiario`: feed exibe apenas o card Entregas
- [ ] Login com perfil `estagiario`: tentativa de acesso direto a `/dashboard` redireciona para `/entrega-list`
- [ ] Login com perfil `estagiario`: `/entrega-list` e `/entrega-detail/:saleKey` carregam normalmente
- [ ] Login com perfil `admin`: menu e feed completos, todas as rotas acessíveis
- [ ] Login com perfil `master`: menu e feed completos (incluindo item Usuários)
- [ ] Logout zera `UserProfileService` (`getPerfil()` retorna `null`)
- [ ] Compilação sem erros (`ng build`)
- [ ] Sem regressões visíveis nos fluxos de campanha, venda e clientes

---

## Ponto em Aberto

O perfil `master` deve aparecer como opção no formulário de cadastro de usuário (`new-account.component.html`) ou só é atribuído diretamente no banco? Não bloqueia esta feature — nenhuma das tarefas acima depende dessa decisão.
