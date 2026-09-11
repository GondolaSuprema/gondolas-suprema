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

- `ALE_ONLY_TABS = ["dre", "conciliacao", "leadmarc"]` → só o Ale (`user.id === "v1"`),
  independente do papel.
- **gestor (Zanella)**: SEM comissões. TEM Financeiro **somente leitura**
  (bloqueio via `somenteLeitura` no `FinanceiroPage`). TEM NF **completa**
  (emite/cancela/CC-e via `podeEmitir`).
- **vendedor (Adelmo)**: Gráficos + Logística **só leitura** (`canEditLogistica`)
  + próprias comissões + ADM **só leitura** (`canEditAdm`).
- **vendedor_basico (João)**: só operacional + próprias comissões + Logística.
- **contabilidade (Nexx)**: só Financeiro (leitura) + NF (visualiza; **não**
  emite — emitir segue restrito a admin/gestor). Landing page dele = Financeiro.
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
