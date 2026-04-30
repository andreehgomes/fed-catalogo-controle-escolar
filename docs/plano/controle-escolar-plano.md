# Plano de Desenvolvimento: Controle de Campanhas Escolares

**Data:** 2026-04-30
**Projeto:** fed-catalogo-controle-escolar
**Análise base:** _(sem arquivo de análise — requisitos extraídos da conversa com o usuário)_
**Branch alvo:** claude/priceless-panini-f76c2d
**Projeto de referência:** `C:\Users\Oem\Documents\Projetos\2 - Particular\fed-catalogo-cosmeticos`

---

## Visão Geral

Aplicação Angular SPA para controlar campanhas de venda em escolas (brindes, pizza, rifas, etc.). Cada campanha agrupa vendas, e cada venda é associada a um cliente (cadastro mínimo: nome obrigatório + telefone opcional). Na tela de venda, o usuário busca o cliente pelo nome em uma autocomplete; se não existir, o nome digitado é usado para criar o cadastro automaticamente ao salvar a venda. A venda permite adicionar múltiplos itens manualmente (descrição, quantidade, valor) e o app calcula o total. Por fim, há um dashboard com os resultados consolidados por campanha (total de vendas, total arrecadado, ranking de itens, etc.).

A estrutura, padrões de código, autenticação, interceptors HTTP, error handler global e layout serão **copiados integralmente** do projeto `fed-catalogo-cosmeticos`. As principais diferenças são:

1. **Domínio**: `Campaign`, `Client` (simplificado), `Sale` (com referência a campanha) substituem o domínio de produtos/vendas-a-prazo.
2. **Cores**: paleta em **tons de azul escuro** (substituindo o roxo/rosa do cosméticos).
3. **Firebase**: novo projeto (`fed-catalogo-controle-escolar`) com config já fornecida pelo usuário.
4. **Sem feed de produtos, sem brand cards, sem catálogo** — a tela inicial é a lista de campanhas.

---

## Convenções Obrigatórias

Extraídas do `CLAUDE.md` do projeto de referência e do padrão Angular 20 já em uso:

- **NgModules tradicionais** (não standalone) — o projeto cosméticos usa `standalone: false` em todos os componentes; manter o mesmo padrão para que a cópia funcione sem refactor.
- **Lazy loading por feature** via `loadChildren` no `app-routing.module.ts`.
- **Firebase via @angular/fire 20**: `provideFirebaseApp`, `provideFirestore`, `provideDatabase`, `provideAuth`, `provideStorage`.
- **Realtime Database** como storage principal (mesmo padrão de cosméticos), com `runInInjectionContext` em todas as chamadas SDK.
- **Locale `pt-BR`** com `BRL` como moeda padrão.
- **Material 20** com tema customizado em `styles.scss`.
- **Interceptor global HTTP** + **ErrorHandler global** em `core/http-handler/`.
- **AccountService + LoginService + InitAuthService** copiados do cosméticos sem alterações de lógica.
- **Cores em tons de azul escuro**: substituir paleta `mat.$rose-palette` / `mat.$red-palette` por `mat.$blue-palette` / `mat.$indigo-palette`, e o gradiente `#2d1b2e → #4a1942` por algo como `#0a1929 → #102a43`.

---

## Fases de Implementação

### Fase 1 — Fundação (setup, dependências, estrutura base)

**Objetivo:** Deixar o projeto destino com a mesma base técnica do cosméticos rodando, sem nenhum domínio ainda.

#### Tarefa 1.1 — Atualizar `package.json` com dependências do cosméticos

**Arquivo a modificar:** `package.json`

**O que fazer:** Adicionar todas as dependências e devDependencies que existem no `package.json` de cosméticos (versões idênticas). Lista a copiar literal:

Dependencies a adicionar:
```
@angular-builders/custom-webpack ^20.0.0
@angular/animations ^20.3.3
@angular/cdk ^20.2.7
@angular/fire ^20.0.1
@angular/material ^20.2.7
@angular/material-moment-adapter ^20.2.7
@angular/platform-browser-dynamic ^20.3.3
express ^4.18.2
firebase ^12.3.0
firebase-tools ^14.18.0
html2canvas ^1.4.1
moment ^2.29.4
ng-process-env ^15.0.1
```

DevDependencies a adicionar:
```
@angular/localize ^20.3.3
@types/html2canvas ^0.5.35
codelyzer ^6.0.0
```

Manter `@angular/* ^20.3.0` que já existe (cosméticos usa `^20.3.3`, ajustar para `^20.3.3`).

Adicionar scripts:
```
"build:prod": "ng build --configuration production",
"build:prod:hosting": "ng build --configuration production && firebase deploy --only hosting",
"lint": "ng lint"
```

**Critério:** `npm install` roda sem erros e `node_modules/@angular/material` existe.

#### Tarefa 1.2 — Configurar `angular.json` para custom-webpack e configuração production

**Arquivo a modificar:** `angular.json`

**O que fazer:** Substituir o builder atual por `@angular-builders/custom-webpack:browser` (igual cosméticos), adicionar configuração `production` com `fileReplacements` para `environment.prod.ts` e os budgets. Copiar o bloco `architect.build` e `architect.serve` de cosméticos, adaptando o nome do projeto (`fed-catalogo-controle-escolar`).

**Critério:** `ng build` produz output em `dist/fed-catalogo-controle-escolar/` e `ng build --configuration production` funciona.

#### Tarefa 1.3 — Criar `environments/`

**Arquivos a criar:**
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

**O que fazer:** Criar dois arquivos com a config Firebase fornecida pelo usuário:

