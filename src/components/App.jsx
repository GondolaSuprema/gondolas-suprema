import { useState, useEffect } from "react";
import { sharePDFWhatsApp } from "../lib/pdf";

const COLORS = {
  bg: "#0A0E18",
  surface: "#111728",
  card: "#151B2D",
  border: "#1D2540",
  accent: "#F5A623",
  accentHover: "#FFBD4A",
  text: "#E8ECF4",
  textMuted: "#7A849B",
  textDim: "#4A526A",
  success: "#34D399",
  danger: "#F87171",
  white: "#FFFFFF",
  orange: "#F5A623",
};

const CATEGORIES = [
  { key: "all", label: "Todos" },
  { key: "parede-bandejas", label: "Parede c/ Bandejas" },
  { key: "parede-ganchos", label: "Parede c/ Ganchos" },
  { key: "parede-cestos", label: "Parede c/ Cestos" },
  { key: "centro-bandejas", label: "Centro c/ Bandejas" },
  { key: "centro-ganchos", label: "Centro c/ Ganchos" },
  { key: "ponta", label: "Ponta" },
  { key: "slim", label: "Slim 2000x600" },
  { key: "mpp", label: "MPP 2000x800" },
];

const PRODUCTS = [
  { id: 1, name: "Parede Inicial 1,40 c/ Bandejas", category: "parede-bandejas", icon: "🏪", price: 481.80, specs: { altura: "1,40m", tipo: "Inicial" }, options: [] },
  { id: 2, name: "Parede Continuação 1,40 c/ Bandejas", category: "parede-bandejas", icon: "🏪", price: 386.43, specs: { altura: "1,40m", tipo: "Continuação" }, options: [] },
  { id: 3, name: "Parede Inicial 1,70 c/ Bandejas", category: "parede-bandejas", icon: "🏪", price: 589.48, specs: { altura: "1,70m", tipo: "Inicial" }, options: [] },
  { id: 4, name: "Parede Continuação 1,70 c/ Bandejas", category: "parede-bandejas", icon: "🏪", price: 477.26, specs: { altura: "1,70m", tipo: "Continuação" }, options: [] },
  { id: 5, name: "Parede Inicial 2,00 c/ Bandejas", category: "parede-bandejas", icon: "🏪", price: 647.42, specs: { altura: "2,00m", tipo: "Inicial" }, options: [] },
  { id: 6, name: "Parede Continuação 2,00 c/ Bandejas", category: "parede-bandejas", icon: "🏪", price: 518.38, specs: { altura: "2,00m", tipo: "Continuação" }, options: [] },
  { id: 7, name: "Parede Inicial 1,40 c/ Ganchos", category: "parede-ganchos", icon: "🪝", price: 547.04, specs: { altura: "1,40m", tipo: "Inicial" }, options: [] },
  { id: 8, name: "Parede Continuação 1,40 c/ Ganchos", category: "parede-ganchos", icon: "🪝", price: 451.67, specs: { altura: "1,40m", tipo: "Continuação" }, options: [] },
  { id: 9, name: "Parede Inicial 1,70 c/ Ganchos", category: "parede-ganchos", icon: "🪝", price: 659.90, specs: { altura: "1,70m", tipo: "Inicial" }, options: [] },
  { id: 10, name: "Parede Continuação 1,70 c/ Ganchos", category: "parede-ganchos", icon: "🪝", price: 547.68, specs: { altura: "1,70m", tipo: "Continuação" }, options: [] },
  { id: 11, name: "Parede Inicial 2,00 c/ Ganchos", category: "parede-ganchos", icon: "🪝", price: 772.71, specs: { altura: "2,00m", tipo: "Inicial" }, options: [] },
  { id: 12, name: "Parede Continuação 2,00 c/ Ganchos", category: "parede-ganchos", icon: "🪝", price: 643.67, specs: { altura: "2,00m", tipo: "Continuação" }, options: [] },
  { id: 13, name: "Parede Inicial 1,40 c/ Cestos", category: "parede-cestos", icon: "🧺", price: 882.27, specs: { altura: "1,40m", tipo: "Inicial" }, options: [] },
  { id: 14, name: "Parede Continuação 1,40 c/ Cestos", category: "parede-cestos", icon: "🧺", price: 786.90, specs: { altura: "1,40m", tipo: "Continuação" }, options: [] },
  { id: 15, name: "Parede Inicial 1,70 c/ Cestos", category: "parede-cestos", icon: "🧺", price: 1273.49, specs: { altura: "1,70m", tipo: "Inicial" }, options: [] },
  { id: 16, name: "Parede Continuação 1,70 c/ Cestos", category: "parede-cestos", icon: "🧺", price: 1161.27, specs: { altura: "1,70m", tipo: "Continuação" }, options: [] },
  { id: 17, name: "Parede Inicial 2,00 c/ Cestos", category: "parede-cestos", icon: "🧺", price: 1498.04, specs: { altura: "2,00m", tipo: "Inicial" }, options: [] },
  { id: 18, name: "Parede Continuação 2,00 c/ Cestos", category: "parede-cestos", icon: "🧺", price: 1369.00, specs: { altura: "2,00m", tipo: "Continuação" }, options: [] },
  { id: 19, name: "Centro Inicial 1,40 c/ Bandejas", category: "centro-bandejas", icon: "🏬", price: 709.55, specs: { altura: "1,40m", tipo: "Inicial" }, options: [] },
  { id: 20, name: "Centro Continuação 1,40 c/ Bandejas", category: "centro-bandejas", icon: "🏬", price: 597.24, specs: { altura: "1,40m", tipo: "Continuação" }, options: [] },
  { id: 21, name: "Centro Inicial 1,70 c/ Bandejas", category: "centro-bandejas", icon: "🏬", price: 866.91, specs: { altura: "1,70m", tipo: "Inicial" }, options: [] },
  { id: 22, name: "Centro Continuação 1,70 c/ Bandejas", category: "centro-bandejas", icon: "🏬", price: 737.76, specs: { altura: "1,70m", tipo: "Continuação" }, options: [] },
  { id: 23, name: "Centro Inicial 2,00 c/ Bandejas", category: "centro-bandejas", icon: "🏬", price: 924.84, specs: { altura: "2,00m", tipo: "Inicial" }, options: [] },
  { id: 24, name: "Centro Continuação 2,00 c/ Bandejas", category: "centro-bandejas", icon: "🏬", price: 778.87, specs: { altura: "2,00m", tipo: "Continuação" }, options: [] },
  { id: 25, name: "Centro Inicial 1,40 c/ Ganchos", category: "centro-ganchos", icon: "🪝", price: 840.02, specs: { altura: "1,40m", tipo: "Inicial" }, options: [] },
  { id: 26, name: "Centro Continuação 1,40 c/ Ganchos", category: "centro-ganchos", icon: "🪝", price: 727.71, specs: { altura: "1,40m", tipo: "Continuação" }, options: [] },
  { id: 27, name: "Centro Inicial 1,70 c/ Ganchos", category: "centro-ganchos", icon: "🪝", price: 1007.75, specs: { altura: "1,70m", tipo: "Inicial" }, options: [] },
  { id: 28, name: "Centro Continuação 1,70 c/ Ganchos", category: "centro-ganchos", icon: "🪝", price: 878.60, specs: { altura: "1,70m", tipo: "Continuação" }, options: [] },
  { id: 29, name: "Centro Inicial 2,00 c/ Ganchos", category: "centro-ganchos", icon: "🪝", price: 1175.42, specs: { altura: "2,00m", tipo: "Inicial" }, options: [] },
  { id: 30, name: "Centro Continuação 2,00 c/ Ganchos", category: "centro-ganchos", icon: "🪝", price: 1029.45, specs: { altura: "2,00m", tipo: "Continuação" }, options: [] },
  { id: 31, name: "Ponta Inicial 1,40", category: "ponta", icon: "▶️", price: 430.00, specs: { altura: "1,40m", tipo: "Inicial" }, options: [] },
  { id: 32, name: "Ponta Inicial 2,00", category: "ponta", icon: "▶️", price: 599.03, specs: { altura: "2,00m", tipo: "Inicial" }, options: [] },
  { id: 33, name: "Ponta Continuação 2,00", category: "ponta", icon: "▶️", price: 469.99, specs: { altura: "2,00m", tipo: "Continuação" }, options: [] },
  { id: 34, name: "Slim Inicial 3 Níveis", category: "slim", icon: "📦", price: 656.90, specs: { niveis: "3", tipo: "Inicial", dimensao: "2000x600" }, options: [] },
  { id: 35, name: "Slim Continuação 3 Níveis", category: "slim", icon: "📦", price: 494.15, specs: { niveis: "3", tipo: "Continuação", dimensao: "2000x600" }, options: [] },
  { id: 36, name: "Slim Inicial 4 Níveis", category: "slim", icon: "📦", price: 767.37, specs: { niveis: "4", tipo: "Inicial", dimensao: "2000x600" }, options: [] },
  { id: 37, name: "Slim Continuação 4 Níveis", category: "slim", icon: "📦", price: 604.61, specs: { niveis: "4", tipo: "Continuação", dimensao: "2000x600" }, options: [] },
  { id: 38, name: "Slim Inicial 5 Níveis", category: "slim", icon: "📦", price: 877.83, specs: { niveis: "5", tipo: "Inicial", dimensao: "2000x600" }, options: [] },
  { id: 39, name: "Slim Continuação 5 Níveis", category: "slim", icon: "📦", price: 715.07, specs: { niveis: "5", tipo: "Continuação", dimensao: "2000x600" }, options: [] },
  { id: 40, name: "MPP Inicial 3 Níveis", category: "mpp", icon: "🏗️", price: 1021.35, specs: { niveis: "3", tipo: "Inicial", dimensao: "2000x800" }, options: [] },
  { id: 41, name: "MPP Continuação 3 Níveis", category: "mpp", icon: "🏗️", price: 782.78, specs: { niveis: "3", tipo: "Continuação", dimensao: "2000x800" }, options: [] },
  { id: 42, name: "MPP Inicial 4 Níveis", category: "mpp", icon: "🏗️", price: 1202.76, specs: { niveis: "4", tipo: "Inicial", dimensao: "2000x800" }, options: [] },
  { id: 43, name: "MPP Continuação 4 Níveis", category: "mpp", icon: "🏗️", price: 964.18, specs: { niveis: "4", tipo: "Continuação", dimensao: "2000x800" }, options: [] },
  { id: 44, name: "MPP Inicial 5 Níveis", category: "mpp", icon: "🏗️", price: 1384.16, specs: { niveis: "5", tipo: "Inicial", dimensao: "2000x800" }, options: [] },
  { id: 45, name: "MPP Continuação 5 Níveis", category: "mpp", icon: "🏗️", price: 1145.58, specs: { niveis: "5", tipo: "Continuação", dimensao: "2000x800" }, options: [] },
];

