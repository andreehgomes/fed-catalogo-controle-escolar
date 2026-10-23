# Redesign — Ponto de retomada

> Documento vivo da sessão de redesign. Serve para continuar o trabalho em
> uma janela de contexto limpa.
>
> **Branch atual:** `feature/redesign`
> **Último commit:** `f09962e redesign`
> **Working tree:** limpo (tudo commitado até aqui).

## 1. Onde paramos

Todas as mudanças abaixo estão commitadas em `feature/redesign` e o build
Angular passa (`npx ng build` sem erros, só deprecation warning esperada do
`@import "colors"` e warnings preexistentes de arquivos TS não referenciados).

### Fundação (Fases 1–4) — concluídas

- **Docs base** em `docs/`:
  - [`analise/redesign-estado-atual.md`](../analise/redesign-estado-atual.md) — inventário congelado.
  - [`plano/redesign-controle-escolar.md`](redesign-controle-escolar.md) — plano em 8 fases.
  - [`design-system.md`](../design-system.md) — guia visual.
  - [`CLAUDE.md`](../../CLAUDE.md) na raiz.
- **Design system `ce-*`** em `src/app/shared/style/`:
  - `_tokens.scss` — casca azul escolar, superfícies claras, rampa de texto, semânticas, raios, sombras, layout, tipografia **Instrument Sans**.
  - `_breakpoints.scss` — `mobile`, `tablet-up`, `desktop`, `shell-narrow`/`shell-wide`.
  - `_admin-ui.scss` — mixins parametrizáveis: `ce-grid`, `ce-chip`, `ce-btn-icon-ghost`, `ce-icon-block`, `ce-progress`, `ce-segmented`, **`ce-field-mat`** (ver nota crítica abaixo).
- **`_colors.scss`** reapontado: cada `$c-*` legado agora resolve para o `$ce-*` equivalente, mantendo 214 referências vivas nas 25 features.
- **`styles.scss` reescrito** com classes globais `ce-*` (page/card/panel/field/btn-*/list/chip/segmented/info-block/empty-state/summary/loading/skeleton) + `@include ce-field-mat;` + overrides globais do `mat-mdc-select-panel`/`mat-mdc-autocomplete-panel` para o visual casar com o dropdown nativo.
- **`index.html`** com Instrument Sans + Material Symbols Rounded carregados do Google Fonts, splash com `$ce-gradient-shell`.
- **Shell novo** (`src/app/app.component.{ts,html,scss}`): `<aside class="ce-nav">` com rail 76 / expandido 264 / drawer 272 sobreposto <900px, header sticky translúcido com `backdrop-filter: blur(14px)`, scroll interno a `.ce-content`. RBAC preservado 1-a-1 (`!isEstagiario`, `isMaster`). Rotas **fora do shell**: `login`, `new-account`, `redefine-password`, `reset-password`, `error`, `c/:key`.
- **`material.module.ts`** ganhou `MatTooltipModule` (usado no rail).

### Features migradas para o DS (Fase 5)

Feitas até agora (todas com `.ce-page`, cabeçalho `.ce-page-header`, botões `.ce-btn-*`, chips `.ce-chip`, filtros em grid, empty states `.ce-empty-state` quando aplicável; ts/módulo **intocados** em todas):

