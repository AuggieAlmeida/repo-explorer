# BUILD PLAN — roteiro de montagem (escrita do projeto)

Sequência de execução do PLAN.md, fatia a fatia. Cada fatia: timebox, arquivos escritos, critério de pronto (DoD), verificação e commit. Orçamento total: **3h30–4h de código + 30–40min de README**. Regra do enunciado: estourou o tempo → para, documenta no README, não entrega pela metade.

Princípio de montagem: **tracer bullet** — toda fatia termina com o app rodando end-to-end (`ng serve` + fluxo manual). Nada fica meio-escrito entre commits.

---

## Fatia 0 — Scaffold (20min)

**Escreve:**
- `ng new repo-explorer --style=css --routing --strict` (standalone é default no 17+)
- `tsconfig.json`: conferir `strict`, adicionar `noImplicitReturns`, `noFallthroughCasesInSwitch`
- `app.config.ts`: `provideHttpClient(withFetch())`
- Limpar template default do `app.component`
- Esqueleto de pastas: `core/github/`, `features/search/`, `features/favorites/`, `shared/`

**DoD:** `ng serve` sobe página vazia; `ng lint` e `ng test` rodam (mesmo sem specs próprios).
**Commit 1:** `chore: scaffold Angular standalone + strict`

## Fatia 1 — Núcleo tipado + busca end-to-end (50min, coração do teste)

**Escreve, nesta ordem:**
1. `core/github/github.types.ts` — `RepoSummary`, `RepoOwner`, `SearchResponse`, `RepoDetail`; só campos usados; comentário de premissa (API devolve mais, modelamos o consumido).
2. `core/github/github-error.ts` — `AppError` (`kind: 'rate-limit' | 'network' | 'http'` + `resetAt?`); função `toAppError(HttpErrorResponse)` lendo `x-ratelimit-remaining`/`x-ratelimit-reset`.
3. `core/github/github-api.service.ts` — `search(term, page)` e `getRepo(owner, name)`; HTTP puro, tipado, sem estado.
4. `shared/ui-state.ts` — `UiState<T>` discriminado + construtores (`loading()`, `success(data)`, …).
5. `features/search/search-state.service.ts` — pipeline: `Subject` → `trim` → `debounceTime(300)` → `distinctUntilChanged` → `switchMap` (termo <2 chars → idle) → `toSignal`.
6. `features/search/search-page.component.ts` — input de busca ligado ao serviço, dump provisório de resultados (JSON mesmo).

**DoD:** digitar busca → 1 request após pausa (aba Network confirma debounce e cancelamento); resultado aparece.
**Commit 2:** `feat(core): typed GitHub API service + error mapping`
**Commit 3:** `feat(search): debounced search with cancellation + result list`
(2 commits: núcleo separado da feature — histórico conta a evolução.)

## Fatia 2 — Estados de UI + lista real (40min)

**Escreve:**
1. `shared/status-panel.component.ts` — render de loading/vazio/erro; erro `rate-limit` com mensagem própria + hora de reset; botão "tentar de novo" (emite evento, retry manual).
2. `features/search/repo-list.component.ts` — `@for (repo of repos; track repo.id)`; OnPush.
3. `features/search/repo-list-item.component.ts` — nome, avatar (`loading="lazy"`), login, descrição, stars, linguagem; OnPush.
4. `search-page` passa a usar `@switch (state().kind)` + status-panel + repo-list.

**DoD:** os 4 estados visíveis manualmente — busca válida (sucesso), termo sem resultado (vazio), rede desligada (erro network), termo novo durante voo (só resultado novo). Rate limit: forçar com ~11 buscas rápidas.
**Commit 4:** `feat(ui): explicit idle/loading/empty/error states incl. rate limit`

## Fatia 3 — Painel de detalhe sob demanda (30min)

**Escreve:**
1. `features/search/repo-detail-panel.component.ts` — recebe `owner/name` selecionado, chama `getRepo()` **no momento da seleção** (requisito: não reusar objeto da lista), próprio `UiState<RepoDetail>`; mostra forks, issues abertas, licença (pode ser null → "sem licença"), data de criação formatada.
2. `search-state.service.ts` — signal `selected`, método `select(repo)`.
3. Layout: lista à esquerda, painel à direita (grid simples; empilha no mobile).

**DoD:** clicar em item → request de detalhe na Network → painel preenche; erro de detalhe não derruba a lista.
**Commit 5:** `feat(detail): detail panel with on-demand fetch`

