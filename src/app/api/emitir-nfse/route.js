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

// Aceita CNPJ com pontuação ou não. Pra ser considerado "tomador custom
// completo" (e ir direto pro payload sem lookup), TODOS os campos
// essenciais precisam estar preenchidos: razão social, logradouro,
// bairro, código IBGE (7 dígitos), UF (2 letras) e CEP (8 dígitos).
// Se faltar qualquer um, retorna null — aí o handler cai pro lookup
// automático na BrasilAPI (quando só veio o CNPJ) ou pro RRE padrão.
function normalizarTomadorCustom(t) {
  if (!t || !t.cnpj) return null;
  const cnpj = String(t.cnpj).replace(/\D/g, "");
  if (cnpj.length !== 14) return null;
  const razao = String(t.razao_social || "").trim().toUpperCase();
  const logradouro = String(t.logradouro || "").trim().toUpperCase();
  const bairro = String(t.bairro || "").trim().toUpperCase();
  const codigoMunicipio = String(t.codigo_municipio || "").replace(/\D/g, "");
  const uf = String(t.uf || "").trim().toUpperCase().slice(0, 2);
  const cep = String(t.cep || "").replace(/\D/g, "");
  // Tem que ter TODOS os campos essenciais — senão deixa fluir pro lookup
  if (!razao || !logradouro || !bairro || codigoMunicipio.length !== 7 || uf.length !== 2 || cep.length !== 8) {
    return null;
  }
  return {
    cnpj,
    razao_social: razao,
    logradouro,
    numero: String(t.numero || "S/N").trim(),
    bairro,
    codigo_municipio: codigoMunicipio,
    uf,
    cep,
  };
}

// Busca dados oficiais do CNPJ na BrasilAPI (Receita Federal) e devolve
// um objeto no formato do TOMADOR_PADRAO. Devolve null se a API falhar
// ou se o CNPJ não vier com código IBGE — o handler vai responder erro
// explicando que precisa cadastrar manualmente.
async function buscarTomadorPorCnpj(cnpjLimpo) {
  try {
    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, {
      headers: { "User-Agent": "GondolasSuprema/1.0" },
      cache: "no-store",
    });
    if (!resp.ok) return null;
    const d = await resp.json();
    if (!d || !d.codigo_municipio_ibge) return null;
    return {
      cnpj: cnpjLimpo,
      razao_social: String(d.razao_social || "").trim().toUpperCase(),
      logradouro: String(d.logradouro || "").trim().toUpperCase(),
      numero: String(d.numero || "S/N").trim(),
      bairro: String(d.bairro || "").trim().toUpperCase(),
      codigo_municipio: String(d.codigo_municipio_ibge).replace(/\D/g, ""),
      uf: String(d.uf || "").trim().toUpperCase().slice(0, 2),
      cep: String(d.cep || "").replace(/\D/g, ""),
    };
  } catch (_e) {
    return null;
  }
}

// Monta o texto da discriminacao da NFS-e.
// Formato padrao: "NF {numero_pedido} - Cliente {tomador.razao_social}".
// O "Cliente" aqui é o TOMADOR da NFS-e (quem está sendo cobrado pela
// comissão) — RRE Máquinas no caso padrão, ou outro CNPJ customizado.
// Se vier `observacao` opcional, anexa "OBS: ..." em linha separada.
function montarDiscriminacao(ordem, tomador, observacao) {
  const numero = ordem.numero_pedido || ordem.id?.slice(0, 6).toUpperCase() || "—";
  const cliente = tomador?.razao_social || "—";
  const base = `NF ${numero} - Cliente ${cliente}`;
  const obs = String(observacao || "").trim();
  if (!obs) return base;
  return `${base}\n\nOBS: ${obs}`;
}

// Data local BRT no formato YYYY-MM-DD. `new Date().toISOString()` retorna
// UTC, o que causa erro à noite no Brasil (dia seguinte). Ajustamos -3h
// pra pegar o dia local antes de fatiar.
function dataAtualISO() {
  const agora = new Date();
  const brt = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 10); // YYYY-MM-DD local
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { ordem, ambiente = "homologacao", acao, ref_cancelamento, ref_consulta, justificativa, tomador_custom, observacao } = body;

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
    // Consulta de status (pra NFS-e que ficaram em "processando_autorizacao")
    // ────────────────────────────────────────────────────────────────────
    if (acao === "consultar") {
      if (!ref_consulta) {
        return Response.json({ success: false, mensagem: "ref_consulta obrigatório" }, { status: 400 });
      }
      const url = `${baseUrl}/${encodeURIComponent(ref_consulta)}`;
      const res = await fetch(url, {
        headers: { "Authorization": authHeader, "Content-Type": "application/json" },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return Response.json({ success: false, mensagem: data.mensagem || data.codigo || `HTTP ${res.status}`, raw: data }, { status: res.status });
      }
      return Response.json({ success: true, consulta: true, ...data });
    }

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

    // Resolve tomador. Ordem de prioridade:
    // 1. Se vier tomador_custom completo no body → usa.
    // 2. Se vier só {cnpj} → busca dados oficiais na BrasilAPI (incluindo IBGE).
    // 3. Senão → RRE Máquinas padrão.
    let tomadorResolvido = normalizarTomadorCustom(tomador_custom);
    if (!tomadorResolvido && tomador_custom && tomador_custom.cnpj) {
      const cnpjLimpo = String(tomador_custom.cnpj).replace(/\D/g, "");
      if (cnpjLimpo.length === 14) {
        tomadorResolvido = await buscarTomadorPorCnpj(cnpjLimpo);
        if (!tomadorResolvido) {
          return Response.json({
            success: false,
            mensagem: `Não consegui resolver os dados do CNPJ ${cnpjLimpo} na Receita Federal (BrasilAPI). Tenta novamente em alguns segundos — se persistir, o cliente precisa ter o CNPJ cadastrado corretamente.`,
          }, { status: 502 });
        }
      }
    }
    if (!tomadorResolvido) tomadorResolvido = TOMADOR_PADRAO;

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
        discriminacao: montarDiscriminacao(ordem, tomadorResolvido, observacao),
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
