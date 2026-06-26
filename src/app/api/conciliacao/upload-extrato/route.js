export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { parseExtrato } from "../../../../lib/parsers/extrato";
import { createClient } from "@supabase/supabase-js";

// Service-role client (server-side only) pra fazer upsert na tabela
// lancamentos_bancarios bypassando RLS. As env vars devem estar na Vercel.
function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return Response.json({ success: false, mensagem: "Arquivo PDF não enviado." }, { status: 400 });
    }

    // Lê o PDF como buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // pdf-parse v2: API OOP. Cria instância com o buffer e chama getText().
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    const texto = result.text || "";

    if (!texto.trim()) {
      return Response.json({ success: false, mensagem: "Não foi possível extrair texto do PDF." }, { status: 422 });
    }

    // Detecta o banco e parseia
    const { banco, lancamentos, erro } = parseExtrato(texto);
    if (erro) {
      return Response.json({ success: false, mensagem: erro }, { status: 422 });
    }
    if (!lancamentos.length) {
      return Response.json({
        success: false,
        banco,
        mensagem: `Banco identificado (${banco}) mas nenhum lançamento foi reconhecido no PDF. Pode ser layout diferente — manda o trecho do PDF que eu ajusto o parser.`,
      }, { status: 422 });
    }

    // Persiste via upsert (idempotente: reupload do mesmo PDF não duplica
    // porque o ID é determinístico por banco+data+valor+descrição).
    const supabase = supabaseServer();
    const linhas = lancamentos.map(l => ({
      ...l,
      status_conciliacao: "pendente",
    }));

    const { data: inseridos, error } = await supabase
      .from("lancamentos_bancarios")
      .upsert(linhas, { onConflict: "id", ignoreDuplicates: false })
      .select("id");

    if (error) {
      return Response.json({ success: false, mensagem: `Erro ao salvar: ${error.message}`, raw: error }, { status: 500 });
    }

    return Response.json({
      success: true,
      banco,
      total: lancamentos.length,
      salvos: inseridos?.length || 0,
      lancamentos: linhas.slice(0, 5), // amostra pro preview
    });
  } catch (e) {
    return Response.json({ success: false, mensagem: e.message }, { status: 500 });
  }
}
