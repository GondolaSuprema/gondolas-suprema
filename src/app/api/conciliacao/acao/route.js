export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { inferirTipoCategoria, gerarIdDespesa } from "../../../../lib/conciliacao-helpers";

function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
}

// POST { lancamento_id, acao, ... }
//
// Ações suportadas:
// - "criar_despesa"        → cria despesa nova a partir do lançamento e linka
// - "marcar_ignorado"      → muda status_conciliacao pra 'ignorado'
// - "marcar_conciliado"    → muda pra 'conciliado' (uso manual)
// - "vincular_despesa"     → linka a uma despesa existente (despesa_id)
// - "vincular_venda"       → linka a uma venda (ordem_id) e atualiza valor_recebido
// - "desconciliar"         → reseta pra 'pendente'
export async function POST(request) {
  try {
    const body = await request.json();
    const { lancamento_id, acao } = body;
    if (!lancamento_id || !acao) {
      return Response.json({ success: false, mensagem: "lancamento_id e acao são obrigatórios" }, { status: 400 });
    }

    const sb = supabaseServer();

    // Carrega o lançamento
    const { data: l, error: errL } = await sb
      .from("lancamentos_bancarios")
      .select("*")
      .eq("id", lancamento_id)
      .single();
    if (errL || !l) {
      return Response.json({ success: false, mensagem: "Lançamento não encontrado" }, { status: 404 });
    }

    if (acao === "criar_despesa") {
      const { tipo, categoria } = inferirTipoCategoria(l.descricao);
      // Pra entradas, sai como tipo RECEITA_FINANCEIRA por padrão se for empréstimo
      const tipoFinal = l.tipo === "entrada" && tipo !== "RECEITA_FINANCEIRA" ? "RECEITA_FINANCEIRA" : tipo;
      const categoriaFinal = l.tipo === "entrada" && tipo !== "RECEITA_FINANCEIRA" ? "Outros" : categoria;
      const novaDespesaId = gerarIdDespesa(l.banco.split("_")[0], l.data, l.descricao);
      // Prefixo legível no nome
      const prefixoBanco = ({ c6_instalacoes: "C6", sicredi_gondolas: "Sicredi", mp_gondolas: "MP" })[l.banco] || l.banco;
      const nome = `${prefixoBanco} - ${l.descricao}`.slice(0, 120);

      const { error: errD } = await sb.from("despesas").insert({
        id: novaDespesaId,
        nome,
        vencimento: l.data,
        valor: l.valor,
        status: "pago",
        mes: l.mes,
        fixa: false,
        tipo: tipoFinal,
        categoria: categoriaFinal,
      });
      if (errD) {
        return Response.json({ success: false, mensagem: `Erro ao criar despesa: ${errD.message}` }, { status: 500 });
      }
      await sb.from("lancamentos_bancarios").update({
        status_conciliacao: "conciliado",
        despesa_id: novaDespesaId,
        atualizado_em: new Date().toISOString(),
      }).eq("id", lancamento_id);
      return Response.json({ success: true, despesa_id: novaDespesaId, tipo: tipoFinal, categoria: categoriaFinal });
    }

    if (acao === "marcar_ignorado") {
      const motivo = body.observacao || "Marcado manualmente como ignorado";
      await sb.from("lancamentos_bancarios").update({
        status_conciliacao: "ignorado",
        observacao: motivo,
        atualizado_em: new Date().toISOString(),
      }).eq("id", lancamento_id);
      return Response.json({ success: true });
    }

    if (acao === "marcar_conciliado") {
      await sb.from("lancamentos_bancarios").update({
        status_conciliacao: "conciliado",
        atualizado_em: new Date().toISOString(),
      }).eq("id", lancamento_id);
      return Response.json({ success: true });
    }

    if (acao === "vincular_despesa") {
      const { despesa_id } = body;
      if (!despesa_id) return Response.json({ success: false, mensagem: "despesa_id obrigatório" }, { status: 400 });
      await sb.from("lancamentos_bancarios").update({
        status_conciliacao: "conciliado",
        despesa_id,
        atualizado_em: new Date().toISOString(),
      }).eq("id", lancamento_id);
      return Response.json({ success: true });
    }

    if (acao === "vincular_venda") {
      const { ordem_id, atualizar_valor_recebido } = body;
      if (!ordem_id) return Response.json({ success: false, mensagem: "ordem_id obrigatório" }, { status: 400 });
      // Opcionalmente atualiza o valor_recebido da venda
      if (atualizar_valor_recebido) {
        await sb.from("orcamentos").update({ valor_recebido: l.valor }).eq("id", ordem_id);
      }
      await sb.from("lancamentos_bancarios").update({
        status_conciliacao: "conciliado",
        ordem_id,
        atualizado_em: new Date().toISOString(),
      }).eq("id", lancamento_id);
      return Response.json({ success: true });
    }

    if (acao === "desconciliar") {
      await sb.from("lancamentos_bancarios").update({
        status_conciliacao: "pendente",
        despesa_id: null,
        ordem_id: null,
        observacao: null,
        atualizado_em: new Date().toISOString(),
      }).eq("id", lancamento_id);
      return Response.json({ success: true });
    }

    return Response.json({ success: false, mensagem: `Ação desconhecida: ${acao}` }, { status: 400 });
  } catch (e) {
    return Response.json({ success: false, mensagem: e.message }, { status: 500 });
  }
}
