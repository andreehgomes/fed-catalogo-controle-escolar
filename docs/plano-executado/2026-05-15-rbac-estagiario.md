# Execução: RBAC — Perfil Estagiário

**Data:** 2026-05-15
**Plano:** [docs/plano/rbac-estagiario-plano.md](../plano/rbac-estagiario-plano.md)
**Branch:** feature/entregas
**Executor:** Claude Code

---

## Resumo

Implementado controle de acesso por perfil (RBAC) para restringir o perfil `estagiario` ao acesso exclusivo da área de Entregas. Criados `PerfilEnum`, `UserProfileService` e `roleGuard`; menu lateral, feed de cards e rotas foram protegidos conforme a matriz de acesso definida na análise.

---

## Tarefas Executadas

| Fase | Tarefa | Status | Observações |
|------|--------|--------|-------------|
| 1.1 | Adicionar `PerfilEnum` em `accout.enum.ts` | ✅ | Enum adicionado ao arquivo existente |
| 1.2 | Criar `UserProfileService` | ✅ | Criado em `src/app/shared/service/user-profile/` |
| 2.1 | Atualizar `app.component.ts` | ✅ | Injetado serviço; adicionado `isEstagiario`; atualizado `loadUserProfile` e `logout` |
| 2.2 | Atualizar `app.component.html` (menu) | ✅ | Seções restritas envolvidas com `ng-container *ngIf="!isEstagiario"` |
| 3.1 | Filtrar cards no `FeedComponent` | ✅ | `allCards` com `allowedPerfis`; `cards` filtrado no construtor |
| 4.1 | Criar `roleGuard` | ✅ | Criado em `src/app/core/guards/role.guard.ts` |
| 4.2 | Adicionar `roleGuard` nas rotas | ✅ | 19 rotas atualizadas com `canActivate: [authGuard, roleGuard]` |

---

## Discrepâncias do Plano

Nenhuma discrepância relevante. O estado do projeto correspondia exatamente ao descrito no plano.

---

## Análise de Lint

```
ng lint: Cannot find "lint" target — ESLint não está configurado no projeto (pré-existente, não relacionado a esta feature).

npx tsc --project tsconfig.app.json --noEmit: 0 erros encontrados.
```

---

## Boas Práticas Angular 20

O projeto usa Angular com NgModules (não standalone). As convenções verificadas seguem o padrão existente do projeto:

| Critério | Status | Observação |
|----------|--------|-----------|
| Padrão do projeto: constructor injection em serviços/componentes | ✅ | Seguido em `AppComponent` e `FeedComponent` |
| Padrão do projeto: `inject()` em guards funcionais | ✅ | `roleGuard` segue o mesmo padrão de `authGuard` |
| `BehaviorSubject` para estado reativo | ✅ | Usado em `UserProfileService` |
| `*ngIf` / `ng-container` para visibilidade no template | ✅ | Sem elemento DOM extra |
| `standalone: false` nos componentes | ✅ | Não alterado |
| OnPush / `inject()` / `@for` / `loading="lazy"` | N/A | Não aplicável — projeto NgModule sem esses padrões |

---

## Critérios de Aceitação

- [ ] Login com perfil `estagiario`: menu exibe apenas Página inicial, Entregas e Sair *(requer teste manual)*
- [ ] Login com perfil `estagiario`: feed exibe apenas o card Entregas *(requer teste manual)*
- [ ] Login com perfil `estagiario`: tentativa de acesso direto a `/dashboard` redireciona para `/entrega-list` *(requer teste manual)*
- [ ] Login com perfil `estagiario`: `/entrega-list` e `/entrega-detail/:saleKey` carregam normalmente *(requer teste manual)*
- [ ] Login com perfil `admin`: menu e feed completos, todas as rotas acessíveis *(requer teste manual)*
- [ ] Login com perfil `master`: menu e feed completos (incluindo item Usuários) *(requer teste manual)*
- [x] Logout zera `UserProfileService` — `setPerfil(null)` chamado em `logout()`
- [x] Compilação sem erros — `tsc --project tsconfig.app.json --noEmit` retorna 0 erros
- [ ] Sem regressões visíveis nos fluxos de campanha, venda e clientes *(requer teste manual)*

---

## Arquivos Criados/Modificados

```
Criados:
  src/app/shared/service/user-profile/user-profile.service.ts
  src/app/core/guards/role.guard.ts

Modificados:
  src/app/shared/model/accout.enum.ts          (+ PerfilEnum)
  src/app/app.component.ts                     (+ UserProfileService, isEstagiario)
  src/app/app.component.html                   (+ ng-container *ngIf="!isEstagiario")
  src/app/feature/feed/feed.component.ts       (+ allowedPerfis, filtro por perfil)
  src/app/app-routing.module.ts                (+ roleGuard em 19 rotas)
```
