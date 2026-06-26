// Parsers de extrato bancário pra a aba Conciliação.
//
// Estratégia: recebemos o TEXTO bruto do PDF (pdf-parse) e detectamos o
// banco pelo conteúdo. Cada parser sabe extrair (data, descrição, valor,
// tipo) das linhas tabulares do seu layout específico.
//
// IDs gerados são determinísticos: hash(banco + data + valor + descrição)
// — assim reupload do mesmo PDF não duplica.

import crypto from "node:crypto";

function gerarId(banco, data, valor, descricao, indice) {
  const base = `${banco}|${data}|${valor.toFixed(2)}|${descricao.slice(0, 40)}|${indice}`;
  const hash = crypto.createHash("sha1").update(base).digest("hex").slice(0, 10);
  return `lb-${banco}-${data.replace(/-/g, "")}-${hash}`;
}

function mesDe(dataIso) {
  return dataIso.slice(0, 7); // YYYY-MM
}

// Converte string monetária BR ("1.234,56" ou "-1.234,56" ou "R$ -1.000,00")
// pra { valor (number positivo), tipo ('entrada'|'saida') }.
function parseValorBR(raw) {
  if (raw == null) return null;
  const limpo = String(raw).replace(/R\$\s*/g, "").replace(/\s/g, "").trim();
  if (!limpo) return null;
  const negativo = limpo.startsWith("-") || limpo.startsWith("(");
  // Remove sinal e parênteses
  const numStr = limpo.replace(/^[-(]+|[)]+$/g, "")
    .replace(/\./g, "")  // milhar
    .replace(",", ".");  // decimal
  const n = Number(numStr);
  if (!Number.isFinite(n)) return null;
  return { valor: Math.abs(n), tipo: negativo ? "saida" : "entrada" };
}

// Converte "DD/MM/AAAA" pra "YYYY-MM-DD".
function parseDataBR(raw) {
  if (!raw) return null;
  const m = String(raw).match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

// Detecta o banco pelo conteúdo do PDF. Retorna 'c6_instalacoes',
// 'sicredi_gondolas', 'mp_gondolas' ou null.
export function detectarBanco(texto) {
  const t = texto.toUpperCase();
  if (t.includes("C6BANK") || t.includes("C6 BANK") || t.includes("SUPREMA INSTALACOES LTDA")) {
    return "c6_instalacoes";
  }
  if (t.includes("SICREDI") || t.includes("ASSOCIADO:") || t.includes("COOPERATIVA: 0226")) {
    return "sicredi_gondolas";
  }
  if (t.includes("MERCADO PAGO") || t.includes("EXTRATO DE CONTA")) {
    return "mp_gondolas";
  }
  return null;
}

// Parser Sicredi — linhas tabulares "DD/MM/AAAA   Descrição   Doc   Valor   Saldo"
// Ignora cabeçalho "SALDO ANTERIOR" e linhas vazias.
export function parseSicredi(texto) {
  const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const out = [];
  let idx = 0;
  for (const linha of linhas) {
    // Regex: data + descrição + doc + valor + saldo (todos espaçados)
    // Doc pode ser sigla (Iof.ADic / PIX_DEB / COB000001 / REP001) ou vazio.
    const m = linha.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z][A-Za-z0-9_\.]+)?\s*(-?[\d\.]+,\d{2})\s+(-?[\d\.]+,\d{2})$/);
    if (!m) continue;
    const data = parseDataBR(m[1]);
    if (!data) continue;
    const descricao = m[2].trim();
    const docRef = (m[3] || "").trim() || null;
    const valorInfo = parseValorBR(m[4]);
    if (!valorInfo || valorInfo.valor === 0) continue;
    // Ignora linha de SALDO
    if (/^SALDO\b/i.test(descricao)) continue;
    out.push({
      banco: "sicredi_gondolas",
      conta: "69304-5",
      data,
      descricao,
      valor: valorInfo.valor,
      tipo: valorInfo.tipo,
      mes: mesDe(data),
      doc_ref: docRef,
      id: gerarId("sicredi", data, valorInfo.valor, descricao, idx++),
    });
  }
  return out;
}

