export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json();
  const { ambiente, cnpj } = body;

  const TOKENS = {
    homologacao: "YoOU9pLnnkcTYCiPx9fF59ChxxeDa7D4",
    producao: "J2rPtH7N9vNbVbqN3GlusOOCRhdqlTKr",
  };

  const token = ambiente === "producao" ? TOKENS.producao : TOKENS.homologacao;
  const baseUrl = ambiente === "producao"
    ? "https://api.focusnfe.com.br/v2/nfe"
    : "https://homologacao.focusnfe.com.br/v2/nfe";
  const authHeader = "Basic " + Buffer.from(token + ":").toString("base64");

  try {
    const response = await fetch(baseUrl + "?cnpj=" + (cnpj || "46996687000168"), {
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

    return Response.json({ success: true, notas: data });
  } catch (error) {
    return Response.json({ success: false, mensagem: error.message });
  }
}
