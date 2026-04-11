export async function POST(request) {
  const body = await request.json();
  const { ordem, ambiente } = body;

  // Tokens Focus NFe
  const TOKENS = {
    homologacao: "YoOU9pLnnkcTYCiPx9fF59ChxxeDa7D4",
    producao: "J2rPtH7N9vNbVbqN3GlusOOCRhdqlTKr",
  };

  const token = ambiente === "producao" ? TOKENS.producao : TOKENS.homologacao;
  const baseUrl = "https://api.focusnfe.com.br/v2/nfe";

  // Dados do emitente
  const emitente = {
    cnpj: "46996687000168",
    razao_social: "GONDOLAS SUPREMA LTDA",
    nome_fantasia: "Gondolas Suprema",
    inscricao_estadual: "261775430",
    regime_tributario: "1",
    logradouro: "Rua Jose Cosme Pamplona",
    numero: "1700",
    bairro: "Bela Vista",
    municipio: "Palhoça",
    uf: "SC",
    cep: "88132700",
    codigo_municipio: "4211900",
    telefone: "4898874-1847",
  };

  // Determinar CFOP baseado no estado do cliente
  const cfop = ordem.client?.estado?.toUpperCase() === "SC" ? "5102" : "6102";

  // Montar produtos
  const produtos = (ordem.items || []).map((item, i) => {
    // Determinar NCM baseado no nome do produto
    let ncm = "94031000"; // padrão gôndolas
    const nome = (item.name || "").toLowerCase();
    if (nome.includes("mpp") || nome.includes("porta palete") || nome.includes("mini porta")) {
      ncm = "73089090";
    }

    return {
      numero_item: String(i + 1),
      codigo_produto: String(item.code || i + 1),
      descricao: item.name || "Produto",
      ncm: ncm,
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

  // Determinar se é CPF ou CNPJ
  const docCliente = (ordem.client?.cnpj || "").replace(/\D/g, "");
  const isClienteCpf = docCliente.length === 11;

  // Montar NF-e
  const nfe = {
    natureza_operacao: "Venda",
    forma_pagamento: "0",
    tipo_documento: "1",
    local_destino: ordem.client?.estado?.toUpperCase() === "SC" ? "1" : "2",
    finalidade_emissao: "1",
    consumidor_final: "1",
    presenca_comprador: "0",
    nome_emitente: emitente.razao_social,
    nome_fantasia_emitente: emitente.nome_fantasia,
    cnpj_emitente: emitente.cnpj,
    inscricao_estadual_emitente: emitente.inscricao_estadual,
    regime_tributario_emitente: emitente.regime_tributario,
    logradouro_emitente: emitente.logradouro,
    numero_emitente: emitente.numero,
    bairro_emitente: emitente.bairro,
    municipio_emitente: emitente.municipio,
    uf_emitente: emitente.uf,
    cep_emitente: emitente.cep,
    codigo_municipio_emitente: emitente.codigo_municipio,
    telefone_emitente: emitente.telefone,
    ...(isClienteCpf
      ? { cpf_destinatario: docCliente }
      : { cnpj_destinatario: docCliente }),
    nome_destinatario: ordem.client?.empresa || "Consumidor",
    logradouro_destinatario: ordem.client?.endereco || "Não informado",
    numero_destinatario: "S/N",
    bairro_destinatario: ordem.client?.bairro || "Não informado",
    municipio_destinatario: ordem.client?.cidade || "Não informado",
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

  // Gerar referência única
  const ref = "nfe_" + Date.now();

  try {
    const response = await fetch(`${baseUrl}?ref=${ref}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(token + ":").toString("base64"),
      },
      body: JSON.stringify(nfe),
    });

    const data = await response.json();

    if (data.status === "autorizado" || data.status_sefaz === "100") {
      return Response.json({
        success: true,
        status: data.status,
        numero: data.numero,
        chave: data.chave_nfe,
        url_danfe: data.caminho_danfe,
        url_xml: data.caminho_xml_nota_fiscal,
        ref,
      });
    } else if (data.status === "processando_autorizacao") {
      // Aguardar processamento
      await new Promise((r) => setTimeout(r, 5000));
      const checkResponse = await fetch(`${baseUrl}/${ref}`, {
        headers: {
          Authorization: "Basic " + Buffer.from(token + ":").toString("base64"),
        },
      });
      const checkData = await checkResponse.json();
      return Response.json({
        success: checkData.status === "autorizado",
        status: checkData.status,
        numero: checkData.numero,
        chave: checkData.chave_nfe,
        url_danfe: checkData.caminho_danfe,
        url_xml: checkData.caminho_xml_nota_fiscal,
        mensagem: checkData.mensagem_sefaz,
        ref,
      });
    } else {
      return Response.json({
        success: false,
        status: data.status || "erro",
        mensagem: data.mensagem_sefaz || data.mensagem || JSON.stringify(data),
        ref,
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
