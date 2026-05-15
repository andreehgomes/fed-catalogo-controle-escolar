# Plano de Desenvolvimento: Listar Usuários Cadastrados

**Data:** 2026-05-15
**Projeto:** fed-catalogo-controle-escolar
**Análise base:** [docs/analise/listar-usuarios-analise.md](../analise/listar-usuarios-analise.md)
**Branch alvo:** feature/entregas

---

## Visão Geral

Criar a feature `account-list` — uma tela de listagem de todos os usuários cadastrados no Firebase Realtime Database, acessível exclusivamente por usuários com perfil `master`. A tela exibe nome, e-mail, celular, data de nascimento e perfil de cada usuário em cards, com busca em tempo real por nome ou e-mail, chip colorido por tipo de perfil, e ações de editar e excluir por item.

A implementação reutiliza `AccountService` (ajustado para incluir o campo `perfil`), `AccountDataService` (para preencher o estado antes de navegar para `/new-account` em modo de edição) e `ConfirmDeleteDialogComponent` (para confirmar exclusões). O padrão segue o `ClientListComponent` existente: NgModule com lazy loading, injeção via construtor, `standalone: false`.

---

## Convenções Obrigatórias

Extraídas do padrão vigente do projeto (observado em `client-list`, `app.component`, serviços existentes):

- `standalone: false` — todos os componentes declarados em NgModule
- Injeção de dependências via **construtor** (não usar `inject()`)
- Implementar `OnInit` para inicialização
- Métodos de negócio privados separados: `carregar()`, `confirmarExclusao()`
- `LoaderService.openDialog()` / `closeDialog()` ao redor de chamadas assíncronas
- `MatSnackBar` para feedback de erro e sucesso, `verticalPosition: 'top'`
- `ConfirmDeleteDialogComponent` para confirmações destrutivas
- Lazy loading via `loadChildren` com módulo dedicado de roteamento
- `authGuard` em todas as rotas autenticadas
- Textos em português, sem biblioteca de i18n

---

## Fases de Implementação

### Fase 1 — Fundação: modelos, serviço e rota

**Objetivo:** Preparar os pré-requisitos antes de criar qualquer componente — sem isso a feature não compila.

#### Tarefa 1.1 — Adicionar `perfil` à interface `AccountModel`

**Arquivo a modificar:** `src/app/shared/model/accout.enum.ts`

**O que fazer:** Adicionar o campo opcional `perfil` à interface:

```ts
export interface AccountModel {
  key?: string;
  nome: string;
  celular: string;
  data_nascimento: string;
  senha: string;
  email?: string;
  uid?: string;
  perfil?: string;   // <-- adicionar
}
```

**Critério:** Interface compilando com o campo `perfil` acessível sem erro de tipo.

---

#### Tarefa 1.2 — Adicionar `perfil` à classe `NewAccount`

**Arquivo a modificar:** `src/app/shared/model/new-account.ts`

**O que fazer:** Adicionar o campo opcional `perfil` à classe (necessário para o fluxo de edição via `AccountDataService`):

```ts
export class NewAccount {
  uid?: string;
  email?: string;
  nome: string;
  celular: string;
  data_nascimento: string;
  senha: string;
  perfil?: string;   // <-- adicionar
}
```

**Critério:** Compilação sem erro; `new-account` consegue ler `perfil` do estado recebido.

---

#### Tarefa 1.3 — Incluir `perfil` no mapeamento de `getAllAccount()`

**Arquivo a modificar:** `src/app/shared/service/account/account.service.ts`

**O que fazer:** No método `getAllAccount()`, adicionar `perfil` ao objeto mapeado (linha ~97):

```ts
return Object.keys(data).map(key => ({
  key: key,
  celular: data[key].celular,
  data_nascimento: data[key].data_nascimento,
  nome: data[key].nome,
  email: data[key].email,
  uid: data[key].uid,
  perfil: data[key].perfil ?? null,   // <-- adicionar
}));
```

**Critério:** `getAllAccount()` retorna o campo `perfil` para cada usuário; verificável via `console.log` ou inspeção no DevTools.

---

#### Tarefa 1.4 — Adicionar `ACCOUNT_LIST` ao `RouterEnum`

**Arquivo a modificar:** `src/app/core/router/router.enum.ts`

**O que fazer:** Adicionar a entrada ao enum, na seção de gestão (após `ENTREGA_DETAIL`):

```ts
ACCOUNT_LIST = "account-list",
```

**Critério:** `RouterEnum.ACCOUNT_LIST` disponível para uso em componentes e no `app-routing`.

---

#### Tarefa 1.5 — Registrar a rota lazy em `app-routing.module.ts`

**Arquivo a modificar:** `src/app/app-routing.module.ts`

**O que fazer:** Adicionar a rota antes do wildcard `**`, na seção de gestão (após `entrega-detail`):

