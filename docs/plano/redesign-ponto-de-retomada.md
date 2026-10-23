# Redesign — Ponto de retomada

> Documento vivo da sessão de redesign. Serve para continuar o trabalho em
> uma janela de contexto limpa.
>
> **Branch atual:** `feature/redesign`
> **Working tree:** limpo (tudo commitado).
> **Status:** Fases 1–7 concluídas. Resta a Fase 8 (qualidade, opcional).

## 1. O que está feito

Todas as 25 features estão migradas para o DS `ce-*`, os componentes
compartilhados foram portados ou removidos, e o legado de cores saiu do
repositório. `npx ng build` passa sem erros nem deprecation warnings
(só warnings pré-existentes de TS files não referenciados).

### Fundação (Fases 1–4)

- Docs: `analise/redesign-estado-atual.md`, `plano/redesign-controle-escolar.md`,
  `design-system.md`, `CLAUDE.md`.
- Design system `ce-*` em `src/app/shared/style/`:
  - `_tokens.scss` — paleta azul escolar, raios, sombras, tipografia Instrument Sans.
  - `_breakpoints.scss` — `mobile`, `tablet-up`, `desktop`, `shell-narrow`/`shell-wide`.
  - `_admin-ui.scss` — mixins parametrizáveis: `ce-grid`, `ce-chip`,
    `ce-btn-icon-ghost`, `ce-icon-block`, `ce-progress`, `ce-segmented`,
    `ce-field-mat` (alinha mat-form-field outline ao `.ce-field` nativo).
- `styles.scss` reescrito com classes globais `.ce-*` e overrides globais
  de `mat-mdc-select-panel`/`mat-mdc-autocomplete-panel`.
- `index.html` com Instrument Sans + Material Symbols Rounded.
- Shell novo (`app.component.{ts,html,scss}`) com rail/expanded/drawer e
  header sticky; RBAC preservado (`!isEstagiario`, `isMaster`).

### Fase 5 — Todas as features (25/25)

| Feature | Nota |
|---|---|
| **Autenticação / conta** | `login`, `redefine-password`, `page-error` (fora do shell, molde do login); `new-account` entrou no shell e virou Master-only (ver seção abaixo). |
| **Campanhas** | `feed`, `campaign-list`, `new-campaign`, `campaign-detail`, `campaign-public`, `new-sponsor`, `sponsor-list`. |
| **Clientes** | `client-list`, `new-client`, `client-detail`. |
| **Vendas / financeiro** | `new-sale`, `sale-list`, `contas-a-receber`, `recebimento`, `listar-recebimentos`. |
| **Despesas** | `new-expense`, `expense-list`. |
| **Entregas** | `entrega-list`, `entrega-detail`. |
| **Gestão** | `dashboard`, `account-list`. |

Padrão aplicado: `.ce-page[--form]` + `.ce-page-header`, `.ce-panel`/`.ce-card`,
`mat-form-field` com `subscriptSizing="dynamic"` (herda `ce-field-mat`),
`ce-form-actions` com ghost + primary, grid `align-items: end` para
alinhar inputs mat-form-field com `.ce-field` nativo. `ts/módulo` intocados
nas features (as exceções foram no fluxo de permissão do new-account e
nos modules que precisavam de ajuste real).

#### Correções colaterais aplicadas durante a Fase 5

- **new-account entra no shell e vira Master-only:** `masterGuard` novo
  em `src/app/core/guards/master.guard.ts` + `isMaster()` em
  `UserProfileService`. Guard aplicado em `/new-account` e `/account-list`.
  Menu "Cadastro de usuário" ganha `*ngIf="isMaster"`.
- **page-error.module** passou a declarar o próprio componente e importar
  `MaterialModule` (ambos faltavam desde antes).
- **Botões Cancelar** que só resetavam o form (new-account, redefine-password)
  viraram `<a routerLink>` reais.
- **campaign-public:** confirmado que NÃO usa `html2canvas` (a observação
  antiga sobre fonte de impressão não se aplica). Aplicado o DS normal:
  hero full-width com gradiente da marca e conteúdo em container 960px.

### Fase 6 — Componentes compartilhados

- `card-alert` → template virou `.ce-info-block` com variantes
  `success/danger/warn` mapeadas de `AlertasType`.
