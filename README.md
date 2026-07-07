# Repo Explorer

Aplicação Angular para explorar repositórios públicos do GitHub sem autenticação. O app cobre busca com debounce, estados explícitos de UI, detalhe sob demanda, favoritos locais, cache em memória, paginação e verificação por CI.

## Stack

- Angular 22 com componentes standalone e TypeScript estrito.
- Signals para estado síncrono de UI e valores derivados.
- RxJS para fluxo assíncrono de busca, debounce, cancelamento e HTTP.
- CSS puro, sem biblioteca de componentes.
- Vitest pelo builder de testes do Angular CLI.

O cache persistente do Angular CLI está desativado em `angular.json`. Neste ambiente local com Node 26/macOS, o binding nativo de LMDB aborta durante `ng build`; desativar o cache mantém o build determinístico sem alterar o comportamento da aplicação.

## Como Rodar

```bash
npm ci
npm start
```

Abra `http://localhost:4200`.

Comandos úteis:

```bash
npm run lint
npm test -- --watch=false
npm run build
```

## Funcionalidades

- A busca espera `300 ms` de pausa antes de chamar o GitHub.
- Buscas obsoletas são canceladas com `switchMap`, então respostas antigas não sobrescrevem a consulta mais recente.
- A lista exibe nome, avatar/login do dono, descrição, stars e linguagem.
- Selecionar um repositório chama `/repos/{owner}/{repo}` separadamente para forks, issues abertas, licença e data de criação.
- Estados de UI são explícitos: idle, loading, empty, error e success.
- Erros de rate limit são tratados como caso próprio, com horário de reset e countdown.
- Favoritos persistem no `localStorage` como snapshot mínimo do repositório e continuam visíveis sem nova chamada de rede.
- Buscas repetidas para o mesmo termo/página usam cache em memória.
- "Load more" busca a próxima página do GitHub e concatena os resultados.

## Decisões de Arquitetura

| Decisão              | Escolha                                                                | Motivo                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Estrutura Angular    | Componentes standalone e rotas lazy                                    | Atende Angular 17+, reduz boilerplate e deixa as fronteiras de rota claras.                                               |
| Estado               | Signals + RxJS                                                         | Signals servem bem para estado de UI/favoritos; RxJS serve melhor para debounce, cancelamento e erro em fluxo assíncrono. |
| Store externa        | Nenhuma                                                                | Um app de busca/favoritos não justifica NgRx ou outra store global.                                                       |
| Detalhe              | Painel inline abaixo do item selecionado na busca                      | Cumpre o fetch sob demanda sem adicionar escopo de rota profunda e mantém o detalhe no ponto de leitura.                  |
| Estilo               | CSS puro                                                               | Menos dependência para justificar; clareza vale mais que cobertura visual de framework.                                   |
| Performance da lista | `@for` com `track repo.id`, OnPush, avatars lazy e paginação do GitHub | Combina com o formato da API. Virtual scroll é desnecessário para páginas de 30 itens e fica documentado como evolução.   |
| Cache                | Em memória por `term::page`                                            | Reduz chamadas repetidas. O cache reinicia com a sessão de propósito.                                                     |

## Perguntas Obrigatórias

### 1. Por que essa abordagem de estado?

Signals guardam o estado local e síncrono: consulta atual, repositório selecionado, favoritos, flag de "carregar mais" e chaves derivadas de favoritos. RxJS fica com o pipeline assíncrono de busca porque já oferece operadores nativos para debounce, valores distintos, cancelamento, loading e mapeamento de erro. Uma store global adicionaria cerimônia sem resolver um problema real neste escopo.

### 2. Como a sobrecarga de API e race conditions são evitadas?

O pipeline de busca normaliza o texto, espera `300 ms`, ignora valores repetidos com `distinctUntilChanged` e usa `switchMap`. Quando uma consulta nova chega, o observable HTTP anterior é cancelado. Assim, uma resposta antiga e lenta não consegue sobrescrever o estado da busca mais recente. Pares termo/página repetidos também são servidos pelo cache em memória.

### 3. Onde o OnPush é usado e que cuidado ele exige?

Todos os componentes do app usam `ChangeDetectionStrategy.OnPush`. Os dados fluem por signals e inputs imutáveis, então os gatilhos de change detection ficam claros. O principal cuidado é não mutar arrays ou maps in-place; os serviços criam novos `Map` e concatenam arrays de resultado de forma imutável.

### 4. Como foram evitados memory leaks?

Componentes não fazem subscription manual. Templates leem signals e emitem eventos. O serviço de busca usa `takeUntilDestroyed` no pipeline vivo de consulta. Chamadas HTTP de detalhe e paginação completam naturalmente; a paginação usa `take(1)`.

### 5. O que mudaria com 50+ telas e 8 devs?

Eu separaria o app em bibliotecas por domínio, aplicaria regras de boundary no lint, criaria um design system compartilhado e geraria contratos de API a partir de OpenAPI. O estado continuaria local por feature por padrão; NgRx ou SignalStore entrariam apenas onde houvesse estado realmente compartilhado entre domínios. A CI rodaria lint/test/build afetados, e code owners seriam mapeados por área.

## Fora de Escopo Deliberado

- OAuth ou token do GitHub: aumenta custo de setup e tratamento de segredo.
- Backend proxy: desnecessário para o desafio com API pública.
- Rota profunda para detalhe: útil depois, mas o painel inline mantém o escopo focado.
- CDK virtual scroll: faz mais sentido quando o volume de resultados não depende da paginação do GitHub.
- Cache offline de detalhes: favoritos já guardam o snapshot mínimo offline.
- Cobertura exaustiva: os testes miram riscos do desafio, não um número de cobertura.
- Angular zoneless: bom candidato para avaliar depois, mas não necessário para esta entrega.

## Testes

A cobertura automatizada atual foca nos riscos do desafio:

- `SearchStateService`: debounce, cancelamento, estado vazio, erros, detalhe sob demanda e paginação.
- `GithubApiService`: URL/params, mapeamento de resposta, detalhe e cache em memória.
- `FavoritesService`: toggle, persistência e storage corrompido.
- Componentes de apresentação: painel de status, lista de resultados, painel de detalhe e página de favoritos.