```ts
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyBhUA-UlwcBKFPiFregWzURaAAC94OjDAg",
    authDomain: "fed-catalogo-controle-escolar.firebaseapp.com",
    projectId: "fed-catalogo-controle-escolar",
    storageBucket: "fed-catalogo-controle-escolar.firebasestorage.app",
    messagingSenderId: "589224897507",
    appId: "1:589224897507:web:992b41abc713c795b1ced6",
    measurementId: "G-QXX8VNEVG6",
    databaseURL: "https://fed-catalogo-controle-escolar-default-rtdb.firebaseio.com",
  },
};
```

`environment.prod.ts` igual com `production: true`.

**Critério:** Build dev e prod compilam sem erro de import do environment.

#### Tarefa 1.4 — Criar arquivos de configuração Firebase

**Arquivos a criar:**
- `firebase.json`
- `.firebaserc`
- `database.rules.json`
- `storage.rules`

**O que fazer:**

`.firebaserc`:
```json
{
  "projects": {
    "default": "fed-catalogo-controle-escolar"
  }
}
```

`firebase.json`: copiar de cosméticos, ajustando `public` para `dist/fed-catalogo-controle-escolar` e **removendo** os rewrites `/api/boticario`, `/api/natura`, `/api/avon` (não fazem sentido aqui). Manter rewrite `**` → `/index.html`.

`database.rules.json`: substituir pelo seguinte (paths novos do domínio):
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "account": { ".indexOn": ["uid"] },
    "campaigns": { ".indexOn": ["nome", "nomeLower", "status", "dataCriacao"] },
    "clients": { ".indexOn": ["nomeLower"] },
    "sales": { ".indexOn": ["campaignKey", "clienteKey", "clienteNomeLower", "dataCriacao"] }
  }
}
```

`storage.rules`: copiar literal de cosméticos.

**Critério:** `firebase deploy --only database` aceitaria as regras (validação local com `firebase emulators:start` opcional).

#### Tarefa 1.5 — Criar tema/cores e estilos base

**Arquivos a criar/modificar:**
- `src/styles.scss`
- `src/app/shared/style/_colors.scss`

**O que fazer:**

`_colors.scss` — paleta azul escuro:
```scss
$c-primary: #1565c0;            // azul escuro principal
$c-primary-light: #5e92f3;
$c-primary-dark: #003c8f;
$c-secondary: #0d47a1;
$c-accent: #1976d2;
$c-background: #e3f2fd;
$c-white: #fff;
$c-bg-gradient-start: #0a1929;
$c-bg-gradient-end: #102a43;

// Reaproveitar variantes de alerta do cosméticos (verde, vermelho, amarelo) — mesmas cores.
$c-red: #e42a1d;
$c-red-alert: #721c24;
$c-red-alert-light: #f8d7da;
$c-red-alert-border: #f5c6cb;
$c-yellow-alert-ligth: #ffecb3;
$c-yellow-alert: #ff6f00;
$c-yellow-alert-border: #ffc107;
$c-blue-alert-light: #e3f2fd;
$c-blue-alert: #3174da;
$c-blue-alert-border: #64b5f6;
$c-green-alert-light: #ebfde3;
$c-green-alert: #297000;
$c-green-alert-border: #92f664;
```

`styles.scss` — copiar de cosméticos com as substituições:
- `mat.$rose-palette` → `mat.$blue-palette`
- `mat.$red-palette` → `mat.$indigo-palette`
- Gradiente `#2d1b2e → #4a1942` → `#0a1929 → #102a43` (em todos os lugares: `.mat-typography`, `body`, `.content`, `.containers`, `.body`, `mat-drawer-container`)

**Critério:** App carrega com fundo gradiente azul escuro, formulários com accent azul.

#### Tarefa 1.6 — Copiar `app.module.ts`, `app-routing.module.ts`, `app.component.*`, `material.module.ts`, `polyfills.ts`, `main.ts`, `index.html`, `proxy.conf.*`

**Arquivos a criar/modificar:**
- `src/app/app.module.ts`
- `src/app/app-routing.module.ts`
- `src/app/app.component.ts`, `.html`, `.scss`
- `src/app/material.module.ts`
- `src/polyfills.ts`
- `src/main.ts`
- `src/index.html`
- `proxy.conf.js`, `proxy.conf.json`
- `tsconfig.app.json`, `tsconfig.json`, `tsconfig.spec.json`
- `karma.conf.js`
- `browserslist`
- `.editorconfig`

**O que fazer:** Copiar literal de cosméticos. Em `app-routing.module.ts`, **trocar todo o conjunto de rotas** pelo conjunto novo (ver Tarefa 1.10).

Trocar título em `index.html`: `<title>Sandra Cosméticos</title>` → `<title>Controle de Campanhas Escolares</title>`.

Trocar `bootstrap` em `main.ts` se necessário (deve permanecer `AppModule`).

**Critério:** `npm start` levanta o app na porta 4200 com fundo azul, sem erros no console.

#### Tarefa 1.7 — Copiar `core/` (autenticação, interceptors, router, utils)

**Arquivos a criar:** copiar literal as pastas:
- `src/app/core/base-auth/init-auth.service.ts` (+ spec)
- `src/app/core/config-firebase/config-firebase.service.ts` (+ spec)
- `src/app/core/http-handler/global-error-handler.ts`
- `src/app/core/http-handler/global-http.interceptor.ts`
- `src/app/core/router/router.service.ts` (+ spec)
- `src/app/core/router/router.enum.ts` — **substituir** pelo enum novo (ver Tarefa 1.10)
- `src/app/core/utils/` — copiar literal

**Critério:** Imports resolvem; nenhum erro de TS.

#### Tarefa 1.8 — Copiar `shared/` parcialmente (services e modelos comuns)