const fmt = (v) => v === 0 ? "Sob consulta" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const genId = () => Math.random().toString(36).substr(2, 9);
const catLabel = (key) => CATEGORIES.find(c => c.key === key)?.label || key;

const LOGO_B64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD02iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAOnWikYAqQeh4NZ+n3RV2tJ2+eNioY9/T9KynVUJJS6lRg5JtdDRooorUkKKKKACjPOO9Q3VzHawtJIcBRTLESNH58/wDrJecf3R2FZ+1TnyIrl0uWaKKK0JCiiigAooooARhkVzesR3Mdz9qt2PHDptyGHrXS1BcxB4mwQGxwSM4/Csq1KNWPLJFwm4O6Oci8UwWpEd06rx0LZH4Z5ra0/W9P1EH7NOCVGSDxj8elcvqMeqW0pa3s4bkf3vLAasHUNU1VCBPYXLj/AJ5FXCf+O9a4qNPFU9Iq682jaboy3dn8z09b21ZmVJ42KfeCnOKpXGuWsTFQ65HXnJ/L/GvMLvxDdtEkCIIo1+/FFGUC/wCfpVvSLuGaRQbS3lkJGFlMjk/h0rWpDGSW1vS3+ZEXQW7OvF1/amoIzHFrEcgZzub+p9q6dPuDgj2NZemWkgZZZgilRhVQYVB7CtarwtGVOL5t2KrNStYKKKK6jIKKKKACiiigCG7u7eygM11KscYIGT6noKjtNQs74SfZp1fy/vjBBX6g1n+JXEa6WWIC/wBoRZJOMdaxdQ1K7gbXmb7OLiO1iImhzwpYgA5JHAzVJXJbsdTZ3dlqEbPaSJKqNtJA6Gpmt4mGCgrjbu4n0f8AtaG1vJHEdgkyuWDFW3beD9Kmv7u80ltSjivriXbpn2hTK+4q+7GR6UcvYOY1J9E0afUPJkiT7SU83aBzjOM/nV2Kw07TIHlWKOKONS7NjAAHU1y0huNMvb2VL6a4mXRnmWSR9xU7h0ome6tkubZ9QnuorjR5Z2Er7sMMcj06mnZ9xXO2hkSWFJYjlHUMp9QeRT64nUNRu20+G3sRMjWenR3EkiXHl9V44wd2NtGoaneqy3jXkzW8NtBJKtvMqtEWGSWUj5s0uUfMdtRSAhgCOh5pakoKKKKACiiigCC7tIL2AwXUSyxt1VhkGqbabY2GnTx2tlAqSD5kC4D/AFrTqK5h8+Ex72TJBDKeRg5pSvytIatfUybGx0mOye3FpaBZ8+asK/K23nBq3IunzXDeZCGeaNYmYrxtPIUn8elB0pDlvNfzGLFn4ycgA+3QCmxaaRcuzPiIMjIg/wBkYBJrC9Yu0CtaWuj2MUq2mn7Fmyr7IvvqP/ZeaSO00Sw8+CCwCiZSkmyL747r/wDWq8dMiBgKMymFNikdcVItjGrblJzvZ+fVhg017bq+wvcKF3p+jXs8AubJJGMYWMmPgL2HtU9xoOl3NzHcTWUTyRgKpK9AOg/CnJpUSTpIHb5Npx67Rgc1oVpTdT7ZMlHoFFFFWIKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBaKKKAP/2Q==";

