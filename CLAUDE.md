# CLAUDE.md — Sistema Gôndolas Suprema

Contexto do projeto para o Claude. Objetivo: começar qualquer conversa já
sabendo a arquitetura e as regras de negócio "escondidas", sem reler as ~12 mil
linhas do `App.jsx`. Mantenha este arquivo atualizado quando mudar algo
estrutural.

## O que é

Sistema web interno da Gôndolas Suprema: orçamentos, catálogo, calculadora de
preços, geração de PDF, emissão de NF/NFS-e, financeiro (DRE, conciliação
bancária), logística de entregas, comissões, agenda e leads (inclusive um bot
"Mariana" para a marcenaria). Uso interno da equipe — não é produto público.

## Stack e estrutura

- **Next.js 14** (app router) + **React 18**. Deploy no **Vercel**.
- **Supabase**: auth (e-mail/senha) + Postgres com **RLS**. Client em
  `src/lib/supabase.js`.
- **jsPDF** / `jspdf-autotable` para PDF (`src/lib/pdf.js`).
- **O app inteiro vive em `src/components/App.jsx` (~12 mil linhas)**, um único
  componente com todas as "páginas" como funções `XxxPage`. Não há roteamento
  por URL — a navegação é por estado `page` no fim do arquivo.
- Rotas de API server-side em `src/app/api/*` (emissão de NF, frete, CNPJ,
  conciliação, Meta CAPI, versão).
- Também existe empacotamento mobile via Capacitor (`capacitor.config.json`,
  `mobile-flutter/`) — secundário.

Rodar local: `npm run dev`. Build: `npm run build`.

## Usuários (fixos, array `VENDEDORES` em `App.jsx` ~L2371)

| id  | Nome                | Papel (role)      | Admin |
|-----|---------------------|-------------------|-------|
| v1  | Alessandro Thonsen  | admin (dono)      | sim   |
| v2  | Adelmo Martinello   | vendedor          | não   |
| v3  | Willian Zanella     | gestor (sócio)    | sim   |
| v4  | João Marcos Martins | vendedor_basico   | não   |
| —   | Nexx                | contabilidade     | —     |
| —   | Mariana             | bot de leads (marcenaria) | — |

- **Atenção:** o array `VENDEDORES` (~L2371) só tem v1–v4. **Nexx** e **Mariana
  NÃO estão nesse array** — existem só como `role` no Supabase Auth / tabelas.
  `VENDEDORES` é a lista para ranking/atribuição, não a lista de logins.
- Login aceita usuário sem `@` (ex.: `Nexx` vira `Nexx@gondolasuprema.com`).
  E-mails reais: Zanella = `comercial@gondolasuprema.com`,
  João = `joaomarcosmartinsmot@gmail.com`.
- João também é montador/motorista → precisa ver Logística/Agenda de entregas.
- Zanella é sócio (não vende). ⚠️ **Ver divergência do ranking de Gráficos abaixo**
  — na regra atual do código ele NÃO fica de fora do ranking.

## Permissões — REGRA CENTRAL

**Mudar acesso = editar o objeto `ROLE_PERMISSIONS` (`App.jsx` ~L2385). NÃO
espalhe `if` de papel pelo código.** `canAccess(user, aba)` (~L2414) é a única porta.

- Papéis (roles) que existem de fato: `admin`, `gestor`, `vendedor`,
  `vendedor_basico`, `contabilidade` (`ROLE_PERMISSIONS` ~L2385).
- `ALE_ONLY_TABS = ["dre", "conciliacao", "leadmarc"]` (~L2410) → só o Ale
  (`user.id === "v1"`), independente do papel.
- Abas **`resumo`** e **`fotos`** estão liberadas para todas as roles não-contábeis
  (admin, gestor, vendedor, vendedor_basico). Ver seção "Fotos" mais abaixo.
- **gestor (Zanella)**: SEM comissões. TEM Financeiro **somente leitura**
  (bloqueio via `somenteLeitura` no `FinanceiroPage`). TEM NF **completa**
  (emite/cancela/CC-e via `podeEmitir`).
- **vendedor (Adelmo)**: Gráficos + Logística **só leitura** (`canEditLogistica`)
  + próprias comissões + ADM **só leitura** (`canEditAdm`).
- **vendedor_basico (João)**: só operacional + próprias comissões + Logística.
- **contabilidade (Nexx)**: só Financeiro (leitura) + NF (visualiza; **não**
  emite — emitir segue restrito a admin/gestor). Landing page dele = Financeiro.