- `confirm-delete-dialog` → ícone circular em `danger-soft`, mensagem
  secundária e botões `ce-btn-ghost` + `ce-btn-danger`.
- `loader` → `@import "colors"` fora, `mat-spinner` com stroke `ce-accent`.
- `lista-recebimentos` → casca `success-soft` embutida no card de conta,
  linhas `.lr-row` com `ce-btn-icon` nas ações.
- `input-moeda` → já renderiza `mat-form-field`, que ganha o `ce-field-mat`
  global; template/TS mantidos.
- `toolbar` e `footer` → **removidos** (componentes mortos); limpezas em
  `app.module` e `new-account.module`.

### Fase 7 — Limpeza

- `_colors.scss` removido. Nenhum `$c-*` nem `.c-primary/.c-red/.c-yellow`
  no app.
- `@import "./app/shared/style/colors"` removido de `styles.scss`.
- Deprecation warnings do Sass (`@import rules are deprecated`) sumiram do
  build.
- Roboto já não estava no `index.html`.

## 2. O que falta — Fase 8 (opcional)

- **Substituir `codelyzer`/`tslint` por `angular-eslint 20`.** O `npm run lint`
  ainda roda o linter legado. Migração é independente do DS.
- **Playwright para e2e** dos fluxos críticos: login, nova venda, nova
  entrega, confirmar pagamento, campanha pública.

Nenhum é bloqueante do redesign.

## 3. Decisões e padrões consolidados

Para evitar refazer no próximo passo:

- **Prefixo do DS:** `ce-*` (controle-escolar).
- **NgModules mantidos** (não migrar para standalone).
- **Filtros de lista** seguem padrão: grid `2fr / 1.x fr / auto` com
  busca `.ce-field--search` + mat-select (com
  `::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none }`) +
  `.ce-btn-ghost` Limpar; `align-items: end` no grid para alinhar inputs
  mat + nativos.
- **Busca com ícone absoluto:** `.ce-field--search` tem
  `.ce-field-prefix-icon` posicionado `left: 12px; top: 50%; transform:
  translateY(-50%)` e `input { padding-left: 40px }`.
- **Chips semânticos:** `.ce-chip` + `.success` / `.info` / `.warn` /
  `.danger` / `.accent`.
- **Botão de excluir** em cards/linhas: `.ce-btn-icon` com hover
  `$ce-danger-action` + `$ce-danger-soft` via `!important`.
- **Empty states** diferenciam "nada cadastrado" × "sem resultado para
  filtros".
- **Hints abaixo de inputs:** `position: absolute; top: 100%` para não
  desalinhar vizinhos.
- **Textarea Material:** usa `mat-form-field` com o mixin.
- **mat-expansion-panel estilizado como `.ce-card`** com os overrides do
  dashboard (padding, altura 60px, ícone 20px em `$ce-accent`, body com
  padding `0 20px 20px`).

## 4. Como retomar

1. Abrir este projeto em uma nova janela do Claude Code.
2. Ler, nesta ordem:
   - [`docs/plano/redesign-controle-escolar.md`](redesign-controle-escolar.md)
   - [`docs/design-system.md`](../design-system.md)
   - Este documento
   - `src/app/shared/style/_tokens.scss` e `_admin-ui.scss`
   - `src/styles.scss`
3. Para a Fase 8, começar pelo `angular-eslint` (é um comando `ng add` +
   ajuste em `angular.json`; depois adaptar algumas regras); Playwright
   é um projeto novo em `e2e/`.
4. Validar com `npx ng build` ao final.
5. Se um campo visual não parecer certo, abrir o navegador em
   `localhost:4200` e inspecionar os tokens reais com
   `mcp__Claude_Browser__javascript_tool` antes de supor a causa.

## 5. Observações do usuário durante as sessões

- Preferência por verificar antes de supor (não ficar chutando overrides CSS).
- Preferência por reaproveitar o que já existe nos projetos-irmãos (ganho
  confirmado com `ce-field-mat`).
- O dev server já roda em `localhost:4200`; **não subir outro na porta 4201**.
- Botões "Cancelar" devem realmente navegar para fora do form, não só
  resetar.