const COMPANY = {
  razao: "Gôndolas Suprema",
  cnpj: "46.996.687/0001-68",
  endereco: "R. José Cosme Pamplona, 1700 — Palhoça/SC",
  telefone: "(48) 98874-1847",
  site: "www.gondolasuprema.com",
};

const pdfStyles = `@page{size:A4;margin:20mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Helvetica,Arial,sans-serif;padding:36px;color:#1a1a1a;max-width:800px;margin:auto;position:relative}.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.06;z-index:0;pointer-events:none;width:400px;height:auto}.content{position:relative;z-index:1}.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #F5A623;padding-bottom:18px;margin-bottom:24px}.logo-area{display:flex;align-items:center;gap:12px}.logo-area img{height:60px}.logo-text{font-size:10px;color:#666;line-height:1.5;margin-top:4px}.info{text-align:right;font-size:11px;color:#666;line-height:1.6}table{width:100%;border-collapse:collapse;margin:12px 0}th{background:#f5f5f5;text-align:left;padding:8px 10px;font-size:11px;border-bottom:2px solid #ddd;color:#555;text-transform:uppercase;letter-spacing:.5px}td{padding:8px 10px;border-bottom:1px solid #eee;font-size:12px}.tr td{font-weight:700;font-size:14px;border-top:2px solid #333;border-bottom:none;padding-top:12px}.n{background:#fafafa;padding:14px;border-radius:6px;margin:16px 0;font-size:12px;color:#555}.ft{margin-top:32px;padding-top:12px;border-top:1px solid #eee;font-size:10px;color:#999;text-align:center}@media print{body{padding:0}.watermark{position:fixed;opacity:0.06}}`;