**Arquivos a criar (literal de cosméticos, sem alterações):**
- `src/app/shared/service/account/account.service.ts`
- `src/app/shared/service/analytics/analytics.service.ts`
- `src/app/shared/service/authState/` (todos os arquivos)
- `src/app/shared/service/sidenav/sidenav.service.ts`
- `src/app/shared/service/file/file.service.ts`
- `src/app/shared/util/` (todos)
- `src/app/shared/directive/` (todos)
- `src/app/shared/lists/` (todos)
- `src/app/shared/model/`:
  - `accout.enum.ts`
  - `alertas-model.ts`
  - `alertas-type.enum.ts`
  - `analytics-model.ts`
  - `file-upload-model.ts`
  - `lists.ts`
  - `new-account.ts`
  - `page-index.ts`
  - `token.ts`

**Arquivos NÃO copiar (serão substituídos por modelos novos do domínio):**
- `card-item.ts`, `client.ts`, `product.ts`, `sale.ts`, `path.enum.ts`, `promocao.enum.ts`

**Critério:** Imports de account/analytics/auth resolvem; nenhum erro de TS.

#### Tarefa 1.9 — Copiar `components/` (toolbar, footer, loader, card-alert, input-moeda, confirm-delete-dialog)

**Arquivos a criar (literal):**
- `src/app/components/toolbar/`
- `src/app/components/footer/`
- `src/app/components/loader/`
- `src/app/components/card-alert/`
- `src/app/components/input-moeda/`
- `src/app/components/confirm-delete-dialog/`

**NÃO copiar:** `card-product-list/`, `contact/`, `parceiro/`, `lista-recebimentos/` (não fazem sentido nesse domínio).

**Critério:** `<app-toolbar>`, `<app-loader>`, `<card-alert>`, `<input-moeda>` renderizam.

#### Tarefa 1.10 — Definir `RouterEnum` e rotas do novo domínio

**Arquivos a modificar:**
- `src/app/core/router/router.enum.ts`
- `src/app/app-routing.module.ts`

**O que fazer:**

`router.enum.ts`:
```ts
export enum RouterEnum {
  DEFAULT = "",
  LOGIN = "login",
  ERROR = "error",
  FEED = "feed",
  NEW_ACCOUNT = "new-account",
  REDEFINE_PASSWORD = "redefine-password",
  PARAM_KEY = "key",

  CAMPAIGN_LIST = "campaign-list",
  NEW_CAMPAIGN = "new-campaign",
  CAMPAIGN_DETAIL = "campaign-detail",

  CLIENT_LIST = "client-list",
  NEW_CLIENT = "new-client",
  CLIENT_DETAIL = "client-detail",

  NEW_SALE = "new-sale",
  SALE_LIST = "sale-list",

  DASHBOARD = "dashboard",
}
```

`app-routing.module.ts`: registrar lazy load para todos os módulos:
```ts
{ path: 'login', loadChildren: () => import('./feature/login/login.module').then(m => m.LoginModule) },
{ path: 'new-account', loadChildren: () => import('./feature/new-account/new-account.module').then(m => m.NewAccountModule) },
{ path: 'redefine-password', loadChildren: () => import('./feature/redefine-password/redefine-password.module').then(m => m.RedefinePasswordModule) },
{ path: 'error', loadChildren: () => import('./feature/page-error/page-error.module').then(m => m.PageErrorModule) },
{ path: 'feed', loadChildren: () => import('./feature/feed/feed.module').then(m => m.FeedModule) },
{ path: 'campaign-list', loadChildren: () => import('./feature/campaign-list/campaign-list.module').then(m => m.CampaignListModule) },
{ path: 'new-campaign', loadChildren: () => import('./feature/new-campaign/new-campaign.module').then(m => m.NewCampaignModule) },
{ path: 'campaign-detail/:key', loadChildren: () => import('./feature/campaign-detail/campaign-detail.module').then(m => m.CampaignDetailModule) },
{ path: 'client-list', loadChildren: () => import('./feature/client-list/client-list.module').then(m => m.ClientListModule) },
{ path: 'new-client', loadChildren: () => import('./feature/new-client/new-client.module').then(m => m.NewClientModule) },
{ path: 'client-detail/:key', loadChildren: () => import('./feature/client-detail/client-detail.module').then(m => m.ClientDetailModule) },
{ path: 'new-sale', loadChildren: () => import('./feature/new-sale/new-sale.module').then(m => m.NewSaleModule) },
{ path: 'sale-list', loadChildren: () => import('./feature/sale-list/sale-list.module').then(m => m.SaleListModule) },
{ path: 'dashboard', loadChildren: () => import('./feature/dashboard/dashboard.module').then(m => m.DashboardModule) },
{ path: '', loadChildren: () => import('./feature/feed/feed.module').then(m => m.FeedModule) },
{ path: '**', redirectTo: '' },
```

**Critério:** `npm start` carrega `/feed` na rota raiz.

---

### Fase 2 — Modelos de domínio e services

**Objetivo:** Definir as interfaces e services que falam com o Firebase Realtime DB para Campaign, Client e Sale.

#### Tarefa 2.1 — Criar `Path` enum do novo domínio

**Arquivo a criar:** `src/app/shared/model/path.enum.ts`

```ts
export enum Path {
  ACCOUNT = "account",
  CAMPAIGN = "campaigns",
  CLIENT = "clients",
  SALES = "sales",
  ANALYTICS = "analytics",
  TOKEN = "token",
}
```

**Critério:** Usado pelos services nas próximas tarefas.

#### Tarefa 2.2 — Criar modelo `Client`

**Arquivo a criar:** `src/app/shared/model/client.ts`

```ts
export interface Client {
  key?: string;
  nome: string;
  nomeLower?: string;
  telefone?: string;
}
```

Apenas `nome` obrigatório, `telefone` opcional. Sem endereço (diferente de cosméticos).

