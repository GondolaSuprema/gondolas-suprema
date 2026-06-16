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

// Destinatário fixo — RRE Maquinas (Gôndolas Brasil)
const TOMADOR = {
  cnpj: "23505287000107",
  razao_social: "RRE MAQUINAS E EQUIPAMENTOS LTDA",
  logradouro: "RUA JOSE ANTONIO PEREIRA",
  numero: "1902",
  bairro: "IPIRANGA",
  codigo_municipio: "4216800", // São José/SC
  uf: "SC",
  cep: "88111490",
};

// Configuração fiscal do serviço (Simples Nacional / Item 10.05)
const SERVICO_CFG = {
  aliquota: 3.0,
  iss_retido: false,
  codigo_tributario_municipio: "10.05",
  item_lista_servico: "10.05",
  codigo_cnae: "7490104",
  natureza_operacao: "1",     // 1 = Tributação no município
  regime_tributacao: "6",     // 6 = Simples Nacional
  optante_simples_nacional: true,
  incentivador_cultural: false,
};

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
    const { ordem, ambiente = "homologacao", acao, ref_cancelamento, justificativa } = body;

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

    const payload = {
      data_emissao: dataAtualISO(),
      prestador: {
        cnpj: PRESTADOR.cnpj,
        inscricao_municipal: PRESTADOR.inscricao_municipal,
        codigo_municipio: PRESTADOR.codigo_municipio,
      },
      tomador: {
        cnpj: TOMADOR.cnpj,
        razao_social: TOMADOR.razao_social,
        endereco: {
          logradouro: TOMADOR.logradouro,
          numero: TOMADOR.numero,
          bairro: TOMADOR.bairro,
          codigo_municipio: TOMADOR.codigo_municipio,
          uf: TOMADOR.uf,
          cep: TOMADOR.cep,
        },
      },
      servico: {
        aliquota: SERVICO_CFG.aliquota,
        valor_servicos: Number(valorServicos.toFixed(2)),
        iss_retido: SERVICO_CFG.iss_retido,
        discriminacao: montarDiscriminacao(ordem),
        codigo_tributario_municipio: SERVICO_CFG.codigo_tributario_municipio,
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
      tomador: TOMADOR.razao_social,
      cnpj_tomador: TOMADOR.cnpj,
      ...data,
    });
  } catch (e) {
    return Response.json({ success: false, mensagem: e.message }, { status: 500 });
  }
}