```ts
{
  path: "account-list",
  canActivate: [authGuard],
  loadChildren: () =>
    import("./feature/account-list/account-list.module").then(
      (m) => m.AccountListModule
    ),
},
```

**Critério:** Navegar para `/account-list` sem erros de compilação ou de roteamento (após a Fase 2 estar completa).

---

### Fase 2 — Feature `account-list`

**Objetivo:** Criar os arquivos da feature — módulo, roteamento, componente (TS, HTML, SCSS).

#### Tarefa 2.1 — Criar `account-list-routing.module.ts`

**Arquivo a criar:** `src/app/feature/account-list/account-list-routing.module.ts`

**O que fazer:**

```ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AccountListComponent } from './account-list.component';

const routes: Routes = [{ path: '', component: AccountListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccountListRoutingModule {}
```

**Critério:** Módulo de roteamento exportado e importável em `AccountListModule`.

---

#### Tarefa 2.2 — Criar `account-list.module.ts`

**Arquivo a criar:** `src/app/feature/account-list/account-list.module.ts`

**O que fazer:**

```ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { ConfirmDeleteDialogModule } from '../../components/confirm-delete-dialog/confirm-delete-dialog.module';
import { AccountListRoutingModule } from './account-list-routing.module';
import { AccountListComponent } from './account-list.component';

@NgModule({
  declarations: [AccountListComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    AccountListRoutingModule,
    ConfirmDeleteDialogModule,
  ],
})
export class AccountListModule {}
```

**Critério:** Módulo compilando sem erros; lazy loading resolvendo `AccountListComponent`.

---

#### Tarefa 2.3 — Criar `account-list.component.ts`

**Arquivo a criar:** `src/app/feature/account-list/account-list.component.ts`

**O que fazer:** Seguir o padrão de `ClientListComponent`. Pontos-chave:

- Injetar `AccountService`, `AccountDataService`, `Router`, `LoaderService`, `MatDialog`, `MatSnackBar` e `Auth` (`@angular/fire/auth`)
- Estado: `accounts: AccountModel[]`, `filtered: AccountModel[]`, `searchCtrl: FormControl<string>`, `currentUserUid: string`
- `ngOnInit`: obter `currentUserUid` via `Auth.currentUser?.uid`; chamar `carregar()`; assinar `searchCtrl.valueChanges` com `debounceTime(400)` para filtrar `accounts` no cliente (sem nova chamada ao Firebase)
- Filtro no cliente: filtrar `accounts` por `nome` ou `email` contendo o termo (case-insensitive); atribuir resultado a `filtered`
- `editar(account, event)`: chamar `accountDataService.obtemAccount(account, account.key!)` e navegar para `RouterEnum.NEW_ACCOUNT`
- `excluir(account, event)`: bloquear se `account.uid === currentUserUid`; abrir `ConfirmDeleteDialogComponent`; em confirmação, chamar `accountService.deleteAccount(account.key!)` e remover da lista local
- Método `chipColor(perfil: string): string` — retorna classe CSS por perfil (`'chip-master'`, `'chip-admin'`, `'chip-estagiario'`, `'chip-default'`)

**Critério:** Componente compilando; lista carregando usuários; busca filtrando sem chamar o Firebase.

---

#### Tarefa 2.4 — Criar `account-list.component.html`

**Arquivo a criar:** `src/app/feature/account-list/account-list.component.html`

**O que fazer:** Seguir o layout de `client-list.component.html`. Estrutura:

```
<div class="page">
  <div class="header">
    título "Usuários"
    botão mat-mini-fab (click)="novoUsuario()" — ícone person_add, aria-label="Novo usuário"
  </div>

  <div class="page-content">
    <!-- campo de busca -->
    <mat-form-field appearance="outline" color="accent" class="field-full">
      <mat-label>Buscar por nome ou e-mail</mat-label>
      <mat-icon matPrefix>search</mat-icon>
      <input matInput [formControl]="searchCtrl" aria-label="Buscar usuário" autocomplete="off" />
    </mat-form-field>

    <!-- estado vazio -->
    <div *ngIf="filtered.length === 0" class="empty">
      <mat-icon>info</mat-icon>
      <span>Nenhum usuário encontrado.</span>
    </div>

    <!-- card por usuário -->
    <div class="account-card" *ngFor="let a of filtered">
      <div class="account-info">
        <span class="account-nome">{{ a.nome }}</span>
        <span class="account-email">{{ a.email }}</span>
        <span class="account-cel" *ngIf="a.celular">{{ a.celular }}</span>
        <mat-chip [ngClass]="chipColor(a.perfil)" class="perfil-chip">
          {{ a.perfil || 'sem perfil' }}
        </mat-chip>
      </div>
      <div class="account-actions">
        <button mat-icon-button [attr.aria-label]="'Editar ' + a.nome" (click)="editar(a, $event)">
          <mat-icon>edit</mat-icon>
        </button>
        <button mat-icon-button [attr.aria-label]="'Excluir ' + a.nome"
                [disabled]="a.uid === currentUserUid"
                (click)="excluir(a, $event)">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </div>
  </div>
</div>
```