**Critério:** Service de Client usa esse tipo.

#### Tarefa 2.3 — Criar modelo `Campaign`

**Arquivo a criar:** `src/app/shared/model/campaign.ts`

```ts
export type CampaignStatus = 'ativa' | 'encerrada';

export interface Campaign {
  key?: string;
  nome: string;
  nomeLower?: string;
  descricao?: string;
  dataInicio: string;     // ISO 8601 (YYYY-MM-DD)
  dataFim?: string;       // ISO 8601 opcional
  meta?: number;          // valor meta da campanha em R$
  status: CampaignStatus;
  dataCriacao: string;    // ISO 8601 UTC
  dataAlteracao?: string;
}
```

**Critério:** Usado pelo service de Campaign.

#### Tarefa 2.4 — Criar modelo `Sale`

**Arquivo a criar:** `src/app/shared/model/sale.ts`

```ts
export interface SaleItem {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorSubtotal: number;  // quantidade * valorUnitario
}

export interface Sale {
  key?: string;
  campaignKey: string;
  campaignNome: string;
  clienteKey: string;
  clienteNome: string;
  clienteNomeLower: string;
  itens: SaleItem[];
  valorTotal: number;
  observacao?: string;
  dataCriacao: string;     // ISO 8601 UTC
  dataAlteracao?: string;
}
```

**Critério:** Usado pelo service de Sale.

#### Tarefa 2.5 — Criar `CampaignService`

**Arquivo a criar:** `src/app/shared/service/campaign/campaign.service.ts`

**O que fazer:** Service no padrão de `ClientService` do cosméticos. Métodos:
- `newCampaign(c: Campaign): Observable<string>` — push ao Realtime DB, retorna a key
- `updateCampaign(key: string, c: Campaign): Observable<void>` — update por key
- `getCampaigns(term?: string): Observable<Campaign[]>` — query por `nomeLower`
- `getAllCampaigns(): Observable<Campaign[]>` — todas, ordenadas por `dataCriacao` desc
- `getCampaignByKey(key: string): Observable<Campaign>`
- `getActiveCampaigns(): Observable<Campaign[]>` — filtro `status === 'ativa'`
- `deleteCampaign(key: string): Promise<void>` — exclusão direta (sem soft-delete)
- `selectedCampaign$ = new BehaviorSubject<Campaign | null>(null)` — para passar campanha selecionada entre telas (padrão usado em cosméticos)

Sempre usar `runInInjectionContext(this.injector, ...)` em torno das chamadas SDK.

**Critério:** Testar manualmente: criar uma campanha pelo console → ver no Firebase RTDB.

#### Tarefa 2.6 — Criar `ClientService` (simplificado)

**Arquivo a criar:** `src/app/shared/service/client/client.service.ts`

**O que fazer:** Copiar `ClientService` de cosméticos, **removendo**:
- Toda a lógica de soft-delete (`deleteClientWithSales`, `getExcludedClients`).
- `EXCLUDED_CLIENTS` e referências a `excluded_*`.

Manter:
- `newClient`, `getClients(term, cursor)`, `getAllClients`, `getClientByKey`, `updateClient`.
- `selectedClient$ = new BehaviorSubject<Client | null>(null)`.
- Adicionar `deleteClient(key: string): Promise<void>` — exclusão direta sem mover para "excluídos".

Ajustar import do modelo (`Client` não tem mais endereço).

**Critério:** Lista, busca, criação e atualização de clientes funcionam contra o RTDB.

#### Tarefa 2.7 — Criar `SaleService`

**Arquivo a criar:** `src/app/shared/service/sale/sale.service.ts`

**O que fazer:** Copiar `SaleService` de cosméticos, simplificando para esse domínio:

Manter:
- `newSale`, `updateSale`, `getSaleByKey`, `getAllSales`, `getSalesByClientKey`.
- `selectedSale$`.
- `deleteSale(key)` — exclusão direta (sem soft-delete e sem `excluded_sales`).

Adicionar:
- `getSalesByCampaign(campaignKey: string): Observable<Sale[]>` — query por `campaignKey`.
- `getSalesPage(params: { campaignKey?: string; nomePrefix: string; pageSize: number; afterValue?: string; afterKey?: string })` — paginação no padrão cosméticos.

Remover: tudo relacionado a parcelas, recebimentos, status `pendente/quitado`, `addRecebimento`, `deleteRecebimento`.

**Critério:** Salvar uma venda manualmente e ler de volta funciona.

---

### Fase 3 — Telas de autenticação (login, cadastro, redefinir senha, page-error)

**Objetivo:** Login funcional contra o Firebase Auth do projeto novo, igual cosméticos.

#### Tarefa 3.1 — Copiar feature `login/`

**Arquivos a criar:** copiar literal `src/app/feature/login/` de cosméticos:
- `login.component.ts`, `.html`, `.scss`, `.spec.ts`
- `login.module.ts`, `login-routing.module.ts`
- `shared/model/payload-login.ts`, `shared/model/response-login.ts`
- `shared/service/login.service.ts`

**Modificar:**
- `login.component.html`: trocar `Logo Sandra Cosméticos` → `Logo Controle de Campanhas` e `<span class="brand-name">Sandra Cosméticos</span>` → `<span class="brand-name">Controle de Campanhas</span>`.
- Após login, redirecionar para `RouterEnum.CAMPAIGN_LIST` em vez de `FEED` (alternativamente manter `FEED` se a tela inicial for o feed).

**Critério:** Login com email/senha cria sessão e redireciona.

#### Tarefa 3.2 — Copiar feature `new-account/`

**Arquivos a criar:** copiar literal `src/app/feature/new-account/` de cosméticos.

Trocar referências textuais "Sandra Cosméticos" → "Controle de Campanhas" se houver.