function buildPdfPage({ orderNum, date, clientName, clientCompany, clientPhone, clientCnpj, clientEndereco, clientEmail, items, total, notes }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Orçamento Gôndolas Suprema</title><style>${pdfStyles}</style></head><body>
<img class="watermark" src="${LOGO_B64}" alt=""/>
<div class="content">
<div class="hdr">
  <div><div class="logo-area"><img src="${LOGO_B64}" alt="Logo"/></div>
  <div class="logo-text">${COMPANY.razao}<br>CNPJ: ${COMPANY.cnpj}<br>${COMPANY.endereco}<br>Tel: ${COMPANY.telefone}<br>${COMPANY.site}</div></div>
  <div class="info"><strong style="font-size:16px;color:#333">ORÇAMENTO</strong>${orderNum ? `<br><span style="color:#F5A623;font-weight:700">#${orderNum}</span>` : ""}<br>Data: ${date}${clientCompany ? `<br><br><strong>Empresa:</strong> ${clientCompany}` : ""}${clientCnpj ? `<br><strong>CNPJ:</strong> ${clientCnpj}` : ""}${clientName ? `<br><strong>Responsável:</strong> ${clientName}` : ""}${clientPhone ? `<br><strong>Tel:</strong> ${clientPhone}` : ""}${clientEmail ? `<br><strong>E-mail:</strong> ${clientEmail}` : ""}${clientEndereco ? `<br><strong>End:</strong> ${clientEndereco}` : ""}</div>
</div>
<table><thead><tr><th>Produto</th><th>Categoria</th><th>Qtd</th><th>Opcionais</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>
${items.map(i => `<tr><td><strong>${i.name}</strong></td><td>${i.cat || ""}</td><td>${i.qty}</td><td>${i.opts?.length ? i.opts.join(", ") : "—"}</td><td style="text-align:right">${fmt(i.total)}</td></tr>`).join("")}
<tr class="tr"><td colspan="4">TOTAL GERAL</td><td style="text-align:right;color:#F5A623">${total === 0 ? "Sob consulta" : fmt(total)}</td></tr>
</tbody></table>
${notes ? `<div class="n"><strong>Observações:</strong><br>${notes}</div>` : ""}
<div class="ft">Orçamento válido por 15 dias • ${COMPANY.razao} • CNPJ: ${COMPANY.cnpj} • ${COMPANY.endereco} • ${COMPANY.telefone}</div>
</div>
</body></html>`;
}

// ─── NAV ───
function Nav({ page, setPage, user, onLogout, cartCount }) {
  return (
    <nav style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div onClick={() => setPage("client")} style={{ cursor: "pointer", fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800 }}>
          <span style={{ color: "#888" }}>Gôndolas</span><span style={{ color: COLORS.orange }}> Suprema</span>
        </div>
        {user && (
          <div style={{ display: "flex", gap: 2 }}>
            {[
              { k: "client", l: "Cliente" },
              { k: "catalog", l: "Produtos" },
              { k: "resumo", l: "Resumo" },
              { k: "orders", l: "Orçamentos" },
            ].map(i => (
              <button key={i.k} onClick={() => setPage(i.k)} style={{ background: page === i.k ? COLORS.orange + "18" : "transparent", color: page === i.k ? COLORS.orange : COLORS.textMuted, border: "none", padding: "7px 14px", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{i.l}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {user ? (
          <>
            <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Olá, <strong style={{ color: COLORS.text }}>{user.name}</strong></span>
            <button onClick={onLogout} style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Sair</button>
          </>
        ) : (
          <button onClick={() => setPage("login")} style={{ background: COLORS.orange, border: "none", color: "#000", padding: "7px 18px", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Entrar</button>
        )}
      </div>
    </nav>
  );
}

// ─── CLIENT ───
function ClientPage({ clientData, setClientData, setPage }) {
  const [form, setForm] = useState(clientData);
  const inp = { width: "100%", padding: "12px 14px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };
  const labelStyle = { color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: 0.5 };

  const handleSave = () => {
    setClientData(form);
    localStorage.setItem("gs_client_data", JSON.stringify(form));
    setPage("catalog");
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "36px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏢</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 26, margin: "0 0 6px" }}>Dados do Cliente</h1>
        <p style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>Preencha os dados para gerar o orçamento</p>
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Nome da Empresa *</label>
            <input placeholder="Ex: Supermercado Bom Preço" value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })} style={inp} />
          </div>
          <div>
            <label style={labelStyle}>CNPJ</label>
            <input placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} style={inp} />
          </div>
          <div>
            <label style={labelStyle}>Responsável</label>
            <input placeholder="Nome do responsável" value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} style={inp} />
          </div>
          <div>
            <label style={labelStyle}>Telefone</label>
            <input placeholder="(00) 00000-0000" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} style={inp} />
          </div>
          <div>
            <label style={labelStyle}>E-mail</label>
            <input placeholder="email@empresa.com" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Endereço</label>
              <input placeholder="Rua, número" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} style={inp} />
            </div>
            <div>
              <label style={labelStyle}>Bairro</label>
              <input placeholder="Bairro" value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} style={inp} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Cidade</label>
              <input placeholder="Cidade" value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} style={inp} />
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <input placeholder="UF" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} style={inp} maxLength={2} />
            </div>
          </div>
        </div>

        <button onClick={handleSave} style={{
          width: "100%", background: COLORS.orange, color: "#000", border: "none", padding: "14px",
          borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 24
        }}>
          {form.empresa ? "Salvar e Ir para Produtos →" : "Pular e Ir para Produtos →"}
        </button>
      </div>

      {clientData.empresa && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, marginTop: 16 }}>
          <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Dados salvos</div>
          <div style={{ fontSize: 13, color: COLORS.text, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
            <strong>{clientData.empresa}</strong>
            {clientData.cnpj && <span style={{ color: COLORS.textMuted }}> — CNPJ: {clientData.cnpj}</span>}
            {clientData.responsavel && <><br/>Resp: {clientData.responsavel}</>}
            {clientData.telefone && <span style={{ color: COLORS.textMuted }}> • Tel: {clientData.telefone}</span>}
            {clientData.cidade && <><br/>{clientData.endereco && `${clientData.endereco}, `}{clientData.bairro && `${clientData.bairro} — `}{clientData.cidade}{clientData.estado && `/${clientData.estado}`}</>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LOGIN ───
function Login({ onLogin, setPage }) {
  const [reg, setReg] = useState(false);
  const [f, setF] = useState({ name: "", email: "", password: "", company: "", phone: "" });
  const [err, setErr] = useState("");
  const go = () => {
    setErr("");
    if (!f.email || !f.password) return setErr("Preencha todos os campos.");
    if (reg && (!f.name || !f.company)) return setErr("Preencha todos os campos.");
    const users = JSON.parse(localStorage.getItem("gs_users") || "[]");
    if (reg) {
      if (users.find(u => u.email === f.email)) return setErr("E-mail já cadastrado.");
      const u = { ...f, id: genId() };
      users.push(u);
      localStorage.setItem("gs_users", JSON.stringify(users));
      onLogin(u); setPage("client");
    } else {
      const u = users.find(u => u.email === f.email && u.password === f.password);
      if (!u) return setErr("E-mail ou senha incorretos.");
      onLogin(u); setPage("client");
    }
  };
  const inp = { width: "100%", padding: "11px 14px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)", padding: 20 }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 36, width: 380, maxWidth: "100%" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 6px" }}>{reg ? "Criar Conta" : "Entrar"}</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 24px", fontFamily: "'DM Sans', sans-serif" }}>{reg ? "Cadastre-se para fazer orçamentos" : "Acesse sua conta"}</p>
        {err && <div style={{ background: COLORS.danger + "15", color: COLORS.danger, padding: "8px 12px", borderRadius: 7, fontSize: 12, marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>{err}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reg && <><input placeholder="Nome completo" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} style={inp} /><input placeholder="Empresa" value={f.company} onChange={e => setF({ ...f, company: e.target.value })} style={inp} /><input placeholder="Telefone" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} style={inp} /></>}
          <input placeholder="E-mail" type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} style={inp} />
          <input placeholder="Senha" type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} style={inp} onKeyDown={e => e.key === "Enter" && go()} />
          <button onClick={go} style={{ background: COLORS.orange, color: "#000", border: "none", padding: "12px", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{reg ? "Cadastrar" : "Entrar"}</button>
        </div>
        <p style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: COLORS.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{reg ? "Já tem conta?" : "Não tem conta?"} <span onClick={() => { setReg(!reg); setErr(""); }} style={{ color: COLORS.orange, cursor: "pointer", fontWeight: 600 }}>{reg ? "Entrar" : "Criar conta"}</span></p>
      </div>
    </div>
  );
}

// ─── CATALOG ───
function Catalog({ onAdd }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = PRODUCTS.filter(p => (filter === "all" || p.category === filter) && p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 28, margin: "0 0 4px" }}>Produtos</h1>
      <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 8px", fontFamily: "'DM Sans', sans-serif" }}>Selecione os produtos para adicionar ao orçamento</p>
      <input placeholder="🔍 Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: 16 }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setFilter(c.key)} style={{ background: filter === c.key ? COLORS.orange : "transparent", color: filter === c.key ? "#000" : COLORS.textMuted, border: `1px solid ${filter === c.key ? COLORS.orange : COLORS.border}`, padding: "5px 14px", borderRadius: 18, cursor: "pointer", fontWeight: 600, fontSize: 11, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>{c.label}</button>
        ))}
      </div>
      <div style={{ color: COLORS.textDim, fontSize: 12, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>{filtered.length} produto(s) encontrado(s)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {filtered.map(p => (
          <div key={p.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden", transition: "all .2s" }}>
            <div style={{ height: 80, background: `linear-gradient(135deg, ${COLORS.orange}08, ${COLORS.orange}15)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>{p.icon}</div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.2, color: COLORS.orange, fontWeight: 700, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>{catLabel(p.category)}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 15, margin: "0 0 6px", lineHeight: 1.3 }}>{p.name}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px", marginBottom: 10 }}>
                {Object.entries(p.specs).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ color: COLORS.textDim, textTransform: "capitalize" }}>{k}: </span>
                    <span style={{ color: COLORS.textMuted }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${COLORS.border}` }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: p.price === 0 ? COLORS.textDim : COLORS.orange }}>{fmt(p.price)}</span>
                <button onClick={() => onAdd(p)} style={{ background: COLORS.orange, color: "#000", border: "none", padding: "7px 14px", borderRadius: 7, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Orçamento</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── QUOTE ───
function Quote({ items, setItems, user, setPage, clientData, editingOrderId, setEditingOrderId }) {
  const [notes, setNotes] = useState("");
  const upd = (i, f, v) => { const c = [...items]; c[i] = { ...c[i], [f]: v }; setItems(c); };
  const togOpt = (i, oi) => { const c = [...items]; c[i] = { ...c[i], selOpts: [oi] }; setItems(c); };
  const rem = i => setItems(items.filter((_, j) => j !== i));
  const itemTotal = it => it.product.price * it.qty;
  const total = items.reduce((s, i) => s + itemTotal(i), 0);

  if (!items.length) return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "70px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 22, margin: "0 0 6px" }}>Orçamento vazio</h2>
      <p style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif", margin: "0 0 20px" }}>Adicione produtos do catálogo</p>
      <button onClick={() => setPage("catalog")} style={{ background: COLORS.orange, color: "#000", border: "none", padding: "10px 24px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Ver Catálogo</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>
      {editingOrderId && (
        <div style={{ background: COLORS.orange + "12", border: `1px solid ${COLORS.orange}30`, borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'DM Sans', sans-serif" }}>
          <span style={{ color: COLORS.orange, fontSize: 13 }}>Adicionando itens ao orçamento <strong>#{editingOrderId.slice(0, 6)}</strong></span>
          <button onClick={() => { setEditingOrderId(null); setItems([]); setPage("orders"); }} style={{ background: "transparent", border: "none", color: COLORS.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
        </div>
      )}
      <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 20px" }}>{editingOrderId ? "Adicionar Itens" : "Calculadora de Orçamento"}</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 22, marginRight: 8 }}>{it.product.icon}</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: COLORS.white }}>{it.product.name}</span>
                <span style={{ color: COLORS.textDim, fontSize: 11, marginLeft: 8, fontFamily: "'DM Sans', sans-serif" }}>{catLabel(it.product.category)}</span>
              </div>
              <button onClick={() => rem(i)} style={{ background: COLORS.danger + "15", color: COLORS.danger, border: "none", width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Qtd:</span>
              <button onClick={() => upd(i, "qty", Math.max(1, it.qty - 1))} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, width: 30, height: 30, borderRadius: "6px 0 0 6px", cursor: "pointer" }}>−</button>
              <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderLeft: "none", borderRight: "none", width: 40, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.white, fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{it.qty}</div>
              <button onClick={() => upd(i, "qty", it.qty + 1)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, width: 30, height: 30, borderRadius: "0 6px 6px 0", cursor: "pointer" }}>+</button>
            </div>
            {it.product.options.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginRight: 4 }}>Altura:</span>
                {it.product.options.map((o, oi) => {
                  const sel = it.selOpts.includes(oi);
                  return <button key={oi} onClick={() => togOpt(i, oi)} style={{ background: sel ? COLORS.orange + "20" : COLORS.bg, border: `1px solid ${sel ? COLORS.orange : COLORS.border}`, color: sel ? COLORS.orange : COLORS.textMuted, padding: "4px 12px", borderRadius: 16, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: sel ? 600 : 400 }}>{sel ? "✓ " : ""}{o.label}</button>;
                })}
              </div>
            )}
            <div style={{ textAlign: "right", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLORS.border}` }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: it.product.price === 0 ? COLORS.textDim : COLORS.orange, fontWeight: 700 }}>{fmt(itemTotal(it))}</span>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setPage("catalog")} style={{ width: "100%", background: COLORS.card, border: `2px dashed ${COLORS.border}`, color: COLORS.orange, padding: "14px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 12, transition: "all .2s" }}>+ Adicionar mais produtos</button>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações adicionais..." rows={3} style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.text, padding: "12px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box", marginTop: 14 }} />
      <div style={{ background: `linear-gradient(135deg, ${COLORS.orange}12, ${COLORS.orange}06)`, border: `1px solid ${COLORS.orange}30`, borderRadius: 12, padding: "18px 22px", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Subtotal produtos</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: total === 0 ? COLORS.textDim : COLORS.orange }}>{total === 0 ? "Valores sob consulta" : fmt(total)}</div>
          <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{items.length} produto(s) · {items.reduce((s, i) => s + i.qty, 0)} un</div>
        </div>
        <button onClick={() => setPage("resumo")} style={{ background: COLORS.orange, color: "#000", border: "none", padding: "12px 24px", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Ver Resumo →</button>
      </div>
    </div>
  );
}

