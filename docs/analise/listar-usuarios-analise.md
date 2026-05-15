# Análise: Listar Usuários Cadastrados

**Data:** 2026-05-15
**Projeto:** fed-catalogo-controle-escolar
**Escopo:** Criar tela de listagem dos usuários cadastrados no sistema, com suporte a busca, visualização de perfil e ações de gestão (editar, excluir).

---

## 1. Contexto

O projeto já possui um fluxo completo de **criação de usuários** via `new-account` (rota protegida por `authGuard`). O `AccountService` (`src/app/shared/service/account/account.service.ts`) expõe o método `getAllAccount()` que busca todos os registros da coleção `account` no Firebase Realtime Database.

**O que já existe:**
- `AccountService.getAllAccount()` — retorna `{ key, nome, email, celular, data_nascimento, uid }`
- `AccountService.getAccountByUidKey(uid)` — retorna também o campo `perfil`
- `AccountService.updateAccount()` e `AccountService.deleteAccount()`
- `AccountDataService` — serviço de estado para compartilhar a conta selecionada entre componentes
- `NewAccount` class e `AccountModel` interface com os campos básicos
- Perfis de usuário conhecidos: `"admin"`, `"estagiario"` (cadastro) e `"master"` (detectado em `app.component.ts`)
- Controle de acesso `isMaster` já presente em `AppComponent`

**O que falta:**
- Feature `account-list`: módulo, componente, rota e entrada no menu lateral
- O método `getAllAccount()` **não retorna o campo `perfil`** — é necessário incluí-lo
- Não há rota `account-list` em `RouterEnum` nem em `app-routing.module.ts`
- Não há entrada no menu lateral (`app.component.html`) para acessar a listagem

---

## 2. Dados Disponíveis

| Fonte | Localização | Dados retornados |
|---|---|---|
| Firebase Realtime DB — `account` | `AccountService.getAllAccount()` | `key`, `nome`, `email`, `celular`, `data_nascimento`, `uid` |
| Firebase Realtime DB — `account` (por UID) | `AccountService.getAccountByUidKey(uid)` | idem + `perfil` |
| Estado compartilhado | `AccountDataService.obtemAccount()` | conta selecionada para edição |
| Firebase Auth | `AuthStateService.getAuthState()` | usuário autenticado atual |

> **Atenção:** `getAllAccount()` não inclui `perfil` no mapeamento. A correção deve ser feita no serviço antes de implementar a listagem.

---

## 3. Requisitos Funcionais

**RF-01** — A tela deve exibir todos os usuários cadastrados em forma de lista (cards ou tabela), mostrando: nome, e-mail, celular, data de nascimento e perfil.

**RF-02** — Deve haver um campo de busca em tempo real (debounce de 300–500ms) filtrando por nome ou e-mail no lado do cliente.

**RF-03** — Cada item da lista deve exibir um chip/badge com o perfil do usuário (`admin`, `estagiário`, `master`), com cores distintas para facilitar a identificação visual.

**RF-04** — A ação **Editar** deve preencher `AccountDataService` com o usuário selecionado e navegar para `/new-account`, que deve detectar o estado e entrar em modo de edição.

**RF-05** — A ação **Excluir** deve exibir um diálogo de confirmação (`ConfirmDeleteDialogComponent`) antes de chamar `AccountService.deleteAccount(key)`.

**RF-06** — Não deve ser possível excluir o próprio usuário autenticado — o botão de exclusão deve ser desabilitado/ocultado para o registro com `uid` igual ao do usuário logado.

**RF-07** — A tela deve ser acessível apenas por usuários com perfil `master` (guard ou verificação no componente com `isMaster`).

**RF-08** — Deve haver um botão **Novo usuário** que navega para `/new-account`.

**RF-09** — Durante o carregamento da lista, o `LoaderService` deve ser ativado; em caso de erro na busca, o loader deve ser fechado e uma mensagem de feedback exibida via `MatSnackBar`.

---

## 4. Requisitos Não Funcionais

**RNF-01 (Desempenho)** — A listagem usa lazy loading (módulo separado via `loadChildren`), seguindo o padrão de todas as outras features. A busca é filtrada no cliente (sem chamadas adicionais ao Firebase), evitando round-trips desnecessários para listas pequenas de usuários.

**RNF-02 (Responsividade)** — Layout deve seguir o padrão `client-list`: cards empilhados em mobile, podendo exibir em grid em telas maiores. Usar breakpoints do Angular CDK ou classes utilitárias já presentes no projeto.