**Critério:** Cadastro de nova conta cria usuário no Firebase Auth + registro em `account/`.

#### Tarefa 3.3 — Copiar feature `redefine-password/` e `page-error/`

**Arquivos a criar:** copiar literal as duas pastas inteiras.

**Critério:** `/redefine-password` e `/error` carregam.

---

### Fase 4 — Tela inicial (`feed`)

**Objetivo:** Ter uma home simples que sirva de hub para as principais funcionalidades do app.

#### Tarefa 4.1 — Criar feature `feed/` simplificado

**Arquivos a criar:**
- `src/app/feature/feed/feed.component.ts`, `.html`, `.scss`
- `src/app/feature/feed/feed.module.ts`, `feed-routing.module.ts`

**O que fazer:** **NÃO** copiar literal o feed de cosméticos (ele é específico para catálogo de produtos). Criar um feed novo, mais simples:

- Logo central (placeholder usando logo do cosméticos por enquanto, em `src/assets/imagens/logo.png`).
- Saudação (`Olá!` ou nome do usuário se logado).
- Cards/botões para navegação rápida:
  - **Campanhas** → `/campaign-list`
  - **Vendas** → `/sale-list`
  - **Clientes** → `/client-list`
  - **Dashboard** → `/dashboard`
  - **Nova Venda** → `/new-sale`

Usar `mat-card` clicáveis, layout em grid responsivo.

**Critério:** `/feed` mostra logo + 5 cards clicáveis que navegam corretamente.

#### Tarefa 4.2 — Copiar logo e assets

**Arquivos a criar:** Copiar `src/assets/imagens/logo.png` de cosméticos para o projeto novo (placeholder até o usuário enviar a logo definitiva).

**Critério:** Logo aparece no feed e na tela de login.

---

### Fase 5 — CRUD de Campanhas

**Objetivo:** Criar, listar, editar e excluir campanhas.

#### Tarefa 5.1 — Feature `new-campaign/` (criar/editar)

**Arquivos a criar:**
- `src/app/feature/new-campaign/new-campaign.component.ts`, `.html`, `.scss`
- `new-campaign.module.ts`, `new-campaign-routing.module.ts`

**O que fazer:** Form reativo com:
- `nome` (required)
- `descricao` (opcional, textarea)
- `dataInicio` (required, datepicker)
- `dataFim` (opcional, datepicker)
- `meta` (opcional, `input-moeda`)
- `status` (select: `ativa | encerrada`, default `ativa`)

Padrão de edição: usar `selectedCampaign$` do `CampaignService` para detectar modo edição (igual venda-a-prazo). Ao salvar:
- Modo criar: `newCampaign({...})`.
- Modo editar: `updateCampaign(key, {...})`.

Após salvar: snackbar de sucesso + navegar para `/campaign-list`.

**Critério:** Criar nova campanha e editar uma existente, ambos refletem no RTDB.

#### Tarefa 5.2 — Feature `campaign-list/`

**Arquivos a criar:**
- `src/app/feature/campaign-list/campaign-list.component.ts`, `.html`, `.scss`
- `campaign-list.module.ts`, `campaign-list-routing.module.ts`

**O que fazer:**
- Lista as campanhas (cards), com chip de status (`ativa`/`encerrada`).
- Mostra: nome, descrição (truncada), data início/fim, meta, total arrecadado (calcular somando vendas da campanha — fazer uma única query `getAllSales()` ou `getSalesByCampaign`).
- Botão "Nova campanha" no topo navega para `/new-campaign`.
- Botão de busca por nome (input com debounce 500ms).
- Card clicável navega para `/campaign-detail/:key`.
- Botão de menu por card: editar (seta `selectedCampaign$` e navega para `/new-campaign`), excluir (`confirm-delete-dialog` + `deleteCampaign`).

**Critério:** Lista renderiza, busca filtra, navegação funciona, exclusão remove do RTDB.

#### Tarefa 5.3 — Feature `campaign-detail/`

**Arquivos a criar:**
- `src/app/feature/campaign-detail/campaign-detail.component.ts`, `.html`, `.scss`
- `campaign-detail.module.ts`, `campaign-detail-routing.module.ts`

**O que fazer:** Tela com:
- Cabeçalho: nome, status, datas, meta.
- Resumo: total de vendas, total arrecadado, % da meta atingida (se meta definida).
- Lista de vendas dessa campanha (chamando `getSalesByCampaign(campaignKey)`).
- Botão "Nova venda" abre `/new-sale?campaignKey=:key` (preenche campanha automaticamente).

**Critério:** Acessar `/campaign-detail/:key` mostra os dados da campanha + suas vendas.

---

### Fase 6 — Cadastro de Clientes

**Objetivo:** CRUD mínimo de clientes (nome obrigatório + telefone opcional).

#### Tarefa 6.1 — Feature `new-client/`

**Arquivos a criar:**
- `src/app/feature/new-client/new-client.component.ts`, `.html`, `.scss`
- `new-client.module.ts`, `new-client-routing.module.ts`

**O que fazer:** Form reativo com:
- `nome` (required)
- `telefone` (opcional, máscara `(99) 99999-9999`)

Padrão de edição via `selectedClient$`. Ao salvar:
- Modo criar: `newClient({...})`, snackbar + nav.
- Modo editar: `updateClient(key, {...})`.

**Critério:** Criar e editar cliente funcionam.

#### Tarefa 6.2 — Feature `client-list/`

**Arquivos a criar:**
- `src/app/feature/client-list/`

**O que fazer:** Copiar lógica do `client-list/` de cosméticos, **removendo** referências a clientes excluídos. Lista paginada por `nomeLower`, busca com debounce, edit/delete por card.