// Parser Mercado Pago — formato:
//   "DD-MM-AAAA   Descrição (multilinha)   ID_OPERACAO   R$ -123,45   R$ 6.138,47"
// Atenção: descrição pode ocupar várias linhas; o ID vem antes do valor.
export function parseMercadoPago(texto) {
  const linhas = texto.split(/\r?\n/);
  const out = [];
  let idx = 0;
  // Acumula até encontrar uma linha com valor monetário. Quando achar, faz match
  // contra "DD-MM-AAAA ... ID R$ valor R$ saldo" (varredura linear simples).
  let buffer = "";
  for (const raw of linhas) {
    const linha = raw.trim();
    if (!linha) { buffer = ""; continue; }
    // Só começa a acumular quando encontra linha que comece com data DD-MM-AAAA
    // — assim ignora cabeçalho (Saldo inicial, Período, etc).
    if (!buffer && !/^\d{2}-\d{2}-\d{4}\b/.test(linha)) continue;
    buffer = buffer ? (buffer + " " + linha) : linha;
    // Procura padrão completo no buffer
    const m = buffer.match(/^(\d{2}-\d{2}-\d{4})\s+(.+?)\s+(\d{8,})\s+R\$\s*(-?[\d\.]+,\d{2})\s+R\$\s*(-?[\d\.]+,\d{2})/);
    if (!m) continue;
    const data = parseDataBR(m[1].replace(/-/g, "/"));
    if (!data) continue;
    const descricao = m[2].replace(/\s+/g, " ").trim();
    const docRef = m[3];
    const valorInfo = parseValorBR(m[4]);
    if (!valorInfo) { buffer = ""; continue; }
    out.push({
      banco: "mp_gondolas",
      conta: "40665711970",
      data,
      descricao,
      valor: valorInfo.valor,
      tipo: valorInfo.tipo,
      mes: mesDe(data),
      doc_ref: docRef,
      id: gerarId("mp", data, valorInfo.valor, descricao, idx++),
    });
    buffer = "";
  }
  return out;
}

// Parser C6 — formato exportado: data, descrição, valor, saldo. O extrato
// agrupa saldos de dia ("Saldo do dia DD/MM/AA   R$ ..."). Vamos pegar
// só linhas com data + descrição + valor monetário (positivo ou negativo).
export function parseC6(texto) {
  const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const out = [];
  let idx = 0;
  for (const linha of linhas) {
    // Formato: "DD/MM   DD/MM   Tipo   Descrição     Valor"
    // Ex: "04/06   05/06   Entrada PIX   Pix recebido de Gondolas Suprema Ltda   R$ 3.000,00"
    // Valor pode ser "R$ 3.000,00" (positivo) ou "-R$ 1.237,80" (negativo).
    const m = linha.match(/^(\d{2}\/\d{2})\s+(\d{2}\/\d{2})\s+(.+?)\s+(-?R\$\s*[\d\.]+,\d{2})$/);
    if (!m) continue;
    // O extrato C6 mostra só DD/MM — ano vem do cabeçalho "Período · 1 de junho de 2026 até …"
    // Pegamos o ano da própria string global (procuramos uma vez no texto).
    const anoMatch = texto.match(/at[eé]\s+\d{1,2}\s+de\s+\w+\s+de\s+(\d{4})/i)
      || texto.match(/Per[ií]odo[\s\S]{0,100}(\d{4})/i);
    const ano = anoMatch ? anoMatch[1] : String(new Date().getFullYear());
    const ddmm = m[1].split("/");
    const data = `${ano}-${ddmm[1]}-${ddmm[0]}`;
    const descricao = m[3].trim();
    const valorInfo = parseValorBR(m[4]);
    if (!valorInfo) continue;
    if (/^Saldo\b/i.test(descricao)) continue;
    out.push({
      banco: "c6_instalacoes",
      conta: "426772474",
      data,
      descricao,
      valor: valorInfo.valor,
      tipo: valorInfo.tipo,
      mes: mesDe(data),
      doc_ref: null,
      id: gerarId("c6", data, valorInfo.valor, descricao, idx++),
    });
  }
  return out;
}

// Dispatcher: detecta o banco e roteia pro parser certo.
export function parseExtrato(texto) {
  const banco = detectarBanco(texto);
  if (!banco) return { banco: null, lancamentos: [], erro: "Não consegui identificar o banco pelo conteúdo do PDF." };
  let lancamentos = [];
  if (banco === "sicredi_gondolas") lancamentos = parseSicredi(texto);
  else if (banco === "mp_gondolas") lancamentos = parseMercadoPago(texto);
  else if (banco === "c6_instalacoes") lancamentos = parseC6(texto);
  return { banco, lancamentos };
}
