import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COMPANY = {
  razao: "Gôndolas Suprema",
  cnpj: "46.996.687/0001-68",
  endereco: "R. José Cosme Pamplona, 1700 — Palhoça/SC",
  telefone: "(48) 98874-1847",
  site: "www.gondolasuprema.com",
};

const fmt = (v) =>
  v === 0 ? "Sob consulta" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ICON_KEYS = [
  "parede-branca", "parede-preta",
  "centro-branca", "centro-preta",
  "mpp",
  "checkout-branco", "checkout-preto",
];
const ICON_EXTS = ["jpg", "jpeg", "png"];

function getProductIconKey(item) {
  const cat = (item.cat || "").toLowerCase();
  const name = (item.name || "").toLowerCase();
  const opts = (item.opts || []).join(" ").toLowerCase();
  const all = `${cat} ${name} ${opts}`;
  const isPreta = /preta|preto|black/.test(all);

  if (/checkout|check-out/.test(all)) return isPreta ? "checkout-preto" : "checkout-branco";
  if (/mini\s*porta\s*pal|mpp|slim/.test(all)) return "mpp";
  if (/ponta/.test(all)) return isPreta ? "parede-preta" : "parede-branca";
  if (/centro/.test(all)) return isPreta ? "centro-preta" : "centro-branca";
  if (/g[oô]ndola|parede/.test(all)) return isPreta ? "parede-preta" : "parede-branca";
  return null;
}

const TABELA_JUROS_BOLETO = [
  { parcelas: 1, juros: 0 },
  { parcelas: 2, juros: 0 },
  { parcelas: 3, juros: 0 },
  { parcelas: 4, juros: 0.015 },
  { parcelas: 5, juros: 0.030 },
  { parcelas: 6, juros: 0.045 },
  { parcelas: 7, juros: 0.060 },
  { parcelas: 8, juros: 0.075 },
];

function calcularOpcoesPagamento(total, entrada) {
  const saldo = Math.max(total - entrada, 0);
  return TABELA_JUROS_BOLETO.map(({ parcelas, juros }) => {
    const totalParcelado = saldo * (1 + juros);
    const valorParcela = totalParcelado / parcelas;
    return {
      parcelas,
      juros,
      valorParcela,
      totalParcelado,
      totalGeral: entrada + totalParcelado,
    };
  });
}

async function loadIcons() {
  const map = {};
  for (const key of ICON_KEYS) {
    for (const ext of ICON_EXTS) {
      try {
        const r = await fetch(`/produto-icons/${key}.${ext}`);
        if (!r.ok) continue;
        const b = await r.blob();
        const dataUrl = await new Promise((res, rej) => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result);
          fr.onerror = rej;
          fr.readAsDataURL(b);
        });
        map[key] = dataUrl;
        break;
      } catch (e) {}
    }
  }
  return map;
}

