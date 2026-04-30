export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Consulta CNPJ via BrasilAPI (principal) com fallback ReceitaWS para
// preencher email/telefone quando a BrasilAPI nao retornar.
// Roda no servidor para evitar bloqueios de extensao/CORS no navegador.
export async function GET(_request, { params }) {
  const cnpjLimpo = String(params?.cnpj || "").replace(/\D/g, "");

  if (cnpjLimpo.length !== 14) {
    return Response.json(
      { success: false, mensagem: "CNPJ deve ter 14 digitos." },
      { status: 400 }
    );
  }

  // 1) BrasilAPI (fonte principal)
  let dados;
  try {
    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, {
      headers: { "User-Agent": "GondolasSuprema/1.0" },
      cache: "no-store",
    });

    if (resp.status === 404) {
      return Response.json(
        { success: false, mensagem: "CNPJ nao encontrado na Receita." },
        { status: 404 }
      );
    }
    if (!resp.ok) {
      return Response.json(
        { success: false, mensagem: `BrasilAPI retornou status ${resp.status}.` },
        { status: 502 }
      );
    }
    dados = await resp.json();
  } catch (e) {
    return Response.json(
      { success: false, mensagem: "Falha ao consultar BrasilAPI: " + (e?.message || "erro desconhecido") },
      { status: 502 }
    );
  }

  // 2) Normalizacao
  const cep = dados.cep ? String(dados.cep).replace(/\D/g, "") : "";
  const dddTel = dados.ddd_telefone_1 ? String(dados.ddd_telefone_1).replace(/\D/g, "") : "";

  let email = dados.email || "";
  let telefone = dddTel || "";

  // 3) Fallback ReceitaWS apenas se faltar email (servidor nao tem CORS, entao roda)
  if (!email) {
    try {
      const respRws = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpjLimpo}`, {
        headers: { "User-Agent": "GondolasSuprema/1.0" },
        cache: "no-store",
      });
      if (respRws.ok) {
        const dRws = await respRws.json();
        if (dRws && dRws.status !== "ERROR") {
          email = email || dRws.email || "";
          if (!telefone && dRws.telefone) {
            telefone = String(dRws.telefone).replace(/\D/g, "");
          }
        }
      }
    } catch (_e) {
      // silencioso: ReceitaWS eh opcional, BrasilAPI ja tem o essencial
    }
  }

  return Response.json({
    success: true,
    razao_social: dados.razao_social || "",
    nome_fantasia: dados.nome_fantasia || "",
    email,
    telefone,
    logradouro: dados.logradouro || "",
    numero: dados.numero || "",
    bairro: dados.bairro || "",
    cep,
    municipio: dados.municipio || "",
    uf: dados.uf || "",
  });
}
