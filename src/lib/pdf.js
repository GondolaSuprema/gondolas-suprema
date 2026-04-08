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

export async function generatePDF({ orderNum, date, client, items, total, notes }) {
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
    doc.addImage(logoBase64, "JPEG", pageW / 2 - 35, pageH / 2 - 62, 70, 125);
    doc.restoreGraphicsState();

    // Header logo - proporcional (a logo original eh mais larga que alta)
    doc.addImage(logoBase64, "JPEG", margin, 5, 22, 39);
  } catch (e) {}

  // Company info abaixo da logo
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(COMPANY.razao, margin + 25, 15);
  doc.text("CNPJ: " + COMPANY.cnpj, margin + 25, 19);
  doc.text(COMPANY.endereco, margin + 25, 23);
  doc.text("Tel: " + COMPANY.telefone, margin + 25, 27);
  doc.text(COMPANY.site, margin + 25, 31);

  // Order info - right side
  doc.setFontSize(16);
  doc.setTextColor(30);
  doc.setFont(undefined, "bold");
  doc.text("ORCAMENTO", pageW - margin, 18, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(245, 166, 35);
  if (orderNum) doc.text("#" + orderNum, pageW - margin, 24, { align: "right" });

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Data: " + date, pageW - margin, 30, { align: "right" });

  var cy = 36;
  doc.setTextColor(30);
  doc.setFont(undefined, "bold");
  if (client && client.empresa) { doc.text("Empresa: " + client.empresa, pageW - margin, cy, { align: "right" }); cy += 4.5; }
  doc.setFont(undefined, "normal");
  doc.setTextColor(80);
  if (client && client.cnpj) { doc.text("CNPJ: " + client.cnpj, pageW - margin, cy, { align: "right" }); cy += 4.5; }
  if (client && client.responsavel) { doc.text("Responsavel: " + client.responsavel, pageW - margin, cy, { align: "right" }); cy += 4.5; }
  if (client && client.telefone) { doc.text("Tel: " + client.telefone, pageW - margin, cy, { align: "right" }); cy += 4.5; }
  if (client && client.email) { doc.text("E-mail: " + client.email, pageW - margin, cy, { align: "right" }); cy += 4.5; }
  if (client && client.endereco && client.cidade) {
    var addr = client.endereco + (client.bairro ? ", " + client.bairro : "") + " - " + client.cidade + (client.estado ? "/" + client.estado : "");
    doc.text("End: " + addr, pageW - margin, cy, { align: "right" }); cy += 4.5;
  }

  // Orange line
  doc.setDrawColor(245, 166, 35);
  doc.setLineWidth(0.8);
  doc.line(margin, 55, pageW - margin, 55);

  // Table
  var tableData = items.map(function(it) {
    return [
      it.name || "",
      it.cat || "",
      String(it.qty),
      it.opts && it.opts.length ? it.opts.join(", ") : "-",
      fmt(it.total),
    ];
  });

  doc.autoTable({
    startY: 59,
    head: [["Produto", "Categoria", "Qtd", "Opcionais", "Subtotal"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [80, 80, 80],
      fontStyle: "bold",
      fontSize: 9,
      halign: "left",
    },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45 },
      1: { cellWidth: 30 },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 30 },
      4: { cellWidth: 30, halign: "right" },
    },
    margin: { left: margin, right: margin },
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

  // Notes
  var notesY = finalY + 16;
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
  var file = new File([blob], "orcamento-" + (params.orderNum || "novo") + ".pdf", {
    type: "application/pdf",
  });

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Orcamento " + (params.orderNum ? "#" + params.orderNum : "") + " - Gondolas Suprema",
        files: [file],
      });
      return true;
    } catch (e) {}
  }

  doc.save("orcamento-" + (params.orderNum || "novo") + ".pdf");
  return false;
}
