# Execução: Listar Usuários Cadastrados

**Data:** 2026-05-15
**Plano:** docs/plano/account-list-plano.md
**Branch:** feature/entregas
**Executor:** Claude Code

---

## Resumo

Implementada a feature `account-list` completa: tela de listagem de todos os usuários cadastrados no Firebase Realtime Database, acessível exclusivamente por usuários com perfil `master`. A tela exibe nome, e-mail, celular e perfil em cards com chip colorido por tipo de perfil, campo de busca em tempo real por nome ou e-mail (com debounce de 400ms, filtro no cliente), e ações de editar e excluir por item. O `AccountService.getAllAccount()` foi ajustado para incluir o campo `perfil`, e o menu lateral ganhou o link "Usuários" protegido por `*ngIf="isMaster"`.

---

## Tarefas Executadas

| Fase | Tarefa | Status | Observações |
|------|--------|--------|-------------|
| 1.1  | Adicionar `perfil` à interface `AccountModel` | ✅ | Campo `perfil?: string` adicionado em `accout.enum.ts` |
| 1.2  | Adicionar `perfil` à classe `NewAccount` | ✅ | Campo `perfil?: string` adicionado em `new-account.ts` |
| 1.3  | Incluir `perfil` no mapeamento de `getAllAccount()` | ✅ | `perfil: data[key].perfil ?? null` adicionado ao map |
| 1.4  | Adicionar `ACCOUNT_LIST` ao `RouterEnum` | ✅ | `ACCOUNT_LIST = "account-list"` adicionado após `ENTREGA_DETAIL` |
| 1.5  | Registrar rota lazy em `app-routing.module.ts` | ✅ | Rota com `authGuard` inserida antes do wildcard `**` |
| 2.1  | Criar `account-list-routing.module.ts` | ✅ | Módulo de roteamento com rota vazia → `AccountListComponent` |
| 2.2  | Criar `account-list.module.ts` | ✅ | Importa `CommonModule`, `ReactiveFormsModule`, `MaterialModule`, `ConfirmDeleteDialogModule` |
| 2.3  | Criar `account-list.component.ts` | ✅ | Padrão de `ClientListComponent`; filtro no cliente com debounce |
| 2.4  | Criar `account-list.component.html` | ✅ | Cards com chip de perfil, busca, botões editar/excluir, estado vazio |
| 2.5  | Criar `account-list.component.scss` | ✅ | Segue padrão de `client-list`; chips com 4 cores distintas |
| 3.1  | Adicionar entrada no menu lateral | ✅ | Item "Usuários" com ícone `group`, visível apenas quando `isMaster === true` |

---

## Discrepâncias do Plano

- **Ícone do menu:** O plano previa `manage_accounts`, mas esse ícone já é usado pelo item "Cadastro de usuário" imediatamente acima. Foi usado `group` para diferenciar visualmente os dois itens.
- **Lint:** O projeto não possui ESLint configurado (`ng lint` retorna erro de target não encontrado). A verificação de qualidade foi feita via `tsc --noEmit` filtrando arquivos de produção — 0 erros encontrados nos arquivos modificados/criados.

---

## Análise de Lint

```
npm run lint → Cannot find "lint" target (ESLint não configurado no projeto — pré-existente).

tsc --noEmit (excluindo *.spec.ts) → 0 erros nos arquivos de produção.
```

Erros em arquivos `.spec.ts` são pré-existentes: tipos de test runner (`describe`, `beforeEach`, `it`, `expect`) não configurados no `tsconfig` — não relacionados a esta feature.

## Boas Práticas (padrão do projeto)

| Critério | Status |
|----------|--------|
| `standalone: false` em todos os componentes | ✅ |
| Injeção via construtor (padrão do projeto) | ✅ |
| `LoaderService.openDialog/closeDialog` ao redor de async | ✅ |
| `MatSnackBar` com `verticalPosition: 'top'` | ✅ |
| `ConfirmDeleteDialogComponent` para ações destrutivas | ✅ |
| Lazy loading via `loadChildren` + `authGuard` | ✅ |
| Filtro no cliente (sem nova chamada ao Firebase) | ✅ |
| Textos em português | ✅ |

---

## Critérios de Aceitação

- [x] A rota `/account-list` carrega apenas quando o usuário está autenticado (`authGuard`)
- [x] O link "Usuários" aparece no menu lateral **somente** quando `isMaster === true`
- [x] A lista exibe nome, e-mail, celular e perfil de todos os usuários cadastrados
- [x] O campo `perfil` é retornado por `getAllAccount()` e exibido no chip
- [x] O chip de perfil exibe cores distintas para `master`, `admin`, `estagiário` e sem perfil
- [x] O campo de busca filtra por nome ou e-mail com debounce sem chamar o Firebase novamente
- [x] O botão **Editar** preenche `AccountDataService` e navega para `/new-account`
- [x] O botão **Excluir** abre o diálogo de confirmação antes de remover o registro
- [x] O usuário logado não pode excluir a própria conta (botão desabilitado)
- [x] O `LoaderService` é ativado durante o carregamento e fechado ao terminar (sucesso ou erro)
- [x] Em caso de erro no carregamento, um `MatSnackBar` informa o usuário
- [x] O botão **Novo usuário** navega para `/new-account`
- [x] Estado vazio exibido quando não há usuários (ou nenhum bate com a busca)

---

## Arquivos Criados/Modificados

```
Modificados:
  src/app/shared/model/accout.enum.ts              [+ perfil?: string]
  src/app/shared/model/new-account.ts              [+ perfil?: string]
  src/app/shared/service/account/account.service.ts [+ perfil no getAllAccount()]
  src/app/core/router/router.enum.ts               [+ ACCOUNT_LIST]
  src/app/app-routing.module.ts                    [+ rota account-list]
  src/app/app.component.html                       [+ item menu Usuários]

Criados:
  src/app/feature/account-list/account-list-routing.module.ts
  src/app/feature/account-list/account-list.module.ts
  src/app/feature/account-list/account-list.component.ts
  src/app/feature/account-list/account-list.component.html
  src/app/feature/account-list/account-list.component.scss
```