**Critério:** Template renderizando lista com chip de perfil, busca e botões de ação; botão excluir desabilitado para o próprio usuário logado.

---

#### Tarefa 2.5 — Criar `account-list.component.scss`

**Arquivo a criar:** `src/app/feature/account-list/account-list.component.scss`

**O que fazer:** Seguir o padrão do SCSS de `client-list`. Adicionar regras para:

- `.account-card` — mesmo layout flex de `.client-card` (row, space-between, align-center, borda/sombra, padding)
- `.account-info` — coluna com gap entre nome, email, celular e chip
- `.account-nome` — `font-weight: 600`
- `.account-email`, `.account-cel` — `font-size: 0.85rem; color: var(--mdc-theme-text-secondary)` ou equivalente
- `.perfil-chip` — base do chip; cores distintas por classe:
  - `.chip-master` — fundo primário escuro (ex.: `#1a237e`), texto branco
  - `.chip-admin` — fundo accent (ex.: `#f57f17`), texto branco
  - `.chip-estagiario` — fundo verde (ex.: `#388e3c`), texto branco
  - `.chip-default` — fundo cinza neutro

**Critério:** Visual consistente com o restante da aplicação; chips com cores distintas e contraste WCAG AA mínimo.

---

### Fase 3 — Menu lateral e controle de acesso

**Objetivo:** Tornar a tela acessível pelo menu, restrita a perfil `master`.

#### Tarefa 3.1 — Adicionar entrada no menu lateral (`app.component.html`)

**Arquivo a modificar:** `src/app/app.component.html`

**O que fazer:** Adicionar o item na seção **Gestão**, após o item "Cadastro de usuário", visível apenas quando `isMaster === true`:

```html
<a *ngIf="isMaster"
   mat-list-item class="nav-item"
   (click)="goTo(routes.ACCOUNT_LIST); drawer.toggle()">
  <mat-icon matListItemIcon>manage_accounts</mat-icon>
  <span matListItemTitle>Usuários</span>
</a>
```

**Critério:** Item aparece no menu apenas quando `isMaster` é `true`; usuários sem perfil `master` não veem o link.

---

## Estrutura Final de Arquivos

```
src/app/
├── core/router/
│   └── router.enum.ts                          [modificado — Fase 1.4]
├── shared/model/
│   ├── accout.enum.ts                          [modificado — Fase 1.1]
│   └── new-account.ts                          [modificado — Fase 1.2]
├── shared/service/account/
│   └── account.service.ts                      [modificado — Fase 1.3]
├── app-routing.module.ts                       [modificado — Fase 1.5]
├── app.component.html                          [modificado — Fase 3.1]
└── feature/account-list/                       [criado — Fase 2]
    ├── account-list-routing.module.ts
    ├── account-list.module.ts
    ├── account-list.component.ts
    ├── account-list.component.html
    └── account-list.component.scss
```

---

## Ordem de Execução Recomendada

```
1.1 AccountModel.perfil
    └── 1.2 NewAccount.perfil
        └── 1.3 getAllAccount() + perfil
            └── 1.4 RouterEnum.ACCOUNT_LIST
                └── 2.1 account-list-routing.module.ts
                    └── 2.2 account-list.module.ts
                        └── 2.3 account-list.component.ts
                            ├── 2.4 account-list.component.html
                            └── 2.5 account-list.component.scss
                                └── 1.5 app-routing.module.ts
                                    └── 3.1 app.component.html (menu)
```

---

## Critérios de Aceitação Globais

- [ ] A rota `/account-list` carrega apenas quando o usuário está autenticado (`authGuard`)
- [ ] O link "Usuários" aparece no menu lateral **somente** quando `isMaster === true`
- [ ] A lista exibe nome, e-mail, celular e perfil de todos os usuários cadastrados
- [ ] O campo `perfil` é retornado por `getAllAccount()` e exibido no chip
- [ ] O chip de perfil exibe cores distintas para `master`, `admin`, `estagiário` e sem perfil
- [ ] O campo de busca filtra por nome ou e-mail com debounce sem chamar o Firebase novamente
- [ ] O botão **Editar** preenche `AccountDataService` e navega para `/new-account`
- [ ] O botão **Excluir** abre o diálogo de confirmação antes de remover o registro
- [ ] O usuário logado não pode excluir a própria conta (botão desabilitado)
- [ ] O `LoaderService` é ativado durante o carregamento e fechado ao terminar (sucesso ou erro)
- [ ] Em caso de erro no carregamento, um `MatSnackBar` informa o usuário
- [ ] O botão **Novo usuário** navega para `/new-account`
- [ ] Estado vazio exibido quando não há usuários (ou nenhum bate com a busca)
