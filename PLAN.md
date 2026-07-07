# PLAN — Repo Explorer (teste prático Angular sênior)

Plano de execução do teste "Explorador de Repositórios". Referência: enunciado do teste (PDF) + linha técnica preparada para a reunião de 2026-07-08. Princípio de avaliação declarado no enunciado: **decisões bem justificadas > volume de features**. Escopo alvo: 3–4h; o que não couber vai documentado no README como "próximos passos", não entregue pela metade.

**Prazo: entrega até 2026-07-08 (fim do dia).** Repo público `repo-explorer` no GitHub pessoal. Decisões abaixo travadas em brainstorm de 2026-07-07 — o README explica cada uma.

## 1. Stack e decisões de partida

| Decisão | Escolha | Justificativa (vai pro README) |
|---|---|---|
| Versão | Angular 19 (ou última estável 17+) | Enunciado pede 17+; standalone é default moderno |
| Componentes | Standalone, sem NgModule | Requisito explícito; menos boilerplate, tree-shaking melhor |
| Estado | **Signals (estado) + RxJS (fluxo assíncrono)** | Signals para estado síncrono/derivado da UI (`computed` para favoritos, estados de tela); RxJS onde há tempo/cancelamento (busca digitada). Complementares — sem NgRx: uma feature e meia não justifica o custo de store externa. Se crescesse, a fronteira serviço-com-signals já isola a migração. |
| HTTP | `HttpClient` + `provideHttpClient(withFetch())` | Padrão da plataforma, interceptors se precisar |
| TS | `strict: true`, sem `any` solto | Requisito; tipos da API modelados à mão só com os campos usados |
| Estilo | CSS puro, layout simples | Enunciado: clareza > design; sem Material = uma dependência a menos pra justificar |
| Change detection | `OnPush` em todos os componentes | Dados fluem por signals/inputs imutáveis → seguro; justificativa por componente no README |
| Zona | Manter zone.js (não zoneless) | Zoneless ainda é passo extra de risco num teste 3-4h; documentar como evolução |

## 2. Estrutura de pastas (grita o domínio, não o framework)

```
src/app/
  core/                      # singletons e infra
    github/
      github-api.service.ts  # HTTP puro, tipado, sem estado
      github.types.ts        # SearchResponse, RepoSummary, RepoDetail (só campos usados)
      github-error.ts        # mapeia HttpErrorResponse -> AppError (rate-limit | network | http)
  features/
    search/
      search-page.component.ts       # smart: liga estado <-> apresentação
      search-state.service.ts        # signals: query, status, results; RxJS pipeline dentro
      repo-list.component.ts         # dumb, OnPush, @for track repo.id
      repo-list-item.component.ts    # dumb, OnPush
      repo-detail-panel.component.ts # painel simples na própria tela; fetch sob demanda ao selecionar
    favorites/
      favorites.service.ts          # signal<Set<repoKey>> + persistência localStorage
      favorites-page.component.ts   # lista separada (rota /favorites)
  shared/
    ui-state.ts               # tipo UiState<T> = idle|loading|success|empty|error
    status-panel.component.ts # render de loading/vazio/erro reutilizável
app.routes.ts                 # rotas lazy (loadComponent)
```

- `shared/` mínimo de verdade (regra: só reuso real).
- Detalhe é **painel simples** na tela de busca (decisão de brainstorm): seleção dispara fetch de `/repos/{owner}/{repo}` sob demanda; estado de seleção vive no `search-state`. Rota própria vai pro README como alternativa considerada (deep-link) e descartada por escopo.

## 3. Pipeline da busca (requisito anti-race, coração do teste)

```ts
// search-state.service.ts (esqueleto)
private query$ = new Subject<string>();

readonly state = toSignal(
  this.query$.pipe(
    map(q => q.trim()),
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(q => q.length < 2
      ? of(idleState)
      : this.api.search(q).pipe(
          map(toSuccessOrEmpty),
          catchError(e => of(toErrorState(e))),
          startWith(loadingState),
        )),
  ),
  { initialValue: idleState },
);
```

Respostas prontas para as perguntas 2 e 4 do README:
- **Sem sobrecarga/race:** `debounceTime` corta requisição por tecla; `distinctUntilChanged` corta repetida; `switchMap` **cancela** a requisição em voo quando chega termo novo — resposta obsoleta nunca sobrescreve a atual, por construção, não por flag manual.
- **Sem memory leak:** template consome via signal (`toSignal` gerencia a subscription no injection context); nenhuma subscription manual em componente; se precisar, `takeUntilDestroyed`.

## 4. Estados de UI

Union discriminada única para toda tela:

```ts
type UiState<T> =
  | { kind: 'idle' } | { kind: 'loading' }
  | { kind: 'success'; data: T } | { kind: 'empty' }
  | { kind: 'error'; error: AppError };  // AppError inclui 'rate-limit' distinto
```