- `canEditLogistica` (~L2449): admin, gestor e vendedor_basico podem editar entregas.
- `podeEmitir` (~L10114) = admin OU gestor; contabilidade fica fora.
- **Comissões — marcar pago/a pagar é só do admin.** O toggle de status usa
  `isAdmin = role === "admin"` (~L5503); vendedores só visualizam as próprias
  (query já filtrada por `vendedor_id`, ~L5512). Nem gestor mexe no status.
- **`somenteLeitura` do Financeiro** (~L8672) = `!(role === "admin" || id === "v1")`
  → só admin/Ale escreve; gestor, contabilidade e demais ficam em leitura.

## Regras de negócio "escondidas" (fáceis de quebrar sem saber)

- **Orçamentos RS-ocultos** (`isOrcamentoRsOculto`, `App.jsx` ~L2463): orçamentos
  do estado **RS feitos pelo Ale (v1)** são particulares — somem de
  ADM/Gráficos/DRE/Logística/ranking para os outros. Só aparecem na aba
  Orçamentos do próprio Ale (`podeVerOrcamentosRsOcultos`, ~L2472).
- ⚠️ **Ranking de Gráficos NÃO usa `VENDEDORES` nem exclui o Zanella** — está
  hardcoded para `v1 || v2 || v3` (~L8533), ou seja **inclui Zanella (v3) e
  exclui João (v4)**. Isso CONTRADIZ a regra "Zanella fica fora de rankings".
  Antes de mexer, confirmar com o Ale qual é o certo: se o ranking deve seguir a
  regra (Zanella fora), trocar esse hardcode por filtro baseado em papel/flag.
- **Mês da NF / Vendas Concluídas segue a `data_entrega`**, não a data de
  criação do orçamento. A coluna "Entrega (NF)" é editável.
- **Sincronização automática de NF** só para quem pode emitir (contabilidade é
  100% leitura).
- **MPP China**: MDF fica **fora da receita** (só estrutura) + aviso "MDF à
  parte" na tela. Módulos 200kg têm receita por nº de níveis (3/4/5/6) e pills
  de comprimento (1,00/1,50/2,00m com combinações de longarina + MDF).
- **Trava de ano na data de entrega**: evita bug `26 → 0026` (que sumia a venda
  da ADM).
- **Ordenação de status** (`STATUS_ORDEM`): "Fazer Pedido" primeiro, "Concluído"
  por último. Temperatura do lead: quente → morno → frio.
- **Lead marcado "Desistir"** sai da aba (some da lista e do filtro, ~L6702).
- **Leads Mariana — dedup por telefone + janela de 24h**: conversão
  lead→orçamento→venda é casada por `fone8(telefone)` (últimos 8 dígitos) com
  corte de 24h (~L6728, L6742). Motivos de desistência são agregados por
  `motivo_desistencia`. Mexer nisso muda as métricas de conversão.
- Regiões de entrega (Logística) mapeadas em `REGIOES_ENTREGA` (~L2425) — cidades
  em UPPERCASE sem acento porque vêm assim do banco.

## Fotos (aba não óbvia)

- Aba **Fotos** (`FotosPage`, ~L12422) liberada para todas as roles não-contábeis.
- Usa **Supabase Storage** (bucket público `"fotos"`, uma pasta por álbum),
  **não é tabela Postgres** — por isso não aparece na lista de tabelas abaixo.
  Acesso via `supabase.storage.from("fotos")` (~L11873, L11953–12009).

## Receitas de produtos (como cada gôndola é composta)

Uma gôndola **não tem preço fixo**: o preço é a soma dos componentes da receita.
Quando o preço de um componente muda em `produtos_uniplus`, o preço da gôndola
se atualiza sozinho.

- **Fonte da verdade: `PRODUCT_RECIPES` (`App.jsx` ~L118–1486)** — tabela grande
  de dados; NÃO copiar pra cá, sempre consultar o código para as quantidades.
- **Chave** da receita: `"produtoId|variante|cor"` (o formato da variante muda
  por família; alguns produtos usam só `"id|cor"` ou `"id"`).
  ⚠️ **A "linha" (Fit 40/Fit 60) NÃO entra na chave** — a chave é montada sem ela
  (~L1567) e a Fit 60 é derivada por substituição (ver abaixo). Não inclua a
  linha na chave ao mexer nas receitas, senão nenhuma casa.
- **Valor**: lista de pares `[uniplusId, qtd]`. `uniplusId` pode ser
  `"nome:<slug>"` para casar pelo nome do item em `produtos_uniplus` (o `slug`
  é gerado por `slug(nome)`).
