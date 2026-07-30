export const runtime = "nodejs";

// Data de emissão no formato ISO com offset -03:00 (BRT).
// Motivo: `new Date().toISOString()` sempre retorna UTC (com Z), e à noite
// no Brasil isso vira o DIA SEGUINTE. A Focus NFe monta a chave da NFe com
// AAMM da data enviada, mas a SEFAZ valida o DV baseada no fuso local do
// emitente — divergência → erro 253 "Digito Verificador da chave de acesso
// composta invalida". Solução: enviar sempre com offset -03:00 explícito.
function dataEmissaoBRT() {
  const agora = new Date();
  const brt = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().replace(/Z$/, "-03:00");
}

export async function POST(request) {
  const body = await request.json();
  const { ordem, ambiente, acao, ref_cancelamento, justificativa, transportadora, ref_correcao, correcao } = body;

  const TOKENS = {
    homologacao: process.env.FOCUS_NFE_TOKEN_HOMOLOGACAO,
    producao: process.env.FOCUS_NFE_TOKEN_PRODUCAO,
  };

  const token = ambiente === "producao" ? TOKENS.producao : TOKENS.homologacao;
  if (!token) {
    return Response.json({
      success: false,
      mensagem: "Token Focus NFe nao configurado. Defina FOCUS_NFE_TOKEN_HOMOLOGACAO e FOCUS_NFE_TOKEN_PRODUCAO no ambiente.",
    }, { status: 500 });
  }
  const baseUrl = ambiente === "producao"
    ? "https://api.focusnfe.com.br/v2/nfe"
    : "https://homologacao.focusnfe.com.br/v2/nfe";
  const urlBase = ambiente === "producao"
    ? "https://api.focusnfe.com.br"
    : "https://homologacao.focusnfe.com.br";
  const authHeader = "Basic " + Buffer.from(token + ":").toString("base64");

  // CANCELAMENTO
  if (acao === "cancelar") {
    try {
      const response = await fetch(baseUrl + "/" + ref_cancelamento, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify({ justificativa: justificativa || "Cancelamento solicitado pelo emitente" }),
      });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch (e) {
        return Response.json({ success: false, mensagem: "Resposta: " + text.substring(0, 300) });
      }
      return Response.json({
        success: data.status === "cancelado",
        status: data.status,
        mensagem: data.mensagem_sefaz || data.mensagem || JSON.stringify(data),
      });
    } catch (error) {
      return Response.json({ success: false, mensagem: error.message });
    }
  }

  // CARTA DE CORRECAO ELETRONICA (CC-e) — corrige campos que a SEFAZ permite
  // alterar sem cancelar a nota (ex: dados do transportador, quantidade/peso
  // dos volumes), desde que nao mude valor, quantidade faturada ou as partes
  // envolvidas. Endpoint confirmado na doc Focus: POST /nfe/{ref}/carta_correcao.
  if (acao === "carta_correcao") {
    try {
      const response = await fetch(baseUrl + "/" + ref_correcao + "/carta_correcao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify({ correcao }),
      });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch (e) {
        return Response.json({ success: false, mensagem: "Resposta: " + text.substring(0, 300) });
      }
      return Response.json({
        success: response.ok && !!data.numero_carta_correcao,
        status_sefaz: data.status_sefaz,
        mensagem: data.mensagem_sefaz || data.mensagem || JSON.stringify(data),
        numero_carta_correcao: data.numero_carta_correcao,
        url_pdf_carta_correcao: data.caminho_pdf_carta_correcao ? urlBase + data.caminho_pdf_carta_correcao : null,
        url_xml_carta_correcao: data.caminho_xml_carta_correcao ? urlBase + data.caminho_xml_carta_correcao : null,
      });
    } catch (error) {
      return Response.json({ success: false, mensagem: error.message });
    }
  }

  // EMISSAO
  const cfop = ordem.client?.estado?.toUpperCase() === "SC" ? "5101" : "6101";

  const totalItens = (ordem.items || []).reduce((s, it) => s + (it.total || 0), 0);
  const frete = ordem.frete || 0;
  const totalNfe = ordem.total || 0;

  const produtos = (ordem.items || []).map((item, i) => {
    let ncm = "94031000";
    const nome = (item.name || "").toLowerCase();
    if (nome.includes("mpp") || nome.includes("porta palete") || nome.includes("mini porta")) {
      ncm = "73089090";
    }

    const valorItem = totalItens > 0 ? (item.total / totalItens) * totalNfe : item.total;

    return {
      numero_item: String(i + 1),
      codigo_produto: String(item.code || i + 1),
      descricao: item.name || "Produto",
      codigo_ncm: ncm,
      cfop: cfop,
      unidade_comercial: "UN",
      quantidade_comercial: String(item.qty || 1),
      valor_unitario_comercial: (valorItem / (item.qty || 1)).toFixed(4),
      valor_bruto: valorItem.toFixed(2),
      unidade_tributavel: "UN",
      quantidade_tributavel: String(item.qty || 1),
      valor_unitario_tributavel: (valorItem / (item.qty || 1)).toFixed(4),
      icms_origem: "0",
      icms_situacao_tributaria: "400",
      icms_base_calculo: "0.00",
      icms_valor: "0.00",
      pis_situacao_tributaria: "99",
      pis_base_calculo: "0.00",
      pis_aliquota_porcentual: "0.00",
      pis_valor: "0.00",
      cofins_situacao_tributaria: "99",
      cofins_base_calculo: "0.00",
      cofins_aliquota_porcentual: "0.00",
      cofins_valor: "0.00",
    };
  });

  const docCliente = (ordem.client?.cnpj || "").replace(/\D/g, "");
  const isClienteCpf = docCliente.length === 11;

  const dataEmissao = dataEmissaoBRT();
  const nfe = {
    data_emissao: dataEmissao,
    data_entrada_saida: dataEmissao,
    natureza_operacao: "Venda",
    forma_pagamento: "0",
    tipo_documento: "1",
    local_destino: ordem.client?.estado?.toUpperCase() === "SC" ? "1" : "2",
    finalidade_emissao: "1",
    consumidor_final: "1",
    presenca_comprador: "0",
    cnpj_emitente: "46996687000168",
    nome_emitente: "GONDOLAS SUPREMA LTDA",
    nome_fantasia_emitente: "Gondolas Suprema",
    inscricao_estadual_emitente: "261775430",
    regime_tributario_emitente: "1",
    logradouro_emitente: "Rua Jose Cosme Pamplona",
    numero_emitente: "1700",
    bairro_emitente: "Bela Vista",
    municipio_emitente: "Palhoca",
    uf_emitente: "SC",
    cep_emitente: "88132700",
    codigo_municipio_emitente: "4211900",
    telefone_emitente: "48988741847",
    ...(isClienteCpf
      ? { cpf_destinatario: docCliente }
      : { cnpj_destinatario: docCliente }),
    nome_destinatario: ordem.client?.empresa || "Consumidor",
    logradouro_destinatario: ordem.client?.endereco || "Nao informado",
    numero_destinatario: ordem.client?.numero || "SN",
    bairro_destinatario: ordem.client?.bairro || "Nao informado",
    municipio_destinatario: ordem.client?.cidade || "Nao informado",
    uf_destinatario: (ordem.client?.estado || "SC").toUpperCase(),
    cep_destinatario: ((ordem.client?.cep || "").replace(/\D/g, "").padStart(8, "0")).slice(0, 8) || "00000000",
    // Inscricao Estadual: se cliente é PJ e a ficha tem IE preenchida, manda
    // indicador "1" (contribuinte) + IE. Se for "ISENTO" / vazio / PF, indicador "9".
    // SEFAZ rejeita NF-e com destinatario PJ sem IE quando o indicador eh 1.
    ...(function() {
      if (isClienteCpf) return { indicador_inscricao_estadual_destinatario: "9" };
      const ieRaw = String(ordem.client?.ie || "").trim().toUpperCase();
      if (!ieRaw || ieRaw === "ISENTO" || ieRaw === "ISENTA") {
        return { indicador_inscricao_estadual_destinatario: ieRaw.startsWith("ISENT") ? "2" : "9" };
      }
      const ieLimpa = ieRaw.replace(/\D/g, "");
      if (!ieLimpa) return { indicador_inscricao_estadual_destinatario: "9" };
      return {
        indicador_inscricao_estadual_destinatario: "1",
        inscricao_estadual_destinatario: ieLimpa,
      };
    })(),
    telefone_destinatario: (ordem.client?.telefone || "").replace(/\D/g, ""),
    email_destinatario: ordem.client?.email || "",
    items: produtos,
    modalidade_frete: "3",
    valor_produtos: totalNfe.toFixed(2),
    valor_total: totalNfe.toFixed(2),
    formas_pagamento: [{
      forma_pagamento: "99",
      valor_pagamento: totalNfe.toFixed(2),
    }],
  };

  // Transportadora (grupo Transporte da NFe) — só entra quando o envio é
  // feito por transportadora. modalidade_frete: "0" = CIF (emitente paga),
  // "1" = FOB (destinatário paga) — sobrescreve o default "3" (transporte
  // próprio) usado quando a Suprema mesma entrega e monta.
  // ⚠️ Nomes de campo (nome_transportador, cnpj_transportador, etc.) seguem o
  // mesmo padrão "atributo_entidade" já confirmado nos campos de destinatario/
  // emitente desta rota — não confirmados 1:1 na doc da Focus (indisponível
  // no momento da implementação). Testar em homologação antes de confiar 100%
  // em produção; se a Focus rejeitar por nome de campo, o erro virá explícito.
  if (transportadora && transportadora.nome) {
    const docTransp = (transportadora.documento || "").replace(/\D/g, "");
    const transpIsCpf = docTransp.length === 11;
    nfe.modalidade_frete = transportadora.frete_modalidade === "1" ? "1" : "0";
    nfe.nome_transportador = transportadora.nome;
    if (docTransp) {
      if (transpIsCpf) nfe.cpf_transportador = docTransp;
      else nfe.cnpj_transportador = docTransp;
    }
    if (transportadora.ie) nfe.inscricao_estadual_transportador = String(transportadora.ie).replace(/\D/g, "");
    if (transportadora.endereco) nfe.endereco_transportador = transportadora.endereco;
    if (transportadora.municipio) nfe.municipio_transportador = transportadora.municipio;
    if (transportadora.uf) nfe.uf_transportador = String(transportadora.uf).toUpperCase();
    // Volumes vão num ARRAY "volumes" (tag XML vol) — nomes confirmados na doc
    // oficial de campos da Focus NFe (campos.focusnfe.com.br/nfe/): cada volume
    // tem quantidade (qVol), especie (esp), peso_liquido (pesoL) e peso_bruto
    // (pesoB). Os campos planos antigos (quantidade_volumes/peso_bruto_volumes)
    // NÃO existem na API — por isso a caixa de volumes não saía na DANFE.
    const qtd = Number(transportadora.quantidade) || 1;
    const pesoB = Number(transportadora.peso_bruto) || 0;
    const pesoL = Number(transportadora.peso_liquido) || 0;
    nfe.volumes = [{
      quantidade: String(Math.max(1, Math.round(qtd))),
      especie: "Volume",
      peso_liquido: pesoL.toFixed(3),
      peso_bruto: pesoB.toFixed(3),
    }];
  }

  const ref = "nfe_" + Date.now();

  try {
    const response = await fetch(baseUrl + "?ref=" + ref, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(nfe),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return Response.json({
        success: false,
        status: "erro_parse",
        mensagem: "Resposta da API: " + text.substring(0, 300),
      });
    }

    if (data.status === "autorizado" || data.status_sefaz === "100") {
      return Response.json({
        success: true,
        status: data.status,
        numero: data.numero,
        chave: data.chave_nfe,
        url_danfe: data.caminho_danfe ? urlBase + data.caminho_danfe : null,
        url_xml: data.caminho_xml_nota_fiscal ? urlBase + data.caminho_xml_nota_fiscal : null,
        ref: ref,
      });
    } else if (data.status === "processando_autorizacao") {
      await new Promise(function(r) { setTimeout(r, 5000); });
      const checkResponse = await fetch(baseUrl + "/" + ref, {
        headers: { "Authorization": authHeader },
      });
      const checkText = await checkResponse.text();
      let checkData;
      try {
        checkData = JSON.parse(checkText);
      } catch (e) {
        return Response.json({
          success: false,
          status: "erro_parse",
          mensagem: "Resposta consulta: " + checkText.substring(0, 300),
        });
      }
      return Response.json({
        success: checkData.status === "autorizado",
        status: checkData.status,
        numero: checkData.numero,
        chave: checkData.chave_nfe,
        url_danfe: checkData.caminho_danfe ? urlBase + checkData.caminho_danfe : null,
        url_xml: checkData.caminho_xml_nota_fiscal ? urlBase + checkData.caminho_xml_nota_fiscal : null,
        mensagem: checkData.mensagem_sefaz,
        ref: ref,
      });
    } else {
      return Response.json({
        success: false,
        status: data.status || "erro",
        mensagem: data.mensagem_sefaz || data.mensagem || JSON.stringify(data),
        erros: data.erros || data.erros_validacao || null,
        ref: ref,
      });
    }
  } catch (error) {
    return Response.json({
      success: false,
      status: "erro",
      mensagem: error.message,
    });
  }
}
