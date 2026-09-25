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

## Usuários (fixos, em `App.jsx` ~L2333)

| id  | Nome                | Papel (role)      | Admin |
|-----|---------------------|-------------------|-------|
| v1  | Alessandro Thonsen  | admin (dono)      | sim   |
| v2  | Adelmo Martinello   | vendedor          | não   |
| v3  | Willian Zanella     | gestor (sócio)    | sim   |
| v4  | João Marcos Martins | vendedor_basico   | não   |
| —   | Nexx                | contabilidade     | —     |
| —   | Mariana             | bot de leads (marcenaria) | — |

- Login aceita usuário sem `@` (ex.: `Nexx` vira `Nexx@gondolasuprema.com`).
- João também é montador/motorista → precisa ver Logística/Agenda de entregas.
- Zanella é sócio (não vende) → fica fora de rankings/agregações de venda.

## Permissões — REGRA CENTRAL

**Mudar acesso = editar o objeto `ROLE_PERMISSIONS` (`App.jsx` ~L2343). NÃO
espalhe `if` de papel pelo código.** `canAccess(user, aba)` é a única porta.

- `ALE_ONLY_TABS = ["leadmarc"]` → só o Ale (`user.id === "v1"`), independente do
  papel. (DRE e Conciliação SAÍRAM em 15-set: a contabilidade passou a vê-los.)
- **gestor (Zanella)**: SEM comissões. TEM Financeiro **somente leitura**
  (bloqueio via `somenteLeitura` no `FinanceiroPage`). TEM NF **completa**
  (emite/cancela/CC-e via `podeEmitir`).
- **vendedor (Adelmo)**: Gráficos + Logística **só leitura** (`canEditLogistica`)
  + próprias comissões + ADM **só leitura** (`canEditAdm`).
- **vendedor_basico (João)**: só operacional + próprias comissões + Logística.
- **contabilidade (Nexx)**: Financeiro + NF + **Conciliação bancária/extratos**
  + **DRE** — tudo em **leitura** (NF visualiza, não emite; Conciliação tem
  `somenteLeitura` que esconde importar/reconciliar/ações). Landing = Financeiro.
  Sem Comissões. ⚠️ As rotas `/api/conciliacao/*` usam service_role e ainda não
  checam sessão (C4 pendente) — o gate de leitura é só na UI.
- `canEditLogistica`: admin, gestor e vendedor_basico podem editar entregas.

## Regras de negócio "escondidas" (fáceis de quebrar sem saber)

- **Orçamentos RS-ocultos** (`isOrcamentoRsOculto`, `App.jsx` ~L2413): orçamentos
  do estado **RS feitos pelo Ale (v1)** são particulares — somem de
  ADM/Gráficos/DRE/Logística/ranking para os outros. Só aparecem na aba
  Orçamentos do próprio Ale (`podeVerOrcamentosRsOcultos`).
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
- **Lead marcado "Desistir"** sai da aba (some da lista e do filtro).
- Regiões de entrega (Logística) mapeadas em `REGIOES_ENTREGA` — cidades em
  UPPERCASE sem acento porque vêm assim do banco.

## Receitas de produtos (como cada gôndola é composta)

Uma gôndola **não tem preço fixo**: o preço é a soma dos componentes da receita.
Quando o preço de um componente muda em `produtos_uniplus`, o preço da gôndola
se atualiza sozinho.

- **Fonte da verdade: `PRODUCT_RECIPES` (`App.jsx` ~L103–1486)** — tabela grande
  de dados; NÃO copiar pra cá, sempre consultar o código para as quantidades.
- **Chave** da receita: `"produtoId|variante|cor"` (o formato da variante muda
  por família; alguns produtos usam só `"id|cor"` ou `"id"`).
- **Valor**: lista de pares `[uniplusId, qtd]`. `uniplusId` pode ser
  `"nome:<slug>"` para casar pelo nome do item em `produtos_uniplus` (o `slug`
  é gerado por `slug(nome)`).
