# Design System — `fed-catalogo-controle-escolar`

> Prefixo: **`ce-*`** (controle-escolar).
> Família: `ds-*` (cosméticos), `ep-*` (confecções), `cp-*` (compara-precos),
> `ce-*` (este projeto).

Este documento é a referência visual. A fonte de verdade dos valores é
`src/app/shared/style/_tokens.scss`. Esta página explica **por que** cada
token existe e **quando** usar cada classe.

## Identidade

- **Casca**: azul profundo escolar — remete à área administrativa de escola,
  séria, confiável. Usada **só** no `<aside class="ce-nav">` e em gradientes
  decorativos (hero do feed, avatar do usuário).
- **Superfície**: canvas claro (`#f6f4f1` ou similar — definir no `_tokens.scss`),
  cards brancos com borda sutil e sombra leve.
- **Acento**: azul-tinta para CTAs, chips ativos, foco.
- **Tipografia**: **Instrument Sans** (Google Fonts). Display com tracking
  negativo e peso 650; labels uppercase 10px/700 tracking 0.11em; valores com
  `font-variant-numeric: tabular-nums`.
- **Ícones**: **Material Symbols Rounded** (via `.material-icons` remapeada
  em `src/styles.scss`). Font Awesome 4.7 só para glifos de marca (WhatsApp).

## Paleta (resumo)

Os valores exatos ficam em `_tokens.scss` após a Fase 2. Aqui vai a estrutura
esperada.

### Casca (azul escolar)
- `$ce-ink-900` — gradiente início, rodapé sólido.
- `$ce-ink-800` — stop 55%.
- `$ce-ink-750` — stop 60% dos gradientes hero/login.
- `$ce-ink-700` — fim de gradiente, ícone/ação secundária.
- `$ce-ink-600` — topo de barras do dashboard.
- `$ce-ink-500` — hover.
- `$ce-ink-soft`, `$ce-ink-soft-hover` — chips, avatares, hovers claros.

### Gradientes
- `$ce-gradient-shell` — sidebar.
- `$ce-gradient-hero` — card de boas-vindas no feed.
- `$ce-gradient-dark` — bloco de resumo.
- `$ce-gradient-avatar` — avatar circular do usuário.
- `$ce-gradient-success` — chip de pago/entregue.
- `$ce-gradient-bar` — barra vertical do dashboard.

### Superfícies
- `$ce-bg` — tela do app.
- `$ce-surface` — card, header.
- `$ce-surface-input` — input em repouso (vira `$ce-surface` no foco).
- `$ce-surface-subtle` — bloco interno, hover de linha.
- `$ce-surface-muted` — trilho de barra, pílula de quantidade.
- `$ce-surface-track` — trilho de progresso, fundo de `ce-segmented`.
- `$ce-border`, `$ce-border-input`, `$ce-border-divider`, `$ce-border-soft`,
  `$ce-border-dashed` — bordas em uso crescente de contraste.

### Rampa de texto
- `$ce-text` — base, títulos, valores.
- `$ce-text-strong`, `$ce-text-body`, `$ce-text-secondary`,
  `$ce-text-muted`, `$ce-text-label`, `$ce-text-placeholder`,
  `$ce-text-disabled`.

### Semânticas
- **Success** — `$ce-success`, `$ce-success-soft`, `$ce-success-border`,
  `$ce-success-label` (sobre bloco claro).
- **Info** — azul mais frio que o acento, usado só em `ce-info-block info`.
- **Warn** — âmbar com texto AA (`#a54600` sobre `#ffecb3`).
- **Danger** — **dois vermelhos distintos** (seguindo confecções):
  - `$ce-danger-data` — valores vencidos, chips (`#a51d13`).
  - `$ce-danger-action` — ícones de excluir, warning (`#e42a1d`).
  - Não unificar.

### Raios
- `$ce-radius-card: 18px`
- `$ce-radius-panel: 22px`
- `$ce-radius-inner: 14px`
- `$ce-radius-kpi: 16px`
- `$ce-radius-input: 12px`
- `$ce-radius-sm: 10px`
- `$ce-radius-icon: 9px`
- `$ce-radius-pill: 999px`

### Sombras
- `$ce-shadow-hairline` — borda fina de card.
- `$ce-shadow-card` — card em repouso.
- `$ce-shadow-hover` — card no hover.
- `$ce-shadow-panel` — painel grande (detalhe).
- `$ce-shadow-accent` — botão primário.
- `$ce-shadow-drawer` — sidebar aberta.
- `$ce-shadow-modal` — diálogo.

### Layout
- `$ce-rail-width: 76px`
- `$ce-nav-width: 264px`
- `$ce-drawer-width: 272px`
- `$ce-breakpoint-narrow: 900px`
- `$ce-content-max: 1180px` (listas)
- `$ce-detail-max: 1080px` (detalhe)
- `$ce-form-max: 940px` (formulário)
- `$ce-page-padding: clamp(16px, 3.4vw, 34px)`
- `$ce-gap: 14px`
- `$ce-section-gap: 20px`

## Shell

