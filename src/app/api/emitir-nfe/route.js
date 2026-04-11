export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json();
  const { ordem, ambiente } = body;

  const TOKENS = {
    homologacao: "YoOU9pLnnkcTYCiPx9fF59ChxxeDa7D4",
    producao: "J2rPtH7N9vNbVbqN3GlusOOCRhdqlTKr",
  };

  const token = ambiente === "producao" ? TOKENS.producao : TOKENS.homologacao;
  const baseUrl = ambiente === "producao"
    ? "https://api.focusnfe.com.br/v2/nfe"
    : "https://homologacao.focusnfe.com.br/v2/nfe";
  const authHeader = "Basic " + Buffer.from(token + ":").toString("base64");

  const cfop = ordem.client?.estado?.toUpperCase() === "SC" ? "5102" : "6102";

  const produtos = (ordem.items || []).map((item, i) => {
    let ncm = "94031000";
    const nome = (item.name || "").toLowerCase();
    if (nome.includes("mpp") || nome.includes("porta palete") || nome.includes("mini porta")) {
      ncm = "73089090";
    }
    return {
      numero_item: String(i + 1),
      codigo_produto: String(item.code || i + 1),
      descricao: item.name || "Produto",
      codigo_ncm: ncm,
      cfop: cfop,
      unidade_comercial: "UN",
      quantidade_comercial: String(item.qty || 1),
      valor_unitario_comercial: (item.total / (item.qty || 1)).toFixed(4),
      valor_bruto: (item.total || 0).toFixed(2),
      unidade_tributavel: "UN",
      quantidade_tributavel: String(item.qty || 1),
      valor_unitario_tributavel: (item.total / (item.qty || 1)).toFixed(4),
      origem: "0",
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

  const nfe = {
    data_emissao: new Date().toISOString(),
    data_entrada_saida: new Date().toISOString(),
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
    numero_destinatario: "SN",
    bairro_destinatario: ordem.client?.bairro || "Nao informado",
    municipio_destinatario: ordem.client?.cidade || "Nao informado",
    uf_destinatario: (ordem.client?.estado || "SC").toUpperCase(),
    cep_destinatario: "00000000",
    indicador_inscricao_estadual_destinatario: "9",
    telefone_destinatario: (ordem.client?.telefone || "").replace(/\D/g, ""),
    email_destinatario: ordem.client?.email || "",
    items: produtos,
    modalidade_frete: "3",
    valor_produtos: produtos.reduce((s, p) => s + Number(p.valor_bruto), 0).toFixed(2),
    valor_total: (ordem.total || 0).toFixed(2),
    valor_desconto: Math.max(0, produtos.reduce((s, p) => s + Number(p.valor_bruto), 0) - (ordem.total || 0)).toFixed(2),
    formas_pagamento: [{
      forma_pagamento: "99",
      valor_pagamento: (ordem.total || 0).toFixed(2),
    }],
  };

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
        url_danfe: data.caminho_danfe,
        url_xml: data.caminho_xml_nota_fiscal,
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
        url_danfe: checkData.caminho_danfe,
        url_xml: checkData.caminho_xml_nota_fiscal,
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
