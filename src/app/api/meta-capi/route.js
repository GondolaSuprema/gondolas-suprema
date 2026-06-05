export const runtime = "nodejs";

import crypto from "crypto";

// Ponte CAPI - Fase 1 (coleta)
// Dispara um evento Purchase pro Meta quando um orcamento vira "Concluido".
// NAO altera nenhuma campanha. So manda a verdade da venda pro algoritmo aprender.

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// Normaliza telefone BR pro padrao que o Meta espera: so digitos, com DDI 55.
function normalizarTelefone(tel) {
  let d = (tel || "").replace(/\D/g, "");
  if (!d) return null;
  // remove zeros a esquerda
  d = d.replace(/^0+/, "");
  // se nao comeca com 55 (DDI Brasil), adiciona
  if (!d.startsWith("55")) d = "55" + d;
  return d;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, telefone, valor, email, nome } = body;

    const DATASET_ID = process.env.META_CAPI_DATASET_ID;
    const TOKEN = process.env.META_CAPI_TOKEN;
    const API_VERSION = process.env.META_CAPI_VERSION || "v21.0";

    if (!DATASET_ID || !TOKEN) {
      return Response.json(
        { success: false, mensagem: "CAPI nao configurada (faltam env vars)" },
        { status: 200 }
      );
    }

    const telNorm = normalizarTelefone(telefone);

    const user_data = {};
    if (telNorm) user_data.ph = [sha256(telNorm)];
    if (email) user_data.em = [sha256(String(email).trim().toLowerCase())];

    const evento = {
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      action_source: "business_messaging",
      messaging_channel: "whatsapp",
      // event_id = id do orcamento -> garante deduplicacao se reenviar
      event_id: String(id || Date.now()),
      user_data,
      custom_data: {
        currency: "BRL",
        value: Number(valor || 0),
      },
    };

    const url =
      "https://graph.facebook.com/" +
      API_VERSION +
      "/" +
      DATASET_ID +
      "/events?access_token=" +
      encodeURIComponent(TOKEN);

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [evento] }),
    });

    const data = await resp.json();

    if (resp.ok && data.events_received) {
      return Response.json({
        success: true,
        events_received: data.events_received,
        fbtrace_id: data.fbtrace_id,
      });
    }

    return Response.json({
      success: false,
      mensagem: data.error?.message || "Erro ao enviar evento",
      detalhe: data,
    });
  } catch (error) {
    // Nunca quebra o fluxo da venda - so registra o erro.
    return Response.json({ success: false, mensagem: error.message }, { status: 200 });
  }
}
