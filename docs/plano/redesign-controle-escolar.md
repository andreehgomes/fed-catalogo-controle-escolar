# Plano — Redesign `fed-catalogo-controle-escolar`

> Base: [`docs/analise/redesign-estado-atual.md`](../analise/redesign-estado-atual.md).
> Guia visual: [`docs/design-system.md`](../design-system.md).
> **Prefixo do design system: `ce-*`** (controle-escolar).

## Objetivo

Alinhar o projeto com `fed-catalogo-cosmeticos`, `fed-catalogo-confeccoes` e
`fed-catalogo-compara-precos`: superfície clara, casca escura só na sidebar,
rail 76 / expandido 264 / drawer <900, tokens próprios, classes globais `ce-*`,
sem gradiente escuro e sem overrides `!important` em input.

**Fora do escopo**: migrar para standalone (cosméticos e confecções também
estão em NgModules — não é dívida do projeto), trocar Firebase RTDB por
Firestore, mexer em regras RBAC ou alterar paths de rota.

## Princípios

- **Nada no banco muda.** `path.enum.ts` e serviços seguem como estão.
- **Rotas não mudam.** `c/:key` continua pública e compartilhável.
- **RBAC preservado 1-a-1.** `*ngIf="!isEstagiario"` e `*ngIf="isMaster"` mapeados antes de reescrever o shell.
- **`_colors.scss` sobrevive** durante a migração, com `$c-*` reapontando para os `$ce-*` — não quebrar as 25 features de uma vez.
- **Classe global antes de mixin.** No SCSS do componente só o que é dele.
- **Material fica onde precisa**: `mat-datepicker`, `mat-autocomplete`, `mat-select`, `mat-paginator`, `mat-menu`, `mat-dialog`. Resto vira `<label>` + `<input>`.

## Fases

### Fase 1 — Documentação base
- `docs/analise/redesign-estado-atual.md` ✅
- `docs/plano/redesign-controle-escolar.md` ✅
- `docs/design-system.md` ✅
- `CLAUDE.md` na raiz ✅

### Fase 2 — Fundação de tokens
1. Criar `src/app/shared/style/_tokens.scss` com:
   - Casca azul-escolar (plum do confecções → azul profundo da marca).
   - Rampa clara de superfícies: canvas (`#f6f3f1`/similar), card, input, bloco interno.
   - Rampa de texto: base → strong → body → secondary → muted → label → placeholder → disabled.
   - Semânticas: success / info / warn / danger (dois vermelhos distintos como no confecções: valor x ação).
   - Tipografia (Instrument Sans), raios, sombras, layout (rail 76, nav 264, breakpoint 900, content-max 1180, detail-max 1080, form-max 940).
2. Criar `src/app/shared/style/_breakpoints.scss` (mesmo contrato do confecções).
3. Criar `src/app/shared/style/_admin-ui.scss` com mixins só parametrizáveis: `ce-grid($min)`, `ce-chip($ink, $bg)`, `ce-btn-icon-ghost(...)`, `ce-icon-block(...)`, `ce-progress`, `ce-segmented`.
4. **Manter `_colors.scss`**: cada `$c-*` reaponta para o `$ce-*` equivalente — fallback de compatibilidade enquanto features são migradas.

### Fase 3 — `styles.scss` novo
1. Remover `background: linear-gradient(135deg, #0a1929 0%, #102a43 100%)` do `.mat-typography`, `.content`, `.containers`, `.body`, `mat-drawer-container`, `mat-drawer-content`.
2. Remover bloco `.filtros` com 60 linhas de `!important`.
3. Remover `.mat-mdc-select-panel { background: #102a43 !important }` e similares.
4. `color-scheme: light` no `body`; fundo `$ce-bg`.
5. Trocar paleta Material: `primary: mat.$blue-palette` (ou paleta M3 custom se quisermos acento exato), tipografia Instrument Sans.
6. Mapear `.material-icons` → Material Symbols Rounded.
7. Carregar Google Fonts (Instrument Sans) e Material Symbols Rounded no `index.html`.
8. Expor classes globais `ce-page`, `ce-page-header`, `ce-card`, `ce-block`, `ce-panel`, `ce-field`, `ce-btn-*`, `ce-list`, `ce-list-row`, `ce-empty-state`, `ce-info-block`, `ce-form-grid`, `ce-form-actions`, `ce-chip`, `ce-segmented`, `ce-summary`, `ce-loading`, `ce-skeleton`.