**Critério:** Listagem, busca, paginação, edição e exclusão funcionam.

#### Tarefa 6.3 — Feature `client-detail/`

**Arquivos a criar:**
- `src/app/feature/client-detail/`

**O que fazer:** Tela com nome, telefone e lista das vendas desse cliente (`getSalesByClientKey`). Sem dados financeiros de parcelas (esse domínio não tem parcelas).

**Critério:** Acessar `/client-detail/:key` mostra dados + histórico de vendas.

---

### Fase 7 — Venda (núcleo da aplicação)

**Objetivo:** Criar/editar venda com autocomplete de cliente, criação automática quando o cliente não existir, e múltiplos itens.

#### Tarefa 7.1 — Feature `new-sale/`

**Arquivos a criar:**
- `src/app/feature/new-sale/new-sale.component.ts`, `.html`, `.scss`
- `new-sale.module.ts`, `new-sale-routing.module.ts`

**O que fazer:** Componente baseado no `venda-a-prazo` de cosméticos, **com as seguintes adaptações**:

**Estrutura do form:**
```ts
form: FormGroup = this.fb.group({
  campaignKey: ['', Validators.required],
  campaignNome: [''],
  clienteKey: [''],            // pode ficar vazio até o save (quando criamos cliente novo)
  clienteNome: ['', Validators.required],
  itens: this.fb.array([], Validators.required),  // pelo menos 1 item
  valorTotal: [0],
  observacao: [''],
});

// Controles auxiliares para o input de adicionar item
itemDescricaoCtrl = new FormControl('', Validators.required);
itemQuantidadeCtrl = new FormControl(1, [Validators.required, Validators.min(1)]);
itemValorUnitarioCtrl = new FormControl(null, [Validators.required, Validators.min(0.01)]);
```

**Comportamento — campanha:**
- Select com lista de campanhas ativas (`getActiveCampaigns()`).
- Pré-selecionar via query param `?campaignKey=...` (vindo de `campaign-detail`).
- Quando selecionar, gravar `campaignKey` e `campaignNome` no form.

**Comportamento — busca de cliente:**
- Igual venda-a-prazo: input de `clienteNome` com debounce 500ms chamando `clientService.getClients(term)`.
- Lista suspensa de sugestões (`<ul class="suggestions-list">`).
- Ao clicar numa sugestão: `selecionarCliente(c)` — preenche `clienteKey` + `clienteNome`.
- Se o usuário digitar um nome novo (não selecionar nenhuma sugestão), `clienteKey` fica vazio. **No `salvar()`, se `clienteKey === ''` → cria cliente primeiro via `newClient({ nome: clienteNome })`, pega a key retornada e usa na venda.**

**Comportamento — itens:**
- Linha de input (descrição + quantidade + valor unitário + botão `+`).
- Botão `+` adiciona ao `FormArray` `itens` com `valorSubtotal = quantidade * valorUnitario` calculado.
- Cada item exibido como card com botão de remover.
- `valorTotal` calculado automaticamente como `sum(item.valorSubtotal)`.

**Comportamento — salvar:**
1. Se `form.invalid` ou `itens.length === 0` → return.
2. Loader open.
3. Se `clienteKey === ''`: chamar `clientService.newClient({ nome: clienteNome.trim() })` → atualizar `clienteKey` com o resultado.
4. Montar objeto `Sale` com `dataCriacao = new Date().toISOString()` (ou preservar `dataCriacao` original em modo edição) + `clienteNomeLower = clienteNome.toLowerCase()`.
5. `newSale(sale)` ou `updateSale(key, sale)`.
6. Snackbar + reset + navegar para `/campaign-detail/:campaignKey` (ou voltar para origem se houver query param).

**Modo edição:** detectar via `saleService.selectedSale$`. Se há venda selecionada → preencher form, marcar `editingKey`, preencher `itensArray` com os itens existentes.

**Critério:**
- Cliente novo é criado e a venda é registrada na mesma operação.
- Cliente existente reutiliza key.
- Adicionar/remover itens recalcula o total.
- Edição preserva `dataCriacao` original.

#### Tarefa 7.2 — Feature `sale-list/`

**Arquivos a criar:**
- `src/app/feature/sale-list/`

**O que fazer:** Lista paginada de vendas (todas as campanhas). Filtros opcionais: por campanha (select) e por nome de cliente (input com debounce). Cada item mostra: data, cliente, campanha, valor total. Card clicável navega para edição (seta `selectedSale$` + nav `/new-sale`).

**Critério:** Lista, busca por cliente, filtro por campanha, edição via clique funcionam.

---

### Fase 8 — Dashboard

**Objetivo:** Painel agregando os dados de uma campanha (ou de todas).

#### Tarefa 8.1 — Feature `dashboard/`

**Arquivos a criar:**
- `src/app/feature/dashboard/dashboard.component.ts`, `.html`, `.scss`
- `dashboard.module.ts`, `dashboard-routing.module.ts`

**O que fazer:** Dashboard com cards e gráficos. Estrutura:

**Filtro no topo:**
- Select de campanha (default: "Todas as campanhas").
- Datas De/Até (datepicker).

**Cards de resumo (KPIs):**
- Total de vendas (count).
- Total arrecadado (sum `valorTotal`).
- Ticket médio (total / count).
- % da meta atingida (se campanha selecionada e tem meta).

**Lista de top itens vendidos:**
- Agregar `itens` de todas as vendas filtradas: `descricao` → `qtdTotal` + `valorTotal`.
- Top 10 ordenados por quantidade.

**Lista de últimas vendas:**
- Top 10 vendas mais recentes da seleção.

**Barra de progresso da meta** (se campanha + meta definidas):
- `mat-progress-bar` com `value = (totalArrecadado / meta) * 100`.