// ─── RESUMO ───
function ResumoPage({ items, user, setPage, clientData, editingOrderId, setEditingOrderId, setItems }) {
  const [markup, setMarkup] = useState(0);
  const [frete, setFrete] = useState(0);
  const [notes, setNotes] = useState("");

  const itemBase = it => it.product.price * it.qty;
  const itemComissao = it => itemBase(it) * markup / 100;
  const itemFinal = it => itemBase(it) + itemComissao(it);

  const subtotalProdutos = items.reduce((s, i) => s + itemBase(i), 0);
  const totalComissao = items.reduce((s, i) => s + itemComissao(i), 0);
  const totalFinal = subtotalProdutos + totalComissao + frete;

  const save = () => {
    if (!user) return;
    const cd = clientData || {};
    const newItems = items.map(i => ({ name: i.product.name, cat: catLabel(i.product.category), qty: i.qty, opts: i.selOpts.map(oi => i.product.options[oi]?.label).filter(Boolean), total: itemFinal(i) }));
    const allOrders = JSON.parse(localStorage.getItem("gs_orders_" + user.id) || "[]");

    if (editingOrderId) {
      const idx = allOrders.findIndex(o => o.id === editingOrderId);
      if (idx >= 0) {
        allOrders[idx].items = [...allOrders[idx].items, ...newItems];
        allOrders[idx].total = allOrders[idx].items.reduce((s, i) => s + i.total, 0) + frete;
        allOrders[idx].frete = (allOrders[idx].frete || 0) + frete;
        allOrders[idx].date = new Date().toISOString();
        if (notes) allOrders[idx].notes = allOrders[idx].notes ? allOrders[idx].notes + "\n" + notes : notes;
      }
      localStorage.setItem("gs_orders_" + user.id, JSON.stringify(allOrders));
      setEditingOrderId(null);
    } else {
      allOrders.push({ id: genId(), date: new Date().toISOString(), client: { empresa: cd.empresa, cnpj: cd.cnpj, responsavel: cd.responsavel, telefone: cd.telefone, email: cd.email, endereco: cd.endereco, bairro: cd.bairro, cidade: cd.cidade, estado: cd.estado }, items: newItems, total: totalFinal, frete, notes, status: "Pendente" });
      localStorage.setItem("gs_orders_" + user.id, JSON.stringify(allOrders));
    }
    setItems([]); setPage("orders");
  };

  if (!items.length) return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "70px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 22, margin: "0 0 6px" }}>Nenhum produto no orçamento</h2>
      <p style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif", margin: "0 0 20px" }}>Adicione produtos antes de ver o resumo</p>
      <button onClick={() => setPage("catalog")} style={{ background: COLORS.orange, color: "#000", border: "none", padding: "10px 24px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Ir para Produtos</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 6px" }}>Resumo do Orçamento</h1>
      <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 20px", fontFamily: "'DM Sans', sans-serif" }}>Confira os produtos, adicione margem e frete</p>

      {/* Lista de produtos */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>Produtos ({items.length})</span>
          <button onClick={() => setPage("catalog")} style={{ background: "transparent", border: "none", color: COLORS.orange, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>+ Adicionar</button>
        </div>
        {items.map((it, i) => (
          <div key={i} style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{it.product.name}</div>
              <div style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{catLabel(it.product.category)} · Qtd: {it.qty}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{fmt(itemBase(it))}</div>
              {markup > 0 && <div style={{ color: COLORS.success, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>+{fmt(itemComissao(it))}</div>}
            </div>
          </div>
        ))}
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", background: COLORS.bg }}>
          <span style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Subtotal produtos</span>
          <span style={{ color: COLORS.text, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{fmt(subtotalProdutos)}</span>
        </div>
      </div>

      {/* Comissão */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, marginTop: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Comissão/Margem (%):</span>
        <input type="number" min="0" max="500" value={markup || ""} onChange={e => setMarkup(Number(e.target.value) || 0)} placeholder="0" style={{ width: 80, padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.orange, fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center" }} />
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ color: COLORS.success, fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{fmt(totalComissao)}</div>
          <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{markup > 0 ? markup + "% sobre produtos" : "Sem comissão"}</div>
        </div>
      </div>

      {/* Frete */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, marginTop: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Frete (R$):</span>
        <input type="number" min="0" value={frete || ""} onChange={e => setFrete(Number(e.target.value) || 0)} placeholder="0,00" style={{ width: 120, padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.orange, fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center" }} />
        <span style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{frete > 0 ? "Frete incluso no total" : "Sem frete"}</span>
      </div>

      {/* Observações */}
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações adicionais..." rows={3} style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.text, padding: "12px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box", marginTop: 14 }} />

      {/* Total final */}
      <div style={{ background: `linear-gradient(135deg, ${COLORS.orange}15, ${COLORS.orange}05)`, border: `1px solid ${COLORS.orange}30`, borderRadius: 12, padding: "20px 22px", marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Produtos</span>
          <span style={{ color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{fmt(subtotalProdutos)}</span>
        </div>
        {markup > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Comissão ({markup}%)</span>
          <span style={{ color: COLORS.success, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>+ {fmt(totalComissao)}</span>
        </div>}
        {frete > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Frete</span>
          <span style={{ color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>+ {fmt(frete)}</span>
        </div>}
        <div style={{ borderTop: `1px solid ${COLORS.orange}30`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: COLORS.white, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>TOTAL FINAL</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: COLORS.orange }}>{fmt(totalFinal)}</span>
        </div>
      </div>

      {/* Botão salvar */}
      <button onClick={save} style={{ width: "100%", background: COLORS.orange, color: "#000", border: "none", padding: "14px", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 16 }}>{editingOrderId ? "Adicionar ao Orçamento" : "Salvar Orçamento"}</button>
    </div>
  );
}

// ─── ORDERS ───
function Orders({ user, setPage, setCart, clientData, setEditingOrderId }) {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem("gs_orders_" + user.id) || "[]");
    setOrders([...raw].reverse());
  }, [user.id]);

  const deleteOrder = (orderId) => {
    const raw = JSON.parse(localStorage.getItem("gs_orders_" + user.id) || "[]");
    const updated = raw.filter(o => o.id !== orderId);
    localStorage.setItem("gs_orders_" + user.id, JSON.stringify(updated));
    setOrders([...updated].reverse());
    if (expanded === orderId) setExpanded(null);
    setConfirmDel(null);
  };

  const addMoreItems = (orderId) => {
    setEditingOrderId(orderId);
    setCart([]);
    setPage("catalog");
  };

  const buildPdfHtml = (order) => {
    const cd = clientData || {};
    return buildPdfPage({
      orderNum: order.id.slice(0, 6).toUpperCase(),
      date: new Date(order.date).toLocaleDateString("pt-BR"),
      clientName: cd.responsavel || user.name, clientCompany: cd.empresa || user.company, clientPhone: cd.telefone || user.phone || "",
      clientCnpj: cd.cnpj, clientEndereco: cd.endereco && cd.cidade ? `${cd.endereco}${cd.bairro ? `, ${cd.bairro}` : ""} — ${cd.cidade}${cd.estado ? `/${cd.estado}` : ""}` : "",
      clientEmail: cd.email,
      items: order.items, total: order.total, notes: order.notes
    });
  };

  const [pdfHtml, setPdfHtml] = useState(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfOrder, setPdfOrder] = useState(null);

  const showPdf = (order) => {
    setPdfHtml(buildPdfHtml(order));
    setPdfTitle(order.id.slice(0, 6));
    setPdfOrder(order);
  };

  const [sharingOrder, setSharingOrder] = useState(false);
  const handleWhatsApp = async (order) => {
    setSharingOrder(true);
    const cd = clientData || {};
    const o = order || pdfOrder;
    if (!o) { setSharingOrder(false); return; }
    try {
      await sharePDFWhatsApp({
        orderNum: o.id.slice(0, 6).toUpperCase(),
        date: new Date(o.date).toLocaleDateString("pt-BR"),
        client: cd,
        items: o.items, total: o.total, notes: o.notes
      });
    } catch(e) { console.error(e); }
    setSharingOrder(false);
  };

  const sc = { Pendente: "#F59E0B", Aprovado: "#34D399", Recusado: "#F87171" };

  // PDF viewer
  if (pdfHtml) {
    const bodyMatch = pdfHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const styleMatch = pdfHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);

    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <button onClick={() => { setPdfHtml(null); setPdfOrder(null); }} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 20 }}>Orçamento #{pdfTitle}</h2>
          <button onClick={() => handleWhatsApp()} disabled={sharingOrder} style={{ background: sharingOrder ? COLORS.textDim : "#25D366", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: sharingOrder ? "wait" : "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            {sharingOrder ? "Gerando PDF..." : "Enviar via WhatsApp"}
          </button>
        </div>
        <div style={{ borderRadius: 10, overflow: "auto", border: `1px solid ${COLORS.border}`, maxHeight: "70vh" }}>
          <div style={{ background: "#fff", padding: 36, fontFamily: "Helvetica, Arial, sans-serif", color: "#1a1a1a", width: 794 }}>
            <style>{styleMatch ? styleMatch[1] : ""}</style>
            <div dangerouslySetInnerHTML={{ __html: bodyMatch ? bodyMatch[1] : "" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!orders.length) return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "70px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>📂</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 22 }}>Nenhum orçamento salvo</h2>
      <p style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif", margin: "8px 0 20px" }}>Seus orçamentos finalizados aparecerão aqui</p>
      <button onClick={() => setPage("catalog")} style={{ background: COLORS.orange, color: "#000", border: "none", padding: "10px 24px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Criar Orçamento</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 20px" }}>Orçamentos</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {orders.map(o => {
          const isOpen = expanded === o.id;
          const isConfirming = confirmDel === o.id;
          return (
            <div key={o.id} style={{ background: COLORS.card, border: `1px solid ${isOpen ? COLORS.orange + "40" : COLORS.border}`, borderRadius: 12, overflow: "hidden", transition: "all .2s" }}>
              {/* Header */}
              <div onClick={() => setExpanded(isOpen ? null : o.id)} style={{ padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: COLORS.textDim, fontSize: 18, transition: "transform .2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>▸</span>
                  <div>
                    <span style={{ fontSize: 10, color: COLORS.textDim, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>#{o.id.slice(0, 6)}</span>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
                      {new Date(o.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                      <span style={{ marginLeft: 8, color: COLORS.textDim }}>{o.items.length} {o.items.length === 1 ? "item" : "itens"}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ background: (sc[o.status] || "#888") + "20", color: sc[o.status] || "#888", padding: "3px 10px", borderRadius: 16, fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{o.status}</span>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: o.total === 0 ? COLORS.textDim : COLORS.orange }}>{o.total === 0 ? "Sob consulta" : fmt(o.total)}</span>
                </div>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${COLORS.border}` }}>
                  <div style={{ marginTop: 14 }}>
                    {o.items.map((it, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: COLORS.bg, borderRadius: 8, marginBottom: 6 }}>
                        <div>
                          <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{it.name}</div>
                          <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                            <span style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{it.cat}</span>
                            <span style={{ color: COLORS.textDim, fontSize: 11 }}>×{it.qty}</span>
                            {it.opts?.length > 0 && <span style={{ color: COLORS.orange, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>Altura: {it.opts.join(", ")}</span>}
                          </div>
                        </div>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: it.total === 0 ? COLORS.textDim : COLORS.textMuted }}>{fmt(it.total)}</span>
                      </div>
                    ))}
                  </div>

                  {o.notes && (
                    <div style={{ padding: "8px 12px", background: COLORS.orange + "08", borderRadius: 8, fontSize: 12, color: COLORS.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>💬 {o.notes}</div>
                  )}

                  <div style={{ background: `linear-gradient(135deg, ${COLORS.orange}10, ${COLORS.orange}05)`, border: `1px solid ${COLORS.orange}25`, borderRadius: 10, padding: "14px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>Total do orçamento</div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: o.total === 0 ? COLORS.textDim : COLORS.orange }}>{o.total === 0 ? "Valores sob consulta" : fmt(o.total)}</div>
                    </div>
                    <div style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif", textAlign: "right" }}>
                      {o.items.length} produto(s)<br/>{o.items.reduce((s, it) => s + it.qty, 0)} unidade(s)
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {isConfirming && (
                    <div style={{ background: COLORS.danger + "10", border: `1px solid ${COLORS.danger}30`, borderRadius: 10, padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                      <span style={{ color: COLORS.danger, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Excluir este orçamento?</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDel(null); }} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                        <button onClick={(e) => { e.stopPropagation(); deleteOrder(o.id); }} style={{ background: COLORS.danger, border: "none", color: "#fff", padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Sim, excluir</button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={(e) => { e.stopPropagation(); showPdf(o); }} style={{ background: "#25D366", border: "none", color: "#fff", padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flex: 1, minWidth: 120 }}>📤 Compartilhar</button>
                    <button onClick={(e) => { e.stopPropagation(); addMoreItems(o.id); }} style={{ background: COLORS.orange + "15", border: `1px solid ${COLORS.orange}40`, color: COLORS.orange, padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flex: 1, minWidth: 120 }}>+ Adicionar Itens</button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDel(o.id); }} style={{ background: COLORS.danger + "10", border: `1px solid ${COLORS.danger}30`, color: COLORS.danger, padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", minWidth: 50 }}>🗑️ Excluir</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── APP ───
export default function App() {
  const [page, setPage] = useState("client");
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [clientData, setClientData] = useState({ empresa: "", cnpj: "", responsavel: "", telefone: "", email: "", endereco: "", bairro: "", cidade: "", estado: "" });
  const [editingOrderId, setEditingOrderId] = useState(null);

  useEffect(() => {
    const s = localStorage.getItem("gs_cur");
    if (s) setUser(JSON.parse(s));
    const cd = localStorage.getItem("gs_client_data");
    if (cd) setClientData(JSON.parse(cd));
  }, []);

  const login = u => { setUser(u); localStorage.setItem("gs_cur", JSON.stringify(u)); };
  const logout = () => { setUser(null); localStorage.removeItem("gs_cur"); setPage("client"); };
  const addToQuote = p => {
    const ex = cart.findIndex(i => i.product.id === p.id);
    if (ex >= 0) { const c = [...cart]; c[ex] = { ...c[ex], qty: c[ex].qty + 1 }; setCart(c); }
    else setCart([...cart, { product: p, qty: 1, selOpts: [] }]);
    setPage("quote");
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet" />
      <Nav page={page} setPage={setPage} user={user} onLogout={logout} cartCount={cart.length} />
      {page === "login" && <Login onLogin={login} setPage={setPage} />}
      {page === "client" && user && <ClientPage clientData={clientData} setClientData={setClientData} setPage={setPage} />}
      {page === "client" && !user && <Login onLogin={login} setPage={setPage} />}
      {page === "catalog" && <Catalog onAdd={addToQuote} />}
      {page === "quote" && <Quote items={cart} setItems={setCart} user={user} setPage={setPage} clientData={clientData} editingOrderId={editingOrderId} setEditingOrderId={setEditingOrderId} />}
      {page === "resumo" && <ResumoPage items={cart} user={user} setPage={setPage} clientData={clientData} editingOrderId={editingOrderId} setEditingOrderId={setEditingOrderId} setItems={setCart} />}
      {page === "orders" && user && <Orders user={user} setPage={setPage} setCart={setCart} clientData={clientData} setEditingOrderId={setEditingOrderId} />}
      {page === "orders" && !user && <Login onLogin={login} setPage={setPage} />}
    </div>
  );
}