| Feature | Molde |
|---|---|
| **Feed** | `.ce-page` com hero escuro + grid auto-fit de atalhos coloridos por `data-color`. |
| **Login** | Fora do shell; card branco centralizado sobre `$ce-gradient-hero`; campos `<label class="ce-field">` + `<input>` nativo. |
| **campaign-list** | Grid auto-fit de cards com chip de status, barra de progresso de meta via `ce-progress` + `--ce-progress-value`. |
| **sale-list** | Grid auto-fit; chips de status success/warn, saldo pendente em `$ce-danger-data`. |
| **entrega-list** | Dois `ce-summary` coloridos (entregues/faltando) + `mat-tab-group` com badges + cards com pills ce-chip (success/warn/danger/info) + comprovante verde. |
| **client-list** | Lista densa `.ce-list` + `.ce-list-row` com avatar inicial, nome, telefone, edit/delete. |
| **entrega-detail** | `.ce-page--detalhe` com 5 ce-cards (cabeçalho + saldo tiles / progresso / ações entrega / histórico edit inline / recebimentos edit inline). |
| **Dashboard** | Filtros em grid + 8 KPIs em `ce-summary` com `data-tint` + card de meta + 4 `mat-expansion-panel` estilizados como ce-card. |
| **contas-a-receber** | Filtros (busca + mat-select + `ce-segmented` + ghost) + 2 ce-summary + cards com 4 ações (Receber primary à direita). |
| **listar-recebimentos** | Filtros + `ce-summary` verde + cards com cliente clicável acessível. |
| **expense-list** | Grid auto-fit; valor vermelho (despesa=danger); "sem comprovante" discreto. |
| **sponsor-list** | 2 ce-summary coloridos (dinheiro verde / produto azul) + grid de cards com chips semânticos. |
| **account-list** | Lista densa com avatar, "· você" quando é o próprio usuário, chip de perfil (master=success/admin=info/estagiário=danger), delete desabilitado para si. |
| **new-sale** | **Primeiro formulário.** `.ce-page--form` + `.ce-panel`; molde para os outros 6 (new-campaign, new-client, new-expense, new-sponsor, new-account, redefine-password). |

### Nota crítica sobre o `ce-field-mat` (ganho desta sessão)

O mixin `ce-field-mat` em `_admin-ui.scss` **alinha o `mat-form-field appearance="outline"` ao `.ce-field` nativo**. É portado do `ep-field-mat` do confecções, mas **tem tokens adicionais que o confecções não tem** — essenciais para o Material v20.2.7 M3 real desta versão:

```scss
--mat-form-field-outlined-outline-color       // v20 M3 — pinta .mat-mdc-notch-piece
--mat-form-field-outlined-hover-outline-color
--mat-form-field-outlined-focus-outline-color
--mat-form-field-outlined-error-outline-color
--mat-form-field-outlined-outline-width: 1px
--mat-form-field-outlined-container-shape     // raio do leading/trailing
```

Sem esses tokens novos, a borda do notched-outline sai cinza default
`rgb(119, 118, 128)` com raio 4px. **Se for propagar esse mixin para
cosméticos/confecções, inclua esses tokens.**

Outras duas correções que fiz nesta sessão e ficam valendo para todas as
features:

1. **`.ce-field` passou a estilizar `> span` E `> label`** (antes só `> label`, que nunca batia no html `<label class="ce-field"><span>...</span>`).
2. **Dropdown do `mat-select-panel`/`mat-mdc-autocomplete-panel`** foi estilizado em `styles.scss` para igualar o `.ns-suggestions` do new-sale: fundo branco, borda `$ce-border`, raio `$ce-radius-sm`, sombra `$ce-shadow-panel`, padding 4px, opções 40px com hover/selected em `$ce-accent-soft`.
3. **Hints posicionadas absolute**: para evitar que uma mensagem abaixo de um campo desalinhe os vizinhos no grid, hints devem ser `position: absolute; top: 100%`.

## 2. Pendente (Fases 5.c–8)

### Formulários restantes (molde = new-sale)

- `new-campaign` — tem FormArray de `itensPadrao` e `patrocinadores` (ver domain). Mais parecido com new-sale.
- `new-client` — simples: nome, telefone. Molde para new-expense/new-sponsor.
- `new-expense` — tem upload de comprovante (storage).
- `new-sponsor` — nome, tipo (valor/produto), valor OU produto, observação.
- `new-account` — nome, email, telefone, perfil.
- `redefine-password` — fora do shell (já).

### Detalhes restantes

- `campaign-detail` — tela densa com totais, lista de patrocinadores, lista de vendas.
- `client-detail` — detalhes do cliente + histórico de vendas.
- `recebimento` — formulário de registro de pagamento vindo de contas-a-receber.

### Especial

- **`campaign-public` (`c/:key`)** — rota pública, compartilhável, com `html2canvas`. Decisão pendente: seguir o DS ou manter layout isolado de impressão. **Recomendação:** manter isolada, usar `$ce-font-print` (pilha de sistema) para o html2canvas renderizar bem.
- `page-error` — tela de erro simples.

### Fase 6 — Componentes compartilhados