**Comportamento de carga:**
- Carregar vendas via `getSalesByCampaign(key)` se campanha selecionada, senão `getAllSales()`.
- Filtrar por intervalo de datas em memória (datas pequenas, OK).
- Recalcular agregados em getters (`get totalVendas()`, etc.) ou em uma função `calcular()` chamada após carregar.

**Critério:** Selecionar campanha mostra os números dela; sem seleção mostra os totais de todas.

---

### Fase 9 — Toolbar/Sidenav adaptados

**Objetivo:** Menu lateral apontando para as rotas novas.

#### Tarefa 9.1 — Adaptar `toolbar` e `sidenav`

**Arquivos a modificar:**
- `src/app/app.component.html` (onde fica o `<mat-sidenav>`)
- `src/app/components/toolbar/toolbar.component.html` (se tiver lista de itens)

**O que fazer:** Ajustar a lista de itens do sidenav para apontar para as rotas novas:
- Início (`/feed`)
- Campanhas (`/campaign-list`)
- Nova venda (`/new-sale`)
- Vendas (`/sale-list`)
- Clientes (`/client-list`)
- Dashboard (`/dashboard`)
- Sair

Trocar nome de marca exibido na toolbar/header, se houver, para "Controle de Campanhas".

**Critério:** Sidenav abre com os itens corretos; cada item navega para a rota.

---

### Fase 10 — Limpeza, build e validação manual

**Objetivo:** Garantir que tudo compila e roda end-to-end.

#### Tarefa 10.1 — Verificar imports e remover código morto

**O que fazer:** Buscar por imports quebrados (vestígios de `Recebimento`, `EXCLUDED_*`, `Product`, `CardItem`, `parceiro`, `contact`, `card-product-list`) e remover.

**Critério:** `ng build` sem warnings/erros.

#### Tarefa 10.2 — Build de produção

**O que fazer:** Rodar `npm run build:prod`.

**Critério:** Build conclui dentro dos budgets.

#### Tarefa 10.3 — Smoke test manual

**O que fazer (checklist a seguir manualmente no browser):**
1. Acessar app → cair em `/feed`.
2. Criar conta → login → ver feed.
3. Criar campanha "Pizza setembro" → aparecer em `/campaign-list`.
4. Criar venda nessa campanha com **cliente novo** (digitar nome inédito) → 2 itens → salvar → verificar que cliente foi criado em `/client-list` E venda aparece em `/campaign-detail/:key`.
5. Criar segunda venda **selecionando cliente existente** da autocomplete → salvar.
6. Editar uma venda → trocar quantidade de um item → salvar → ver total atualizado.
7. Excluir uma venda → confirmar → some da lista.
8. Ir ao `/dashboard` → ver KPIs corretos.
9. Filtrar dashboard por campanha → KPIs reagem.

**Critério:** Todos os 9 passos passam.

---

## Estrutura Final de Arquivos

```
fed-catalogo-controle-escolar/
├── .firebaserc                             [Fase 1.4 — novo]
├── firebase.json                           [Fase 1.4 — novo]
├── database.rules.json                     [Fase 1.4 — novo]
├── storage.rules                           [Fase 1.4 — novo]
├── angular.json                            [Fase 1.2 — modificado]
├── package.json                            [Fase 1.1 — modificado]
├── proxy.conf.js, proxy.conf.json          [Fase 1.6 — novo]
├── browserslist                            [Fase 1.6 — novo]
├── tsconfig.app.json / .json / .spec.json  [Fase 1.6 — modificado]
├── karma.conf.js                           [Fase 1.6 — novo]
├── docs/
│   └── plano/
│       └── controle-escolar-plano.md       [este arquivo]
└── src/
    ├── index.html                          [Fase 1.6 — modificado]
    ├── main.ts                             [Fase 1.6 — novo]
    ├── polyfills.ts                        [Fase 1.6 — novo]
    ├── styles.scss                         [Fase 1.5 — novo]
    ├── environments/
    │   ├── environment.ts                  [Fase 1.3 — novo]
    │   └── environment.prod.ts             [Fase 1.3 — novo]
    ├── assets/
    │   └── imagens/logo.png                [Fase 4.2 — copiada placeholder]
    └── app/
        ├── app.module.ts                   [Fase 1.6]
        ├── app-routing.module.ts           [Fase 1.6 + 1.10]
        ├── app.component.{ts,html,scss}    [Fase 1.6]
        ├── material.module.ts              [Fase 1.6]
        ├── core/
        │   ├── base-auth/init-auth.service.ts                [Fase 1.7]
        │   ├── config-firebase/config-firebase.service.ts    [Fase 1.7]
        │   ├── http-handler/{global-error-handler.ts, global-http.interceptor.ts}  [Fase 1.7]
        │   ├── router/{router.service.ts, router.enum.ts}    [Fase 1.7 + 1.10]
        │   └── utils/                                        [Fase 1.7]
        ├── shared/
        │   ├── style/_colors.scss          [Fase 1.5]
        │   ├── service/
        │   │   ├── account/                [Fase 1.8 — copiado]
        │   │   ├── analytics/              [Fase 1.8 — copiado]
        │   │   ├── authState/              [Fase 1.8 — copiado]
        │   │   ├── sidenav/                [Fase 1.8 — copiado]
        │   │   ├── file/                   [Fase 1.8 — copiado]
        │   │   ├── campaign/campaign.service.ts  [Fase 2.5 — novo]
        │   │   ├── client/client.service.ts      [Fase 2.6 — novo]
        │   │   └── sale/sale.service.ts          [Fase 2.7 — novo]
        │   ├── model/
        │   │   ├── path.enum.ts            [Fase 2.1 — novo]
        │   │   ├── campaign.ts             [Fase 2.3 — novo]
        │   │   ├── client.ts               [Fase 2.2 — novo simplificado]
        │   │   ├── sale.ts                 [Fase 2.4 — novo simplificado]
        │   │   ├── accout.enum.ts          [Fase 1.8]
        │   │   ├── alertas-model.ts        [Fase 1.8]
        │   │   ├── alertas-type.enum.ts    [Fase 1.8]
        │   │   ├── analytics-model.ts      [Fase 1.8]
        │   │   ├── file-upload-model.ts    [Fase 1.8]
        │   │   ├── lists.ts                [Fase 1.8]
        │   │   ├── new-account.ts          [Fase 1.8]
        │   │   ├── page-index.ts           [Fase 1.8]
        │   │   └── token.ts                [Fase 1.8]
        │   ├── util/                       [Fase 1.8 — copiado]
        │   ├── directive/                  [Fase 1.8 — copiado]
        │   └── lists/                      [Fase 1.8 — copiado]
        ├── components/
        │   ├── toolbar/                    [Fase 1.9 + 9.1]
        │   ├── footer/                     [Fase 1.9]
        │   ├── loader/                     [Fase 1.9]
        │   ├── card-alert/                 [Fase 1.9]
        │   ├── input-moeda/                [Fase 1.9]
        │   └── confirm-delete-dialog/      [Fase 1.9]
        └── feature/
            ├── login/                      [Fase 3.1 — copiado adapt.]
            ├── new-account/                [Fase 3.2 — copiado]
            ├── redefine-password/          [Fase 3.3 — copiado]
            ├── page-error/                 [Fase 3.3 — copiado]
            ├── feed/                       [Fase 4.1 — novo simplificado]
            ├── campaign-list/              [Fase 5.2 — novo]
            ├── new-campaign/               [Fase 5.1 — novo]
            ├── campaign-detail/            [Fase 5.3 — novo]
            ├── client-list/                [Fase 6.2 — adaptado]
            ├── new-client/                 [Fase 6.1 — adaptado]
            ├── client-detail/              [Fase 6.3 — adaptado]
            ├── new-sale/                   [Fase 7.1 — novo]
            ├── sale-list/                  [Fase 7.2 — novo]
            └── dashboard/                  [Fase 8.1 — novo]
```

