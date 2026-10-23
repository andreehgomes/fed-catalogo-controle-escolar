# Redesign — Estado atual do `fed-catalogo-controle-escolar`

> Inventário congelado em **2026-10-23**, antes do redesign. Serve de linha de base
> para o plano em [`docs/plano/redesign-controle-escolar.md`](../plano/redesign-controle-escolar.md)
> e para o guia visual em [`docs/design-system.md`](../design-system.md).

## 1. Stack

| Item | Versão | Observação |
|---|---|---|
| Angular | 20.3.3 | Alinhado com cosméticos / confecções (compara-precos já em 22). |
| Angular Material | 20.2.7 | `mat.theme()` com `mat.$blue-palette`. |
| Angular CDK | 20.2.7 | — |
| Angular Fire | 20.0.1 | — |
| Firebase SDK | 12.3.0 | **Realtime Database**, não Firestore. |
| moment | 2.29.4 | Datas. |
| html2canvas | 1.4.1 | Comprovante / impressão da `campaign-public`. |
| Builder | `@angular-builders/custom-webpack` 20 | Igual aos irmãos. |
| ng-process-env | 15.0.1 | Injeta Firebase prod no build de CI. |
| Lint | `codelyzer` + `ng lint` legado | **Fora do padrão**: confecções usa ESLint 10 + angular-eslint 20. |
| E2E | — | Nenhum. Confecções/compara-precos têm Playwright. |
| Testes | Karma + Jasmine | Igual aos cosméticos / confecções. |

## 2. Estrutura

- Ainda em **NgModules** (`app.module.ts`, `app-routing.module.ts`, `material.module.ts`), com uma `*.module.ts` por tela e `loadChildren` para lazy. **Mesmo padrão de cosméticos / confecções** — não é dívida, não vamos migrar para standalone neste redesign.
- 25 features em `src/app/feature/`:
  - **Autenticação / conta:** `login`, `new-account`, `redefine-password`, `page-error`.
  - **Campanhas:** `feed`, `campaign-list`, `new-campaign`, `campaign-detail`, `campaign-public`, `new-sponsor`, `sponsor-list`.
  - **Clientes:** `client-list`, `new-client`, `client-detail`.
  - **Vendas / financeiro:** `new-sale`, `sale-list`, `contas-a-receber`, `recebimento`, `listar-recebimentos`.
  - **Despesas:** `new-expense`, `expense-list`.
  - **Entregas:** `entrega-list`, `entrega-detail` *(implementadas recentemente — commits `01e9566` / `4558b44`)*.
  - **Gestão:** `dashboard`, `account-list`.
- `src/app/components/` — compartilhados em módulos próprios: `card-alert`, `confirm-delete-dialog`, `footer`, `input-moeda`, `lista-recebimentos`, `loader`, `toolbar`.
- `src/app/shared/` — modelos (`path.enum.ts`, `profile.enum.ts`, …), serviços, pipes, helpers. **Sem `shared/style/`** — é a lacuna estrutural que o redesign preenche.
- `src/app/core/` — infra: `auth`, `guards` (`authGuard`, `roleGuard`), `config-firebase`, `router.enum.ts`.

## 3. Roteamento e acesso

- Todas as telas pós-login passam por `authGuard` **e** `roleGuard` — exceto `entrega-list` e `entrega-detail`, que ficam **só com `authGuard`** (estagiário acessa).
- Rota pública: `c/:key` → `campaign-public`. Compartilhável externamente (link enviado a patrocinadores), capturada com `html2canvas` para gerar imagem.
- Rota curinga `**` cai no feed.

**Perfis** (`profile.enum.ts` / `role.guard.ts`):
- **Master** — vê tudo, inclusive `account-list` (gerenciar usuários).
- **Operacional** (padrão) — vê tudo, menos `account-list`.
- **Estagiário** — vê apenas `feed` + `entrega-list` + `entrega-detail` + logout.

Qualquer reescrita do shell precisa preservar 1-a-1 os `*ngIf="!isEstagiario"` e `*ngIf="isMaster"` que hoje escondem itens do menu.

## 4. Shell atual (`AppComponent`)

- `mat-drawer-container` + `mat-drawer mode="over"` + mini-FAB flutuante (`btn-menu-float`) para abrir.
- Header dentro do drawer com gradiente azul primary → primary-dark, ícone `school`, botão fechar.
- Lista de navegação em `mat-nav-list`, com `mat-divider` e rótulos de seção (`.nav-section-label`): **Campanhas**, **Vendas & Clientes**, **Gestão**.
- Rodapé do drawer com rótulo *"Controle de Campanhas Escolares"*.
- Scroll é do **`body`**, não interno à área de conteúdo.
- Login, nova conta, redefinir senha, página de erro e `campaign-public` ficam dentro do shell (não são "fora" como nos irmãos).

É o padrão antigo descrito nos irmãos como *"insuficiente — vira drawer até em desktop e tem mini-FAB sobrepondo conteúdo"*.

## 5. Visual

### 5.1 `src/styles.scss`