`@switch (state().kind)` no template + `status-panel` compartilhado. Rate limit (403/429 com header `x-ratelimit-remaining: 0`) vira mensagem própria com hora de reset — tratamento "elegante" pedido no enunciado.

## 4b. Rate limit — cache + countdown (decisão de brainstorm)

- **Cache em memória por termo** (`Map<termo, resultado>`) no serviço de busca: corta requisição repetida (10 req/min sem token) e rende parágrafo de trade-off no README (invalidação: cache morre com a sessão, aceitável para busca exploratória).
- **Countdown**: em 403/429 com `x-ratelimit-remaining: 0`, ler `x-ratelimit-reset` e mostrar hora/contagem pra liberar.
- **Retry manual** (botão) — nunca automático: retry automático agrava o rate limit.

## 5. Favoritos

- `FavoritesService`: `signal<Map<string, FavoriteRepo>>` (key `owner/name`), `computed` para lista e para `isFavorite(key)`.
- Persistência: `effect()` serializa pro `localStorage` a cada mudança; hidrata no construtor com try/catch (JSON corrompido → estado vazio, não crash).
- Guarda o snapshot mínimo (nome, owner, avatar, stars) — suficiente pra listar sem rede.

## 6. Performance de lista

- `@for (repo of repos; track repo.id)` — obrigatório.
- Itens `OnPush` + inputs imutáveis.
- Paginação simples ("carregar mais", 30/página da API) em vez de virtual scroll — API do GitHub pagina de qualquer forma; CDK virtual scroll declarado no README como **deixado de fora de propósito** (a resposta sênior é o trade-off, não a feature).
- `NgOptimizedImage`/`loading="lazy"` nos avatares.

## 7. Testes (por risco, não por cobertura)

Runner: o default do Angular CLI da versão usada — trocar tooling (ex.: Jest) custa setup e não prova nada aqui; justificativa de 1 linha no README.

1. **`search-state.service.spec`** — teste-âncora: com `HttpTestingController` + tempo fake, provar debounce (1 request pra N teclas), cancelamento (termo novo cancela antigo), erro → estado `error`, resultado vazio → `empty`. É a prova executável do requisito anti-race.
2. **`favorites.service.spec`** — toggle, persistência (localStorage fake), hidratação com JSON inválido.
3. **`github-error.spec`** — mapeamento 403 rate-limit vs falha de rede.
4. (se sobrar tempo) `repo-list-item` — render básico + emissão de evento de favorito.

## 8. Roteiro de commits (histórico legível = entregável)

1. `chore: scaffold Angular 19 standalone + strict` 
2. `feat(core): typed GitHub API service + error mapping`
3. `feat(search): debounced search with cancellation + result list`
4. `feat(ui): explicit idle/loading/empty/error states incl. rate limit`
5. `feat(detail): detail panel with on-demand fetch`
6. `feat(favorites): toggle + localStorage persistence + page`
7. `feat(rate-limit): per-term cache, reset countdown, manual retry`
8. `perf(list): trackBy, OnPush audit, lazy avatars, load more`
9. `test: search state, favorites, error mapping`
10. `ci: GitHub Actions with lint, test and build`
11. `docs: README with architecture decisions and answers`

Uma fatia funcional por commit (tracer bullet: cada uma roda end-to-end).

## 9. README — respostas curtas planejadas

1. **Estado:** Signals+RxJS complementares (síncrono vs assíncrono); store externa é custo sem retorno neste escopo.
2. **API/race:** debounce + distinct + switchMap (cancelamento por construção).
3. **OnPush:** em todos; exige dados imutáveis e mudanças via signal/input — nunca mutar array/objeto in-place.
4. **Leaks:** `toSignal`/`async pipe`; imperativo só com `takeUntilDestroyed`.
5. **50+ telas / 8 devs:** workspace Nx ou app com libs por domínio; fronteiras enforced (eslint boundaries); design system em lib própria; estado por feature com facade (avaliar NgRx/SignalStore onde houver estado compartilhado real); contratos de API gerados de OpenAPI; CI com lint/test/build afetados; convenção de rotas e code owners por domínio.

## 10. Fora de escopo deliberado (declarar no README)

Auth/OAuth, backend próprio, cobertura exaustiva, design system, i18n, SSR, zoneless, virtual scroll, cache offline de detalhe, rota deep-link de detalhe. Cada um com uma linha de "faria assim".

## 11. CI (narrativa fullstack end-to-end)

GitHub Actions mínimo: 1 workflow, jobs `lint` → `test` → `build` em push/PR. ~15min de custo, sinaliza operação e release confiável — mesmo argumento de CI/CD da linha fullstack levada pra reunião.

## 12. Uso na reunião de 2026-07-08

Teste e reunião são a mesma frente: cada decisão daqui (switchMap/cancelamento, OnPush+imutabilidade, cache com invalidação pensada, testes por risco, CI) é munição direta pras perguntas técnicas. README escrito pra ser defendido oralmente.