- **Variantes/pills** de cada família em `VARIANTS_*` (`App.jsx` ~L65–99):
  largura, níveis, cor, comprimento, altura, linha.
- **Fit 60 é derivado do Fit 40**: o mapa `SUBSTITUICAO_FIT60` (~L1491) +
  `aplicarLinhaFit60` (~L1525) trocam só as peças mapeadas; peça não mapeada
  continua igual à do Fit 40.

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
- **"Continuação"**: módulo Inicial com **1 coluna a menos de cada tipo** (a
  coluna é compartilhada com o módulo anterior da fila).
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
- Componentes grandes ficam todos em `App.jsx` — siga o padrão existente em vez
  de fragmentar sem necessidade.
- `.env.local` (não commitado): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` e os tokens Focus server-side.

## Mapa do `App.jsx` — onde fica cada coisa (índice de navegação)

> O arquivo tem ~13 mil linhas. **Não leia inteiro** (custa ~250k tokens). As
> linhas abaixo são APROXIMADAS — elas se deslocam quando o arquivo cresce, então
> a **âncora real é o nome** da função/const: `grep -n "function LeadsPage"
> src/components/App.jsx` te leva ao ponto exato. Use este mapa pra pular direto.

### Raiz e navegação
- `App()` ~L12627 — componente raiz. Estado `page` = navegação (NÃO há URL/rota).
  Carrega `orders`/`cart`/`user`; monta `uniplusPriceMap` ~L12680; roteia em
  `{page === "..." && <XxxPage/>}` ~L12903+. Trocar de aba = `setPage("...")`.

### Páginas (cada aba é uma função `XxxPage`)
| Aba | Função | ~L | Tabela principal |
|---|---|---|---|
| Login | `Login` | 2701 | Supabase Auth |
| Dados do cliente | `ClientPage` | 2163 | estado `clientData` |
| Catálogo | `Catalog` | 2813 | PRODUCTS + produtos_uniplus |
| Carrinho | `Quote` | 3334 | — |
| Resumo + **SALVA orçamento** | `ResumoPage` | 3485 | insere em `orcamentos` (~L3618) |
| Orçamentos (lista/PDF/status) | `Orders` | 3836 | orcamentos |
| Logística (entregas) | `LogisticaPage` | 5204 | orcamentos (data_entrega) |
| Comissões | `ComissoesPage` | 5683 | orcamentos + despesas (espelho) |
| CRM de Leads | `LeadsPage` | 6793 | mariana_leads + mariana_chat_memory |
| Lead Marcenaria | `MarcenariaLeadsPage` | 6105 | marcenaria_leads |
| Marcenaria › Orçamentos | `MarcenariaPage` | 11544 | marc_orcamentos |
| Agenda | `AgendaPage` | 6381 | agenda_tarefas |
| ADM / Vendas Concluídas | `AdminPage` | 7313 | orcamentos (mês da ENTREGA) |
| Gráficos | `GraficosPage` | 8758 | orcamentos |
| Financeiro | `FinanceiroPage` | 8940 | despesas + boletos_a_pagar |
| DRE | `DrePage` | 9781 | agrega despesas/orcamentos |
| NF (NFe/NFSe) | `NFPage` | 10285 | notas_fiscais + /api |
| Conciliação | `ConciliacaoPage` | 11766 | lancamentos_bancarios + /api |
| Fotos (álbuns) | `FotosPage` | 12220 | Storage bucket `fotos` |

### Motor de preço (produto → custo → venda)
- `PRODUCT_RECIPES` ~L157–1566 (dados grandes — NÃO ler inteiro; grep a chave
  `"id|altura|cor"`) · `FIT60_SUBST` ~L1567 · `PRODUCTS` ~L1625 · `VARIANTS_*` ~L40–155.
- `computeProductPrice` ~L1615 (soma receita×preço) · `recipeKeyForProduct` ~L1605
  · `aplicarLinhaFit60` ~L1600.
- `uniplusPriceMap` ~L12680 — mapa `id`/`nome:slug` → `preco_brasil` (lê
  produtos_uniplus). É a **fonte do preço**; sync manual da planilha do Drive =
  memória `sincroniza-o-manual-uniplus-sistema-drive-supabase`.
- Gôndola por medidas: `GONDOLA_MODULOS` L58 · `calcularGondola` L76 ·
  PAREDE_INICIAL_M/CONT_M/PONTA_M L53-55. `catLabel` L1746 (+`EXTRA_CAT_LABELS` L1745).
- ⭐ O item do orçamento guarda `total` = **custo** (receita); o markup entra só no
  nível do pedido (`comissao = subtotal × markup%`). PDF distribui o markup por item.

### Permissões e regras (âncoras)
- `ROLE_PERMISSIONS` L2431 · `ALE_ONLY_TABS` L2459 · `canAccess` L2463 ·
  `canEditLogistica` L2498 · `VENDEDORES` L2417.
- `isOrcamentoRsOculto` L2512 · `anoEntregaOk` L2001 (+`ANO_ENTREGA_MIN/MAX` L1999,
  trava do ano da entrega) · `STATUS_ORDEM` L2527 · `REGIOES_ENTREGA` L2474.

### Financeiro / despesas (âncoras)
- `TIPOS_DESPESA` L2612 · `TIPOS_FORA_DRE` L2629 (aporte/retirada/financiamento ≠
  resultado) · `CATEGORIAS_SUGERIDAS` L2632 · `inferirTipoDespesa` L2649 ·
  `isBoletoParceladoRRE` L2598 · `COMISSAO_VENDEDOR_FATOR` L5681 (0,20) ·
  `DESPESAS_FIXAS` L8904.

### PDF (2 caminhos)
- HTML (impressão no painel): `buildPdfPage` L1934 + `buildPaymentSection` L1859
  + `buildCardSection` L1907 + `pdfStyles` L1812.
- jsPDF (compartilhar WhatsApp): **`src/lib/pdf.js`** → `generatePDF` / `sharePDFWhatsApp`.

### Conversa da Mariana (painel)
- `prepararConversa` L6077 — normaliza texto picotado (streaming) + quebra em
  bolhas + detecta foto. Usada em LeadsPage e MarcenariaLeadsPage. RPC
  `mariana_conversa`.

### Utilitários
- `notify`/`Toaster` L12589 · `formatarCnpj`/`formatarCelular` L1770-1793 ·
  `genId` L1741 · `fmt`/`fmtMoney` L1720 · `mesBRT` L1734 (mês pela STRING, evita
  bug de fuso — nunca `new Date(dateOnly)` p/ agrupar por mês) · `useIsMobile` L2756.

## CRM e Financeiro — as regras que decidem dinheiro (resumo)

> Detalhe completo, com fontes, na skill **gestao-suprema**. Aqui o núcleo que não
> pode errar.

- **Receita = modelo CAIXA** (bate com o extrato), não competência. Venda só vira
  receita quando o status é **"Pago"** (grava `data_pagamento` + `valor_recebido`).
- **`valor_recebido` = boleto ? comissão : total**: em **boleto** (RRE) o cliente
  paga o fornecedor direto, só a **comissão** entra; em **PIX/cartão/dinheiro**
  entra o **total**.
- **Comissão paga** (aba Comissões) cria despesa espelhada `comissao-<orcId>`
  automática — **NUNCA lançar comissão à mão** (duplica).
- **Boleto** → `boletos_a_pagar` + espelho em `despesas`. Despesas variáveis nascem
  "Pago"; parcela futura de fornecedor e fixas = "Em Aberto".
- **Conciliação:** ignora transferências entre contas próprias e PIX pessoal.
- **CRM:** leads da Mariana (n8n/WhatsApp) → `mariana_leads`; funil por consultor;
  "Ver conversa completa" via RPC; "Desistir" some da aba; dedup por 8 dígitos do
  telefone. ⚠️ **Sem origem/UTM** — não mede qual anúncio gerou o lead (melhoria nº1).
