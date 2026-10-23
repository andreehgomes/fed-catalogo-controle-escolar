# CLAUDE.md

Guia para Claude Code (claude.ai/code) ao trabalhar neste repositório.

## Comandos

```bash
# Dev server (http://localhost:4200)
npm start

# Build de produção
npm run build:prod

# Build + deploy do hosting Firebase
npm run build:prod:hosting

# Testes (Karma + Jasmine)
npm test

# Lint (legado — ng lint + codelyzer; migração para angular-eslint em aberto)
npm run lint
```

## Visão geral de arquitetura

Aplicativo **Angular 20** de controle de **campanhas escolares** (venda de
produtos a patrocinadores pelos pais/alunos de uma escola), apoiado por
**Firebase Realtime Database** e **Firebase Auth**. Arquitetura em módulos de
feature com rotas lazy-loaded.

### Estrutura de módulos

- `src/app/feature/` — 25 features em módulos lazy:
  - **Autenticação / conta:** `login`, `new-account`, `redefine-password`, `page-error`
  - **Campanhas:** `feed`, `campaign-list`, `new-campaign`, `campaign-detail`, `campaign-public`, `new-sponsor`, `sponsor-list`
  - **Clientes:** `client-list`, `new-client`, `client-detail`
  - **Vendas / financeiro:** `new-sale`, `sale-list`, `contas-a-receber`, `recebimento`, `listar-recebimentos`
  - **Despesas:** `new-expense`, `expense-list`
  - **Entregas:** `entrega-list`, `entrega-detail`
  - **Gestão:** `dashboard`, `account-list`
- `src/app/components/` — componentes compartilhados, cada um em seu módulo: `card-alert`, `confirm-delete-dialog`, `footer`, `input-moeda`, `lista-recebimentos`, `loader`, `toolbar`
- **Shell:** `AppComponent` — depois do redesign, sidebar (rail 76px / expandida 264px / drawer <900px) + header sticky; scroll interno a `.ce-content`, não no `body`. Login, nova conta, redefinir senha, página de erro e `campaign-public` ficam **fora** do shell
- `src/app/shared/` — modelos (`shared/model/`), serviços (`shared/service/`), pipes e helpers compartilhados
- `src/app/core/` — infra do app: inicialização de auth, config Firebase, guards (`authGuard`, `roleGuard`), enum de rotas (`router.enum.ts`)

### Firebase e acesso a dados

- **Realtime Database** (não Firestore). Todos os caminhos ficam em `src/app/shared/model/path.enum.ts` (`Path.CAMPAIGN`, `Path.SALE`, `Path.CLIENT`, `Path.ENTREGA`, …).
- Firebase inicializado via `provideAuth`, `provideDatabase`, `provideStorage` no `AppModule` (Angular Fire v20).
- Serviços envolvem o SDK modular (`onValue`, `push`, `update`, `remove`, `query`) em `new Observable()`. Prefira `snapshotChanges()` em listas.
- **Firebase Auth**: `inject(Auth)`. Estado em `AuthStateService`; token/user em `localStorage` em base64, restaurados por `InitAuthService` na partida.
- **Não há login anônimo** — todas as rotas exigem usuário autenticado, exceto `c/:key` (campanha pública).

### Ambientes

- `environment.ts` — dev; projeto Firebase de desenvolvimento.
- `environment.prod.ts` — prod. No CI/CD, credenciais prod são injetadas via `process.env` em `ConfigFirebaseService` (`src/app/core/config-firebase/`).

### Estado

Sem NgRx. Estado compartilhado via `BehaviorSubject` em serviços.

### Controle de acesso

Três perfis em `src/app/shared/enum/profile.enum.ts`, verificados por `role.guard.ts`:

- **Master** — acesso total, incluindo `account-list` (gestão de usuários).
- **Operacional** (padrão) — tudo, exceto `account-list`.
- **Estagiário** — apenas `feed`, `entrega-list`, `entrega-detail` e logout.

Qualquer alteração no shell ou em menu precisa preservar os `*ngIf="!isEstagiario"` e `*ngIf="isMaster"` existentes.

### Rota pública

`c/:key` → `campaign-public`. Compartilhada externamente com patrocinadores; a tela gera imagem com `html2canvas` para envio por WhatsApp. **Nunca** renomear essa rota e **manter visual isolado** (não aplicar o shell nem o DS global sem checar impressão).

### Loader

`LoaderService` (`src/app/components/loader/`) controla um diálogo global.
**`closeDialog()` chama `dialog.closeAll()` e não tem contagem de referência**:
qualquer operação que abra o loader fecha o das outras. Em telas com operações
concorrentes (comprovante, exportação), use flag local (`salvando`, `gerando`)
em vez do loader global.

### Comprovantes / impressão

- Geração de PNG com `html2canvas` (carregado por `import()` dinâmico, fica em chunk à parte).
- O componente de impressão declara **pilha de fonte de sistema**, não `$ce-font`: o `html2canvas` renderiza num iframe onde a fonte do Google Fonts costuma não se aplicar.
- `html2canvas` está em `allowedCommonJsDependencies`.

## Design system

Após o redesign, o DS é o **`ce-*`** (controle-escolar): casca azul escolar
sobre canvas claro. Guia completo em [`docs/design-system.md`](docs/design-system.md).

- **Tokens** em `src/app/shared/style/_tokens.scss` — casca azul, superfícies, rampa de texto, semânticas, raios, sombras, layout. **Fonte de verdade** da paleta.
- **Classes globais** em `src/styles.scss` — `.ce-page`, `.ce-page-header`, `.ce-block`, `.ce-card`, `.ce-field`, `.ce-btn-*`, `.ce-list`, `.ce-empty-state`, `.ce-info-block`, `.ce-form-grid`, `.ce-chip`, `.ce-segmented`, `.ce-summary`, `.ce-loading`. **É daqui que vem o estilo das telas.**
- **Mixins** em `src/app/shared/style/_admin-ui.scss` — só o parametrizável: `ce-grid($min)`, `ce-chip($ink, $bg)`, `ce-btn-icon-ghost(…)`, `ce-icon-block(…)`, `ce-progress`, `ce-segmented`.

**Ao estilizar uma tela, prefira a classe global ao mixin.** `@mixin` é
expandido inline; usá-lo por componente replica o bloco no bundle, uma vez
por tela, contra o budget `anyComponentStyle` (6kb aviso, 10kb erro). A
classe global é emitida uma vez e serve as 25 telas. No SCSS do componente
fica só o que é daquela tela.

O tema do Angular Material é **M3** (`mat.theme` em `src/styles.scss`),
mantido para os componentes que sobram: `mat-datepicker`, `mat-autocomplete`,
`mat-select`, `mat-paginator`, `mat-menu` e `mat-dialog`. Os demais campos
são `<label>` + `<input>` com as classes do DS.

Tipografia: **Instrument Sans**; ícones: **Material Symbols Rounded** (a
classe `.material-icons` é remapeada em `src/styles.scss`, então
`<mat-icon>` continua valendo). Font Awesome 4.7 pelos glifos de marca.

## Documentação

- `docs/analise/` — análises de features e levantamentos de estado atual.
- `docs/plano/` — planos aprovados antes de implementar.
- `docs/plano-executado/` — registro de execução (regra global do usuário em `~/.claude/CLAUDE.md`: planos dentro de `docs/plano-executado/plano/` **não** geram registro adicional).

Antes de alterar uma feature grande, procure por documentos relevantes em
`docs/analise/` e `docs/plano/`.