## Fatia 4 — Favoritos (30min)

**Escreve:**
1. `features/favorites/favorites.service.ts` — `signal<Map<string, FavoriteRepo>>` (key `owner/name`); `toggle()`, `isFavorite()` via `computed`; `effect()` persiste no localStorage; hidratação no construtor com try/catch (JSON inválido → vazio).
2. Estrela de toggle no `repo-list-item` (evento sobe, serviço decide).
3. `features/favorites/favorites-page.component.ts` — rota lazy `/favorites`, lista do snapshot salvo, funciona offline.
4. `app.routes.ts` + nav mínima (Busca | Favoritos).

**DoD:** favoritar → recarregar página → favorito persiste; desfavoritar na página de favoritos remove na hora.
**Commit 6:** `feat(favorites): toggle + localStorage persistence + page`

## Fatia 5 — Rate limit com narrativa + performance (25min)

**Escreve:**
1. `github-api.service.ts` (ou decorator no search-state) — `Map<termo+page, resultado>` em memória; hit não vai à rede.
2. Countdown no status-panel: `resetAt` → contagem regressiva simples (signal + interval com cleanup).
3. "Carregar mais": página seguinte concatena (`concatMap` aqui — ordem importa), mantendo cache por página.
4. Auditoria OnPush: conferir todos os componentes; inputs imutáveis.

**DoD:** repetir termo já buscado → zero request; rate limit mostra contagem; "carregar mais" concatena sem flicker.
**Commit 7:** `feat(rate-limit): per-term cache, reset countdown, manual retry`
**Commit 8:** `perf(list): trackBy, OnPush audit, lazy avatars, load more`

## Fatia 6 — Testes-âncora (40min)

**Escreve, por prioridade (cortar de baixo pra cima se faltar tempo):**
1. `search-state.service.spec.ts` — `fakeAsync`/`tick` + `HttpTestingController`: N teclas → 1 request pós-debounce; termo novo cancela voo (a request antiga é cancelada, resultado final é do termo novo); erro HTTP → `error`; `items: []` → `empty`.
2. `favorites.service.spec.ts` — toggle liga/desliga; persistência (localStorage fake); hidratação com JSON corrompido não explode.
3. `github-error.spec.ts` — 403 com `x-ratelimit-remaining: 0` → `rate-limit` com `resetAt`; status 0 → `network`.
4. (só se sobrar) `repo-list-item` — render + output de favorito.

**DoD:** `ng test` verde local.
**Commit 9:** `test: search state, favorites, error mapping`

## Fatia 7 — CI (15min)

**Escreve:** `.github/workflows/ci.yml` — trigger push/PR, Node LTS, cache npm, steps: `npm ci` → `lint` → `test --watch=false --browsers=ChromeHeadless` → `build`.
**DoD:** push no GitHub → Actions verde.
**Commit 10:** `ci: GitHub Actions with lint, test and build`

## Fatia 8 — README (30–40min, é entregável de primeira classe)

**Estrutura:**
1. O que é + screenshot/gif (1 imagem basta).
2. Como rodar: `npm ci` / `ng serve` / `ng test`.
3. Decisões de arquitetura e trade-offs — tabela do PLAN.md seção 1 enxugada + parágrafos: estado, estrutura de pastas, painel vs rota, cache e invalidação, paginação vs virtual scroll.
4. **As 5 perguntas respondidas** (respostas planejadas na seção 9 do PLAN.md) — curtas, como pedido.
5. O que faria com mais tempo / deixado de fora de propósito (seção 10 do PLAN.md, uma linha de "faria assim" cada).
6. Premissas assumidas (rate limit sem token; campos da API modelados parcialmente; licença nullable; busca mínima 2 chars).

**Commit 11:** `docs: README with architecture decisions and answers`

---

## Ordem de corte se o tempo estourar

Cortar nesta ordem (e declarar no README): countdown do rate limit → teste 4 e 3 → "carregar mais" (fica página única de 30) → página de favoritos vira seção na busca (toggle + persistência ficam). **Nunca cortar:** pipeline anti-race, estados de UI, detalhe sob demanda, teste do search-state, README.

## Fechamento (regra de rastreabilidade)

Fim da sessão de montagem: atualizar o leaf `vida-profissional/projetos/em-progresso/repo-explorer-angular.md` no vault — progresso datado, decisões tomadas durante a escrita, `proxima_acao` (publicar repo / enviar link / preparar defesa oral pra reunião de 2026-07-08).
