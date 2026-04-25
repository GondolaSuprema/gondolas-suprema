export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json();
  const { ref, ambiente } = body;

  const TOKENS = {
    homologacao: process.env.FOCUS_NFE_TOKEN_HOMOLOGACAO,
    producao: process.env.FOCUS_NFE_TOKEN_PRODUCAO,
  };

  const token = ambiente === "producao" ? TOKENS.producao : TOKENS.homologacao;
  if (!token) {
    return Response.json({
      success: false,
      mensagem: "Token Focus NFe nao configurado.",
    }, { status: 500 });
  }
  const baseUrl = ambiente === "producao"
    ? "https://api.focusnfe.com.br/v2/nfe"
    : "https://homologacao.focusnfe.com.br/v2/nfe";
  const authHeader = "Basic " + Buffer.from(token + ":").toString("base64");

  try {
    const response = await fetch(baseUrl + "/" + ref + "?completa=1", {
      method: "GET",
      headers: { "Authorization": authHeader },
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return Response.json({ success: false, mensagem: "Resposta: " + text.substring(0, 300) });
    }

    return Response.json({
      success: true,
      status: data.status,
      numero: data.numero,
      chave: data.chave_nfe,
      mensagem_sefaz: data.mensagem_sefaz,
      data_emissao: data.data_emissao,
      valor_total: data.valor_total,
      nome_destinatario: data.nome_destinatario,
    });
  } catch (error) {
    return Response.json({ success: false, mensagem: error.message });
  }
}
