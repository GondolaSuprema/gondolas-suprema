export const runtime = "nodejs";

// ============================================================================
// Emissão de NFS-e (Nota Fiscal de Serviço) — Suprema Instalações LTDA
// ============================================================================
// Empresa: SUPREMA INSTALACOES LTDA (CNPJ 66.640.430/0001-86)
// Município: Palhoça/SC (IBGE 4211900) — IM 66851
// Regime: Simples Nacional (ME)
// Item LC 116/03: 10.05 — Agenciamento, corretagem ou intermediação
// CNAE: 7490104 — Atividades de intermediação e agenciamento
// Destinatário fixo: RRE MAQUINAS (Gôndolas Brasil) — CNPJ 23.505.287/0001-07
// Valor: comissão da venda original (não o total do orçamento)
//
// Tokens da Focus NFe vêm das env vars na Vercel:
//   FOCUS_NFE_TOKEN_HOM_INSTALACOES  — homologação
//   FOCUS_NFE_TOKEN_PROD_INSTALACOES — produção
//
// Documentação Focus NFe: https://focusnfe.com.br/doc/#nfse
// ============================================================================

// Dados fiscais hardcoded da Suprema Instalações
const PRESTADOR = {
  cnpj: "66640430000186",
  inscricao_municipal: "66851",
  codigo_municipio: "4211900", // Palhoça/SC
  razao_social: "SUPREMA INSTALACOES LTDA",
};

// Destinatário PADRÃO — RRE Máquinas (Gôndolas Brasil). Pode ser
// sobrescrito pelo body via `tomador_custom` quando a NFS-e for emitida
// pra outro CNPJ (ex.: outro fornecedor que pague comissão).
const TOMADOR_PADRAO = {
  cnpj: "23505287000107",
  razao_social: "RRE MAQUINAS E EQUIPAMENTOS LTDA",
  logradouro: "RUA JOSE ANTONIO PEREIRA",
  numero: "1902",
  bairro: "IPIRANGA",
  codigo_municipio: "4216800", // São José/SC
  uf: "SC",
  cep: "88111490",
};

// Configuração fiscal do serviço (Simples Nacional / item 10.05).
// Palhoça usa o código NBS desdobrado: 100501 = "Agenciamento, corretagem
// ou intermediação de bens móveis ou imóveis, não abrangidos em outros
// itens ou subitens, por quaisquer meios". O `codigo_tributario_municipio`
// não é utilizado em Palhoça (conforme guia da Focus NFe).
const SERVICO_CFG = {
  aliquota: 3.0,
  iss_retido: false,
  item_lista_servico: "100501",
  codigo_cnae: "7490104",
  natureza_operacao: "1",     // 1 = Tributação no município
  regime_tributacao: "6",     // 6 = Simples Nacional
  optante_simples_nacional: true,
  incentivador_cultural: false,
};

// Aceita CNPJ com ou sem pontuação e padroniza nomes/endereço.
// Retorna null se faltar dado mínimo — aí o handler cai pro TOMADOR_PADRAO.
function normalizarTomadorCustom(t) {
  if (!t || !t.cnpj) return null;
  const cnpj = String(t.cnpj).replace(/\D/g, "");
  if (cnpj.length !== 14) return null;
  return {
    cnpj,
    razao_social: String(t.razao_social || "").trim().toUpperCase(),
    logradouro: String(t.logradouro || "").trim().toUpperCase(),
    numero: String(t.numero || "S/N").trim(),
    bairro: String(t.bairro || "").trim().toUpperCase(),
    codigo_municipio: String(t.codigo_municipio || "").replace(/\D/g, ""),
    uf: String(t.uf || "").trim().toUpperCase().slice(0, 2),
    cep: String(t.cep || "").replace(/\D/g, ""),
  };
}

function montarDiscriminacao(ordem) {
  const numero = ordem.numero_pedido || ordem.id?.slice(0, 6).toUpperCase() || "—";
  const empresa = ordem.client?.empresa || "—";
  return `Comissao referente a intermediacao de venda de equipamentos comerciais. Pedido n ${numero} - Cliente ${empresa}`;
}

function dataAtualISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { ordem, ambiente = "homologacao", acao, ref_cancelamento, justificativa, tomador_custom } = body;

    const TOKEN = ambiente === "producao"
      ? process.env.FOCUS_NFE_TOKEN_PROD_INSTALACOES
      : process.env.FOCUS_NFE_TOKEN_HOM_INSTALACOES;

    if (!TOKEN) {
      return Response.json({
        success: false,
        mensagem: `Token Focus NFe (Suprema Instalações) não configurado para o ambiente "${ambiente}". Defina FOCUS_NFE_TOKEN_${ambiente === "producao" ? "PROD" : "HOM"}_INSTALACOES nas env vars.`,
      }, { status: 500 });
    }

    const baseUrl = ambiente === "producao"
      ? "https://api.focusnfe.com.br/v2/nfse"
      : "https://homologacao.focusnfe.com.br/v2/nfse";

    const authHeader = "Basic " + Buffer.from(TOKEN + ":").toString("base64");

    // ────────────────────────────────────────────────────────────────────
    // Cancelamento
    // ────────────────────────────────────────────────────────────────────
    if (acao === "cancelar") {
      if (!ref_cancelamento) {
        return Response.json({ success: false, mensagem: "ref_cancelamento obrigatório" }, { status: 400 });
      }
      const url = `${baseUrl}/${encodeURIComponent(ref_cancelamento)}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Authorization": authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ justificativa: justificativa || "Cancelamento solicitado pelo emitente" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return Response.json({ success: false, mensagem: data.mensagem || data.codigo || `HTTP ${res.status}`, raw: data }, { status: res.status });
      }
      return Response.json({ success: true, ...data, cancelado: true });
    }

    // ────────────────────────────────────────────────────────────────────
    // Emissão
    // ────────────────────────────────────────────────────────────────────
    if (!ordem) {
      return Response.json({ success: false, mensagem: "ordem obrigatória pra emissão" }, { status: 400 });
    }

    // Valor da nota = COMISSÃO da venda (não o total)
    const valorServicos = Number(ordem.comissao) || 0;
    if (valorServicos <= 0) {
      return Response.json({
        success: false,
        mensagem: "Comissão da venda é zero ou inválida. Não é possível emitir NFS-e da Suprema Instalações sem valor de comissão.",
      }, { status: 400 });
    }

    // Referência única (Focus NFe usa pra rastrear a nota)
    const ref = `inst-${ordem.id}-${Date.now()}`;

    // Resolve tomador: custom (vindo do body) ou RRE padrão.
    const tomadorResolvido = normalizarTomadorCustom(tomador_custom) || TOMADOR_PADRAO;

    const payload = {
      data_emissao: dataAtualISO(),
      prestador: {
        cnpj: PRESTADOR.cnpj,
        inscricao_municipal: PRESTADOR.inscricao_municipal,
        codigo_municipio: PRESTADOR.codigo_municipio,
      },
      tomador: {
        cnpj: tomadorResolvido.cnpj,
        razao_social: tomadorResolvido.razao_social,
        endereco: {
          logradouro: tomadorResolvido.logradouro,
          numero: tomadorResolvido.numero,
          bairro: tomadorResolvido.bairro,
          codigo_municipio: tomadorResolvido.codigo_municipio,
          uf: tomadorResolvido.uf,
          cep: tomadorResolvido.cep,
        },
      },
      servico: {
        aliquota: SERVICO_CFG.aliquota,
        valor_servicos: Number(valorServicos.toFixed(2)),
        iss_retido: SERVICO_CFG.iss_retido,
        discriminacao: montarDiscriminacao(ordem),
        item_lista_servico: SERVICO_CFG.item_lista_servico,
        codigo_cnae: SERVICO_CFG.codigo_cnae,
      },
      natureza_operacao: SERVICO_CFG.natureza_operacao,
      regime_especial_tributacao: SERVICO_CFG.regime_tributacao,
      optante_simples_nacional: SERVICO_CFG.optante_simples_nacional,
      incentivador_cultural: SERVICO_CFG.incentivador_cultural,
    };

    const url = `${baseUrl}?ref=${encodeURIComponent(ref)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Authorization": authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    // Focus NFe retorna 202 Accepted quando aceita a NF e fica processando.
    // Status final ("autorizado", "cancelado", "erro_autorizacao") só fica
    // disponível após a Prefeitura processar — pode ser consultado por
    // /v2/nfse/{ref}.
    if (!res.ok) {
      return Response.json({
        success: false,
        mensagem: data.mensagem || data.codigo || `HTTP ${res.status}`,
        raw: data,
      }, { status: res.status });
    }

    return Response.json({
      success: true,
      ref,
      ambiente,
      valor: valorServicos,
      tomador: tomadorResolvido.razao_social,
      cnpj_tomador: tomadorResolvido.cnpj,
      ...data,
    });
  } catch (e) {
    return Response.json({ success: false, mensagem: e.message }, { status: 500 });
  }
}