### Fase 4 — Shell novo
1. Novo `AppComponent`:
   - `<aside class="ce-nav">` com rail 76px → hover/click para expandido 264px.
   - Abaixo de 900px, vira drawer sobreposto (abre por botão no header, não FAB).
   - Header sticky translúcido `rgba(255,255,255,0.82)` + `backdrop-filter: blur(14px)`.
   - Scroll interno em `.ce-content`, não no `body`.
2. Manter `AuthStateService` e `LoginService` — nenhum serviço muda.
3. Mapear os `*ngIf` do menu atual para o novo shell preservando perfil:
   - Estagiário vê: Página inicial, Entregas, Sair.
   - Operacional vê: tudo, menos Usuários.
   - Master vê: tudo.
4. Login, nova conta, redefinir senha e page-error ficam **fora** do shell (rota solta, igual confecções).
5. `campaign-public` (`c/:key`) também **fora** do shell — tela de impressão.

### Fase 5 — Features (ordem por risco/retorno)
1. **Feed / Dashboard** — telas de entrada, maior impacto visual.
2. **Login** — primeira tela que o usuário vê; polir já aqui.
3. **Listas**: `campaign-list`, `sale-list`, `client-list`, `entrega-list`, `expense-list`, `listar-recebimentos`, `contas-a-receber`, `sponsor-list`, `account-list`. Molde: `.ce-page` + `.ce-page-header` + `.ce-list` ou grid de `.ce-card`.
4. **Detalhes**: `campaign-detail`, `client-detail`, `entrega-detail`, `recebimento`.
5. **Formulários**: `new-campaign`, `new-sale`, `new-client`, `new-expense`, `new-sponsor`, `new-account`, `redefine-password`.
6. **Pública**: `campaign-public` — decidir cedo entre seguir o DS ou manter layout isolado de impressão (recomendação: layout isolado, com html2canvas usando pilha de fonte de sistema como no confecções).

### Fase 6 — Componentes compartilhados
- `card-alert` → `ce-info-block` (quatro variantes: info, success, warn, danger).
- `confirm-delete-dialog` → casca própria com overlay Material como veículo.
- `input-moeda` → absorvido por `ce-field` com `prefix`.
- `lista-recebimentos` → `ce-list` com linhas específicas.
- `loader` → `ce-loading`; features com concorrência (comprovante, exportação) usam flag local.
- `toolbar` → **removido** (shell cobre).
- `footer` → removido ou integrado ao shell.

### Fase 7 — Limpeza
1. Remover `_colors.scss` quando nenhum arquivo referenciar `$c-*`.
2. Remover classes utilitárias `.c-primary`, `.c-red`, `.c-yellow`.
3. Remover Roboto do `index.html`.
4. Revisar `anyComponentStyle` budget — alvo ≤ 6kb por tela (classes globais ajudam).

### Fase 8 — Qualidade (opcional, decidir após Fase 5)
- Trocar `codelyzer`/`tslint` por `angular-eslint 20` (espelhar config do confecções).
- Adicionar Playwright para e2e dos fluxos críticos: login, nova venda, nova entrega, confirmar pagamento, campanha pública.

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Quebrar `campaign-public` (link externo) | Mantê-la fora do shell e manter visual próprio; validar com `html2canvas` cedo. |
| Quebrar RBAC do estagiário | Mapear menu 1-a-1 antes de reescrever `AppComponent`. Testar com conta estagiário em cada entrega de fase. |
| Regressão na feature de entregas (recente) | É a primeira feature a passar por smoke test após shell novo e lista nova. |
| Budget `anyComponentStyle` | Classes globais (não mixins) em componentes repetidos. |
| Perda de contraste em dark do navegador | `color-scheme: light` no body; sem suporte a dark no primeiro ciclo. |
| Divergência de glifos ao trocar para Material Symbols Rounded | Verificar cedo: `school`, `campaign`, `local_shipping`, `receipt_long`, `point_of_sale`, `payments`, `request_quote`, `person_add`, `people`, `manage_accounts`, `add_card`, `group`, `dashboard`. |

## Rastreio

- Cada fase vira um bloco em `docs/plano-executado/` **exceto** quando o plano
  está dentro de `docs/plano-executado/plano/` (regra global do usuário em
  `~/.claude/CLAUDE.md`). Este plano vive em `docs/plano/`, então **gera**
  registro de execução.
- Commits por fase, não por feature grande — fica mais fácil reverter se um
  passo visual der ruim.