- Importa `@angular/material` e `./app/shared/style/colors`.
- `mat.theme()` com `mat.$blue-palette` para `primary` e `tertiary`, tipografia Roboto, densidade 0.
- **Aplica gradiente escuro `linear-gradient(135deg, #0a1929 0%, #102a43 100%)`** em `.mat-typography`, `body` (fundo `#0a1929`), `.content`, `.containers`, `.body`, `mat-drawer-container`, `mat-drawer-content`, `.mat-drawer-container`, `.mat-drawer-content` — este último com `!important`.
- **Overrides globais `!important`** para pintar inputs em branco por cima do escuro (`.filtros` tem 60 linhas de `color: #fff !important`, `caret-color: #fff !important`, `border-color: rgba(255,255,255,.4) !important`).
- `.mat-mdc-select-panel` com fundo `#102a43 !important`, opções em branco.
- Snackbar `.snack-sucesso` com verde `#297000`.

É exatamente o *"aspecto remendado"* que os três irmãos documentam ter abandonado.

### 5.2 `_colors.scss`

- Paleta Material crua: `$c-primary: #1565c0`, `$c-primary-dark: #003c8f`, `$c-secondary: #0d47a1`, `$c-accent: #1976d2`, `$c-background: #e3f2fd`.
- Alertas / semânticas: `$c-red: #e42a1d`, `$c-red-alert: #721c24`, `$c-yellow-alert: #ff6f00`, `$c-blue-alert: #3174da`, `$c-green-alert: #297000`, cada um com variantes `-light` / `-border`.
- Aliases confusos: `$c-pink-saudacao: $c-primary-dark`, `$c-pink-accent: $c-primary` (nome herdado de outro app, nunca ajustado).
- Classes utilitárias `.c-primary`, `.c-red`, `.c-yellow`, … — pintam apenas `background-color`.

**Sem rampa, sem tokens semânticos (surface/text/border), sem tipografia tokenizada, sem raios, sem sombras.**

### 5.3 Tipografia e ícones

- Fonte: **Roboto** (Material default).
- Ícones: `<mat-icon>` com nomes do set outlined padrão. Glifos usados nas 25 features: `school`, `campaign`, `local_shipping`, `receipt_long`, `receipt`, `point_of_sale`, `payments`, `request_quote`, `person_add`, `people`, `manage_accounts`, `add_card`, `group`, `logout`, `login`, `menu`, `close`, `dashboard`, `home`, `list_alt`, `warning_amber`.

### 5.4 Componentes compartilhados

| Componente | Papel atual | Equivalente no padrão alvo |
|---|---|---|
| `card-alert` | Caixa colorida de alerta/aviso. | `.ce-info-block` |
| `confirm-delete-dialog` | Diálogo de confirmação com overlay Material. | Casca própria + overlay Material como veículo. |
| `footer` | Rodapé fixo. | Absorvido pelo shell. |
| `input-moeda` | Input com prefixo R$ e máscara. | `.ce-field` com `prefix`. |
| `lista-recebimentos` | Lista aninhada em detalhes de venda. | `.ce-list` com linhas específicas. |
| `loader` | Dialog Material full-screen. | `.ce-loading` + flag local onde há concorrência (ver nota em `CLAUDE.md`). |
| `toolbar` | Barra superior fixa. | Removido — vira shell. |

## 6. Dados (Firebase RTDB)

- Caminhos declarados em `src/app/shared/model/path.enum.ts`: `CAMPAIGN`, `SALE`, `CLIENT`, `EXPENSE`, `SPONSOR`, `RECEBIMENTO`, `ENTREGA`, `ACCOUNT`, …
- Serviços envolvem o SDK modular do Firebase (`onValue`, `push`, `update`, `remove`, `query`) em `new Observable()`.
- Auth: `inject(Auth)`, estado em `AuthStateService`, token em `localStorage` base64, restaurado em `InitAuthService`. **Não há** `signInAnonymously` (tudo exige login).
- Nenhuma mudança de dados é prevista no redesign.

## 7. Documentação existente

- `docs/analise/` — análises de features recentes (listar-usuarios, RBAC, entregas).
- `docs/plano/` — planos aprovados (feature-entregas, RBAC estagiário, pagamento de entrega, …).
- `docs/plano-executado/` — histórico (segue a regra global do `CLAUDE.md` do usuário: planos daqui **não** geram registro adicional).

Não há `design-system.md`, `CLAUDE.md`, ADRs ou styleguide. O redesign introduz os dois primeiros.

## 8. Pontos fracos vs irmãos (resumo)

1. **Visual escuro remendado** com `!important` em inputs — maior fonte de dívida visual.
2. **Sem design system próprio** (`shared/style/_tokens.scss`, `_breakpoints.scss`, `_admin-ui.scss`).
3. **Sem `CLAUDE.md`** — nenhum guia escrito para quem (humano ou IA) edita o projeto.
4. **Shell `mat-drawer` com mini-FAB** em vez de rail 76 / expandido 264 / drawer <900px.
5. **Scroll do `body`** em vez de interno à área de conteúdo.
6. **Formulários inteiramente em `mat-form-field`** — fora do padrão `<label>` + `<input>` nativo adotado nos irmãos.
7. **Lint legado** (`codelyzer` + `tslint`).

## 9. Pontos fortes a preservar

- Dados em RTDB estáveis — nenhum serviço precisa mudar.
- RBAC já funcionando (`authGuard`, `roleGuard`, `profile.enum.ts`).
- Rotas estabilizadas e **com link externo ativo** (`c/:key`).
- Feature de entregas recém-entregue, com contadores e controle de pagamento — base para validar que o redesign não regride.
- Enum `Routes` centralizado em `core/router.enum.ts` — qualquer reescrita do shell depende apenas dele.
