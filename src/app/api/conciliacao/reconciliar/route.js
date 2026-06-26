export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { detectarIgnorar, valoresIguais } from "../../../../lib/conciliacao-helpers";

function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Diferença em dias entre duas strings YYYY-MM-DD.
function diasEntre(a, b) {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.abs(da - db) / (1000 * 60 * 60 * 24);
}

// POST { banco, mes } → roda matching automático e atualiza todos os
// lançamentos do banco/mes na tabela lancamentos_bancarios.
//
// Estratégia:
// 1. Ignorados → conferidos pela função detectarIgnorar (descrição).
// 2. Saídas (despesas) → procura match em `despesas` por valor exato
//    + vencimento dentro de ±3 dias. Se 1 match único, status=conciliado.
//    Senão, so_extrato.
// 3. Entradas (receitas) → procura match em `orcamentos.valor_recebido`
//    ou `orcamentos.total` por valor exato + data_entrega/data ±5 dias.
//    Se achar, conciliado. Senão, so_extrato.
export async function POST(request) {
  try {
    const { banco, mes } = await request.json();
    if (!banco || !mes) {
      return Response.json({ success: false, mensagem: "banco e mes são obrigatórios" }, { status: 400 });
    }

    const sb = supabaseServer();

    // 1. Pega todos os lançamentos do banco/mês
    const { data: lancamentos, error: errLanc } = await sb
      .from("lancamentos_bancarios")
      .select("*")
      .eq("banco", banco)
      .eq("mes", mes);
    if (errLanc) {
      return Response.json({ success: false, mensagem: errLanc.message }, { status: 500 });
    }
    if (!lancamentos?.length) {
      return Response.json({ success: true, total: 0, mensagem: "Nenhum lançamento pra reconciliar." });
    }

    // 2. Pega despesas do mes (com ±5 dias de margem nos extremos)
    const { data: despesas } = await sb
      .from("despesas")
      .select("id, nome, vencimento, valor, tipo, categoria")
      .gte("vencimento", `${mes}-01`)
      .lte("vencimento", `${mes}-31`);

    // 3. Pega orçamentos com pagamento dentro do mês (recebidos ou totais
    // próximos), tanto da Gôndolas quanto da Suprema Instalações.
    const { data: orcamentos } = await sb
      .from("orcamentos")
      .select("id, cliente_empresa, total, valor_recebido, data_entrega, data, status, venda_empresa_recebedora")
      .eq("status", "Concluído");

    // Mapeia despesas/lançamentos já vinculados pra evitar match duplo
    const despesasUsadas = new Set();
    const ordensUsadas = new Set();
    const updates = [];

    const stats = { conciliado: 0, divergente: 0, so_extrato: 0, ignorado: 0 };

    for (const l of lancamentos) {
      // Se foi marcado manualmente (já com despesa_id ou ordem_id), respeita
      if (l.despesa_id || l.ordem_id || l.status_conciliacao === "ignorado") {
        // Manual ou já-ignorado: não mexe
        stats[l.status_conciliacao] = (stats[l.status_conciliacao] || 0) + 1;
        continue;
      }

      // 1. Ignorar automático
      const ig = detectarIgnorar(l.descricao);
      if (ig.ignorar) {
        updates.push({ id: l.id, status_conciliacao: "ignorado", observacao: ig.motivo });
        stats.ignorado++;
        continue;
      }

      // 2. Match
      if (l.tipo === "saida") {
        // Saída → tenta match em despesas
        const candidatos = (despesas || []).filter(d =>
          !despesasUsadas.has(d.id) &&
          valoresIguais(d.valor, l.valor) &&
          diasEntre(d.vencimento, l.data) <= 3
        );
        // Ordena por proximidade da data
        candidatos.sort((a, b) => diasEntre(a.vencimento, l.data) - diasEntre(b.vencimento, l.data));
        if (candidatos.length > 0) {
          const escolhido = candidatos[0];
          despesasUsadas.add(escolhido.id);
          updates.push({ id: l.id, status_conciliacao: "conciliado", despesa_id: escolhido.id });
          stats.conciliado++;
        } else {
          updates.push({ id: l.id, status_conciliacao: "so_extrato" });
          stats.so_extrato++;
        }
      } else {
        // Entrada → tenta match em orcamentos.valor_recebido ou total
        const candidatos = (orcamentos || []).filter(o => {
          if (ordensUsadas.has(o.id)) return false;
          const vr = Number(o.valor_recebido);
          const tot = Number(o.total);
          if (vr && valoresIguais(vr, l.valor)) return true;
          if (tot && valoresIguais(tot, l.valor)) return true;
          return false;
        });
        // Filtra ainda por data próxima (data_entrega ou data) — ±15 dias
        const filtrados = candidatos.filter(o => {
          const ref = o.data_entrega || (o.data ? o.data.slice(0, 10) : null);
          if (!ref) return true;
          return diasEntre(ref, l.data) <= 15;
        });
        const lista = filtrados.length > 0 ? filtrados : candidatos;
        if (lista.length > 0) {
          const escolhido = lista[0];
          ordensUsadas.add(escolhido.id);
          updates.push({ id: l.id, status_conciliacao: "conciliado", ordem_id: escolhido.id });
          stats.conciliado++;
        } else {
          updates.push({ id: l.id, status_conciliacao: "so_extrato" });
          stats.so_extrato++;
        }
      }
    }

    // Aplica updates em lote
    for (const u of updates) {
      const patch = { status_conciliacao: u.status_conciliacao, atualizado_em: new Date().toISOString() };
      if (u.despesa_id) patch.despesa_id = u.despesa_id;
      if (u.ordem_id) patch.ordem_id = u.ordem_id;
      if (u.observacao) patch.observacao = u.observacao;
      await sb.from("lancamentos_bancarios").update(patch).eq("id", u.id);
    }

    return Response.json({ success: true, total: lancamentos.length, stats });
  } catch (e) {
    return Response.json({ success: false, mensagem: e.message }, { status: 500 });
  }
}