- **Variantes/pills** de cada família em `VARIANTS_*` (`App.jsx` ~L41–110):
  largura, níveis, cor, comprimento, altura, linha.
- **Fit 60 é derivado do Fit 40**: o mapa **`FIT60_SUBST`** (~L1528, **não**
  "SUBSTITUICAO_FIT60") + `aplicarLinhaFit60` (~L1561) trocam só as peças
  mapeadas; peça não mapeada continua igual à do Fit 40.

Regras por família (motivo de existirem — fáceis de quebrar):
- **Farmácia**: colunas (2,02m) e SLG **não** mudam com a largura — só painel e
  bandejas. Largura 90cm (cheio) ou 55cm (ponta). Só Branca por enquanto
  (algumas peças Fit 30 não têm Preta confirmada no banco).
- **Ponta de farmácia**: config fixa (1,37m, 55cm, face única) — só cor.
- **MPP China**: receita = **só a ESTRUTURA** (2 laterais/montantes fixos + 1
  par de longarina por nível + transversina quando houver). O **MDF (deck) NÃO
  entra na receita** — vai à parte como item separado no orçamento (decisão do
  Ale, 11-set). Longarina por comprimento: 1,00m=920, 1,50m=1340, 2,00m=1840;
  a lateral não muda.
- **MPP Zar 500kg / 250kg** (`VARIANTS_MPP_ZAR_500` ~L97, `VARIANTS_MPP_ZAR_250`
  ~L100; produtos 900–903, ~L1669): linha própria de porta-pallet com
  capacidades de carga distintas (500kg vs 250kg) — não confundir com MPP China.
- **Slim** (`VARIANTS_SLIM_AMAPA` ~L104 / `VARIANTS_SLIM_SA` ~L110; produtos
  500–503, ~L1658): "Slim 2000×600" e "Slim SA+Amapá" — famílias próprias com
  suas variantes.
- **"Continuação"**: módulo Inicial com **1 coluna a menos de cada tipo** (a
  coluna é compartilhada com o módulo anterior da fila).
- **Ponta c/ Gancho existe SÓ na Fit 40** (sem Fit 60 — decisão do Ale, 06-ago):
  não tem pill de linha e fica sempre Fit 40 (~L47).
- Alguns produtos são **dupla face** (prateleiras nos 2 lados), outros face
  única — está anotado por receita nos comentários do código.

## Tabelas Supabase (RLS ativa — a tela não esconde, o banco filtra)

`orcamentos`, `notas_fiscais`, `despesas`, `boletos_a_pagar`,
`lancamentos_bancarios`, `agenda_tarefas` (RLS por `auth.uid()`),
`marcenaria_leads`, `marc_orcamentos` (RLS só o Ale / `is_ale()`),
`mariana_leads`, `mariana_chat_memory`, `produtos_uniplus`, `produtos_mpp_china`.

Ao inserir, `user_id` normalmente vai por DEFAULT `auth.uid()` no banco — o
cliente não precisa mandar o UUID. Capture erro de RLS para falha não passar em
silêncio.

Além das tabelas, há **Storage**: bucket público `"fotos"` (ver seção Fotos).

## Integrações

- **Focus NFe** — emissão de NF/NFS-e. Tokens **server-side apenas**
  (`FOCUS_NFE_TOKEN_HOMOLOGACAO` / `_PRODUCAO`). **NUNCA** usar prefixo
  `NEXT_PUBLIC_` neles. Rotacionar no painel Focus em caso de vazamento.
- **Meta CAPI** (`/api/meta-capi`), **consulta CNPJ**, **cálculo de frete**.
- **Conciliação bancária**: importa extrato, reconcilia lançamentos; contas
  mapeadas incluem Mercado Pago (normaliza `mercadopago_gondolas` → `mp_gondolas`).

## Convenções

- Português em UI, comentários e mensagens de commit.
- Ao mexer em acesso/papel: editar `ROLE_PERMISSIONS` / `ALE_ONLY_TABS`, nunca
  `if (user.id === ...)` espalhado.
- **Dívida técnica conhecida** (exceções à regra acima que já existem no código —
  não copiar o padrão, e de preferência migrar para funções centrais ao tocar):
  badge "🔒 RS" duplica a lógica inline (~L4622); `somenteLeitura` do Financeiro
  usa `id === "v1"` (~L8672); ranking de Gráficos com IDs hardcoded (~L8533);
  botão excluir via `user.isAdmin` em vez de `canAccess` (~L4800).
- Componentes grandes ficam todos em `App.jsx` — siga o padrão existente em vez
  de fragmentar sem necessidade.
- `.env.local` (não commitado): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` e os tokens Focus server-side.