```
┌────────┬───────────────────────────────────────┐
│        │  Header sticky translúcido            │
│  aside │ ───────────────────────────────────── │
│  ce-nav│                                       │
│  rail  │  <main class="ce-content">            │
│  76px  │    <section class="ce-page">          │
│        │      ...                              │
│  ou    │                                       │
│ expand │                                       │
│ 264px  │                                       │
│        │                                       │
└────────┴───────────────────────────────────────┘
```

- `<aside class="ce-nav">` com rail 76 → hover/click para 264.
- `< 900px`: vira drawer sobreposto, abertura por botão no header (sem FAB).
- Header **sticky**, fundo `rgba(255,255,255,0.82)` + `backdrop-filter: blur(14px)`.
- Scroll **interno** a `.ce-content` (overflow-y auto), nunca no `body`.
- `color-scheme: light`. Sem dark mode no primeiro ciclo.

## Classes globais

Prefira estas classes ao criar/refatorar telas. É o repertório que vive em
`src/styles.scss`.

### Página
- `.ce-page` — container da feature; largura máxima e padding do canvas.
- `.ce-page-header` — título h1 + ações à direita; `tabular-nums` nos valores.
- `.ce-page-subtitle` — subtítulo discreto abaixo do título.

### Blocos
- `.ce-card` — bloco branco, raio 18, sombra `card`, borda `$ce-border`.
- `.ce-panel` — bloco grande (detalhe), raio 22, sombra `panel`.
- `.ce-block` — bloco interno dentro de card (fundo `surface-subtle`).
- `.ce-info-block` — caixa de aviso; variantes `info`, `success`, `warn`,
  `danger`. Substitui `card-alert` legado.

### Listas
- `.ce-list` — contêiner vertical de linhas.
- `.ce-list-row` — linha clicável; divisor em `border-bottom: 1px solid $ce-border-divider`.
- `.ce-empty-state` — ilustração + título + descrição + ação.

### Formulários
- `.ce-form-grid` — `display: grid; gap: $ce-gap; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))`.
- `.ce-field` — `<label>` uppercase + `<input>` nativo. Variantes:
  - `.ce-field.prefix` — com prefixo (R$, @).
  - `.ce-field.error` — borda e mensagem.
  - `.ce-field.readonly` — fundo `$ce-surface-subtle`.
- `.ce-form-actions` — rodapé de formulário alinhado à direita, botões 44px.

### Botões
- `.ce-btn-primary` — preenchido com `$ce-ink-700`.
- `.ce-btn-secondary` — branco com borda `$ce-border-input`.
- `.ce-btn-ghost` — transparente, texto `$ce-ink-700`.
- `.ce-btn-danger` — branco com borda `$ce-danger-action`.
- `.ce-btn-success` — preenchido `$ce-success`.
- `.ce-btn-icon` — quadrado 40px.
- Mínimo **44px** de altura (touch target).

### Outros
- `.ce-chip` — pílula com `$ce-radius-pill`. Variantes por semântica.
- `.ce-badge` — chip menor com número.
- `.ce-segmented` — grupo de pílulas de alternância (lista ↔ grid, mês/ano).
- `.ce-summary` — KPI tile (rótulo uppercase + valor display + delta).
- `.ce-loading` — spinner centralizado + rótulo.
- `.ce-skeleton` — bloco animado.

## Mixins (em `_admin-ui.scss`)

Use **somente** quando o valor é parametrizável por tela.

- `@mixin ce-grid($min: 260px)` — grid responsivo.
- `@mixin ce-chip($ink, $bg)` — chip com cor customizada.
- `@mixin ce-btn-icon-ghost($ink)` — botão redondo transparente.
- `@mixin ce-icon-block($ink, $bg)` — bloco quadrado com ícone (atalhos no feed).
- `@mixin ce-progress` — barra de progresso.
- `@mixin ce-segmented` — grupo de abas tipo pílula.

> **Regra**: `@mixin` é expandido inline. Usá-lo onde a classe global serve
> replica o bloco em cada bundle de componente e come o budget
> `anyComponentStyle` (6kb aviso, 10kb erro).

## Material no projeto

O tema é `mat.theme()` em `src/styles.scss`. Fica para:
- `mat-datepicker`
- `mat-autocomplete`
- `mat-select`
- `mat-paginator`
- `mat-menu`
- `mat-dialog` (como veículo de overlay — a casca é nossa)

Os demais campos são `<label>` + `<input>` com `.ce-field`.

## Responsividade

- Breakpoints via `_breakpoints.scss`: `mobile` (≤599px), `tablet-up` (≥600px),
  `desktop` (≥1024px).
- Grid: `repeat(auto-fit, minmax(X, 1fr))` — nada de media query no grid.
- Media query **só** para rail ↔ drawer.
- Touch target mínimo 44px.

## Acessibilidade

- Contraste AA mínimo. `$ce-warn` sobre `$ce-warn-soft` passa; `$ce-text-label`
  sobre `$ce-surface` passa.
- `color-scheme: light`.
- `getByLabel()` dos e2e assume `<label>` + `<input>` nativo — por isso
  evitamos `mat-form-field` fora dos casos listados.
- Foco visível em todos os botões e inputs (não remover outline sem substituir).