---

## Ordem de Execução Recomendada

```
Fase 1 (Fundação)
   └─→ Fase 2 (Modelos + Services)
         ├─→ Fase 3 (Auth)  ──┐
         │                    ├─→ Fase 4 (Feed) ──┐
         ├─→ Fase 5 (Campanhas) ─────────┐         │
         ├─→ Fase 6 (Clientes)  ─────────┤         │
         │                                ├─→ Fase 7 (Venda) ──→ Fase 8 (Dashboard)
         └─→ Fase 9 (Toolbar/Sidenav) ────┘                                │
                                                                            │
                                                            Fase 10 (Build + Smoke test) ←┘
```

Fase 5, 6, 7 podem ser feitas em ordem (Campanhas → Clientes → Venda), pois Venda depende de Campanha e Cliente. Fase 9 pode ser feita ao longo, mas faz mais sentido após Fase 8 quando todas as rotas existem.

---

## Critérios de Aceitação Globais

- [ ] `npm install` em projeto novo conclui sem erros.
- [ ] `npm start` levanta o app em `localhost:4200` com fundo gradiente azul escuro.
- [ ] `npm run build:prod` conclui dentro dos budgets, gerando `dist/fed-catalogo-controle-escolar/`.
- [ ] Login com email/senha funciona contra projeto Firebase `fed-catalogo-controle-escolar`.
- [ ] Criação de conta nova insere usuário no Auth + registro em `account/` no RTDB.
- [ ] Cadastro de campanha grava em `campaigns/` no RTDB com `nomeLower` populado.
- [ ] Listagem de campanhas exibe + busca por nome funciona.
- [ ] Cadastro manual de cliente grava em `clients/` no RTDB com `nomeLower` populado.
- [ ] Tela de venda autocompleta cliente existente e cria novo cliente automaticamente quando o nome não existe.
- [ ] Itens de venda são adicionados/removidos com cálculo automático de subtotal e total.
- [ ] Edição de venda preserva `dataCriacao` original e atualiza `dataAlteracao`.
- [ ] Dashboard reflete corretamente: total de vendas, total arrecadado, ticket médio e top itens.
- [ ] Filtro de dashboard por campanha + período funciona.
- [ ] Sidenav navega corretamente para todas as rotas novas.
- [ ] Sem warnings ou erros TypeScript no build.

---

## Pré-condições e Dependências Bloqueantes

- **Logo definitiva** — usuário ainda enviará. Por enquanto, usar a logo de cosméticos como placeholder. Substituição posterior é trivial: trocar `src/assets/imagens/logo.png` e atualizar referências de `alt="Logo Sandra Cosméticos"` para o nome final do app.
- **Regras do Realtime Database** — o `database.rules.json` definido na Tarefa 1.4 exige `auth != null`. Para o primeiro teste local antes de criar conta, pode ser temporariamente afrouxado para `true` em ambos `.read`/`.write` (apenas em dev) e endurecido depois.
- **Ativação do Auth** no Firebase Console — o usuário precisa habilitar **E-mail/Senha** como provedor de autenticação no console do projeto `fed-catalogo-controle-escolar` antes do primeiro teste de login.
- **Database habilitado** — Realtime Database precisa ser criado no console do projeto antes de qualquer escrita (URL `https://fed-catalogo-controle-escolar-default-rtdb.firebaseio.com`).

---

## Primeira Tarefa Recomendada

**Tarefa 1.1** — Atualizar `package.json` com as dependências do cosméticos e rodar `npm install`. Sem isso, nada compila.