export async function generatePDF({ orderNum, date, client, items, total, notes, comissao }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  var logoBase64 = null;
  try {
    var logoUrl = "/Logo.jpg";
    var resp = await fetch(logoUrl);
    var blob = await resp.blob();
    logoBase64 = await new Promise(function(res) {
      var r = new FileReader();
      r.onload = function() { res(r.result); };
      r.readAsDataURL(blob);
    });

    // Watermark - logo grande centralizada e transparente
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.05 }));
    doc.addImage(logoBase64, "JPEG", pageW / 2 - 70, pageH / 2 - 125, 140, 250);
    doc.restoreGraphicsState();

    // Header logo - proporcional (imagem vertical 1080x1920), maior pra ocupar bem o cabecalho
    doc.addImage(logoBase64, "JPEG", margin, 7, 26, 46);
  } catch (e) {}

  // ──────────────────────────────────────────────────────────────────────
  // Cabecalho — distribuido em 3 zonas usando toda a largura util da pagina:
  //   [Logo 26mm] | [Razao + dados empresa, centro] | [ORCAMENTO + cliente, direita]
  // ──────────────────────────────────────────────────────────────────────
  var infoLeftX = margin + 30;        // X onde comeca o bloco de info da empresa
  var rightX = pageW - margin;         // X de alinhamento direito (ORCAMENTO/cliente)
  var headerBottom = 60;               // Y da linha laranja final

  // Razao social — destaque, fonte maior em bold
  doc.setFontSize(11);
  doc.setTextColor(40);
  doc.setFont(undefined, "bold");
  doc.text(COMPANY.razao, infoLeftX, 14);

  // Dados empresa - fonte maior (8.5pt) com cor de hierarquia
  doc.setFontSize(8.5);
  doc.setTextColor(110);
  doc.setFont(undefined, "normal");
  doc.text("CNPJ: " + COMPANY.cnpj, infoLeftX, 19);
  doc.text(COMPANY.endereco, infoLeftX, 24);
  doc.text("Tel: " + COMPANY.telefone, infoLeftX, 29);
  doc.text(COMPANY.site, infoLeftX, 34);

  // Bloco direito (topo): ORCAMENTO em destaque
  doc.setFontSize(22);
  doc.setTextColor(30);
  doc.setFont(undefined, "bold");
  doc.text("ORCAMENTO", rightX, 17, { align: "right" });

  // === Bloco direito (parte inferior): titulo cliente + dados, colados acima da linha laranja ===
  // Coleta as linhas que vao aparecer
  var clientLines = ["Data: " + date];
  if (client && client.cnpj) clientLines.push("CNPJ: " + client.cnpj);
  if (client && client.responsavel) clientLines.push("Responsavel: " + client.responsavel);
  if (client && client.telefone) clientLines.push("Tel: " + client.telefone);
  if (client && client.email) clientLines.push("E-mail: " + client.email);
  if (client && client.endereco && client.cidade) {
    var addr = client.endereco + (client.bairro ? ", " + client.bairro : "") + " - " + client.cidade + (client.estado ? "/" + client.estado : "");
    clientLines.push("End: " + addr);
  }

  // Calcula Y de inicio pra que o bloco termine em headerBottom - 3 (logo acima da linha laranja)
  var lineHeight = 4.5;
  var lastLineY = headerBottom - 3; // ultima linha 3mm acima da linha laranja
  var firstLineY = lastLineY - (clientLines.length - 1) * lineHeight;

  // Titulo destaque (laranja) — empresa do cliente, posicionado logo acima do bloco de dados
  var tituloDestaque = (client && client.empresa) ? client.empresa : (orderNum ? "#" + orderNum : "");
  if (tituloDestaque) {
    doc.setFontSize(13);
    doc.setTextColor(245, 166, 35);
    doc.setFont(undefined, "bold");
    doc.text(tituloDestaque, rightX, firstLineY - 6, { align: "right", maxWidth: 110 });
  }

  // Renderiza dados do cliente, empilhando ate lastLineY
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(80);
  var cy = firstLineY;
  for (var li = 0; li < clientLines.length; li++) {
    doc.text(clientLines[li], rightX, cy, { align: "right" });
    cy += lineHeight;
  }

  // Linha laranja embaixo do cabecalho - ocupando toda largura util
  doc.setDrawColor(245, 166, 35);
  doc.setLineWidth(0.8);
  doc.line(margin, headerBottom, pageW - margin, headerBottom);

  // Carrega icones de produto
  var iconMap = await loadIcons();
  var itemsWithIcons = items.map(function(it) {
    return Object.assign({}, it, { iconKey: getProductIconKey(it) });
  });

  // Label "PRODUTOS:" alinhado a esquerda acima da tabela
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(60);
  doc.text("PRODUTOS:", margin, 67);

  // Table
  var tableData = itemsWithIcons.map(function(it) {
    return [
      "",
      it.name || "",
      it.cat || "",
      String(it.qty),
      it.opts && it.opts.length ? it.opts.join(", ") : "-",
      fmt(it.total),
    ];
  });

  // Larguras das colunas — tabela ocupa toda largura util (pageW - 2*margin = 180mm em A4)
  var colWidths = { foto: 18, produto: 52, categoria: 34, qtd: 14, opcionais: 30, subtotal: 32 };
  // Total = 18+52+34+14+30+32 = 180mm (= pageW 210 - 2*margin 30)

  doc.autoTable({
    startY: 71,
    head: [["Foto", "Produto", "Categoria", "Qtd", "Opcionais", "Subtotal"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [80, 80, 80],
      fontStyle: "bold",
      fontSize: 9,
      halign: "left",
    },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40], minCellHeight: 16, valign: "middle" },
    columnStyles: {
      0: { cellWidth: colWidths.foto, halign: "center" },
      1: { fontStyle: "bold", cellWidth: colWidths.produto },
      2: { cellWidth: colWidths.categoria },
      3: { cellWidth: colWidths.qtd, halign: "center" },
      4: { cellWidth: colWidths.opcionais },
      5: { cellWidth: colWidths.subtotal, halign: "right" },
    },
    margin: { left: margin, right: margin },
    didDrawCell: function (data) {
      if (data.section !== "body" || data.column.index !== 0) return;
      var item = itemsWithIcons[data.row.index];
      if (!item || !item.iconKey) return;
      var dataUrl = iconMap[item.iconKey];
      if (!dataUrl) return;
      var fmtType = dataUrl.indexOf("data:image/png") === 0 ? "PNG" : "JPEG";
      var pad = 1.5;
      var size = Math.min(data.cell.width - pad * 2, data.cell.height - pad * 2);
      var x = data.cell.x + (data.cell.width - size) / 2;
      var y = data.cell.y + (data.cell.height - size) / 2;
      try {
        doc.addImage(dataUrl, fmtType, x, y, size, size);
      } catch (e) {}
    },
  });

  // Total row
  var finalY = doc.lastAutoTable.finalY + 4;
  doc.setDrawColor(30);
  doc.setLineWidth(0.5);
  doc.line(margin, finalY, pageW - margin, finalY);

  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.setTextColor(30);
  doc.text("TOTAL GERAL", margin, finalY + 7);
  doc.setTextColor(245, 166, 35);
  doc.text(total === 0 ? "Sob consulta" : fmt(total), pageW - margin, finalY + 7, { align: "right" });

  // Opcoes de pagamento (Boleto)
  var paymentEndY = finalY + 12;
  var entrada = Number(comissao) || 0;
  if (total > 0 && total > entrada) {
    var saldo = total - entrada;
    var opcoes = calcularOpcoesPagamento(total, entrada);

    var paymentTitleY = finalY + 16;
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.setTextColor(30);
    doc.text("OPCOES DE PAGAMENTO - BOLETO", margin, paymentTitleY);

    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(80);
    if (entrada > 0) {
      doc.text("Entrada (a vista): " + fmt(entrada), margin, paymentTitleY + 5);
      doc.text("Saldo a parcelar: " + fmt(saldo), margin, paymentTitleY + 10);
    } else {
      doc.text("Saldo a parcelar: " + fmt(saldo), margin, paymentTitleY + 5);
    }

    var tabelaStartY = paymentTitleY + (entrada > 0 ? 13 : 8);
    var bodyData = opcoes.map(function (op) {
      var jurosLabel = op.juros === 0 ? "Sem juros" : "+" + (op.juros * 100).toFixed(1).replace(".", ",") + "%";
      return [
        op.parcelas + "x",
        fmt(op.valorParcela),
        jurosLabel,
        fmt(op.totalParcelado),
        fmt(op.totalGeral),
      ];
    });

    doc.autoTable({
      startY: tabelaStartY,
      head: [["Parcelas", "Valor da parcela", "Acrescimo", "Total parcelado", "Total geral"]],
      body: bodyData,
      theme: "grid",
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [80, 80, 80],
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
      },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 40], halign: "center" },
      columnStyles: {
        0: { cellWidth: 18, fontStyle: "bold" },
        1: { cellWidth: 35, halign: "right" },
        2: { cellWidth: 25 },
        3: { cellWidth: 35, halign: "right" },
        4: { cellWidth: 37, halign: "right" },
      },
      margin: { left: margin, right: margin },
    });

    paymentEndY = doc.lastAutoTable.finalY + 4;
    doc.setFontSize(8);
    doc.setFont(undefined, "italic");
    doc.setTextColor(120);
    doc.text("*obs: Mediante analise de credito", margin, paymentEndY);
    paymentEndY += 4;
  }

  // Notes
  var notesY = paymentEndY + 4;
  if (notes) {
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, notesY, pageW - margin * 2, 16, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    doc.setTextColor(80);
    doc.text("Observacoes:", margin + 4, notesY + 5);
    doc.setFont(undefined, "normal");
    doc.text(notes, margin + 4, notesY + 10, { maxWidth: pageW - margin * 2 - 8 });
  }

  // Footer
  var footerY = 282;
  doc.setDrawColor(220);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageW - margin, footerY);
  doc.setFontSize(7);
  doc.setTextColor(160);
  doc.text(
    "Orcamento valido por 15 dias - " + COMPANY.razao + " - CNPJ: " + COMPANY.cnpj + " - " + COMPANY.endereco + " - " + COMPANY.telefone,
    pageW / 2,
    footerY + 4,
    { align: "center" }
  );

  return doc;
}

export async function sharePDFWhatsApp(params) {
  var doc = await generatePDF(params);
  var blob = doc.output("blob");
  var clientName = (params.client && params.client.empresa ? params.client.empresa : params.orderNum || "novo").replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, "-").replace(/-+/g, "-");
  var fileName = "orcamento-" + clientName + ".pdf";
  var file = new File([blob], fileName, { type: "application/pdf" });

  // Tenta compartilhar via Web Share API (WhatsApp/iMessage/etc.) se o browser suportar arquivos
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: "Orcamento " + (params.client && params.client.empresa ? params.client.empresa : "") + " - Gondolas Suprema",
        files: [file],
      });
      return true; // Compartilhado com sucesso — nao baixa fallback pra evitar duplicacao
    } catch (e) {
      // Usuario cancelou o share — respeitar a escolha, nao baixar
      if (e && e.name === "AbortError") return false;
      // Outros erros (permissao, etc.) caem no fallback de download abaixo
    }
  }

  // Fallback: download local quando o share nao esta disponivel ou falhou
  doc.save(fileName);
  return false;
}