Pendentes de migração:
- `card-alert` → já funciona dentro de `.ce-info-block`, mas o componente em si ainda tem SCSS antigo. Converter.
- `confirm-delete-dialog` → casca própria + overlay Material como veículo.
- `input-moeda` → absorvido pelo `.ce-field` com prefix.
- `lista-recebimentos` → `.ce-list` com linhas específicas. **Já aparece embutido em contas-a-receber mas com estilo antigo.**
- `loader` → `.ce-loading`.
- `toolbar` → **remover** (shell cobre).
- `footer` → remover ou integrar.

### Fase 7 — Limpeza

Depois que a última feature migrar:
1. Remover `_colors.scss` (quando ninguém referenciar `$c-*`).
2. Remover classes utilitárias `.c-primary`, `.c-red`, `.c-yellow`.
3. Remover Roboto do `index.html` (não está mais lá — já removido).
4. Migrar `@import "colors"` para `@use` nos SCSS das features (ou remover junto com `_colors.scss`).

### Fase 8 — Qualidade (opcional)

- Substituir `codelyzer`/`tslint` por `angular-eslint 20`.
- Adicionar Playwright para e2e dos fluxos críticos (login, nova venda, nova entrega, confirmar pagamento, campanha pública).

## 3. Decisões e padrões consolidados nesta sessão

Para evitar refazer no próximo passo:

- **Prefixo do DS:** `ce-*` (controle-escolar).
- **NgModules mantidos** (não migrar para standalone — cosméticos e confecções também estão em NgModules).
- **Filtros de lista** seguem padrão: grid `2fr / 1.x fr / auto` com busca `.ce-field--search` + mat-select (com `::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none }` para alinhar altura) + `.ce-btn-ghost` Limpar.
- **Busca com ícone absoluto**: `.ce-field--search` tem `.ce-field-prefix-icon` posicionado `left: 12px; top: 50%; transform: translateY(-50%)` e `input { padding-left: 40px }`.
- **Chips semânticos**: `.ce-chip` + `.success` / `.info` / `.warn` / `.danger` / `.accent` (classes já no `styles.scss`).
- **Botão de excluir** em cards/linhas: `.ce-btn-icon` com hover `$ce-danger-action` + `$ce-danger-soft` via `!important`.
- **Empty states** diferenciam "nada cadastrado" × "sem resultado para filtros".
- **Totais inline no subtítulo** (`.ce-page-subtitle`): contador + "· R$ xxx" quando há agregação monetária. Para destacar, usar um `.ce-summary` separado.
- **Grid de 2 colunas com mat-form-field + .ce-field**: usar `align-items: end` para alinhar os inputs (mat tem `margin-top: 20px` do mixin).
- **Hints abaixo de inputs**: `position: absolute; top: 100%` para não desalinhar vizinhos.
- **Textarea Material**: usa `mat-form-field` (justifica pelo `mat-error`); respira melhor com o mixin.
- **Formulário inline em bloco**: usar `.ce-block` com `h3.ce-section-title` e `.ce-form-actions.form-inline-actions`.

## 4. Como retomar

1. Abrir este projeto em uma nova janela do Claude Code.
2. Ler, **nesta ordem**:
   - [`docs/plano/redesign-controle-escolar.md`](redesign-controle-escolar.md) (plano das fases)
   - [`docs/design-system.md`](../design-system.md) (guia visual)
   - Este documento
   - `src/app/shared/style/_tokens.scss` e `_admin-ui.scss`
   - `src/styles.scss`
   - `src/app/feature/new-sale/` (molde dos formulários)
3. Para a **próxima feature**, perguntar ao usuário qual (sugerido: `new-client`, por ser o molde dos outros formulários simples). Seguir o padrão do new-sale, lendo primeiro os três arquivos (ts/html/scss) da feature alvo + um ou dois irmãos (ex.: new-sale, campaign-list).
4. Validar com `npx ng build` ao final.
5. Se um campo visual não parecer certo, **abrir o navegador** no `localhost:4200` (dev server já roda, não subir outra porta) e inspecionar os tokens reais com `mcp__Claude_Browser__javascript_tool` **antes** de supor a causa.

## 5. Observações do usuário durante a sessão

- Preferência por verificar antes de supor (não ficar chutando overrides CSS).
- Preferência por reaproveitar o que já existe nos projetos-irmãos (ganho confirmado com `ce-field-mat`).
- O dev server já roda em `localhost:4200`; **não subir outro na porta 4201**.
