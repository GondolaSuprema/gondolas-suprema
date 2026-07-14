export const runtime = "nodejs";

import crypto from "crypto";

// Ponte CAPI - Fase 1 (coleta)
// Dispara eventos pro Meta: Lead quando um orcamento e criado, Purchase quando vira "Concluido".
// NAO altera nenhuma campanha. So manda a verdade do funil pro algoritmo aprender.

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

// Normalizacoes pro padrao que o Meta exige (minusculo, sem acento/pontuacao).
function normalizarCidade(cidade) {
  if (!cidade) return null;
  const s = String(cidade)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return s || null;
}
function normalizarEstado(estado) {
  if (!estado) return null;
  const s = String(estado).trim().toLowerCase().replace(/[^a-z]/g, "");
  return s || null;
}
function normalizarCep(cep) {
  const d = String(cep || "").replace(/\D/g, "");
  return d || null;
}
function normalizarCnpj(cnpj) {
  const d = String(cnpj || "").replace(/\D/g, "");
  return d || null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, telefone, valor, email, nome, cidade, estado, cep, cnpj, evento: eventoNome } = body;
    // "Purchase" (padrao, orcamento Concluido) ou "Lead" (orcamento criado)
    const eventName = eventoNome === "Lead" ? "Lead" : "Purchase";

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

    // Dados extras (email/cidade/estado/CEP/CNPJ) so entram em eventos Purchase --
    // so depois do orcamento virar "Concluido" esses dados estao 100% validados.
    // No Lead (orcamento so criado) o unico dado 100% real e o telefone.
    if (eventName === "Purchase") {
      if (email) user_data.em = [sha256(String(email).trim().toLowerCase())];
      const ctNorm = normalizarCidade(cidade);
      if (ctNorm) user_data.ct = [sha256(ctNorm)];
      const stNorm = normalizarEstado(estado);
      if (stNorm) user_data.st = [sha256(stNorm)];
      const zpNorm = normalizarCep(cep);
      if (zpNorm) user_data.zp = [sha256(zpNorm)];
      user_data.country = [sha256("br")];
      const cnpjNorm = normalizarCnpj(cnpj);
      if (cnpjNorm) user_data.external_id = [sha256(cnpjNorm)];
    }

    const evento = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "business_messaging",
      messaging_channel: "whatsapp",
      // event_id = id do orcamento (prefixado por tipo) -> garante deduplicacao se reenviar
      event_id: (eventName === "Lead" ? "lead-" : "purchase-") + String(id || Date.now()),
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