**RNF-03 (Acessibilidade)** — Botões de ação (editar/excluir) devem ter `aria-label` descritivos. O campo de busca deve ter `aria-label`. Chips de perfil devem ter contraste WCAG AA mínimo.

**RNF-04 (Manutenibilidade)** — Componente declarado com `standalone: false` (padrão atual do projeto). Usar `inject()` não é necessário — manter injeção via `constructor` como nos componentes existentes. Separar lógica em métodos privados (`carregar()`, `confirmarExclusao()`), seguindo o padrão de `ClientListComponent`.

**RNF-05 (Testabilidade)** — O componente deve ser testável com mock de `AccountService` e `AccountDataService`. Os mocks devem retornar `Promise` resolvida para `getAllAccount()`.

**RNF-06 (Segurança)** — A rota deve estar protegida por `authGuard` (já usado em todas as rotas autenticadas). A verificação `isMaster` deve ser feita no componente ou em um guard dedicado — usuários sem o perfil `master` não devem ter acesso à listagem nem ao menu de entrada.

**RNF-07 (Internacionalização)** — O projeto não usa `ngx-translate`; textos em português diretamente no template, seguindo o padrão existente.

---

## 5. Estrutura de Componentes Proposta

```
src/app/feature/account-list/
├── account-list.module.ts
├── account-list-routing.module.ts
├── account-list.component.ts
├── account-list.component.html
└── account-list.component.scss
```

**Componente principal:** `AccountListComponent`
- Injeta: `AccountService`, `AccountDataService`, `Router`, `LoaderService`, `MatDialog`, `MatSnackBar`, `Auth` (para obter UID do usuário logado)
- Estado local: `accounts: AccountModel[]`, `searchCtrl: FormControl<string>`, `currentUserUid: string`

**Nenhum subcomponente novo é necessário** — reutiliza `ConfirmDeleteDialogComponent` (já disponível como módulo importável).

---

## 6. Dependências e Pré-condições

| Item | Estado atual | Ação necessária |
|---|---|---|
| `AccountService.getAllAccount()` | Existe, mas **não inclui `perfil`** | Adicionar `perfil: data[key].perfil ?? null` no mapeamento |
| `AccountModel` (`src/app/shared/model/accout.enum.ts`) | Não tem `perfil` | Adicionar campo `perfil?: string` |
| `NewAccount` class | Não tem `perfil` na versão de `src/app/shared/model/` | Verificar se edição de conta precisa atualizar `perfil` |
| `AccountDataService.obtemAccount()` | Existe para compartilhar conta entre componentes | Nenhuma — usar como está |
| `RouterEnum.ACCOUNT_LIST` | **Não existe** | Adicionar `ACCOUNT_LIST = "account-list"` |
| Rota `account-list` em `app-routing.module.ts` | **Não existe** | Adicionar lazy route com `canActivate: [authGuard]` |
| Menu lateral (`app.component.html`) | Não tem link para listagem de usuários | Adicionar item visível apenas quando `isMaster === true` |
| `ConfirmDeleteDialogComponent` | Existe e é importável via `ConfirmDeleteDialogModule` | Nenhuma — importar no módulo |
| `MaterialModule` | Centralizado e reutilizável | Nenhuma — importar no módulo |

---

## 7. Critérios de Aceitação

- [ ] A rota `/account-list` carrega apenas quando o usuário está autenticado (`authGuard`)
- [ ] Usuários sem perfil `master` não veem o link no menu lateral e recebem redirecionamento ao tentar acessar a rota diretamente
- [ ] A lista exibe nome, e-mail, celular, data de nascimento e perfil de todos os usuários cadastrados
- [ ] O campo de busca filtra por nome ou e-mail com debounce e sem chamar o Firebase novamente
- [ ] O chip de perfil exibe cores distintas para `admin`, `estagiário` e `master`
- [ ] O botão **Editar** navega para `/new-account` com os dados do usuário pré-preenchidos
- [ ] O botão **Excluir** abre o diálogo de confirmação antes de remover o registro
- [ ] O usuário logado não pode excluir a própria conta (botão desabilitado ou oculto)
- [ ] O `LoaderService` é ativado durante a requisição e fechado ao terminar (sucesso ou erro)
- [ ] Em caso de erro no carregamento, um `MatSnackBar` informa o usuário
- [ ] O botão **Novo usuário** navega corretamente para `/new-account`
- [ ] A página exibe estado vazio (mensagem informativa) quando não há usuários cadastrados
