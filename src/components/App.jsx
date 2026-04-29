import { useState, useEffect, useMemo } from "react";
import { sharePDFWhatsApp } from "../lib/pdf";
import { supabase } from "../lib/supabase";

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
  { key: "gondolas-parede", label: "Gôndolas de Parede" },
  { key: "gondolas-centro", label: "Gôndolas de Centro" },
  { key: "ponta-gondola", label: "Ponta de Gôndola" },
  { key: "mpp", label: "MPP" },
  { key: "slim", label: "Slim" },
  { key: "moveis", label: "Móveis" },
  { key: "mdf", label: "MDF" },
  { key: "outros", label: "Outros Produtos" },
];

const VARIANTS_GONDOLA_PAREDE = [
  { key: "altura", label: "Altura", options: ["1,37m", "1,70m", "2,00m"] },
  { key: "cor", label: "Cor", options: ["Branca", "Preta"] },
];

// Receitas: cada produto + variante recebe uma lista [uniplusId, qtd]
// Quando o preco do componente muda em produtos_uniplus, o preco da gondola se atualiza automaticamente.
const PRODUCT_RECIPES = {
  // Parede Inicial c/ Bandeja - 1,37m - Branca
  "100|1,37m|Branca": [
    ["diversos-81", 2],   // COLUNA PAREDE 1,06M BASE 40CM BRANCO
    ["diversos-75", 2],   // COLUNA COMPLEMENTAR P/ 1,37M BRANCO
    ["diversos-126", 4],  // PAINEL 90*34CM BRANCO
    ["diversos-66", 1],   // BANDEJA 40*90CM BRANCA
    ["diversos-64", 3],   // BANDEJA 30*90CM BRANCA
    ["diversos-83", 3],   // PAR SLG 30CM BRANCO
    ["diversos-402", 4],  // PORTA ETIQUETA 895MM LARANJA
  ],
  // Parede Continuação c/ Bandeja - 1,37m - Branca
  "101|1,37m|Branca": [
    ["diversos-81", 1],
    ["diversos-75", 1],
    ["diversos-126", 4],
    ["diversos-66", 1],
    ["diversos-64", 3],
    ["diversos-83", 3],
    ["diversos-402", 4],
  ],
  // Parede Inicial c/ Bandeja - 1,70m - Branca
  "100|1,70m|Branca": [
    ["diversos-81", 2],   // COLUNA PAREDE 1,06M BASE 40CM BRANCO
    ["diversos-77", 2],   // COLUNA COMPLEMENTAR P/ 1,70M BRANCO
    ["diversos-126", 5],  // PAINEL 90*34CM BRANCO
    ["diversos-66", 1],   // BANDEJA 40*90CM BRANCA
    ["diversos-64", 4],   // BANDEJA 30*90CM BRANCA
    ["diversos-83", 4],   // PAR SLG 30CM BRANCO
    ["diversos-402", 5],  // PORTA ETIQUETA 895MM LARANJA
  ],
  // Parede Continuação c/ Bandeja - 1,70m - Branca (1 coluna a menos que a Inicial)
  "101|1,70m|Branca": [
    ["diversos-81", 1],
    ["diversos-77", 1],
    ["diversos-126", 5],
    ["diversos-66", 1],
    ["diversos-64", 4],
    ["diversos-83", 4],
    ["diversos-402", 5],
  ],
  // Parede Inicial c/ Bandeja - 2,00m - Branca
  "100|2,00m|Branca": [
    ["diversos-81", 2],   // COLUNA PAREDE 1,06M BASE 40CM BRANCO
    ["diversos-79", 2],   // COLUNA COMPLEMENTAR P/ 2,02M BRANCO
    ["diversos-126", 6],  // PAINEL 90*34CM BRANCO
    ["diversos-66", 1],   // BANDEJA 40*90CM BRANCA
    ["diversos-64", 4],   // BANDEJA 30*90CM BRANCA
    ["diversos-83", 4],   // PAR SLG 30CM BRANCO
    ["diversos-402", 5],  // PORTA ETIQUETA 895MM LARANJA
  ],
  // Parede Continuação c/ Bandeja - 2,00m - Branca (1 coluna a menos que a Inicial)
  "101|2,00m|Branca": [
    ["diversos-81", 1],
    ["diversos-79", 1],
    ["diversos-126", 6],
    ["diversos-66", 1],
    ["diversos-64", 4],
    ["diversos-83", 4],
    ["diversos-402", 5],
  ],

  // ── PRETAS (mesma estrutura das brancas, componentes pretos) ──
  // Parede Inicial c/ Bandeja - 1,37m - Preta
  "100|1,37m|Preta": [
    ["diversos-82", 2],   // COLUNA PAREDE 1,06M PRETO
    ["diversos-76", 2],   // COLUNA COMPLEMENTAR 1,37M PRETO
    ["diversos-127", 4],  // PAINEL 90*34CM PRETO
    ["diversos-67", 1],   // BANDEJA 40*90CM PRETA
    ["diversos-65", 3],   // BANDEJA 30*90CM PRETA
    ["diversos-84", 3],   // PAR SLG 30CM PRETO
    ["diversos-402", 4],  // PORTA ETIQUETA (sem cor)
  ],
  // Parede Continuação c/ Bandeja - 1,37m - Preta
  "101|1,37m|Preta": [
    ["diversos-82", 1],
    ["diversos-76", 1],
    ["diversos-127", 4],
    ["diversos-67", 1],
    ["diversos-65", 3],
    ["diversos-84", 3],
    ["diversos-402", 4],
  ],
  // Parede Inicial c/ Bandeja - 1,70m - Preta
  "100|1,70m|Preta": [
    ["diversos-82", 2],
    ["diversos-78", 2],   // COLUNA COMPLEMENTAR 1,70M PRETO
    ["diversos-127", 5],
    ["diversos-67", 1],
    ["diversos-65", 4],
    ["diversos-84", 4],
    ["diversos-402", 5],
  ],
  // Parede Continuação c/ Bandeja - 1,70m - Preta
  "101|1,70m|Preta": [
    ["diversos-82", 1],
    ["diversos-78", 1],
    ["diversos-127", 5],
    ["diversos-67", 1],
    ["diversos-65", 4],
    ["diversos-84", 4],
    ["diversos-402", 5],
  ],
  // Parede Inicial c/ Bandeja - 2,00m - Preta
  "100|2,00m|Preta": [
    ["diversos-82", 2],
    ["diversos-80", 2],   // COLUNA COMPLEMENTAR 2,02M PRETO
    ["diversos-127", 6],
    ["diversos-67", 1],
    ["diversos-65", 4],
    ["diversos-84", 4],
    ["diversos-402", 5],
  ],
  // Parede Continuação c/ Bandeja - 2,00m - Preta
  "101|2,00m|Preta": [
    ["diversos-82", 1],
    ["diversos-80", 1],
    ["diversos-127", 6],
    ["diversos-67", 1],
    ["diversos-65", 4],
    ["diversos-84", 4],
    ["diversos-402", 5],
  ],
};

function recipeKeyForProduct(product, selVariants) {
  if (!product || !selVariants || !product.variants) return null;
  const parts = product.variants.map(v => selVariants[v.key]);
  if (parts.some(p => !p)) return null;
  return [product.id, ...parts].join("|");
}

function computeProductPrice(product, selVariants, selOpts, uniplusPriceMap) {
  const key = recipeKeyForProduct(product, selVariants);
  if (key && PRODUCT_RECIPES[key]) {
    return PRODUCT_RECIPES[key].reduce((sum, [id, qty]) => sum + ((uniplusPriceMap || {})[id] || 0) * qty, 0);
  }
  const optPrice = (product.options || [])[selOpts?.[0]]?.price;
  return optPrice ?? product.price ?? 0;
}

const PRODUCTS = [
  // ── GÔNDOLAS DE PAREDE (novo modelo com variantes) ──
  { id: 100, name: "Parede Inicial c/ Bandeja",     category: "gondolas-parede", icon: "🧱", price: 0, specs: {}, options: [], variants: VARIANTS_GONDOLA_PAREDE },
  { id: 101, name: "Parede Continuação c/ Bandeja", category: "gondolas-parede", icon: "🧱", price: 0, specs: {}, options: [], variants: VARIANTS_GONDOLA_PAREDE },
  { id: 102, name: "Parede Inicial c/ Gancho",      category: "gondolas-parede", icon: "🧱", price: 0, specs: {}, options: [], variants: VARIANTS_GONDOLA_PAREDE },
  { id: 103, name: "Parede Continuação c/ Gancho",  category: "gondolas-parede", icon: "🧱", price: 0, specs: {}, options: [], variants: VARIANTS_GONDOLA_PAREDE },
  { id: 104, name: "Parede Inicial c/ Cesto",       category: "gondolas-parede", icon: "🧱", price: 0, specs: {}, options: [], variants: VARIANTS_GONDOLA_PAREDE },
  { id: 105, name: "Parede Continuação c/ Cesto",   category: "gondolas-parede", icon: "🧱", price: 0, specs: {}, options: [], variants: VARIANTS_GONDOLA_PAREDE },

  // ── PAREDE C/ BANDEJAS ──
  { id: 1, name: "Parede Inicial 1,40 c/ Bandejas", category: "parede-bandejas", icon: "🏪", price: 451.22, specs: { altura: "1,40m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 449.66 }] },
  { id: 2, name: "Parede Continuação 1,40 c/ Bandejas", category: "parede-bandejas", icon: "🏪", price: 361.43, specs: { altura: "1,40m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 360.19 }] },
  { id: 3, name: "Parede Inicial 1,70 c/ Bandejas", category: "parede-bandejas", icon: "🏪", price: 552.45, specs: { altura: "1,70m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 550.53 }] },
  { id: 4, name: "Parede Continuação 1,70 c/ Bandejas", category: "parede-bandejas", icon: "🏪", price: 446.47, specs: { altura: "1,70m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 444.93 }] },
  { id: 5, name: "Parede Inicial 2,00 c/ Bandejas", category: "parede-bandejas", icon: "🏪", price: 607.19, specs: { altura: "2,00m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 605.07 }] },
  { id: 6, name: "Parede Continuação 2,00 c/ Bandejas", category: "parede-bandejas", icon: "🏪", price: 485.06, specs: { altura: "2,00m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 483.38 }] },
  // ── PAREDE C/ GANCHOS ──
  { id: 7, name: "Parede Inicial 1,40 c/ Ganchos", category: "parede-ganchos", icon: "🪝", price: 525.51, specs: { altura: "1,40m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 496.11 }] },
  { id: 8, name: "Parede Continuação 1,40 c/ Ganchos", category: "parede-ganchos", icon: "🪝", price: 435.72, specs: { altura: "1,40m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 406.64 }] },
  { id: 9, name: "Parede Inicial 1,70 c/ Ganchos", category: "parede-ganchos", icon: "🪝", price: 636.02, specs: { altura: "1,70m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 597.04 }] },
  { id: 10, name: "Parede Continuação 1,70 c/ Ganchos", category: "parede-ganchos", icon: "🪝", price: 530.04, specs: { altura: "1,70m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 491.44 }] },
  { id: 11, name: "Parede Inicial 2,00 c/ Ganchos", category: "parede-ganchos", icon: "🪝", price: 746.47, specs: { altura: "2,00m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 697.91 }] },
  { id: 12, name: "Parede Continuação 2,00 c/ Ganchos", category: "parede-ganchos", icon: "🪝", price: 624.34, specs: { altura: "2,00m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 576.22 }] },
  // ── PAREDE C/ CESTOS ──
  { id: 13, name: "Parede Inicial 1,40 c/ Cestos", category: "parede-cestos", icon: "🧺", price: 869.73, specs: { altura: "1,40m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 828.63 }] },
  { id: 14, name: "Parede Continuação 1,40 c/ Cestos", category: "parede-cestos", icon: "🧺", price: 779.94, specs: { altura: "1,40m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 739.16 }] },
  { id: 15, name: "Parede Inicial 1,70 c/ Cestos", category: "parede-cestos", icon: "🧺", price: 1265.43, specs: { altura: "1,70m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 1197.56 }] },
  { id: 16, name: "Parede Continuação 1,70 c/ Cestos", category: "parede-cestos", icon: "🧺", price: 1159.46, specs: { altura: "1,70m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 1091.97 }] },
  { id: 17, name: "Parede Inicial 2,00 c/ Cestos", category: "parede-cestos", icon: "🧺", price: 1490.63, specs: { altura: "2,00m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 1409.28 }] },
  { id: 18, name: "Parede Continuação 2,00 c/ Cestos", category: "parede-cestos", icon: "🧺", price: 1368.49, specs: { altura: "2,00m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 1287.58 }] },
  // ── CENTRO C/ BANDEJAS ──
  { id: 19, name: "Centro Inicial 1,40 c/ Bandejas", category: "centro-bandejas", icon: "🏬", price: 665.69, specs: { altura: "1,40m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 663.49 }] },
  { id: 20, name: "Centro Continuação 1,40 c/ Bandejas", category: "centro-bandejas", icon: "🏬", price: 559.63, specs: { altura: "1,40m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 557.77 }] },
  { id: 21, name: "Centro Inicial 1,70 c/ Bandejas", category: "centro-bandejas", icon: "🏬", price: 813.34, specs: { altura: "1,70m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 810.62 }] },
  { id: 22, name: "Centro Continuação 1,70 c/ Bandejas", category: "centro-bandejas", icon: "🏬", price: 691.09, specs: { altura: "1,70m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 688.78 }] },
  { id: 23, name: "Centro Inicial 2,00 c/ Bandejas", category: "centro-bandejas", icon: "🏬", price: 868.08, specs: { altura: "2,00m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 865.17 }] },
  { id: 24, name: "Centro Continuação 2,00 c/ Bandejas", category: "centro-bandejas", icon: "🏬", price: 729.68, specs: { altura: "2,00m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 727.22 }] },
  // ── CENTRO C/ GANCHOS ──
  { id: 25, name: "Centro Inicial 1,40 c/ Ganchos", category: "centro-ganchos", icon: "🪝", price: 814.26, specs: { altura: "1,40m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 756.39 }] },
  { id: 26, name: "Centro Continuação 1,40 c/ Ganchos", category: "centro-ganchos", icon: "🪝", price: 708.2, specs: { altura: "1,40m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 650.67 }] },
  { id: 27, name: "Centro Inicial 1,70 c/ Ganchos", category: "centro-ganchos", icon: "🪝", price: 980.48, specs: { altura: "1,70m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 903.65 }] },
  { id: 28, name: "Centro Continuação 1,70 c/ Ganchos", category: "centro-ganchos", icon: "🪝", price: 858.23, specs: { altura: "1,70m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 781.8 }] },
  { id: 29, name: "Centro Inicial 2,00 c/ Ganchos", category: "centro-ganchos", icon: "🪝", price: 1146.64, specs: { altura: "2,00m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 1050.84 }] },
  { id: 30, name: "Centro Continuação 2,00 c/ Ganchos", category: "centro-ganchos", icon: "🪝", price: 1008.24, specs: { altura: "2,00m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 912.9 }] },
  // ── CENTRO C/ CESTOS ──
  { id: 31, name: "Centro Inicial 1,40 c/ Cestos", category: "centro-cestos", icon: "🧺", price: 1502.7, specs: { altura: "1,40m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 1421.43 }] },
  { id: 32, name: "Centro Continuação 1,40 c/ Cestos", category: "centro-cestos", icon: "🧺", price: 1396.65, specs: { altura: "1,40m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 1315.71 }] },
  { id: 33, name: "Centro Inicial 1,70 c/ Cestos", category: "centro-cestos", icon: "🧺", price: 1898.41, specs: { altura: "1,70m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 1790.37 }] },
  { id: 34, name: "Centro Continuação 1,70 c/ Cestos", category: "centro-cestos", icon: "🧺", price: 1776.16, specs: { altura: "1,70m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 1668.52 }] },
  { id: 35, name: "Centro Inicial 2,00 c/ Cestos", category: "centro-cestos", icon: "🧺", price: 2294.05, specs: { altura: "2,00m", tipo: "Inicial" }, options: [{ label: "Branca" }, { label: "Preta", price: 2159.25 }] },
  { id: 36, name: "Centro Continuação 2,00 c/ Cestos", category: "centro-cestos", icon: "🧺", price: 2155.65, specs: { altura: "2,00m", tipo: "Continuação" }, options: [{ label: "Branca" }, { label: "Preta", price: 2021.3 }] },
  // ── PONTA ──
  { id: 37, name: "Ponta 1,40m", category: "ponta", icon: "▶️", price: 411.76, specs: { altura: "1,40m" }, options: [{ label: "Branca" }, { label: "Preta", price: 411.76 }] },
  { id: 38, name: "Ponta 1,70m", category: "ponta", icon: "▶️", price: 523.94, specs: { altura: "1,70m" }, options: [{ label: "Branca" }, { label: "Preta", price: 523.75 }] },
  { id: 39, name: "Ponta 2,00m", category: "ponta", icon: "▶️", price: 575.66, specs: { altura: "2,00m" }, options: [{ label: "Branca" }, { label: "Preta", price: 575.29 }] },
  // ── SLIM 2000x600 ──
  { id: 40, name: "Slim Inicial 3 Níveis", category: "slim", icon: "📦", price: 663.29, specs: { niveis: "3", tipo: "Inicial", dimensao: "2000x600" }, options: [] },
  { id: 41, name: "Slim Continuação 3 Níveis", category: "slim", icon: "📦", price: 499.26, specs: { niveis: "3", tipo: "Continuação", dimensao: "2000x600" }, options: [] },
  { id: 42, name: "Slim Inicial 4 Níveis", category: "slim", icon: "📦", price: 775.03, specs: { niveis: "4", tipo: "Inicial", dimensao: "2000x600" }, options: [] },
  { id: 43, name: "Slim Continuação 4 Níveis", category: "slim", icon: "📦", price: 611, specs: { niveis: "4", tipo: "Continuação", dimensao: "2000x600" }, options: [] },
  { id: 44, name: "Slim Inicial 5 Níveis", category: "slim", icon: "📦", price: 886.77, specs: { niveis: "5", tipo: "Inicial", dimensao: "2000x600" }, options: [] },
  { id: 45, name: "Slim Continuação 5 Níveis", category: "slim", icon: "📦", price: 722.74, specs: { niveis: "5", tipo: "Continuação", dimensao: "2000x600" }, options: [] },
  // ── MPP 2000x800 ──
  { id: 46, name: "MPP Inicial 3 Níveis", category: "mpp", icon: "🏗️", price: 1043.14, specs: { niveis: "3", tipo: "Inicial", dimensao: "2000x800" }, options: [] },
  { id: 47, name: "MPP Continuação 3 Níveis", category: "mpp", icon: "🏗️", price: 798.02, specs: { niveis: "3", tipo: "Continuação", dimensao: "2000x800" }, options: [] },
  { id: 48, name: "MPP Inicial 4 Níveis", category: "mpp", icon: "🏗️", price: 1227.44, specs: { niveis: "4", tipo: "Inicial", dimensao: "2000x800" }, options: [] },
  { id: 49, name: "MPP Continuação 4 Níveis", category: "mpp", icon: "🏗️", price: 982.32, specs: { niveis: "4", tipo: "Continuação", dimensao: "2000x800" }, options: [] },
  { id: 50, name: "MPP Inicial 5 Níveis", category: "mpp", icon: "🏗️", price: 1411.74, specs: { niveis: "5", tipo: "Inicial", dimensao: "2000x800" }, options: [] },
  { id: 51, name: "MPP Continuação 5 Níveis", category: "mpp", icon: "🏗️", price: 1166.62, specs: { niveis: "5", tipo: "Continuação", dimensao: "2000x800" }, options: [] },
  // ── MDF ──
  { id: 52, name: "MDF 1200x600", category: "mdf", icon: "🪵", price: 43.80, specs: { dimensao: "1200x600mm" }, options: [] },
  { id: 53, name: "MDF 1200x800", category: "mdf", icon: "🪵", price: 43.80, specs: { dimensao: "1200x800mm" }, options: [] },
  { id: 54, name: "MDF 1800x600", category: "mdf", icon: "🪵", price: 54.75, specs: { dimensao: "1800x600mm" }, options: [] },
  { id: 55, name: "MDF 1800x800", category: "mdf", icon: "🪵", price: 73.00, specs: { dimensao: "1800x800mm" }, options: [] },
];

const fmt = (v) => v === 0 ? "Sob consulta" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtMoney = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const genId = () => Math.random().toString(36).substr(2, 9);
const catLabel = (key) => CATEGORIES.find(c => c.key === key)?.label || key;

function getItemCusto(item, order) {
  const itemTotal = Number(item.total) || 0;
  const orderTotal = Number(order.total) || 0;
  const orderComissao = Number(order.comissao) || 0;
  const orderFrete = Number(order.frete) || 0;
  const totalSemFrete = orderTotal - orderFrete;
  const somaItens = (order.items || []).reduce((s, i) => s + (Number(i.total) || 0), 0);
  const itensTeemComissao = Math.abs(somaItens - totalSemFrete) < 1 && orderComissao > 0;
  if (!itensTeemComissao) return itemTotal;
  const custoTotal = totalSemFrete - orderComissao;
  if (custoTotal <= 0) return itemTotal;
  const fator = custoTotal / somaItens;
  return itemTotal * fator;
}

function formatarCnpj(valor) {
  const d = (valor || "").replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

function formatarCelular(valor) {
  const d = (valor || "").replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)})${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)})${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)})${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

const LOGO_B64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD02iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAOnWikYAqQeh4NZ+n3RV2tJ2+eNioY9/T9KynVUJJS6lRg5JtdDRooorUkKKKKACjPOO9Q3VzHawtJIcBRTLESNH58/wDrJecf3R2FZ+1TnyIrl0uWaKKK0JCiiigAooooARhkVzesR3Mdz9qt2PHDptyGHrXS1BcxB4mwQGxwSM4/Csq1KNWPLJFwm4O6Oci8UwWpEd06rx0LZH4Z5ra0/W9P1EH7NOCVGSDxj8elcvqMeqW0pa3s4bkf3vLAasHUNU1VCBPYXLj/AJ5FXCf+O9a4qNPFU9Iq682jaboy3dn8z09b21ZmVJ42KfeCnOKpXGuWsTFQ65HXnJ/L/GvMLvxDdtEkCIIo1+/FFGUC/wCfpVvSLuGaRQbS3lkJGFlMjk/h0rWpDGSW1vS3+ZEXQW7OvF1/amoIzHFrEcgZzub+p9q6dPuDgj2NZemWkgZZZgilRhVQYVB7CtarwtGVOL5t2KrNStYKKKK6jIKKKKACiiigCG7u7eygM11KscYIGT6noKjtNQs74SfZp1fy/vjBBX6g1n+JXEa6WWIC/wBoRZJOMdaxdQ1K7gbXmb7OLiO1iImhzwpYgA5JHAzVJXJbsdTZ3dlqEbPaSJKqNtJA6Gpmt4mGCgrjbu4n0f8AtaG1vJHEdgkyuWDFW3beD9Kmv7u80ltSjivriXbpn2hTK+4q+7GR6UcvYOY1J9E0afUPJkiT7SU83aBzjOM/nV2Kw07TIHlWKOKONS7NjAAHU1y0huNMvb2VL6a4mXRnmWSR9xU7h0ome6tkubZ9QnuorjR5Z2Er7sMMcj06mnZ9xXO2hkSWFJYjlHUMp9QeRT64nUNRu20+G3sRMjWenR3EkiXHl9V44wd2NtGoaneqy3jXkzW8NtBJKtvMqtEWGSWUj5s0uUfMdtRSAhgCOh5pakoKKKKACiiigCC7tIL2AwXUSyxt1VhkGqbabY2GnTx2tlAqSD5kC4D/AFrTqK5h8+Ex72TJBDKeRg5pSvytIatfUybGx0mOye3FpaBZ8+asK/K23nBq3IunzXDeZCGeaNYmYrxtPIUn8elB0pDlvNfzGLFn4ycgA+3QCmxaaRcuzPiIMjIg/wBkYBJrC9Yu0CtaWuj2MUq2mn7Fmyr7IvvqP/ZeaSO00Sw8+CCwCiZSkmyL747r/wDWq8dMiBgKMymFNikdcVItjGrblJzvZ+fVhg017bq+wvcKF3p+jXs8AubJJGMYWMmPgL2HtU9xoOl3NzHcTWUTyRgKpK9AOg/CnJpUSTpIHb5Npx67Rgc1oVpTdT7ZMlHoFFFFWIKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBaKKKAP/2Q==";

const COMPANY = {
  razao: "Gôndolas Suprema",
  cnpj: "46.996.687/0001-68",
  endereco: "R. José Cosme Pamplona, 1700 — Palhoça/SC",
  telefone: "(48) 98874-1847",
  site: "www.gondolasuprema.com",
};

const pdfStyles = `@page{size:A4;margin:20mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Helvetica,Arial,sans-serif;padding:36px;color:#1a1a1a;max-width:800px;margin:auto;position:relative}.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.06;z-index:0;pointer-events:none;width:400px;height:auto}.content{position:relative;z-index:1}.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #F5A623;padding-bottom:18px;margin-bottom:24px}.logo-area{display:flex;align-items:center;gap:12px}.logo-area img{height:60px}.logo-text{font-size:10px;color:#666;line-height:1.5;margin-top:4px}.info{text-align:right;font-size:11px;color:#666;line-height:1.6}table{width:100%;border-collapse:collapse;margin:12px 0}th{background:#f5f5f5;text-align:left;padding:8px 10px;font-size:11px;border-bottom:2px solid #ddd;color:#555;text-transform:uppercase;letter-spacing:.5px}td{padding:8px 10px;border-bottom:1px solid #eee;font-size:12px;vertical-align:middle}.tr td{font-weight:700;font-size:14px;border-top:2px solid #333;border-bottom:none;padding-top:12px}.n{background:#fafafa;padding:14px;border-radius:6px;margin:16px 0;font-size:12px;color:#555}.ft{margin-top:32px;padding-top:12px;border-top:1px solid #eee;font-size:10px;color:#999;text-align:center}.foto-cell{width:54px;text-align:center}.foto-cell img{width:46px;height:46px;object-fit:contain;border-radius:4px;background:#fafafa}.pgto-title{font-size:13px;font-weight:700;color:#333;margin:18px 0 6px;text-transform:uppercase;letter-spacing:.5px}.pgto-info{font-size:12px;color:#555;margin:2px 0}.pgto-table th{font-size:10px;text-align:center}.pgto-table td{text-align:center;font-size:11px}.pgto-obs{font-size:11px;color:#888;font-style:italic;margin-top:8px}@media print{body{padding:0}.watermark{position:fixed;opacity:0.06}}`;

const ICON_FILE_MAP = {
  "parede-branca": "parede-branca.jpeg",
  "parede-preta": "parede-preta.png",
  "centro-branca": "centro-branca.jpg",
  "centro-preta": "centro-preta.jpg",
  "mpp": "mpp.jpg",
  "checkout-branco": "checkout-branco.jpeg",
  "checkout-preto": "checkout-preto.jpeg",
};

function getIconKeyFromItem(item) {
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

function getIconHtml(item) {
  const key = getIconKeyFromItem(item);
  if (!key || !ICON_FILE_MAP[key]) return "";
  return `<img src="/produto-icons/${ICON_FILE_MAP[key]}" alt="" />`;
}

const TABELA_JUROS_BOLETO_HTML = [
  { parcelas: 1, juros: 0 },
  { parcelas: 2, juros: 0 },
  { parcelas: 3, juros: 0 },
  { parcelas: 4, juros: 0.015 },
  { parcelas: 5, juros: 0.030 },
  { parcelas: 6, juros: 0.045 },
  { parcelas: 7, juros: 0.060 },
  { parcelas: 8, juros: 0.075 },
];

function buildPaymentSection(total, comissao) {
  const entrada = Number(comissao) || 0;
  if (!total || total <= entrada) return "";
  const saldo = total - entrada;
  const linhas = TABELA_JUROS_BOLETO_HTML.map(({ parcelas, juros }) => {
    const totalParcelado = saldo * (1 + juros);
    const valorParcela = totalParcelado / parcelas;
    const totalGeral = entrada + totalParcelado;
    const acrescimo = juros === 0 ? "Sem juros" : "+" + (juros * 100).toFixed(1).replace(".", ",") + "%";
    return `<tr><td><strong>${parcelas}x</strong></td><td>${fmt(valorParcela)}</td><td>${acrescimo}</td><td>${fmt(totalParcelado)}</td><td>${fmt(totalGeral)}</td></tr>`;
  }).join("");
  return `
    <div class="pgto-title">Opções de Pagamento — Boleto</div>
    ${entrada > 0 ? `<div class="pgto-info"><strong>Entrada (à vista):</strong> ${fmt(entrada)}</div>` : ""}
    <div class="pgto-info"><strong>Saldo a parcelar:</strong> ${fmt(saldo)}</div>
    <table class="pgto-table">
      <thead><tr><th>Parcelas</th><th>Valor da parcela</th><th>Acréscimo</th><th>Total parcelado</th><th>Total geral</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <div class="pgto-obs">*obs: Mediante análise de crédito</div>
  `;
}

function buildPdfPage({ orderNum, date, clientName, clientCompany, clientPhone, clientCnpj, clientEndereco, clientEmail, items, total, notes, comissao }) {
  const tituloDestaque = clientCompany || (orderNum ? `#${orderNum}` : "");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Orçamento Gôndolas Suprema</title><style>${pdfStyles}</style></head><body>
<img class="watermark" src="${LOGO_B64}" alt=""/>
<div class="content">
<div class="hdr">
  <div><div class="logo-area"><img src="${LOGO_B64}" alt="Logo"/></div>
  <div class="logo-text">${COMPANY.razao}<br>CNPJ: ${COMPANY.cnpj}<br>${COMPANY.endereco}<br>Tel: ${COMPANY.telefone}<br>${COMPANY.site}</div></div>
  <div class="info"><strong style="font-size:16px;color:#333">ORÇAMENTO</strong>${tituloDestaque ? `<br><span style="color:#F5A623;font-weight:700;font-size:13px">${tituloDestaque}</span>` : ""}<br>Data: ${date}${clientCnpj ? `<br><strong>CNPJ:</strong> ${clientCnpj}` : ""}${clientName ? `<br><strong>Responsável:</strong> ${clientName}` : ""}${clientPhone ? `<br><strong>Tel:</strong> ${clientPhone}` : ""}${clientEmail ? `<br><strong>E-mail:</strong> ${clientEmail}` : ""}${clientEndereco ? `<br><strong>End:</strong> ${clientEndereco}` : ""}</div>
</div>
<table><thead><tr><th>Foto</th><th>Produto</th><th>Categoria</th><th>Qtd</th><th>Opcionais</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>
${items.map(i => `<tr><td class="foto-cell">${getIconHtml(i)}</td><td><strong>${i.name}</strong></td><td>${i.cat || ""}</td><td>${i.qty}</td><td>${i.opts?.length ? i.opts.join(", ") : "—"}</td><td style="text-align:right">${fmt(i.total)}</td></tr>`).join("")}
<tr class="tr"><td colspan="5">TOTAL GERAL</td><td style="text-align:right;color:#F5A623">${total === 0 ? "Sob consulta" : fmt(total)}</td></tr>
</tbody></table>
${buildPaymentSection(total, comissao)}
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
              { k: "graficos", l: "Gráficos" },
              ...(user.isAdmin ? [{ k: "adm", l: "ADM" }, { k: "financeiro", l: "Financeiro" }, { k: "dre", l: "DRE" }, { k: "nf", l: "NF" }, { k: "conciliacao", l: "Conciliação" }] : []),
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
  const [erro, setErro] = useState("");
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [inputsReady, setInputsReady] = useState(false);

  useEffect(() => {
    const isEmpty = !clientData.empresa && !clientData.cnpj && !clientData.telefone && !clientData.cidade;
    if (isEmpty) setForm(clientData);
  }, [clientData]);

  useEffect(() => {
    const t = setTimeout(() => {
      setForm(prev => ({
        empresa: prev.empresa || "",
        cnpj: prev.cnpj || "",
        responsavel: prev.responsavel || "",
        telefone: prev.telefone || "",
        email: prev.email || "",
        endereco: prev.endereco || "",
        numero: prev.numero || "",
        bairro: prev.bairro || "",
        cep: prev.cep || "",
        cidade: prev.cidade || "",
        estado: prev.estado || "",
      }));
      setInputsReady(true);
    }, 80);
    return () => clearTimeout(t);
  }, []);
  const inp = { width: "100%", padding: "12px 14px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };
  const inpErr = { ...inp, border: `1px solid ${COLORS.danger}` };
  const labelStyle = { color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: 0.5 };

  const noFill = {
    autoComplete: "off",
    readOnly: true,
    onFocus: (e) => e.target.removeAttribute("readonly"),
  };

  const buscarCnpj = async () => {
    const cnpjLimpo = (form.cnpj || "").replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      setErro("CNPJ deve ter 14 dígitos para a consulta automática.");
      return;
    }
    setErro("");
    setBuscandoCnpj(true);
    try {
      const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!resp.ok) {
        setErro(resp.status === 404 ? "CNPJ não encontrado na Receita." : "Falha ao consultar CNPJ. Tente novamente.");
        return;
      }
      const d = await resp.json();
      const cepLimpo = d.cep ? String(d.cep).replace(/\D/g, "") : "";

      let emailFinal = d.email || "";
      let telefoneFinal = "";
      const ddd = d.ddd_telefone_1 ? String(d.ddd_telefone_1).replace(/\D/g, "") : "";
      if (ddd) telefoneFinal = ddd;

      if (!emailFinal) {
        try {
          const respRws = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpjLimpo}`);
          if (respRws.ok) {
            const dRws = await respRws.json();
            if (dRws.status !== "ERROR") {
              emailFinal = dRws.email || "";
              if (!telefoneFinal && dRws.telefone) {
                telefoneFinal = String(dRws.telefone).replace(/\D/g, "");
              }
            }
          }
        } catch (e2) {}
      }

      setForm(prev => ({
        ...prev,
        empresa:  prev.empresa.trim()  || d.razao_social || d.nome_fantasia || "",
        email:    prev.email.trim()    || emailFinal     || "",
        telefone: prev.telefone.trim() || formatarCelular(telefoneFinal) || "",
        endereco: prev.endereco.trim() || d.logradouro   || "",
        numero:   (prev.numero || "").trim() || d.numero || "",
        bairro:   prev.bairro.trim()   || d.bairro    || "",
        cep:      (prev.cep || "").trim() || cepLimpo,
        cidade:   prev.cidade.trim()   || d.municipio || "",
        estado:   prev.estado.trim()   || d.uf        || "",
      }));

      const faltando = [];
      if (!d.logradouro) faltando.push("rua");
      if (!d.numero) faltando.push("número");
      if (!emailFinal) faltando.push("e-mail");
      if (faltando.length > 0) {
        setErro(`Empresa encontrada. A Receita não tem ${faltando.join(", ")} cadastrado(s) — preencha manualmente.`);
      }
    } catch (e) {
      setErro("Sem conexão para consultar o CNPJ. Verifique sua internet.");
    } finally {
      setBuscandoCnpj(false);
    }
  };

  const handleSave = () => {
    const faltando = [];
    if (!form.empresa.trim()) faltando.push("Nome da Empresa");
    if (!form.cnpj.trim()) faltando.push("CNPJ");
    if (!form.telefone.trim()) faltando.push("Celular");
    if (!form.cidade.trim()) faltando.push("Cidade");
    if (faltando.length > 0) {
      setErro("Preencha os campos obrigatórios: " + faltando.join(", "));
      return;
    }
    const telDigits = (form.telefone || "").replace(/\D/g, "");
    if (telDigits.length < 10 || telDigits.length > 11) {
      setErro("Celular inválido. Informe DDD + número (10 ou 11 dígitos). Ex: (48) 99965-6082.");
      return;
    }
    const cepDigits = (form.cep || "").replace(/\D/g, "");
    if (cepDigits && cepDigits.length !== 8) {
      setErro("CEP deve ter 8 digitos (ex: 88132-700).");
      return;
    }
    setErro("");
    const cleaned = { ...form, cep: cepDigits, telefone: telDigits };
    setClientData(cleaned);
    localStorage.setItem("gs_client_data", JSON.stringify(cleaned));
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
        {erro && <div style={{ background: COLORS.danger + "15", color: COLORS.danger, padding: "10px 14px", borderRadius: 8, fontSize: 12, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>{erro}</div>}
        {!inputsReady ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ height: 44, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, opacity: 0.4 }} />
            ))}
          </div>
        ) : (
        <form autoComplete="off" onSubmit={e => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input type="text" name="prevent_autofill" autoComplete="off" style={{ display: "none" }} />
          <input type="password" name="prevent_autofill_pwd" autoComplete="new-password" style={{ display: "none" }} />
          <div>
            <label style={labelStyle}>Nome da Empresa *</label>
            <input {...noFill} placeholder="Ex: Supermercado Bom Preço" name="gs_empresa_nofill" value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })} style={!form.empresa.trim() && erro ? inpErr : inp} />
          </div>
          <div>
            <label style={labelStyle}>CNPJ *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                {...noFill}
                placeholder="00.000.000/0001-00"
                name="gs_cnpj_nofill"
                value={form.cnpj}
                onChange={e => setForm({ ...form, cnpj: formatarCnpj(e.target.value) })}
                onFocus={(e) => e.target.removeAttribute("readonly")}
                onBlur={() => {
                  const c = (form.cnpj || "").replace(/\D/g, "");
                  if (c.length === 14 && !buscandoCnpj) buscarCnpj();
                }}
                maxLength={18}
                style={!form.cnpj.trim() && erro ? { ...inpErr, flex: 1 } : { ...inp, flex: 1 }}
              />
              <button
                type="button"
                onClick={buscarCnpj}
                disabled={buscandoCnpj}
                title="Buscar dados da empresa pelo CNPJ"
                style={{
                  background: COLORS.orange, color: "#000", border: "none",
                  padding: "0 16px", borderRadius: 8, fontWeight: 700, fontSize: 12,
                  cursor: buscandoCnpj ? "wait" : "pointer",
                  fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
                  opacity: buscandoCnpj ? 0.6 : 1,
                }}
              >
                {buscandoCnpj ? "Buscando..." : "Buscar dados"}
              </button>
            </div>
            <div style={{ color: COLORS.textDim, fontSize: 11, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
              Preenche automaticamente os campos vazios com os dados da Receita.
            </div>
          </div>
          <div>
            <label style={labelStyle}>Responsável</label>
            <input {...noFill} placeholder="Nome do responsável" name="gs_resp_nofill" value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} style={inp} />
          </div>
          <div>
            <label style={labelStyle}>Celular *</label>
            <input {...noFill} placeholder="(00)00000-0000" name="gs_tel_nofill" value={form.telefone} onChange={e => setForm({ ...form, telefone: formatarCelular(e.target.value) })} maxLength={14} style={!form.telefone.trim() && erro ? inpErr : inp} />
          </div>
          <div>
            <label style={labelStyle}>E-mail</label>
            <input {...noFill} placeholder="email@empresa.com" name="gs_email_nofill" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Rua / Logradouro</label>
              <input {...noFill} placeholder="Ex: Av. Brasil" name="gs_end_nofill" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} style={inp} />
            </div>
            <div>
              <label style={labelStyle}>Número</label>
              <input {...noFill} placeholder="123" name="gs_num_nofill" value={form.numero || ""} onChange={e => setForm({ ...form, numero: e.target.value })} style={inp} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Bairro</label>
              <input {...noFill} placeholder="Bairro" name="gs_bairro_nofill" value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} style={inp} />
            </div>
            <div>
              <label style={labelStyle}>CEP (recomendado p/ NFe)</label>
              <input {...noFill} placeholder="00000-000" name="gs_cep_nofill" value={form.cep || ""} onChange={e => setForm({ ...form, cep: e.target.value })} style={inp} maxLength={9} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Cidade *</label>
              <input {...noFill} placeholder="Cidade" name="gs_cidade_nofill" value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} style={!form.cidade.trim() && erro ? inpErr : inp} />
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <input {...noFill} placeholder="UF" name="gs_uf_nofill" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} style={inp} maxLength={2} />
            </div>
          </div>
        </form>
        )}

        <button onClick={handleSave} disabled={!inputsReady} style={{
          width: "100%", background: COLORS.orange, color: "#000", border: "none", padding: "14px",
          borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 24
        }}>
          {form.empresa ? "Salvar e Ir para Produtos →" : "Preencha os campos obrigatórios"}
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
            {clientData.cidade && <><br/>{clientData.endereco && `${clientData.endereco}${clientData.numero ? ", " + clientData.numero : ""}`}{clientData.bairro && ` — ${clientData.bairro}`} — {clientData.cidade}{clientData.estado && `/${clientData.estado}`}{clientData.cep && ` · CEP ${clientData.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}`}</>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LOGIN (Supabase Auth) ───
// Lista de vendedores (sem senhas) — usada apenas para exibicao em filtros, ranking e graficos.
// Autenticacao real e feita via Supabase Auth (ver supabase.auth.signInWithPassword abaixo).
const VENDEDORES = [
  { id: "v1", name: "Alessandro Thonsen", email: "ale.thonsen@gmail.com",        isAdmin: true  },
  { id: "v2", name: "Adelmo Martinello",  email: "adelmo_ade@yahoo.com.br",      isAdmin: false },
  { id: "v3", name: "Willian Zanella",    email: "comercial@gondolasuprema.com", isAdmin: true  },
];

function Login({ onLogin, setPage }) {
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setErr("");
    if (!f.email || !f.password) return setErr("Preencha todos os campos.");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: f.email.trim().toLowerCase(),
      password: f.password,
    });
    setLoading(false);
    if (error) {
      const msg = error.message || "";
      if (msg.toLowerCase().includes("invalid")) return setErr("E-mail ou senha incorretos.");
      return setErr(msg);
    }
    const meta = data.user?.user_metadata || {};
    const u = {
      id: meta.legacy_id || data.user.id,
      name: meta.name || data.user.email,
      email: data.user.email,
      isAdmin: !!meta.isAdmin,
    };
    onLogin(u);
    setPage("client");
  };

  const inp = { width: "100%", padding: "11px 14px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)", padding: 20 }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 36, width: 380, maxWidth: "100%" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 6px" }}>Entrar</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 24px", fontFamily: "'DM Sans', sans-serif" }}>Acesse com suas credenciais</p>
        {err && <div style={{ background: COLORS.danger + "15", color: COLORS.danger, padding: "8px 12px", borderRadius: 7, fontSize: 12, marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>{err}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder="E-mail" type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} style={inp} disabled={loading} />
          <input placeholder="Senha" type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} style={inp} onKeyDown={e => e.key === "Enter" && !loading && go()} disabled={loading} />
          <button onClick={go} disabled={loading} style={{ background: loading ? COLORS.border : COLORS.orange, color: "#000", border: "none", padding: "12px", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{loading ? "Entrando..." : "Entrar"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── CATALOG ───
function Catalog({ onAdd, uniplusProducts: uniplusFromApp, uniplusPriceMap }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [outrosProdutos, setOutrosProdutos] = useState([]);
  const [loadingOutros, setLoadingOutros] = useState(false);
  const [variantSel, setVariantSel] = useState({}); // { [productId]: { altura: "1,37m", cor: "Branca" } }
  const [qtyByProduct, setQtyByProduct] = useState({});

  const getProductVariantSel = (p) => {
    const sel = variantSel[p.id] || {};
    if (!p.variants) return sel;
    const filled = { ...sel };
    p.variants.forEach(v => { if (!filled[v.key]) filled[v.key] = v.options[0]; });
    return filled;
  };

  const setProductVariant = (productId, key, value) => {
    setVariantSel(prev => ({ ...prev, [productId]: { ...(prev[productId] || {}), [key]: value } }));
  };

  const getProductQty = (p) => qtyByProduct[p.id] || 1;
  const setProductQty = (productId, qty) => setQtyByProduct(prev => ({ ...prev, [productId]: Math.max(1, qty) }));

  useEffect(() => {
    if (!uniplusFromApp) return;
    setLoadingOutros(true);
    const adaptados = (uniplusFromApp || []).map(r => ({
      id: r.id,
      name: r.nome,
      category: "outros",
      icon: "📦",
      price: Number(r.preco_brasil) || 0,
      specs: { categoria: r.categoria || "Diversos" },
      options: []
    }));
    setOutrosProdutos(adaptados);
    setLoadingOutros(false);
  }, [uniplusFromApp]);

  const todosProdutos = [...PRODUCTS, ...outrosProdutos];
  const filtered = todosProdutos.filter(p => (filter === "all" || p.category === filter) && p.name.toLowerCase().includes(search.toLowerCase()));

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
      <div style={{ color: COLORS.textDim, fontSize: 12, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
        {filtered.length} produto(s) encontrado(s){filter === "outros" && loadingOutros ? " — carregando..." : ""}
      </div>
      {filter === "outros" ? (
        // Visualização em lista para "Outros Produtos"
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: COLORS.textDim, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
            <div>Produto</div>
            <div style={{ textAlign: "right", minWidth: 110 }}>Valor Suprema</div>
            <div style={{ minWidth: 100 }}></div>
          </div>
          {filtered.length === 0 && !loadingOutros && (
            <div style={{ padding: "20px 16px", color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>Nenhum produto encontrado</div>
          )}
          {filtered.map((p, idx) => (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, padding: "10px 16px", borderBottom: idx < filtered.length - 1 ? `1px solid ${COLORS.border}` : "none", alignItems: "center" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", color: COLORS.text, fontSize: 13, lineHeight: 1.3 }}>{p.name}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: p.price === 0 ? COLORS.textDim : COLORS.orange, textAlign: "right", minWidth: 110 }}>{fmt(p.price)}</div>
              <button onClick={() => onAdd(p)} style={{ background: COLORS.orange, color: "#000", border: "none", padding: "6px 12px", borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", minWidth: 100 }}>+ Orçamento</button>
            </div>
          ))}
        </div>
      ) : filter === "gondolas-parede" ? (
        // Visualização em lista com variantes (altura + cor) para Gôndolas de Parede
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "20px 16px", color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>Nenhum produto encontrado</div>
          )}
          {filtered.map((p, idx) => {
            const sel = getProductVariantSel(p);
            const qty = getProductQty(p);
            const computedPrice = computeProductPrice(p, sel, [0], uniplusPriceMap);
            const pillStyle = (active) => ({ background: active ? COLORS.orange + "20" : COLORS.bg, border: `1px solid ${active ? COLORS.orange : COLORS.border}`, color: active ? COLORS.orange : COLORS.textMuted, padding: "4px 12px", borderRadius: 16, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: active ? 600 : 400 });
            return (
              <div key={p.id} style={{ padding: "14px 16px", borderBottom: idx < filtered.length - 1 ? `1px solid ${COLORS.border}` : "none", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                <div style={{ flex: "1 1 240px", minWidth: 200, fontFamily: "'DM Sans', sans-serif", color: COLORS.text, fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{p.name}</div>
                {(p.variants || []).map(v => (
                  <div key={v.key} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
                    <span style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginRight: 4 }}>{v.label}:</span>
                    {v.options.map(op => (
                      <button key={op} onClick={() => setProductVariant(p.id, v.key, op)} style={pillStyle(sel[v.key] === op)}>
                        {sel[v.key] === op ? "✓ " : ""}{op}
                      </button>
                    ))}
                  </div>
                ))}
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: computedPrice === 0 ? COLORS.textDim : COLORS.orange, textAlign: "right", minWidth: 100 }}>{computedPrice === 0 ? "Sob consulta" : fmt(computedPrice)}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginRight: 6 }}>Qtd:</span>
                    <button onClick={() => setProductQty(p.id, qty - 1)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, width: 26, height: 28, borderRadius: "6px 0 0 6px", cursor: "pointer", fontSize: 13 }}>−</button>
                    <input
                      type="number" min="1"
                      value={qty}
                      onChange={e => setProductQty(p.id, Number(e.target.value) || 1)}
                      style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderLeft: "none", borderRight: "none", width: 44, height: 28, textAlign: "center", color: COLORS.white, fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", padding: 0, MozAppearance: "textfield" }}
                    />
                    <button onClick={() => setProductQty(p.id, qty + 1)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, width: 26, height: 28, borderRadius: "0 6px 6px 0", cursor: "pointer", fontSize: 13 }}>+</button>
                  </div>
                  <button onClick={() => onAdd(p, sel, qty)} style={{ background: COLORS.orange, color: "#000", border: "none", padding: "7px 14px", borderRadius: 7, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>+ Orçamento</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
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
      )}
    </div>
  );
}

// ─── QUOTE ───
function Quote({ items, setItems, user, setPage, clientData, editingOrderId, setEditingOrderId, markup, setMarkup, frete, setFrete, uniplusPriceMap }) {
  const [notes, setNotes] = useState("");
  const upd = (i, f, v) => { const c = [...items]; c[i] = { ...c[i], [f]: v }; setItems(c); };
  const togOpt = (i, oi) => { const c = [...items]; c[i] = { ...c[i], selOpts: [oi] }; setItems(c); };
  const setVariant = (i, key, value) => {
    const c = [...items];
    c[i] = { ...c[i], selVariants: { ...(c[i].selVariants || {}), [key]: value } };
    setItems(c);
  };
  const rem = i => setItems(items.filter((_, j) => j !== i));
  const itemPrice = it => computeProductPrice(it.product, it.selVariants, it.selOpts, uniplusPriceMap);
  const itemTotal = it => itemPrice(it) * it.qty;
  const total = items.reduce((s, i) => s + itemTotal(i), 0);
  const totalComissao = total * (markup || 0) / 100;
  const totalFinal = total + totalComissao + (frete || 0);

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
            {(it.product.variants || []).map(v => (
              <div key={v.key} style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginRight: 4 }}>{v.label}:</span>
                {v.options.map(op => {
                  const sel = (it.selVariants || {})[v.key] === op;
                  return <button key={op} onClick={() => setVariant(i, v.key, op)} style={{ background: sel ? COLORS.orange + "20" : COLORS.bg, border: `1px solid ${sel ? COLORS.orange : COLORS.border}`, color: sel ? COLORS.orange : COLORS.textMuted, padding: "4px 12px", borderRadius: 16, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: sel ? 600 : 400 }}>{sel ? "✓ " : ""}{op}</button>;
                })}
              </div>
            ))}
            {it.product.options && it.product.options.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginRight: 4 }}>Cor:</span>
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

      <div style={{ background: `linear-gradient(135deg, ${COLORS.orange}12, ${COLORS.orange}06)`, border: `1px solid ${COLORS.orange}30`, borderRadius: 12, padding: "18px 22px", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Total do orçamento (Custo + Comissão + Frete)</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: totalFinal === 0 ? COLORS.textDim : COLORS.orange }}>{totalFinal === 0 ? "Valores sob consulta" : fmt(totalFinal)}</div>
          <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{items.length} produto(s) · {items.reduce((s, i) => s + i.qty, 0)} un · Subtotal {fmt(total)}</div>
        </div>
        <button onClick={() => setPage("resumo")} style={{ background: COLORS.orange, color: "#000", border: "none", padding: "12px 24px", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Ver Resumo →</button>
      </div>
    </div>
  );
}

// ─── RESUMO ───
function ResumoPage({ items, user, setPage, clientData, editingOrderId, setEditingOrderId, setItems, markup, setMarkup, frete, setFrete, uniplusPriceMap }) {
  const [notes, setNotes] = useState("");

  const itemPrice = it => computeProductPrice(it.product, it.selVariants, it.selOpts, uniplusPriceMap);
  const itemBase = it => itemPrice(it) * it.qty;
  const itemComissao = it => itemBase(it) * markup / 100;
  const itemFinal = it => itemBase(it) + itemComissao(it);

  const subtotalProdutos = items.reduce((s, i) => s + itemBase(i), 0);
  const totalComissao = items.reduce((s, i) => s + itemComissao(i), 0);
  const totalFinal = subtotalProdutos + totalComissao + frete;

  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!user || saving) return;
    setSaving(true);
    const cd = clientData || {};
    const newItems = items.map(i => {
      const optsFromOptions = (i.selOpts || []).map(oi => (i.product.options || [])[oi]?.label).filter(Boolean);
      const optsFromVariants = i.selVariants ? Object.entries(i.selVariants).map(([k, v]) => v) : [];
      return {
        name: i.product.name,
        cat: catLabel(i.product.category),
        qty: i.qty,
        opts: [...optsFromVariants, ...optsFromOptions],
        total: itemBase(i),
      };
    });

    try {
      if (editingOrderId) {
        // Fetch existing order, append items
        const { data: existing } = await supabase.from("orcamentos").select("*").eq("id", editingOrderId).single();
        if (existing) {
          const updatedItems = [...(existing.items || []), ...newItems];
          const updatedTotal = updatedItems.reduce((s, i) => s + i.total, 0) + frete;
          await supabase.from("orcamentos").update({
            items: updatedItems,
            total: updatedTotal,
            frete: (existing.frete || 0) + frete,
            data: new Date().toISOString(),
            notes: notes ? (existing.notes ? existing.notes + "\n" + notes : notes) : existing.notes,
          }).eq("id", editingOrderId);
        }
        setEditingOrderId(null);
      } else {
        await supabase.from("orcamentos").insert({
          id: genId(),
          vendedor_id: user.id,
          vendedor_nome: user.name,
          data: new Date().toISOString(),
          cliente_empresa: cd.empresa,
          cliente_cnpj: cd.cnpj,
          cliente_responsavel: cd.responsavel,
          cliente_telefone: cd.telefone,
          cliente_email: cd.email,
          cliente_endereco: cd.endereco,
          cliente_numero: cd.numero,
          cliente_bairro: cd.bairro,
          cliente_cidade: cd.cidade,
          cliente_estado: cd.estado,
          cliente_cep: cd.cep,
          items: newItems,
          total: totalFinal,
          frete,
          comissao: totalComissao,
          notes,
          status: "Aguardando Retorno",
        });
      }
    } catch (e) { console.error("Erro ao salvar:", e); }
    setSaving(false);
    setItems([]);
    setMarkup(0);
    setFrete(0);
    setPage("orders");
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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{fmt(itemBase(it))}</div>
                {markup > 0 && <div style={{ color: COLORS.success, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>+{fmt(itemComissao(it))}</div>}
              </div>
              <button onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ background: COLORS.danger + "15", border: "none", color: COLORS.danger, padding: "6px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12, lineHeight: 1 }}>✕</button>
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
      <button onClick={save} disabled={saving} style={{ width: "100%", background: saving ? COLORS.textDim : COLORS.orange, color: "#000", border: "none", padding: "14px", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: saving ? "wait" : "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 16 }}>{saving ? "Salvando..." : editingOrderId ? "Adicionar ao Orçamento" : "Salvar Orçamento"}</button>
    </div>
  );
}

// ─── ORDERS ───
function Orders({ user, setPage, setCart, clientData, setEditingOrderId }) {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editFrete, setEditFrete] = useState(0);
  const [editMarkup, setEditMarkup] = useState(0);
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (o) => {
    setEditingId(o.id);
    // Decompor itens pra garantir que a edicao sempre comece com CUSTO puro
    const itensCusto = (o.items || []).map(it => ({ ...it, total: getItemCusto(it, o) }));
    setEditItems(itensCusto);
    setEditFrete(o.frete || 0);
    setEditNotes(o.notes || "");
    // Recuperar a margem do orcamento como percentual aplicado
    const subCusto = itensCusto.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const markupAtual = subCusto > 0 ? Math.round(((Number(o.comissao) || 0) / subCusto) * 100) : 0;
    setEditMarkup(markupAtual);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditItems([]);
    setEditFrete(0);
    setEditMarkup(0);
    setEditNotes("");
  };

  const saveEdit = async (orderId) => {
    setSaving(true);
    const subtotalCusto = editItems.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const comissao = subtotalCusto * (Number(editMarkup) || 0) / 100;
    const frete = Number(editFrete) || 0;
    const newTotal = subtotalCusto + comissao + frete;
    await supabase.from("orcamentos").update({
      items: editItems,
      total: newTotal,
      frete,
      comissao,
      notes: editNotes,
    }).eq("id", orderId);
    setOrders(orders.map(o => o.id === orderId ? { ...o, items: editItems, total: newTotal, frete, comissao, notes: editNotes } : o));
    setSaving(false);
    cancelEdit();
  };

  useEffect(() => {
    const loadOrders = async () => {
      const { data } = await supabase.from("orcamentos").select("*").eq("vendedor_id", user.id).order("data", { ascending: false });
      if (data) {
        setOrders(data.map(o => ({
          id: o.id, date: o.data, total: o.total, frete: o.frete, comissao: o.comissao || 0, notes: o.notes, status: o.status, items: o.items, vendedor: o.vendedor_nome,
          client: { empresa: o.cliente_empresa, cnpj: o.cliente_cnpj, responsavel: o.cliente_responsavel, telefone: o.cliente_telefone, email: o.cliente_email, endereco: o.cliente_endereco, numero: o.cliente_numero, bairro: o.cliente_bairro, cidade: o.cliente_cidade, estado: o.cliente_estado, cep: o.cliente_cep }
        })));
      }
    };
    loadOrders();
  }, [user.id]);

  const deleteOrder = async (orderId) => {
    await supabase.from("orcamentos").delete().eq("id", orderId);
    setOrders(orders.filter(o => o.id !== orderId));
    if (expanded === orderId) setExpanded(null);
    setConfirmDel(null);
  };

  const addMoreItems = (orderId) => {
    setEditingOrderId(orderId);
    setCart([]);
    setPage("catalog");
  };

  const buildPdfHtml = (order) => {
    const cd = order.client || clientData || {};
    return buildPdfPage({
      orderNum: order.id.slice(0, 6).toUpperCase(),
      date: new Date(order.date).toLocaleDateString("pt-BR"),
      clientName: cd.responsavel || user.name, clientCompany: cd.empresa || user.company, clientPhone: cd.telefone || user.phone || "",
      clientCnpj: cd.cnpj, clientEndereco: cd.endereco && cd.cidade ? `${cd.endereco}${cd.bairro ? `, ${cd.bairro}` : ""} — ${cd.cidade}${cd.estado ? `/${cd.estado}` : ""}` : "",
      clientEmail: cd.email,
      items: order.items, total: order.total, notes: order.notes,
      comissao: order.comissao || 0,
    });
  };

  const [pdfHtml, setPdfHtml] = useState(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfOrder, setPdfOrder] = useState(null);

  const showPdf = (order) => {
    const cd = order.client || clientData || {};
    setPdfHtml(buildPdfHtml(order));
    setPdfTitle(cd.empresa || user.name || order.id.slice(0, 6));
    setPdfOrder(order);
  };

  const [sharingOrder, setSharingOrder] = useState(false);
  const handleWhatsApp = async (order) => {
    setSharingOrder(true);
    const o = order || pdfOrder;
    if (!o) { setSharingOrder(false); return; }
    const cd = o.client || clientData || {};
    try {
      await sharePDFWhatsApp({
        orderNum: o.id.slice(0, 6).toUpperCase(),
        date: new Date(o.date).toLocaleDateString("pt-BR"),
        client: cd,
        items: o.items, total: o.total, notes: o.notes,
        comissao: o.comissao || 0,
      });
    } catch(e) { console.error(e); }
    setSharingOrder(false);
  };

  const sc = { "Aguardando Retorno": "#3B82F6", "Desistiu": "#F87171", "Sem Retorno": "#8B5CF6", "Fechou Concorrência": "#34D399", "Concluído": "#10B981" };
  const statusOptions = ["Aguardando Retorno", "Desistiu", "Sem Retorno", "Fechou Concorrência", "Concluído"];
  const [concluidoId, setConcluidoId] = useState(null);
  const [concluidoData, setConcluidoData] = useState({ data_entrega: "", numero_pedido: "", pag1: "", pag1_parcelas: "", pag1_valor: "", pag2: "", pag2_parcelas: "", pag2_valor: "" });

  const updateStatus = async (orderId, newStatus) => {
    if (newStatus === "Concluído") {
      setConcluidoId(orderId);
      setConcluidoData({ data_entrega: "", numero_pedido: "", pag1: "", pag1_parcelas: "", pag1_valor: "", pag2: "", pag2_parcelas: "", pag2_valor: "" });
      return;
    }
    await supabase.from("orcamentos").update({ status: newStatus }).eq("id", orderId);
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const saveConcluido = async () => {
    if (!concluidoId) return;
    const cd = concluidoData;
    let pagStr = cd.pag1;
    if (cd.pag1_parcelas) pagStr += " " + cd.pag1_parcelas + "x";
    if (cd.pag1_valor) pagStr += " R$ " + Number(cd.pag1_valor).toFixed(2);
    if (cd.pag2) {
      pagStr += " + " + cd.pag2;
      if (cd.pag2_parcelas) pagStr += " " + cd.pag2_parcelas + "x";
      if (cd.pag2_valor) pagStr += " R$ " + Number(cd.pag2_valor).toFixed(2);
    }
    const info = "\n📋 CONCLUÍDO — Entrega: " + cd.data_entrega + " | Pedido: " + cd.numero_pedido + " | Pagamento: " + pagStr;
    const existingNotes = orders.find(o => o.id === concluidoId)?.notes || "";
    await supabase.from("orcamentos").update({ status: "Concluído", notes: existingNotes + info }).eq("id", concluidoId);
    setOrders(orders.map(o => o.id === concluidoId ? { ...o, status: "Concluído", notes: (o.notes || "") + info } : o));
    setConcluidoId(null);
  };

  // PDF viewer
  if (pdfHtml) {
    const bodyMatch = pdfHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const styleMatch = pdfHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);

    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <button onClick={() => { setPdfHtml(null); setPdfOrder(null); }} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 20 }}>Orçamento — {pdfTitle}</h2>
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

      {/* Modal Concluído */}
      {concluidoId && (() => {
        const cd = concluidoData;
        const selStyle = { width: "100%", padding: "10px 14px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };
        const lblStyle = { color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: 0.5 };
        const canSave = cd.data_entrega && cd.numero_pedido && cd.pag1 && (cd.pag1 !== "Cartão de Crédito" && cd.pag1 !== "Boleto" || cd.pag1_parcelas);
        return (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 28, width: 460, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#10B981", fontSize: 20, margin: "0 0 6px" }}>Concluir Orçamento</h2>
            <p style={{ color: COLORS.textMuted, fontSize: 12, margin: "0 0 20px", fontFamily: "'DM Sans', sans-serif" }}>Preencha os dados da conclusão</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lblStyle}>Data de Entrega *</label>
                <input type="date" value={cd.data_entrega} onChange={e => setConcluidoData({ ...cd, data_entrega: e.target.value })} style={selStyle} />
              </div>
              <div>
                <label style={lblStyle}>Número do Pedido *</label>
                <input placeholder="Ex: PED-001" value={cd.numero_pedido} onChange={e => setConcluidoData({ ...cd, numero_pedido: e.target.value })} style={selStyle} />
              </div>

              {/* Pagamento 1 */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14 }}>
                <label style={lblStyle}>Forma de Pagamento 1 *</label>
                <select value={cd.pag1} onChange={e => setConcluidoData({ ...cd, pag1: e.target.value, pag1_parcelas: "" })} style={selStyle}>
                  <option value="">Selecione...</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Boleto">Boleto</option>
                </select>
                {cd.pag1 === "Cartão de Crédito" && (
                  <div style={{ marginTop: 10 }}>
                    <label style={lblStyle}>Parcelas *</label>
                    <select value={cd.pag1_parcelas} onChange={e => setConcluidoData({ ...cd, pag1_parcelas: e.target.value })} style={selStyle}>
                      <option value="">Selecione...</option>
                      {Array.from({ length: 18 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}x</option>)}
                    </select>
                  </div>
                )}
                {cd.pag1 === "Boleto" && (
                  <div style={{ marginTop: 10 }}>
                    <label style={lblStyle}>Parcelas *</label>
                    <select value={cd.pag1_parcelas} onChange={e => setConcluidoData({ ...cd, pag1_parcelas: e.target.value })} style={selStyle}>
                      <option value="">Selecione...</option>
                      {Array.from({ length: 8 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}x</option>)}
                    </select>
                  </div>
                )}
                {cd.pag1 && (
                  <div style={{ marginTop: 10 }}>
                    <label style={lblStyle}>Valor (R$)</label>
                    <input type="number" min="0" step="0.01" placeholder="0,00" value={cd.pag1_valor} onChange={e => setConcluidoData({ ...cd, pag1_valor: e.target.value })} style={selStyle} />
                  </div>
                )}
              </div>

              {/* Pagamento 2 (opcional) */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14 }}>
                <label style={lblStyle}>Forma de Pagamento 2 (opcional)</label>
                <select value={cd.pag2} onChange={e => setConcluidoData({ ...cd, pag2: e.target.value, pag2_parcelas: "", pag2_valor: "" })} style={selStyle}>
                  <option value="">Sem segundo pagamento</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Boleto">Boleto</option>
                </select>
                {cd.pag2 === "Cartão de Crédito" && (
                  <div style={{ marginTop: 10 }}>
                    <label style={lblStyle}>Parcelas *</label>
                    <select value={cd.pag2_parcelas} onChange={e => setConcluidoData({ ...cd, pag2_parcelas: e.target.value })} style={selStyle}>
                      <option value="">Selecione...</option>
                      {Array.from({ length: 18 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}x</option>)}
                    </select>
                  </div>
                )}
                {cd.pag2 === "Boleto" && (
                  <div style={{ marginTop: 10 }}>
                    <label style={lblStyle}>Parcelas *</label>
                    <select value={cd.pag2_parcelas} onChange={e => setConcluidoData({ ...cd, pag2_parcelas: e.target.value })} style={selStyle}>
                      <option value="">Selecione...</option>
                      {Array.from({ length: 8 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}x</option>)}
                    </select>
                  </div>
                )}
                {cd.pag2 && (
                  <div style={{ marginTop: 10 }}>
                    <label style={lblStyle}>Valor (R$)</label>
                    <input type="number" min="0" step="0.01" placeholder="0,00" value={cd.pag2_valor} onChange={e => setConcluidoData({ ...cd, pag2_valor: e.target.value })} style={selStyle} />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button onClick={() => setConcluidoId(null)} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                <button onClick={saveConcluido} disabled={!canSave} style={{ flex: 1, background: !canSave ? COLORS.textDim : "#10B981", color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: !canSave ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Concluir</button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

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
                    <span style={{ fontSize: 14, color: COLORS.white, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{o.client?.empresa || "Sem empresa"}</span>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
                      Vendedor: <strong style={{ color: COLORS.accent }}>{o.vendedor || user.name}</strong>
                      <span style={{ marginLeft: 8, color: COLORS.textDim }}>{new Date(o.date).toLocaleDateString("pt-BR")}</span>
                      <span style={{ marginLeft: 8, color: COLORS.textDim }}>{o.items.length} {o.items.length === 1 ? "item" : "itens"}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <select value={o.status || "Aguardando Retorno"} onClick={e => e.stopPropagation()} onChange={e => updateStatus(o.id, e.target.value)} style={{ background: (sc[o.status] || "#888") + "20", color: sc[o.status] || "#888", border: `1px solid ${(sc[o.status] || "#888")}40`, padding: "4px 8px", borderRadius: 16, fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", outline: "none", appearance: "auto" }}>
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: o.total === 0 ? COLORS.textDim : COLORS.orange }}>{o.total === 0 ? "Sob consulta" : fmt(o.total)}</span>
                </div>
              </div>

              {/* Expanded */}
              {isOpen && editingId !== o.id && (
                <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${COLORS.border}` }}>
                  <div style={{ marginTop: 14 }}>
                    {o.items.map((it, i) => {
                      const custo = getItemCusto(it, o);
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: COLORS.bg, borderRadius: 8, marginBottom: 6 }}>
                          <div>
                            <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{it.name}</div>
                            <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                              <span style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{it.cat}</span>
                              <span style={{ color: COLORS.textDim, fontSize: 11 }}>×{it.qty}</span>
                            </div>
                          </div>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: custo === 0 ? COLORS.textDim : COLORS.textMuted }}>{fmtMoney(custo)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {o.notes && <div style={{ padding: "8px 12px", background: COLORS.orange + "08", borderRadius: 8, fontSize: 12, color: COLORS.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>💬 {o.notes}</div>}

                  {(() => {
                    const valorComissao = Number(o.comissao) || 0;
                    const valorFrete = Number(o.frete) || 0;
                    const valorCusto = (Number(o.total) || 0) - valorComissao - valorFrete;
                    const linhaStyle = { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "4px 0", fontFamily: "'DM Sans', sans-serif" };
                    const labelStyle = { color: COLORS.textMuted, fontSize: 12 };
                    const valorStyle = { color: COLORS.text, fontSize: 13, fontWeight: 600 };
                    return (
                      <div style={{ background: `linear-gradient(135deg, ${COLORS.orange}10, ${COLORS.orange}05)`, border: `1px solid ${COLORS.orange}25`, borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                        <div style={linhaStyle}>
                          <span style={labelStyle}>Valor Custo</span>
                          <span style={valorStyle}>{fmtMoney(valorCusto)}</span>
                        </div>
                        <div style={linhaStyle}>
                          <span style={labelStyle}>+ Valor Comissão</span>
                          <span style={{ ...valorStyle, color: valorComissao > 0 ? COLORS.success : COLORS.textDim }}>{fmtMoney(valorComissao)}</span>
                        </div>
                        <div style={linhaStyle}>
                          <span style={labelStyle}>+ Frete</span>
                          <span style={{ ...valorStyle, color: valorFrete > 0 ? COLORS.text : COLORS.textDim }}>{fmtMoney(valorFrete)}</span>
                        </div>
                        <div style={{ borderTop: `1px solid ${COLORS.orange}30`, margin: "8px 0 6px" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>= Total</div>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: COLORS.orange }}>{fmtMoney(o.total)}</div>
                          </div>
                          <div style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif", textAlign: "right" }}>
                            {o.items.length} produto(s)<br/>{o.items.reduce((s, it) => s + it.qty, 0)} unidade(s)
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {isConfirming && (
                    <div style={{ background: COLORS.danger + "10", border: `1px solid ${COLORS.danger}30`, borderRadius: 10, padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                      <span style={{ color: COLORS.danger, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Excluir este orçamento?</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDel(null); }} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                        <button onClick={(e) => { e.stopPropagation(); deleteOrder(o.id); }} style={{ background: COLORS.danger, border: "none", color: "#fff", padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Sim, excluir</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={(e) => { e.stopPropagation(); showPdf(o); }} style={{ background: "#25D366", border: "none", color: "#fff", padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flex: 1, minWidth: 100 }}>📤 Compartilhar</button>
                    <button onClick={(e) => { e.stopPropagation(); startEdit(o); }} style={{ background: "#3B82F6" + "15", border: `1px solid #3B82F640`, color: "#3B82F6", padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flex: 1, minWidth: 100 }}>✏️ Editar</button>
                    <button onClick={(e) => { e.stopPropagation(); addMoreItems(o.id); }} style={{ background: COLORS.orange + "15", border: `1px solid ${COLORS.orange}40`, color: COLORS.orange, padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flex: 1, minWidth: 100 }}>+ Adicionar</button>
                    {user.isAdmin && <button onClick={(e) => { e.stopPropagation(); setConfirmDel(o.id); }} style={{ background: COLORS.danger + "10", border: `1px solid ${COLORS.danger}30`, color: COLORS.danger, padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", minWidth: 50 }}>🗑️</button>}
                  </div>
                </div>
              )}

              {/* Edit Mode */}
              {editingId === o.id && (
                <div style={{ padding: "18px", borderTop: `1px solid #3B82F640`, background: COLORS.bg + "80" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#3B82F6", fontSize: 16, margin: 0 }}>Editando Orçamento</h3>
                    <button onClick={cancelEdit} style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>✕ Cancelar</button>
                  </div>

                  {/* Edit Items */}
                  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
                    <div style={{ padding: "10px 14px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>Itens ({editItems.length})</span>
                      <button onClick={() => { addMoreItems(o.id); cancelEdit(); }} style={{ background: "transparent", border: "none", color: COLORS.orange, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>+ Adicionar item</button>
                    </div>
                    {editItems.map((it, i) => (
                      <div key={i} style={{ padding: "10px 14px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{it.name}</div>
                          <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{it.cat} · Qtd: {it.qty}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: COLORS.text, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{fmt(it.total)}</span>
                          <button onClick={() => setEditItems(editItems.filter((_, j) => j !== i))} style={{ background: COLORS.danger + "15", border: "none", color: COLORS.danger, padding: "4px 7px", borderRadius: 5, cursor: "pointer", fontSize: 11, lineHeight: 1 }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Edit Markup */}
                  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Aplicar margem (%):</span>
                    <input type="number" min="0" max="500" value={editMarkup || ""} onChange={e => setEditMarkup(Number(e.target.value) || 0)} placeholder="0" style={{ width: 70, padding: "6px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.orange, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center" }} />
                    <span style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{editMarkup > 0 ? "+" + editMarkup + "% sobre cada item" : "Sem margem extra"}</span>
                  </div>

                  {/* Edit Frete */}
                  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Frete (R$):</span>
                    <input type="number" min="0" value={editFrete || ""} onChange={e => setEditFrete(Number(e.target.value) || 0)} placeholder="0,00" style={{ width: 100, padding: "6px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.orange, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center" }} />
                  </div>

                  {/* Edit Notes */}
                  <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Observações..." rows={2} style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.text, padding: "10px 14px", fontSize: 12, fontFamily: "'DM Sans', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 14 }} />

                  {/* Edit Total Preview */}
                  <div style={{ background: `linear-gradient(135deg, #3B82F615, #3B82F605)`, border: "1px solid #3B82F630", borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: COLORS.textMuted, fontSize: 11 }}>Subtotal itens</span>
                      <span style={{ color: COLORS.text, fontSize: 11 }}>{fmt(editItems.reduce((s, it) => s + (it.total || 0), 0))}</span>
                    </div>
                    {editMarkup > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: COLORS.textMuted, fontSize: 11 }}>Margem ({editMarkup}%)</span>
                      <span style={{ color: COLORS.success, fontSize: 11 }}>+{fmt(editItems.reduce((s, it) => s + (it.total || 0), 0) * editMarkup / 100)}</span>
                    </div>}
                    {editFrete > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: COLORS.textMuted, fontSize: 11 }}>Frete</span>
                      <span style={{ color: COLORS.text, fontSize: 11 }}>+{fmt(editFrete)}</span>
                    </div>}
                    <div style={{ borderTop: "1px solid #3B82F630", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: COLORS.white, fontSize: 13, fontWeight: 700 }}>NOVO TOTAL</span>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: "#3B82F6" }}>{fmt((editMarkup > 0 ? editItems.reduce((s, it) => s + (it.total || 0) + (it.total || 0) * editMarkup / 100, 0) : editItems.reduce((s, it) => s + (it.total || 0), 0)) + editFrete)}</span>
                    </div>
                  </div>

                  {/* Save Edit */}
                  <button onClick={() => saveEdit(o.id)} disabled={saving} style={{ width: "100%", background: saving ? COLORS.textDim : "#3B82F6", color: "#fff", border: "none", padding: "12px", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: saving ? "wait" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>{saving ? "Salvando..." : "Salvar Alterações"}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ADMIN ───
function AdminPage() {
  const [allOrders, setAllOrders] = useState([]);
  const [deletedCount, setDeletedCount] = useState({});
  const [filterVendedor, setFilterVendedor] = useState("all");
  const [filterCidade, setFilterCidade] = useState("all");
  const [filterDataDe, setFilterDataDe] = useState("");
  const [filterDataAte, setFilterDataAte] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [mesSel, setMesSel] = useState("");
  const [vendaStatus, setVendaStatus] = useState({});
  const [emitindoNfe, setEmitindoNfe] = useState(null);
  const [nfeResult, setNfeResult] = useState(null);
  const [confirmEmitir, setConfirmEmitir] = useState(null);
  const [cancelandoNfe, setCancelandoNfe] = useState(null);
  const [cancelJustificativa, setCancelJustificativa] = useState("");
  const [cancelRef, setCancelRef] = useState("");

  const emitirNfe = async (ordem) => {
    setConfirmEmitir(null);
    setEmitindoNfe(ordem.id);
    setNfeResult(null);
    try {
      const res = await fetch("/api/emitir-nfe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordem, ambiente: "producao" }),
      });
      const data = await res.json();
      setNfeResult(data);
      if (data.success) {
        await supabase.from("notas_fiscais").insert({
          id: data.ref || genId(),
          ordem_id: ordem.id,
          numero: data.numero,
          chave: data.chave,
          ref: data.ref,
          status: "autorizado",
          valor: ordem.total || 0,
          destinatario: ordem.client?.empresa || "",
          cnpj_destinatario: ordem.client?.cnpj || "",
          data_emissao: new Date().toISOString(),
          url_danfe: data.url_danfe || "",
          url_xml: data.url_xml || "",
          vendedor: ordem.vendedor || "",
        });
      }
    } catch (e) {
      setNfeResult({ success: false, mensagem: e.message });
    }
    setEmitindoNfe(null);
  };

  const cancelarNfe = async (ref, justificativa) => {
    setCancelandoNfe("loading");
    try {
      const res = await fetch("/api/emitir-nfe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "cancelar", ref_cancelamento: ref, justificativa, ambiente: "producao" }),
      });
      const data = await res.json();
      setNfeResult(data.success ? { ...data, cancelado: true } : data);
      if (data.success) {
        await supabase.from("notas_fiscais").update({ status: "cancelado" }).eq("ref", ref);
      }
    } catch (e) {
      setNfeResult({ success: false, mensagem: e.message });
    }
    setCancelandoNfe(null);
    setCancelJustificativa("");
  };

  useEffect(() => {
    const loadAll = async () => {
      const { data } = await supabase.from("orcamentos").select("*").order("data", { ascending: false });
      if (data) {
        setAllOrders(data.map(o => ({
          id: o.id, date: o.data, total: o.total, frete: o.frete, comissao: o.comissao || 0, notes: o.notes, status: o.status, items: o.items,
          vendedor: o.vendedor_nome, vendedorId: o.vendedor_id,
          client: { empresa: o.cliente_empresa, cnpj: o.cliente_cnpj, responsavel: o.cliente_responsavel, telefone: o.cliente_telefone, email: o.cliente_email, endereco: o.cliente_endereco, numero: o.cliente_numero, bairro: o.cliente_bairro, cidade: o.cliente_cidade, estado: o.cliente_estado, cep: o.cliente_cep }
        })));
      }
    };
    loadAll();
  }, []);

  const vendedores = [...new Set(allOrders.map(o => o.vendedor))];
  const cidades = [...new Set(allOrders.map(o => o.client?.cidade).filter(Boolean))];

  const filtered = allOrders.filter(o => {
    if (filterVendedor !== "all" && o.vendedor !== filterVendedor) return false;
    if (filterCidade !== "all" && o.client?.cidade !== filterCidade) return false;
    if (filterDataDe) { const d = new Date(o.date); const de = new Date(filterDataDe); if (d < de) return false; }
    if (filterDataAte) { const d = new Date(o.date); const ate = new Date(filterDataAte + "T23:59:59"); if (d > ate) return false; }
    return true;
  });

  const totalGeral = filtered.reduce((s, o) => s + (o.total || 0), 0);
  const sc = { "Aguardando Retorno": "#3B82F6", "Desistiu": "#F87171", "Sem Retorno": "#8B5CF6", "Fechou Concorrência": "#34D399", "Concluído": "#10B981" };
  const sel = { padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none" };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 4px" }}>Painel Administrativo</h1>
      <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 20px", fontFamily: "'DM Sans', sans-serif" }}>Todos os orçamentos de todos os vendedores</p>

      {/* Stats Gerais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Total Orçamentos</div>
          <div style={{ color: COLORS.white, fontSize: 24, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{filtered.length}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Valor Total</div>
          <div style={{ color: COLORS.orange, fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalGeral)}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Aguardando Retorno</div>
          <div style={{ color: "#3B82F6", fontSize: 24, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{allOrders.filter(o => o.status === "Aguardando Retorno").length}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Concluídos</div>
          <div style={{ color: "#10B981", fontSize: 24, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{allOrders.filter(o => o.status === "Concluído").length}</div>
        </div>
      </div>

      {/* Relatório por Vendedor */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}` }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 18, margin: 0 }}>Relatório por Vendedor</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <th style={{ padding: "10px 14px", textAlign: "left", color: COLORS.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Vendedor</th>
                <th style={{ padding: "10px 14px", textAlign: "center", color: COLORS.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Realizados</th>
                <th style={{ padding: "10px 14px", textAlign: "center", color: "#3B82F6", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Aguardando</th>
                <th style={{ padding: "10px 14px", textAlign: "center", color: "#10B981", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Concluídos</th>
                <th style={{ padding: "10px 14px", textAlign: "center", color: "#F87171", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Desistiu</th>
                <th style={{ padding: "10px 14px", textAlign: "center", color: "#8B5CF6", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Sem Retorno</th>
                <th style={{ padding: "10px 14px", textAlign: "center", color: "#34D399", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Fechou Conc.</th>
                <th style={{ padding: "10px 14px", textAlign: "right", color: COLORS.orange, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {VENDEDORES.filter(v => !v.isAdmin).map(v => {
                const vo = allOrders.filter(o => o.vendedorId === v.id);
                return (
                  <tr key={v.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "12px 14px", color: COLORS.text, fontWeight: 600 }}>{v.name}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: COLORS.white, fontWeight: 700, fontSize: 14 }}>{vo.length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#3B82F6", fontWeight: 700 }}>{vo.filter(o => o.status === "Aguardando Retorno").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#10B981", fontWeight: 700 }}>{vo.filter(o => o.status === "Concluído").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#F87171", fontWeight: 700 }}>{vo.filter(o => o.status === "Desistiu").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#8B5CF6", fontWeight: 700 }}>{vo.filter(o => o.status === "Sem Retorno").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#34D399", fontWeight: 700 }}>{vo.filter(o => o.status === "Fechou Concorrência").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", color: COLORS.orange, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{fmt(vo.reduce((s, o) => s + (o.total || 0), 0))}</td>
                  </tr>
                );
              })}
              {/* Admin's own orders if any */}
              {(() => {
                const adminOrders = allOrders.filter(o => !VENDEDORES.filter(v => !v.isAdmin).some(v => v.id === o.vendedorId));
                if (adminOrders.length === 0) return null;
                return (
                  <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "12px 14px", color: COLORS.text, fontWeight: 600 }}>Alessandro Thonsen (ADM)</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: COLORS.white, fontWeight: 700, fontSize: 14 }}>{adminOrders.length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#3B82F6", fontWeight: 700 }}>{adminOrders.filter(o => o.status === "Aguardando Retorno").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#10B981", fontWeight: 700 }}>{adminOrders.filter(o => o.status === "Concluído").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#F87171", fontWeight: 700 }}>{adminOrders.filter(o => o.status === "Desistiu").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#8B5CF6", fontWeight: 700 }}>{adminOrders.filter(o => o.status === "Sem Retorno").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#34D399", fontWeight: 700 }}>{adminOrders.filter(o => o.status === "Fechou Concorrência").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", color: COLORS.orange, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{fmt(adminOrders.reduce((s, o) => s + (o.total || 0), 0))}</td>
                  </tr>
                );
              })()}
              <tr style={{ background: COLORS.bg }}>
                <td style={{ padding: "12px 14px", color: COLORS.white, fontWeight: 700 }}>TOTAL</td>
                <td style={{ padding: "12px 14px", textAlign: "center", color: COLORS.white, fontWeight: 800, fontSize: 14 }}>{allOrders.length}</td>
                <td style={{ padding: "12px 14px", textAlign: "center", color: "#3B82F6", fontWeight: 800 }}>{allOrders.filter(o => o.status === "Aguardando Retorno").length}</td>
                <td style={{ padding: "12px 14px", textAlign: "center", color: "#10B981", fontWeight: 800 }}>{allOrders.filter(o => o.status === "Concluído").length}</td>
                <td style={{ padding: "12px 14px", textAlign: "center", color: "#F87171", fontWeight: 800 }}>{allOrders.filter(o => o.status === "Desistiu").length}</td>
                <td style={{ padding: "12px 14px", textAlign: "center", color: "#8B5CF6", fontWeight: 800 }}>{allOrders.filter(o => o.status === "Sem Retorno").length}</td>
                <td style={{ padding: "12px 14px", textAlign: "center", color: "#34D399", fontWeight: 800 }}>{allOrders.filter(o => o.status === "Fechou Concorrência").length}</td>
                <td style={{ padding: "12px 14px", textAlign: "right", color: COLORS.orange, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalGeral)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, marginBottom: 16, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Filtros:</span>
        <select value={filterVendedor} onChange={e => setFilterVendedor(e.target.value)} style={sel}>
          <option value="all">Todos os vendedores</option>
          {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={filterCidade} onChange={e => setFilterCidade(e.target.value)} style={sel}>
          <option value="all">Todas as cidades</option>
          {cidades.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>De:</span>
        <input type="date" value={filterDataDe} onChange={e => setFilterDataDe(e.target.value)} style={sel} />
        <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Até:</span>
        <input type="date" value={filterDataAte} onChange={e => setFilterDataAte(e.target.value)} style={sel} />
        {(filterVendedor !== "all" || filterCidade !== "all" || filterDataDe || filterDataAte) && (
          <button onClick={() => { setFilterVendedor("all"); setFilterCidade("all"); setFilterDataDe(""); setFilterDataAte(""); }} style={{ background: "transparent", border: `1px solid ${COLORS.danger}`, color: COLORS.danger, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Limpar filtros</button>
        )}
      </div>

      {/* Modal Cancelar NF-e */}
      {cancelandoNfe && cancelandoNfe !== "loading" && !nfeResult && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 420, maxWidth: "100%" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.danger, fontSize: 18, margin: "0 0 12px" }}>Cancelar NF-e</h2>
            <p style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: "0 0 14px" }}>Informe a referência da NF-e e o motivo do cancelamento. O cancelamento só é possível em até 24 horas após a emissão.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" }}>Referência da NF-e (ref) *</div>
                <input value={cancelRef || ""} onChange={e => setCancelRef(e.target.value)} placeholder="Ex: nfe_1775945919881" style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" }}>Justificativa (mín. 15 caracteres) *</div>
                <input value={cancelJustificativa} onChange={e => setCancelJustificativa(e.target.value)} placeholder="Motivo do cancelamento..." style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => { setCancelandoNfe(null); setCancelRef(""); setCancelJustificativa(""); }} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Voltar</button>
                <button onClick={() => cancelarNfe(cancelRef, cancelJustificativa)} disabled={!cancelRef || cancelJustificativa.length < 15} style={{ flex: 1, background: !cancelRef || cancelJustificativa.length < 15 ? COLORS.textDim : COLORS.danger, color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: !cancelRef || cancelJustificativa.length < 15 ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancelar NF-e</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação Emitir NF */}
      {confirmEmitir && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 420, maxWidth: "100%" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#F59E0B", fontSize: 18, margin: "0 0 12px" }}>⚠️ Confirmar Emissão de NF-e</h2>
            <p style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: "0 0 14px" }}>Esta ação irá emitir uma <strong style={{ color: COLORS.danger }}>Nota Fiscal REAL</strong> na SEFAZ com valor fiscal. Não pode ser desfeita (apenas cancelada em até 24h).</p>
            <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
              <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 600 }}>{confirmEmitir.client?.empresa}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 11 }}>CNPJ: {confirmEmitir.client?.cnpj} | {confirmEmitir.client?.cidade}/{confirmEmitir.client?.estado}</div>
              <div style={{ color: COLORS.orange, fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif", marginTop: 4 }}>{fmt(confirmEmitir.total)}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmEmitir(null)} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
              <button onClick={() => emitirNfe(confirmEmitir)} style={{ flex: 1, background: "#10B981", color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Sim, Emitir NF-e</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resultado NF-e */}
      {nfeResult && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 420, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: nfeResult.cancelado ? "#F59E0B" : nfeResult.success ? "#10B981" : COLORS.danger, fontSize: 18, margin: "0 0 12px" }}>{nfeResult.cancelado ? "✓ NF-e Cancelada" : nfeResult.success ? "✓ NF-e Emitida com Sucesso!" : "✕ Erro na Emissão"}</h2>
            {nfeResult.success ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {nfeResult.numero && <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ color: COLORS.textMuted, fontSize: 10 }}>Número</div>
                  <div style={{ color: COLORS.white, fontSize: 14, fontWeight: 700 }}>{nfeResult.numero}</div>
                </div>}
                {nfeResult.chave && <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ color: COLORS.textMuted, fontSize: 10 }}>Chave de Acesso</div>
                  <div style={{ color: COLORS.text, fontSize: 10, wordBreak: "break-all" }}>{nfeResult.chave}</div>
                </div>}
                <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ color: COLORS.textMuted, fontSize: 10 }}>Status</div>
                  <div style={{ color: "#10B981", fontSize: 13, fontWeight: 700 }}>{nfeResult.status}</div>
                </div>
                {nfeResult.url_danfe && (
                  <a href={nfeResult.url_danfe} target="_blank" rel="noopener noreferrer" style={{ background: "#10B981", color: "#fff", padding: "10px", borderRadius: 8, textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>📄 Baixar DANFE (PDF)</a>
                )}
                {nfeResult.url_xml && (
                  <a href={nfeResult.url_xml} target="_blank" rel="noopener noreferrer" style={{ background: "#3B82F615", border: "1px solid #3B82F640", color: "#3B82F6", padding: "10px", borderRadius: 8, textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>📋 Baixar XML</a>
                )}
                {nfeResult.ref && !nfeResult.cancelado && (
                  <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 10, marginTop: 4 }}>
                    {cancelandoNfe === "loading" ? (
                      <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 12 }}>Cancelando...</div>
                    ) : cancelandoNfe === nfeResult.ref ? (
                      <div>
                        <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, textTransform: "uppercase" }}>Justificativa do cancelamento (mín. 15 caracteres)</div>
                        <input value={cancelJustificativa} onChange={e => setCancelJustificativa(e.target.value)} placeholder="Motivo do cancelamento..." style={{ width: "100%", padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setCancelandoNfe(null)} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "8px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Voltar</button>
                          <button onClick={() => cancelarNfe(nfeResult.ref, cancelJustificativa)} disabled={cancelJustificativa.length < 15} style={{ flex: 1, background: cancelJustificativa.length < 15 ? COLORS.textDim : COLORS.danger, color: "#fff", border: "none", padding: "8px", borderRadius: 7, fontWeight: 700, cursor: cancelJustificativa.length < 15 ? "not-allowed" : "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Confirmar Cancelamento</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setCancelandoNfe(nfeResult.ref)} style={{ width: "100%", background: COLORS.danger + "10", border: `1px solid ${COLORS.danger}30`, color: COLORS.danger, padding: "8px", borderRadius: 7, fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Cancelar NF-e (até 24h)</button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: COLORS.danger + "10", border: `1px solid ${COLORS.danger}30`, borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: COLORS.danger, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{nfeResult.mensagem || "Erro desconhecido"}</div>
                {nfeResult.erros && <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'DM Sans', sans-serif", marginTop: 8, whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto" }}>{JSON.stringify(nfeResult.erros, null, 2)}</div>}
              </div>
            )}
            <button onClick={() => { setNfeResult(null); setCancelandoNfe(null); setCancelJustificativa(""); }} style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 12 }}>Fechar</button>
          </div>
        </div>
      )}

      {/* Relatório Vendas Concluídas por Mês */}
      {(() => {
        const concluidos = allOrders.filter(o => o.status === "Concluído");
        const meses = [...new Set(concluidos.map(o => { const d = new Date(o.date); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }))].sort().reverse();
        const mesNomes = { "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril", "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };
        const activeMes = mesSel || meses[0] || "";

        const updateVendaStatus = async (orderId, newSt) => {
          setVendaStatus(prev => ({ ...prev, [orderId]: newSt }));
          const existingNotes = allOrders.find(o => o.id === orderId)?.notes || "";
          const cleanNotes = existingNotes.replace(/\n🏷️ Status venda:.*$/m, "");
          await supabase.from("orcamentos").update({ notes: cleanNotes + "\n🏷️ Status venda: " + newSt }).eq("id", orderId);
        };

        const getVendaStatus = (o) => {
          if (vendaStatus[o.id]) return vendaStatus[o.id];
          const match = (o.notes || "").match(/🏷️ Status venda: (.+)$/m);
          return match ? match[1] : "Em Aberto";
        };

        const mesConcluidos = concluidos.filter(o => { const d = new Date(o.date); return (d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")) === activeMes; });
        const totalMes = mesConcluidos.reduce((s, o) => s + (o.total || 0), 0);
        const vstSc = { "Em Aberto": "#F59E0B", "Pago": "#10B981", "Gerar NF": "#3B82F6", "Concluído": "#8B5CF6" };

        return concluidos.length > 0 ? (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#10B981", fontSize: 18, margin: 0 }}>Vendas Concluídas</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <select value={activeMes} onChange={e => setMesSel(e.target.value)} style={{ padding: "6px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
                  {meses.map(m => <option key={m} value={m}>{mesNomes[m.split("-")[1]]} {m.split("-")[0]}</option>)}
                </select>
                <span style={{ color: COLORS.orange, fontSize: 14, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{fmt(totalMes)}</span>
              </div>
            </div>
            {mesConcluidos.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Nenhuma venda concluída neste mês</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Empresa</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>CNPJ</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Cidade</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Valor Total</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", color: "#10B981", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Lucro/Comissão</th>
                      <th style={{ padding: "10px 12px", textAlign: "left", color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Vendedor</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>NF-e</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mesConcluidos.map(o => {
                      const vs = getVendaStatus(o);
                      return (
                        <tr key={o.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                          <td style={{ padding: "10px 12px", color: COLORS.text, fontWeight: 500 }}>{o.client?.empresa || "-"}</td>
                          <td style={{ padding: "10px 12px", color: COLORS.textMuted }}>{o.client?.cnpj || "-"}</td>
                          <td style={{ padding: "10px 12px", color: COLORS.textMuted }}>{o.client?.cidade || "-"}{o.client?.estado ? "/" + o.client.estado : ""}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: COLORS.orange, fontWeight: 700 }}>{fmt(o.total || 0)}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "#10B981", fontWeight: 700 }}>{fmt(o.comissao || 0)}</td>
                          <td style={{ padding: "10px 12px", color: COLORS.accent, fontWeight: 500 }}>{o.vendedor || "-"}</td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <select value={vs} onChange={e => updateVendaStatus(o.id, e.target.value)} style={{ background: (vstSc[vs] || "#888") + "20", color: vstSc[vs] || "#888", border: `1px solid ${(vstSc[vs] || "#888")}40`, padding: "3px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", outline: "none" }}>
                              <option value="Em Aberto">Em Aberto</option>
                              <option value="Pago">Pago</option>
                              <option value="Gerar NF">Gerar NF</option>
                              <option value="Concluído">Concluído</option>
                            </select>
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                              {emitindoNfe === o.id ? (
                                <span style={{ color: COLORS.textMuted, fontSize: 9 }}>Emitindo...</span>
                              ) : (
                                <button onClick={() => setConfirmEmitir(o)} style={{ background: "#10B98115", border: "1px solid #10B98140", color: "#10B981", padding: "3px 6px", borderRadius: 6, fontSize: 8, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>Emitir</button>
                              )}
                              <button onClick={() => setCancelandoNfe(o.id)} style={{ background: COLORS.danger + "10", border: `1px solid ${COLORS.danger}30`, color: COLORS.danger, padding: "3px 6px", borderRadius: 6, fontSize: 8, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>Cancelar</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null;
      })()}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📂</div>
          <p style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Nenhum orçamento encontrado</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(o => (
            <div key={o.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div onClick={() => setExpanded(expanded === o.id ? null : o.id)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>#{o.id.slice(0, 6).toUpperCase()} · {new Date(o.date).toLocaleDateString("pt-BR")} · {o.items?.length || 0} itens</div>
                  <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{o.client?.empresa || "Sem empresa"}</div>
                  <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Vendedor: <strong style={{ color: COLORS.accent }}>{o.vendedor}</strong>{o.client?.cidade ? " · " + o.client.cidade + (o.client.estado ? "/" + o.client.estado : "") : ""}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ background: sc[o.status] || sc["Aguardando Retorno"], color: "#000", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{o.status || "Aguardando Retorno"}</span>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: COLORS.orange, marginTop: 4 }}>{fmt(o.total || 0)}</div>
                  </div>
                  <button onClick={async (e) => { e.stopPropagation(); if (window.confirm("Excluir este orçamento?")) { await supabase.from("orcamentos").delete().eq("id", o.id); setAllOrders(allOrders.filter(x => x.id !== o.id)); }}} style={{ background: COLORS.danger + "15", border: `1px solid ${COLORS.danger}30`, color: COLORS.danger, padding: "8px", borderRadius: 7, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>🗑️</button>
                </div>
              </div>
              {expanded === o.id && (
                <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "12px 16px" }}>
                  {o.client?.responsavel && <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Responsável: <strong style={{ color: COLORS.text }}>{o.client.responsavel}</strong></div>}
                  {o.client?.telefone && <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Tel: {o.client.telefone}</div>}
                  {o.client?.email && <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>E-mail: {o.client.email}</div>}
                  {o.client?.endereco && <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>End: {o.client.endereco}{o.client.bairro ? ", " + o.client.bairro : ""} — {o.client.cidade}{o.client.estado ? "/" + o.client.estado : ""}</div>}
                  {o.frete > 0 && <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>Frete: {fmt(o.frete)}</div>}
                  {o.notes && <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 8, fontStyle: "italic" }}>Obs: {o.notes}</div>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(o.items || []).map((it, j) => (
                      <div key={j} style={{ background: COLORS.bg, borderRadius: 6, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{it.name}</div>
                          <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{it.cat} · Qtd: {it.qty}</div>
                        </div>
                        <span style={{ color: COLORS.orange, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{fmt(it.total)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    {confirmDel === o.id ? (
                      <>
                        <span style={{ color: COLORS.danger, fontSize: 12, fontFamily: "'DM Sans', sans-serif", alignSelf: "center" }}>Tem certeza?</span>
                        <button onClick={async (e) => { e.stopPropagation(); await supabase.from("orcamentos").delete().eq("id", o.id); setAllOrders(allOrders.filter(x => x.id !== o.id)); setConfirmDel(null); setExpanded(null); }} style={{ background: COLORS.danger, border: "none", color: "#fff", padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Sim, excluir</button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDel(null); }} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                      </>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDel(o.id); }} style={{ background: COLORS.danger + "10", border: `1px solid ${COLORS.danger}30`, color: COLORS.danger, padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>🗑️ Excluir orçamento</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── GRÁFICOS ───
function GaugeChart({ value, max, name, color }) {
  const pct = Math.min(value / max, 1);
  const angle = pct * 180;
  const r = 90;
  const cx = 100;
  const cy = 100;
  const rad = (a) => (a - 180) * Math.PI / 180;
  const arcX = (a) => cx + r * Math.cos(rad(a));
  const arcY = (a) => cy + r * Math.sin(rad(a));
  const needleX = cx + (r - 15) * Math.cos(rad(angle));
  const needleY = cy + (r - 15) * Math.sin(rad(angle));
  const pctLabel = Math.round(pct * 100);

  const zones = [
    { start: 0, end: 45, color: "#F87171" },
    { start: 45, end: 90, color: "#F59E0B" },
    { start: 90, end: 135, color: "#3B82F6" },
    { start: 135, end: 180, color: "#10B981" },
  ];

  const arcPath = (startA, endA, radius) => {
    const x1 = cx + radius * Math.cos(rad(startA));
    const y1 = cy + radius * Math.sin(rad(startA));
    const x2 = cx + radius * Math.cos(rad(endA));
    const y2 = cy + radius * Math.sin(rad(endA));
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  };

  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "20px 16px 14px", textAlign: "center" }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", color: COLORS.text, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{name}</div>
      <svg viewBox="0 0 200 120" style={{ width: "100%", maxWidth: 240 }}>
        {/* Background arc */}
        <path d={arcPath(0, 180, r)} fill="none" stroke={COLORS.border} strokeWidth="18" strokeLinecap="round" />
        {/* Colored zones */}
        {zones.map((z, i) => (
          <path key={i} d={arcPath(z.start, z.end, r)} fill="none" stroke={z.color} strokeWidth="18" strokeLinecap="butt" opacity="0.3" />
        ))}
        {/* Active arc */}
        {angle > 0 && <path d={arcPath(0, Math.min(angle, 180), r)} fill="none" stroke={color} strokeWidth="18" strokeLinecap="round" />}
        {/* Zone labels */}
        <text x={cx + r * Math.cos(rad(0)) - 5} y={cy + r * Math.sin(rad(0)) + 14} fill={COLORS.textDim} fontSize="7" fontFamily="DM Sans" textAnchor="end">R$0</text>
        <text x={cx + r * Math.cos(rad(45))} y={cy + r * Math.sin(rad(45)) - 4} fill={COLORS.textDim} fontSize="6" fontFamily="DM Sans" textAnchor="middle">25%</text>
        <text x={cx + r * Math.cos(rad(90))} y={cy + r * Math.sin(rad(90)) - 6} fill={COLORS.textDim} fontSize="6" fontFamily="DM Sans" textAnchor="middle">50%</text>
        <text x={cx + r * Math.cos(rad(135))} y={cy + r * Math.sin(rad(135)) - 4} fill={COLORS.textDim} fontSize="6" fontFamily="DM Sans" textAnchor="middle">75%</text>
        <text x={cx + r * Math.cos(rad(180)) + 5} y={cy + r * Math.sin(rad(180)) + 14} fill={COLORS.textDim} fontSize="7" fontFamily="DM Sans" textAnchor="start">100%</text>
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill={color} />
        <circle cx={cx} cy={cy} r="2.5" fill={COLORS.bg} />
        {/* Value */}
        <text x={cx} y={cy + 16} fill={color} fontSize="12" fontWeight="800" fontFamily="Playfair Display" textAnchor="middle">
          {value >= 1000 ? (value / 1000).toFixed(1) + "k" : value.toFixed(0)}
        </text>
      </svg>
      <div style={{ fontFamily: "'Playfair Display', serif", color: color, fontSize: 18, fontWeight: 800, marginTop: 4 }}>{fmt(value)}</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", color: COLORS.textDim, fontSize: 10, marginTop: 2 }}>Meta: {fmt(max)} · {pctLabel}% atingido</div>
      <div style={{ marginTop: 8, height: 4, background: COLORS.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: pctLabel + "%", height: "100%", background: color, borderRadius: 2, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

function GraficosPage() {
  const [allOrders, setAllOrders] = useState([]);
  const [mesSel, setMesSel] = useState("");
  const META = 100000;

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("orcamentos").select("*").eq("status", "Concluído").order("data", { ascending: false });
      if (data) {
        setAllOrders(data.map(o => ({
          id: o.id, date: o.data, total: o.total || 0, vendedor: o.vendedor_nome, vendedorId: o.vendedor_id
        })));
      }
    };
    load();
  }, []);

  const meses = [...new Set(allOrders.map(o => { const d = new Date(o.date); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }))].sort().reverse();
  const mesNomes = { "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril", "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };
  const activeMes = mesSel || meses[0] || "";
  const cores = { v1: "#F5A623", v2: "#3B82F6", v3: "#10B981" };

  const SELLERS = VENDEDORES.filter(v => v.id === "v1" || v.id === "v2" || v.id === "v3");

  const vendedoresData = SELLERS.map(v => {
    const vendasMes = allOrders.filter(o => {
      const d = new Date(o.date);
      return o.vendedorId === v.id && (d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")) === activeMes;
    });
    return { ...v, totalMes: vendasMes.reduce((s, o) => s + o.total, 0), qtdVendas: vendasMes.length };
  });

  const totalEquipe = vendedoresData.reduce((s, v) => s + v.totalMes, 0);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 4px" }}>Gráficos de Vendas</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Acompanhamento de metas por vendedor</p>
        </div>
        <select value={activeMes} onChange={e => setMesSel(e.target.value)} style={{ padding: "8px 16px", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
          {meses.length === 0 && <option value="">Sem dados</option>}
          {meses.map(m => <option key={m} value={m}>{mesNomes[m.split("-")[1]]} {m.split("-")[0]}</option>)}
        </select>
      </div>

      {/* Meta da equipe */}
      <div style={{ background: `linear-gradient(135deg, ${COLORS.orange}12, ${COLORS.orange}06)`, border: `1px solid ${COLORS.orange}30`, borderRadius: 14, padding: "20px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>Total da Equipe</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: COLORS.orange }}>{fmt(totalEquipe)}</div>
          <div style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Meta equipe: {fmt(META * SELLERS.length)} · {Math.round(totalEquipe / (META * SELLERS.length) * 100)}%</div>
        </div>
        <div style={{ width: 200 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: COLORS.textDim, fontSize: 10 }}>0%</span>
            <span style={{ color: COLORS.textDim, fontSize: 10 }}>100%</span>
          </div>
          <div style={{ height: 10, background: COLORS.border, borderRadius: 5, overflow: "hidden" }}>
            <div style={{ width: Math.min(totalEquipe / (META * SELLERS.length) * 100, 100) + "%", height: "100%", background: `linear-gradient(90deg, #F87171, #F59E0B, #10B981)`, borderRadius: 5, transition: "width 0.5s" }} />
          </div>
        </div>
      </div>

      {/* Velocímetro Geral - Gôndolas Suprema */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 18, margin: "0 0 14px", textAlign: "center" }}>Resultado Geral — Gôndolas Suprema</h2>
        <div style={{ maxWidth: 320, margin: "0 auto" }}>
          <GaugeChart name="Gôndolas Suprema" value={totalEquipe} max={META * SELLERS.length} color={COLORS.orange} />
        </div>
      </div>

      {/* Velocímetros por vendedor */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {vendedoresData.map((v, i) => (
          <GaugeChart key={v.id} name={v.name} value={v.totalMes} max={META} color={Object.values(cores)[i] || COLORS.orange} />
        ))}
      </div>

      {/* Ranking */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, marginTop: 20, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}` }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 16, margin: 0 }}>Ranking do Mês</h2>
        </div>
        {[...vendedoresData].sort((a, b) => b.totalMes - a.totalMes).map((v, i) => (
          <div key={v.id} style={{ padding: "12px 18px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
              <div>
                <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{v.name}</div>
                <div style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{v.qtdVendas} venda(s) concluída(s)</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: COLORS.orange }}>{fmt(v.totalMes)}</div>
              <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{Math.round(v.totalMes / META * 100)}% da meta</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FINANCEIRO ───
const DESPESAS_FIXAS = [
  "Salário João", "Salário Gaúcho", "S.A", "Internet Fixa", "Seguro HR",
  "Sistema", "Aluguel Barracão", "Carro HR", "Contabilidade", "INSS", "SIMPLES", "FGTS"
];

function FinanceiroPage() {
  const [subTab, setSubTab] = useState("fixas");
  const [despesas, setDespesas] = useState([]);
  const [mesSel, setMesSel] = useState(() => { const n = new Date(); return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0"); });
  const [novaDespesa, setNovaDespesa] = useState("");
  const [showAddVar, setShowAddVar] = useState(false);
  const [varForm, setVarForm] = useState({ categoria: "", socio: "", vencimento_dia: "", vencimento_mes: "", valor: "" });
  const [fornecedores, setFornecedores] = useState([]);
  const [showAddForn, setShowAddForn] = useState("");
  const [fornForm, setFornForm] = useState({ data: "", pedido: "", parcela: "", valor: "" });
  const [gondForm, setGondForm] = useState({ documento: "", pagador: "", dia: "", mes: "", qtdParcelas: "1", valor: "" });
  const [mdfForm, setMdfForm] = useState({ dia: "", mes: "", qtd: "", valor: "" });
  const [outrosForm, setOutrosForm] = useState({ dia: "", mes: "", fornecedor: "", valor: "" });
  const [loading, setLoading] = useState(true);

  const mesNomes = { "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril", "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };

  const carregarDespesas = async (mes) => {
    setLoading(true);
    const { data } = await supabase.from("despesas").select("*").eq("mes", mes).order("nome");
    if (data && data.length > 0) {
      setDespesas(data);
    } else {
      const novas = DESPESAS_FIXAS.map(nome => ({
        id: genId(), nome, vencimento: null, valor: 0, status: "Em Aberto", mes, fixa: true
      }));
      for (const d of novas) { await supabase.from("despesas").insert(d); }
      setDespesas(novas);
    }
    setLoading(false);
  };

  const carregarFornecedores = async () => {
    const { data } = await supabase.from("despesas").select("*").like("nome", "forn_%").order("vencimento");
    if (data) setFornecedores(data);
  };

  useEffect(() => { carregarDespesas(mesSel); carregarFornecedores(); }, [mesSel]);

  const atualizarDespesa = async (id, campo, valor) => {
    const update = {}; update[campo] = valor;
    await supabase.from("despesas").update(update).eq("id", id);
    setDespesas(despesas.map(d => d.id === id ? { ...d, [campo]: valor } : d));
  };

  const adicionarDespesa = async (fixa) => {
    if (fixa) {
      if (!novaDespesa.trim()) return;
      const nova = { id: genId(), nome: novaDespesa.trim(), vencimento: null, valor: 0, status: "Em Aberto", mes: mesSel, fixa: true };
      await supabase.from("despesas").insert(nova);
      setDespesas([...despesas, nova]);
      setNovaDespesa("");
    }
  };

  const adicionarVariavel = async () => {
    const vf = varForm;
    if (!vf.categoria) return;
    const nome = vf.categoria === "Pagamento Socios" ? "Pgto Sócio — " + vf.socio : vf.categoria;
    const y = mesSel.split("-")[0];
    const m = vf.vencimento_mes || mesSel.split("-")[1];
    const d = vf.vencimento_dia || "01";
    const venc = y + "-" + m + "-" + d;
    const nova = { id: genId(), nome, vencimento: venc, valor: Number(vf.valor) || 0, status: "Em Aberto", mes: mesSel, fixa: false };
    await supabase.from("despesas").insert(nova);
    setDespesas([...despesas, nova]);
    setVarForm({ categoria: "", socio: "", vencimento_dia: "", vencimento_mes: "", valor: "" });
    setShowAddVar(false);
  };

  const adicionarFornecedor = async (tipo) => {
    const ff = fornForm;
    if (!ff.valor) return;
    const y = mesSel.split("-")[0];
    const dia = ff.data || "01";
    const mes = mesSel.split("-")[1];
    const venc = y + "-" + mes + "-" + String(dia).padStart(2, "0");
    const nova = { id: genId(), nome: "forn_" + tipo, vencimento: venc, valor: Number(ff.valor) || 0, status: "Em Aberto", mes: mesSel, fixa: false };
    // Store pedido and parcela in notes-like approach using nome
    if (ff.pedido || ff.parcela) {
      nova.nome = "forn_" + tipo + "|" + (ff.pedido || "") + "|" + (ff.parcela || "");
    }
    await supabase.from("despesas").insert(nova);
    setFornecedores([...fornecedores, nova]);
    setFornForm({ data: "", pedido: "", parcela: "", valor: "" });
    setShowAddForn("");
  };

  const excluirFornecedor = async (id) => {
    await supabase.from("despesas").delete().eq("id", id);
    setFornecedores(fornecedores.filter(f => f.id !== id));
  };

  const atualizarFornecedor = async (id, campo, valor) => {
    const update = {}; update[campo] = valor;
    await supabase.from("despesas").update(update).eq("id", id);
    setFornecedores(fornecedores.map(f => f.id === id ? { ...f, [campo]: valor } : f));
  };

  const adicionarMdf = async () => {
    const mf = mdfForm;
    if (!mf.dia || !mf.mes || !mf.valor) return;
    const y = mesSel.split("-")[0];
    const venc = y + "-" + mf.mes + "-" + mf.dia;
    const mesKey = y + "-" + mf.mes;
    const nova = { id: genId(), nome: "forn_mdf||" + (mf.qtd || "1") + "|", vencimento: venc, valor: Number(mf.valor) || 0, status: "Em Aberto", mes: mesKey, fixa: false };
    await supabase.from("despesas").insert(nova);
    setFornecedores([...fornecedores, nova]);
    setMdfForm({ dia: "", mes: "", qtd: "", valor: "" });
    setShowAddForn("");
  };

  const adicionarOutros = async () => {
    const of2 = outrosForm;
    if (!of2.dia || !of2.mes || !of2.fornecedor || !of2.valor) return;
    const y = mesSel.split("-")[0];
    const venc = y + "-" + of2.mes + "-" + of2.dia;
    const mesKey = y + "-" + of2.mes;
    const nova = { id: genId(), nome: "forn_outros|" + of2.fornecedor + "||", vencimento: venc, valor: Number(of2.valor) || 0, status: "Em Aberto", mes: mesKey, fixa: false };
    await supabase.from("despesas").insert(nova);
    setFornecedores([...fornecedores, nova]);
    setOutrosForm({ dia: "", mes: "", fornecedor: "", valor: "" });
    setShowAddForn("");
  };

  const adicionarGondolas = async () => {
    const gf = gondForm;
    if (!gf.documento || !gf.dia || !gf.mes || !gf.valor) return;
    const qtd = Number(gf.qtdParcelas) || 1;
    const val = Number(gf.valor) || 0;
    const y = Number(mesSel.split("-")[0]);
    const m = Number(gf.mes);
    const d = gf.dia;
    const novas = [];
    for (let i = 0; i < qtd; i++) {
      let mesAtual = m + i;
      let anoAtual = y;
      while (mesAtual > 12) { mesAtual -= 12; anoAtual++; }
      const mesStr = String(mesAtual).padStart(2, "0");
      const venc = anoAtual + "-" + mesStr + "-" + d;
      const mesKey = anoAtual + "-" + mesStr;
      const nova = {
        id: genId(),
        nome: "forn_gondolas|" + gf.documento + "|" + (i + 1) + "/" + qtd + "|" + (gf.pagador || ""),
        vencimento: venc,
        valor: val,
        status: "Em Aberto",
        mes: mesKey,
        fixa: false
      };
      novas.push(nova);
      await supabase.from("despesas").insert(nova);
    }
    setFornecedores([...fornecedores, ...novas]);
    setGondForm({ documento: "", pagador: "", dia: "", mes: "", qtdParcelas: "1", valor: "" });
    setShowAddForn("");
  };

  const excluirDespesa = async (id) => {
    await supabase.from("despesas").delete().eq("id", id);
    setDespesas(despesas.filter(d => d.id !== id));
  };

  const hoje = new Date().toISOString().split("T")[0];
  const fixas = despesas.filter(d => d.fixa);
  const variaveis = despesas.filter(d => !d.fixa);
  const current = subTab === "fixas" ? fixas : variaveis;
  const totalFixas = fixas.reduce((s, d) => s + (d.valor || 0), 0);
  const totalVar = variaveis.reduce((s, d) => s + (d.valor || 0), 0);
  const totalMes = totalFixas + totalVar;
  const totalPago = despesas.filter(d => d.status === "Pago").reduce((s, d) => s + (d.valor || 0), 0);
  const totalAberto = totalMes - totalPago;

  const getSituacao = (d) => {
    if (d.status === "Pago") return { label: "Pago", color: "#10B981" };
    if (!d.vencimento) return { label: "Sem data", color: "#888" };
    if (d.vencimento < hoje) return { label: "Vencida", color: "#F87171" };
    if (d.vencimento === hoje) return { label: "Vence hoje", color: "#F59E0B" };
    return { label: "A vencer", color: "#3B82F6" };
  };

  const inp = { padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };

  const renderTabela = (items, isFixa) => (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <th style={{ padding: "6px 8px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Despesa</th>
            <th style={{ padding: "6px 8px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Venc.</th>
            <th style={{ padding: "6px 8px", textAlign: "right", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Valor</th>
            <th style={{ padding: "6px 8px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Sit.</th>
            <th style={{ padding: "6px 8px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Status</th>
            <th style={{ padding: "6px 4px", width: 20 }}></th>
          </tr>
        </thead>
        <tbody>
          {[...items].sort((a, b) => {
            if (!a.vencimento && !b.vencimento) return 0;
            if (!a.vencimento) return 1;
            if (!b.vencimento) return -1;
            return a.vencimento.localeCompare(b.vencimento);
          }).map(d => {
            const sit = getSituacao(d);
            return (
              <tr key={d.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: "6px 8px" }}>
                  <input value={d.nome} onChange={e => atualizarDespesa(d.id, "nome", e.target.value)} style={{ ...inp, width: "100%", padding: "4px 6px", fontSize: 11, fontWeight: 500, color: COLORS.text, border: "1px solid transparent" }} onFocus={e => e.target.style.borderColor = COLORS.border} onBlur={e => e.target.style.borderColor = "transparent"} />
                </td>
                <td style={{ padding: "4px 4px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                    <select value={d.vencimento ? d.vencimento.split("-")[2] : ""} onChange={e => { const m = d.vencimento ? d.vencimento.split("-")[1] : mesSel.split("-")[1]; const y = mesSel.split("-")[0]; atualizarDespesa(d.id, "vencimento", y + "-" + m + "-" + e.target.value); }} style={{ ...inp, width: 42, padding: "4px 2px", fontSize: 10 }}>
                      <option value="">--</option>
                      {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{i + 1}</option>)}
                    </select>
                    <select value={d.vencimento ? d.vencimento.split("-")[1] : ""} onChange={e => { const dia = d.vencimento ? d.vencimento.split("-")[2] : "01"; const y = mesSel.split("-")[0]; atualizarDespesa(d.id, "vencimento", y + "-" + e.target.value + "-" + dia); }} style={{ ...inp, width: 50, padding: "4px 2px", fontSize: 10 }}>
                      <option value="">--</option>
                      <option value="01">Jan</option><option value="02">Fev</option><option value="03">Mar</option><option value="04">Abr</option><option value="05">Mai</option><option value="06">Jun</option><option value="07">Jul</option><option value="08">Ago</option><option value="09">Set</option><option value="10">Out</option><option value="11">Nov</option><option value="12">Dez</option>
                    </select>
                  </div>
                </td>
                <td style={{ padding: "4px 8px", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                    <span style={{ color: COLORS.textDim, fontSize: 10 }}>R$</span>
                    <input type="number" min="0" step="0.01" value={d.valor || ""} onChange={e => atualizarDespesa(d.id, "valor", Number(e.target.value) || 0)} placeholder="0,00" style={{ ...inp, width: 95, textAlign: "right", color: COLORS.orange, fontWeight: 700, padding: "4px 6px", fontSize: 11 }} />
                  </div>
                </td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>
                  <span style={{ background: sit.color + "20", color: sit.color, padding: "2px 6px", borderRadius: 10, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>{sit.label}</span>
                </td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>
                  <select value={d.status} onChange={e => atualizarDespesa(d.id, "status", e.target.value)} style={{ background: d.status === "Pago" ? "#10B98120" : "#F59E0B20", color: d.status === "Pago" ? "#10B981" : "#F59E0B", border: `1px solid ${d.status === "Pago" ? "#10B98140" : "#F59E0B40"}`, padding: "2px 6px", borderRadius: 10, fontSize: 9, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", outline: "none" }}>
                    <option value="Em Aberto">Aberto</option>
                    <option value="Pago">Pago</option>
                  </select>
                </td>
                <td style={{ padding: "4px 2px", textAlign: "center" }}>
                  <button onClick={() => excluirDespesa(d.id)} style={{ background: "transparent", border: "none", color: COLORS.danger, cursor: "pointer", fontSize: 12, lineHeight: 1, padding: 0 }}>✕</button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: COLORS.bg }}>
            <td style={{ padding: "8px", color: COLORS.white, fontWeight: 700, fontSize: 11 }}>SUBTOTAL</td>
            <td></td>
            <td style={{ padding: "8px", textAlign: "right", color: COLORS.orange, fontWeight: 800, fontFamily: "'Playfair Display', serif", fontSize: 13 }}>{fmt(items.reduce((s, d) => s + (d.valor || 0), 0))}</td>
            <td></td><td></td><td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 4px" }}>Financeiro</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Contas a pagar do mês</p>
        </div>
        <select value={mesSel} onChange={e => setMesSel(e.target.value)} style={{ padding: "8px 16px", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date(); d.setMonth(d.getMonth() - 6 + i);
            const v = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
            return <option key={v} value={v}>{mesNomes[String(d.getMonth() + 1).padStart(2, "0")]} {d.getFullYear()}</option>;
          })}
        </select>
      </div>

      {/* Cards resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>Total Geral</div>
          <div style={{ color: COLORS.orange, fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalMes)}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>Fixas: {fmt(totalFixas)}</div>
          <div style={{ color: COLORS.textMuted, fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>Variáveis: {fmt(totalVar)}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>Pago</div>
          <div style={{ color: "#10B981", fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalPago)}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>Aberto</div>
          <div style={{ color: "#F87171", fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalAberto)}</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        <button onClick={() => setSubTab("fixas")} style={{ background: subTab === "fixas" ? COLORS.orange + "20" : COLORS.card, color: subTab === "fixas" ? COLORS.orange : COLORS.textMuted, border: `1px solid ${subTab === "fixas" ? COLORS.orange + "40" : COLORS.border}`, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Fixas ({fixas.length})</button>
        <button onClick={() => setSubTab("variaveis")} style={{ background: subTab === "variaveis" ? "#8B5CF6" + "20" : COLORS.card, color: subTab === "variaveis" ? "#8B5CF6" : COLORS.textMuted, border: `1px solid ${subTab === "variaveis" ? "#8B5CF640" : COLORS.border}`, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Variáveis ({variaveis.length})</button>
        <button onClick={() => setSubTab("fornecedores")} style={{ background: subTab === "fornecedores" ? "#3B82F6" + "20" : COLORS.card, color: subTab === "fornecedores" ? "#3B82F6" : COLORS.textMuted, border: `1px solid ${subTab === "fornecedores" ? "#3B82F640" : COLORS.border}`, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Fornecedores</button>
      </div>

      {/* Tabela Fixas/Variáveis */}
      {(subTab === "fixas" || subTab === "variaveis") && (
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: subTab === "fixas" ? COLORS.orange : "#8B5CF6", fontSize: 15, margin: 0 }}>{subTab === "fixas" ? "Despesas Fixas" : "Despesas Variáveis"} — {mesNomes[mesSel.split("-")[1]]}</h2>
        </div>

        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>Carregando...</div>
        ) : current.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: COLORS.textMuted, fontSize: 12 }}>Nenhuma despesa {subTab === "fixas" ? "fixa" : "variável"} neste mês</div>
        ) : renderTabela(current, subTab === "fixas")}

        {/* Adicionar despesa */}
        {subTab === "fixas" ? (
          <div style={{ padding: "10px 18px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 8, alignItems: "center" }}>
            <input placeholder="Nova despesa fixa..." value={novaDespesa} onChange={e => setNovaDespesa(e.target.value)} onKeyDown={e => e.key === "Enter" && adicionarDespesa(true)} style={{ ...inp, flex: 1, fontSize: 11 }} />
            <button onClick={() => adicionarDespesa(true)} style={{ background: COLORS.orange, border: "none", color: "#000", padding: "6px 14px", borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>+ Adicionar</button>
          </div>
        ) : (
          <div style={{ borderTop: `1px solid ${COLORS.border}` }}>
            {!showAddVar ? (
              <div style={{ padding: "10px 18px", textAlign: "center" }}>
                <button onClick={() => setShowAddVar(true)} style={{ background: "#8B5CF6", border: "none", color: "#fff", padding: "8px 20px", borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Adicionar Despesa Variável</button>
              </div>
            ) : (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 420, maxWidth: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#8B5CF6", fontSize: 18, margin: 0 }}>Nova Despesa Variável</h2>
                    <button onClick={() => { setShowAddVar(false); setVarForm({ categoria: "", socio: "", vencimento_dia: "", vencimento_mes: "", valor: "" }); }} style={{ background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Categoria *</div>
                      <select value={varForm.categoria} onChange={e => setVarForm({ ...varForm, categoria: e.target.value, socio: "" })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}>
                        <option value="">Selecione...</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Gasolina">Gasolina</option>
                        <option value="Frete">Frete</option>
                        <option value="Serviços Terceiros">Serviços Terceiros</option>
                        <option value="Pedágio">Pedágio</option>
                        <option value="Tarifa Bancária">Tarifa Bancária</option>
                        <option value="Equipamentos">Equipamentos</option>
                        <option value="Comissão">Comissão</option>
                        <option value="Pagamento Socios">Pagamento Sócios</option>
                      </select>
                    </div>
                    {varForm.categoria === "Pagamento Socios" && (
                      <div>
                        <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Sócio *</div>
                        <select value={varForm.socio} onChange={e => setVarForm({ ...varForm, socio: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}>
                          <option value="">Selecione...</option>
                          <option value="Alessandro">Alessandro</option>
                          <option value="Zanella">Zanella</option>
                          <option value="Luiz">Luiz</option>
                        </select>
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Dia *</div>
                        <select value={varForm.vencimento_dia} onChange={e => setVarForm({ ...varForm, vencimento_dia: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}>
                          <option value="">Selecione...</option>
                          {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{i + 1}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Mês *</div>
                        <select value={varForm.vencimento_mes} onChange={e => setVarForm({ ...varForm, vencimento_mes: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}>
                          <option value="">Selecione...</option>
                          <option value="01">Janeiro</option><option value="02">Fevereiro</option><option value="03">Março</option><option value="04">Abril</option><option value="05">Maio</option><option value="06">Junho</option><option value="07">Julho</option><option value="08">Agosto</option><option value="09">Setembro</option><option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Valor (R$) *</div>
                      <input type="number" min="0" step="0.01" value={varForm.valor} onChange={e => setVarForm({ ...varForm, valor: e.target.value })} placeholder="0,00" style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.orange, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", textAlign: "right" }} />
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      <button onClick={() => { setShowAddVar(false); setVarForm({ categoria: "", socio: "", vencimento_dia: "", vencimento_mes: "", valor: "" }); }} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                      <button onClick={() => { adicionarVariavel(); setShowAddVar(false); }} disabled={!varForm.categoria || (varForm.categoria === "Pagamento Socios" && !varForm.socio) || !varForm.valor} style={{ flex: 1, background: !varForm.categoria || (varForm.categoria === "Pagamento Socios" && !varForm.socio) || !varForm.valor ? COLORS.textDim : "#8B5CF6", color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: !varForm.categoria || (varForm.categoria === "Pagamento Socios" && !varForm.socio) || !varForm.valor ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Salvar</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Fornecedores */}
      {subTab === "fornecedores" && (() => {
        const tipos = [
          { key: "gondolas", label: "Gôndolas Brasil", color: "#F5A623" },
          { key: "mdf", label: "MDF", color: "#3B82F6" },
          { key: "outros", label: "Outros Fornecedores", color: "#10B981" },
        ];
        const parseForn = (f) => {
          const parts = f.nome.replace("forn_", "").split("|");
          return { tipo: parts[0], pedido: parts[1] || "", parcela: parts[2] || "", pagador: parts[3] || "" };
        };
        const totalFornGeral = fornecedores.reduce((s, f) => s + (f.valor || 0), 0);
        const renderFornCard = (t, items, isGondolas, isMdf) => {
              const totalForn = items.reduce((s, f) => s + (f.valor || 0), 0);
              return (
                <div key={t.key} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: t.color + "10" }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", color: t.color, fontSize: 13, margin: 0 }}>{t.label}</h3>
                    <span style={{ color: t.color, fontSize: 12, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalForn)}</span>
                  </div>
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                          <th style={{ padding: "4px 6px", textAlign: "left", color: COLORS.textMuted, fontSize: 8, textTransform: "uppercase" }}>Data</th>
                          <th style={{ padding: "4px 6px", textAlign: "left", color: COLORS.textMuted, fontSize: 8, textTransform: "uppercase" }}>Pedido</th>
                          <th style={{ padding: "4px 6px", textAlign: "center", color: COLORS.textMuted, fontSize: 8, textTransform: "uppercase" }}>Parc.</th>
                          <th style={{ padding: "4px 6px", textAlign: "right", color: COLORS.textMuted, fontSize: 8, textTransform: "uppercase" }}>Valor</th>
                          <th style={{ padding: "4px 4px", textAlign: "center", color: COLORS.textMuted, fontSize: 8, textTransform: "uppercase" }}>Sit.</th>
                          <th style={{ padding: "4px 2px", width: 14 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...items].sort((a, b) => (a.vencimento || "").localeCompare(b.vencimento || "")).map(f => {
                          const p = parseForn(f);
                          const sit = getSituacao(f);
                          return (
                            <tr key={f.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                              <td style={{ padding: "4px 6px", color: COLORS.text, fontSize: 10 }}>{f.vencimento ? f.vencimento.split("-")[2] + "/" + f.vencimento.split("-")[1] : "--"}</td>
                              <td style={{ padding: "4px 6px", color: COLORS.textMuted, fontSize: 10 }}>{p.pedido || "-"}</td>
                              <td style={{ padding: "4px 6px", textAlign: "center", color: COLORS.textMuted, fontSize: 10 }}>{p.parcela || "-"}</td>
                              <td style={{ padding: "4px 6px", textAlign: "right", color: COLORS.orange, fontWeight: 700, fontSize: 10 }}>{fmt(f.valor)}</td>
                              <td style={{ padding: "3px 3px", textAlign: "center" }}>
                                <select value={f.status} onChange={e => atualizarFornecedor(f.id, "status", e.target.value)} style={{ background: f.status === "Pago" ? "#10B98120" : "#F59E0B20", color: f.status === "Pago" ? "#10B981" : "#F59E0B", border: "none", padding: "2px 3px", borderRadius: 8, fontSize: 8, fontWeight: 700, cursor: "pointer", outline: "none" }}>
                                  <option value="Em Aberto">Aberto</option>
                                  <option value="Pago">Pago</option>
                                </select>
                              </td>
                              <td style={{ padding: "2px", textAlign: "center" }}>
                                <button onClick={() => excluirFornecedor(f.id)} style={{ background: "transparent", border: "none", color: COLORS.danger, cursor: "pointer", fontSize: 10, padding: 0, lineHeight: 1 }}>✕</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {items.length === 0 && <div style={{ padding: 14, textAlign: "center", color: COLORS.textDim, fontSize: 10 }}>Nenhuma despesa</div>}
                  </div>
                  {showAddForn === t.key && isGondolas ? (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 420, maxWidth: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                          <h2 style={{ fontFamily: "'Playfair Display', serif", color: t.color, fontSize: 18, margin: 0 }}>Novo Boleto — Gôndolas Brasil</h2>
                          <button onClick={() => { setShowAddForn(""); setGondForm({ documento: "", pagador: "", dia: "", mes: "", qtdParcelas: "1", valor: "" }); }} style={{ background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 16 }}>✕</button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          <div>
                            <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Nº do Documento *</div>
                            <input placeholder="Ex: NF-1234" value={gondForm.documento} onChange={e => setGondForm({ ...gondForm, documento: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                          </div>
                          <div>
                            <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Nome do Pagador</div>
                            <input placeholder="Ex: Gôndolas Brasil Ltda" value={gondForm.pagador} onChange={e => setGondForm({ ...gondForm, pagador: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                              <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Dia do Vencimento *</div>
                              <select value={gondForm.dia} onChange={e => setGondForm({ ...gondForm, dia: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}>
                                <option value="">Selecione...</option>
                                {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{i + 1}</option>)}
                              </select>
                            </div>
                            <div>
                              <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Mês 1ª Parcela *</div>
                              <select value={gondForm.mes} onChange={e => setGondForm({ ...gondForm, mes: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}>
                                <option value="">Selecione...</option>
                                <option value="01">Janeiro</option><option value="02">Fevereiro</option><option value="03">Março</option><option value="04">Abril</option><option value="05">Maio</option><option value="06">Junho</option><option value="07">Julho</option><option value="08">Agosto</option><option value="09">Setembro</option><option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                              <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Quantidade de Parcelas</div>
                              <select value={gondForm.qtdParcelas} onChange={e => setGondForm({ ...gondForm, qtdParcelas: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}>
                                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}x{i === 0 ? " (única)" : ""}</option>)}
                              </select>
                            </div>
                            <div>
                              <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Valor da Parcela (R$) *</div>
                              <input type="number" min="0" step="0.01" placeholder="0,00" value={gondForm.valor} onChange={e => setGondForm({ ...gondForm, valor: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.orange, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", textAlign: "right" }} />
                            </div>
                          </div>
                          {gondForm.qtdParcelas > 1 && gondForm.dia && gondForm.mes && gondForm.valor && (
                            <div style={{ background: t.color + "10", border: `1px solid ${t.color}25`, borderRadius: 8, padding: "10px 14px" }}>
                              <div style={{ color: t.color, fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Parcelas a serem geradas:</div>
                              <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                                {Array.from({ length: Number(gondForm.qtdParcelas) }, (_, i) => {
                                  let m = Number(gondForm.mes) + i; let a = Number(mesSel.split("-")[0]);
                                  while (m > 12) { m -= 12; a++; }
                                  return <div key={i}>{i + 1}/{gondForm.qtdParcelas} — {gondForm.dia}/{String(m).padStart(2, "0")} — R$ {Number(gondForm.valor).toFixed(2)}</div>;
                                })}
                              </div>
                              <div style={{ color: t.color, fontSize: 12, fontWeight: 800, fontFamily: "'Playfair Display', serif", marginTop: 6 }}>Total: {fmt(Number(gondForm.valor) * Number(gondForm.qtdParcelas))}</div>
                            </div>
                          )}
                          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                            <button onClick={() => { setShowAddForn(""); setGondForm({ documento: "", pagador: "", dia: "", mes: "", qtdParcelas: "1", valor: "" }); }} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                            <button onClick={adicionarGondolas} disabled={!gondForm.documento || !gondForm.dia || !gondForm.mes || !gondForm.valor} style={{ flex: 1, background: !gondForm.documento || !gondForm.dia || !gondForm.mes || !gondForm.valor ? COLORS.textDim : t.color, color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: !gondForm.documento || !gondForm.dia || !gondForm.mes || !gondForm.valor ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Gerar Parcelas</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : showAddForn === t.key && isMdf ? (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 380, maxWidth: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                          <h2 style={{ fontFamily: "'Playfair Display', serif", color: t.color, fontSize: 18, margin: 0 }}>Nova Despesa — MDF</h2>
                          <button onClick={() => { setShowAddForn(""); setMdfForm({ dia: "", mes: "", qtd: "", valor: "" }); }} style={{ background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 16 }}>✕</button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                              <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Dia *</div>
                              <select value={mdfForm.dia} onChange={e => setMdfForm({ ...mdfForm, dia: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}>
                                <option value="">Selecione...</option>
                                {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{i + 1}</option>)}
                              </select>
                            </div>
                            <div>
                              <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Mês *</div>
                              <select value={mdfForm.mes} onChange={e => setMdfForm({ ...mdfForm, mes: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}>
                                <option value="">Selecione...</option>
                                <option value="01">Janeiro</option><option value="02">Fevereiro</option><option value="03">Março</option><option value="04">Abril</option><option value="05">Maio</option><option value="06">Junho</option><option value="07">Julho</option><option value="08">Agosto</option><option value="09">Setembro</option><option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                              <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Quantidade</div>
                              <input type="number" min="1" placeholder="1" value={mdfForm.qtd} onChange={e => setMdfForm({ ...mdfForm, qtd: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                            </div>
                            <div>
                              <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Valor (R$) *</div>
                              <input type="number" min="0" step="0.01" placeholder="0,00" value={mdfForm.valor} onChange={e => setMdfForm({ ...mdfForm, valor: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.orange, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", textAlign: "right" }} />
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                            <button onClick={() => { setShowAddForn(""); setMdfForm({ dia: "", mes: "", qtd: "", valor: "" }); }} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                            <button onClick={adicionarMdf} disabled={!mdfForm.dia || !mdfForm.mes || !mdfForm.valor} style={{ flex: 1, background: !mdfForm.dia || !mdfForm.mes || !mdfForm.valor ? COLORS.textDim : t.color, color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: !mdfForm.dia || !mdfForm.mes || !mdfForm.valor ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Salvar</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : showAddForn === t.key && !isGondolas && !isMdf ? (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 380, maxWidth: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                          <h2 style={{ fontFamily: "'Playfair Display', serif", color: t.color, fontSize: 18, margin: 0 }}>Nova Despesa — Fornecedor</h2>
                          <button onClick={() => { setShowAddForn(""); setOutrosForm({ dia: "", mes: "", fornecedor: "", valor: "" }); }} style={{ background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 16 }}>✕</button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                              <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Dia *</div>
                              <select value={outrosForm.dia} onChange={e => setOutrosForm({ ...outrosForm, dia: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}>
                                <option value="">Selecione...</option>
                                {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{i + 1}</option>)}
                              </select>
                            </div>
                            <div>
                              <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Mês *</div>
                              <select value={outrosForm.mes} onChange={e => setOutrosForm({ ...outrosForm, mes: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}>
                                <option value="">Selecione...</option>
                                <option value="01">Janeiro</option><option value="02">Fevereiro</option><option value="03">Março</option><option value="04">Abril</option><option value="05">Maio</option><option value="06">Junho</option><option value="07">Julho</option><option value="08">Agosto</option><option value="09">Setembro</option><option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Nome do Fornecedor *</div>
                            <input placeholder="Ex: Fornecedor XYZ" value={outrosForm.fornecedor} onChange={e => setOutrosForm({ ...outrosForm, fornecedor: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                          </div>
                          <div>
                            <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Valor (R$) *</div>
                            <input type="number" min="0" step="0.01" placeholder="0,00" value={outrosForm.valor} onChange={e => setOutrosForm({ ...outrosForm, valor: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.orange, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", textAlign: "right" }} />
                          </div>
                          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                            <button onClick={() => { setShowAddForn(""); setOutrosForm({ dia: "", mes: "", fornecedor: "", valor: "" }); }} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                            <button onClick={adicionarOutros} disabled={!outrosForm.dia || !outrosForm.mes || !outrosForm.fornecedor || !outrosForm.valor} style={{ flex: 1, background: !outrosForm.dia || !outrosForm.mes || !outrosForm.fornecedor || !outrosForm.valor ? COLORS.textDim : t.color, color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: !outrosForm.dia || !outrosForm.mes || !outrosForm.fornecedor || !outrosForm.valor ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Salvar</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "6px 10px", borderTop: `1px solid ${COLORS.border}`, textAlign: "center" }}>
                      <button onClick={() => setShowAddForn(t.key)} style={{ background: t.color + "15", border: `1px solid ${t.color}30`, color: t.color, padding: "4px 12px", borderRadius: 5, fontWeight: 700, fontSize: 9, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Adicionar</button>
                    </div>
                  )}
                </div>
              );
            };
        return (
          <div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Total Fornecedores</span>
              <span style={{ color: COLORS.orange, fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalFornGeral)}</span>
            </div>
            {/* Gôndolas Brasil - largura total */}
            <div style={{ marginBottom: 12 }}>
              {renderFornCard(tipos[0], fornecedores.filter(f => f.nome.startsWith("forn_gondolas")), true)}
            </div>
            {/* MDF + Outros lado a lado */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {renderFornCard(tipos[1], fornecedores.filter(f => f.nome.startsWith("forn_mdf")), false, true)}
              {renderFornCard(tipos[2], fornecedores.filter(f => f.nome.startsWith("forn_outros")), false, false)}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── DRE ───
function DrePage() {
  const [vendas, setVendas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [mesSel, setMesSel] = useState(() => { const n = new Date(); return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0"); });
  const mesNomes = { "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril", "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };

  useEffect(() => {
    const load = async () => {
      const { data: orcData } = await supabase.from("orcamentos").select("*").eq("status", "Concluído");
      if (orcData) setVendas(orcData);
      const { data: despData } = await supabase.from("despesas").select("*");
      if (despData) setDespesas(despData);
    };
    load();
  }, []);

  const vendasMes = vendas.filter(o => { const d = new Date(o.data); return (d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")) === mesSel; });
  const despMes = despesas.filter(d => d.mes === mesSel && !d.nome.startsWith("forn_"));
  const fornMes = despesas.filter(d => d.nome.startsWith("forn_") && d.vencimento && d.vencimento.startsWith(mesSel));
  const fixasMes = despMes.filter(d => d.fixa);
  const variaveisMes = despMes.filter(d => !d.fixa);

  // RECEITA BRUTA
  const receitaBruta = vendasMes.reduce((s, o) => s + (o.total || 0), 0);
  const comissoes = vendasMes.reduce((s, o) => s + (o.comissao || 0), 0);

  // CUSTO PRODUTOS (fornecedores)
  const custoFornGondolas = despesas.filter(d => d.nome.startsWith("forn_gondolas") && d.vencimento && d.vencimento.startsWith(mesSel)).reduce((s, d) => s + (d.valor || 0), 0);
  const custoFornMdf = despesas.filter(d => d.nome.startsWith("forn_mdf") && d.vencimento && d.vencimento.startsWith(mesSel)).reduce((s, d) => s + (d.valor || 0), 0);
  const custoFornOutros = despesas.filter(d => d.nome.startsWith("forn_outros") && d.vencimento && d.vencimento.startsWith(mesSel)).reduce((s, d) => s + (d.valor || 0), 0);
  const custoFornTotal = custoFornGondolas + custoFornMdf + custoFornOutros;

  // LUCRO BRUTO
  const lucroBruto = receitaBruta - custoFornTotal;
  const margemBruta = receitaBruta > 0 ? (lucroBruto / receitaBruta * 100) : 0;

  // DESPESAS OPERACIONAIS
  const totalFixas = fixasMes.reduce((s, d) => s + (d.valor || 0), 0);
  const totalVariaveis = variaveisMes.reduce((s, d) => s + (d.valor || 0), 0);
  const totalDespOp = totalFixas + totalVariaveis;

  // RESULTADO OPERACIONAL (EBITDA)
  const resultadoOp = lucroBruto - totalDespOp;
  const margemOp = receitaBruta > 0 ? (resultadoOp / receitaBruta * 100) : 0;

  // RESULTADO LÍQUIDO
  const resultadoLiq = resultadoOp - comissoes;
  const margemLiq = receitaBruta > 0 ? (resultadoLiq / receitaBruta * 100) : 0;

  const row = (label, value, bold, color, indent, bg) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: indent ? "6px 16px 6px 32px" : "8px 16px", background: bg || "transparent", borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ color: bold ? COLORS.white : COLORS.textMuted, fontSize: bold ? 13 : 12, fontWeight: bold ? 700 : 400, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      <span style={{ color: color || (value >= 0 ? COLORS.text : COLORS.danger), fontSize: bold ? 14 : 12, fontWeight: bold ? 800 : 600, fontFamily: "'Playfair Display', serif" }}>{value < 0 ? "- " : ""}{fmt(Math.abs(value))}</span>
    </div>
  );

  const pctRow = (label, pct, color) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 16px" }}>
      <span style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      <span style={{ color: color || COLORS.textMuted, fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{pct.toFixed(1)}%</span>
    </div>
  );

  const separator = (label, color) => (
    <div style={{ padding: "10px 16px", background: (color || COLORS.orange) + "10", borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ color: color || COLORS.orange, fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 4px" }}>DRE</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Demonstração do Resultado do Exercício</p>
        </div>
        <select value={mesSel} onChange={e => setMesSel(e.target.value)} style={{ padding: "8px 16px", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date(); d.setMonth(d.getMonth() - 6 + i);
            const v = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
            return <option key={v} value={v}>{mesNomes[String(d.getMonth() + 1).padStart(2, "0")]} {d.getFullYear()}</option>;
          })}
        </select>
      </div>

      {/* Cards resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
          <div style={{ color: COLORS.textMuted, fontSize: 9 }}>Receita</div>
          <div style={{ color: COLORS.orange, fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(receitaBruta)}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
          <div style={{ color: COLORS.textMuted, fontSize: 9 }}>Despesas</div>
          <div style={{ color: "#F87171", fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalDespOp + custoFornTotal + comissoes)}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${resultadoLiq >= 0 ? "#10B98140" : COLORS.danger + "40"}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
          <div style={{ color: COLORS.textMuted, fontSize: 9 }}>Resultado</div>
          <div style={{ color: resultadoLiq >= 0 ? "#10B981" : COLORS.danger, fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{resultadoLiq < 0 ? "- " : ""}{fmt(Math.abs(resultadoLiq))}</div>
        </div>
      </div>

      {/* DRE */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 16, margin: 0 }}>DRE — {mesNomes[mesSel.split("-")[1]]} {mesSel.split("-")[0]}</h2>
        </div>

        {separator("Receitas", "#10B981")}
        {row("Receita Bruta de Vendas", receitaBruta, true, COLORS.orange)}
        {row("Vendas Concluídas (" + vendasMes.length + ")", receitaBruta, false, null, true)}

        {separator("Custo dos Produtos Vendidos (CPV)", "#F87171")}
        {row("Gôndolas Brasil", -custoFornGondolas, false, COLORS.danger, true)}
        {row("MDF", -custoFornMdf, false, COLORS.danger, true)}
        {row("Outros Fornecedores", -custoFornOutros, false, COLORS.danger, true)}
        {row("(-) Total CPV", -custoFornTotal, true, COLORS.danger)}

        {separator("Lucro Bruto", lucroBruto >= 0 ? "#10B981" : "#F87171")}
        {row("Lucro Bruto", lucroBruto, true, lucroBruto >= 0 ? "#10B981" : COLORS.danger, false, lucroBruto >= 0 ? "#10B98108" : COLORS.danger + "08")}
        {pctRow("Margem Bruta", margemBruta, lucroBruto >= 0 ? "#10B981" : COLORS.danger)}

        {separator("Despesas Operacionais", "#8B5CF6")}
        {row("Despesas Fixas", -totalFixas, false, COLORS.danger, true)}
        {fixasMes.filter(d => d.valor > 0).map((d, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 16px 3px 48px", borderBottom: `1px solid ${COLORS.border}05` }}>
            <span style={{ color: COLORS.textDim, fontSize: 10 }}>{d.nome}</span>
            <span style={{ color: COLORS.textDim, fontSize: 10 }}>{fmt(d.valor)}</span>
          </div>
        ))}
        {row("Despesas Variáveis", -totalVariaveis, false, COLORS.danger, true)}
        {variaveisMes.filter(d => d.valor > 0).map((d, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 16px 3px 48px", borderBottom: `1px solid ${COLORS.border}05` }}>
            <span style={{ color: COLORS.textDim, fontSize: 10 }}>{d.nome}</span>
            <span style={{ color: COLORS.textDim, fontSize: 10 }}>{fmt(d.valor)}</span>
          </div>
        ))}
        {row("(-) Total Despesas Operacionais", -totalDespOp, true, COLORS.danger)}

        {separator("Resultado Operacional", resultadoOp >= 0 ? "#3B82F6" : "#F87171")}
        {row("EBITDA", resultadoOp, true, resultadoOp >= 0 ? "#3B82F6" : COLORS.danger, false, resultadoOp >= 0 ? "#3B82F608" : COLORS.danger + "08")}
        {pctRow("Margem Operacional", margemOp, resultadoOp >= 0 ? "#3B82F6" : COLORS.danger)}

        {separator("Deduções", "#F59E0B")}
        {row("(-) Comissões de Vendas", -comissoes, false, COLORS.danger, true)}

        {separator("Resultado Líquido", resultadoLiq >= 0 ? "#10B981" : "#F87171")}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: resultadoLiq >= 0 ? "#10B98112" : COLORS.danger + "12" }}>
          <span style={{ color: COLORS.white, fontSize: 15, fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>RESULTADO LÍQUIDO</span>
          <span style={{ color: resultadoLiq >= 0 ? "#10B981" : COLORS.danger, fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{resultadoLiq < 0 ? "- " : ""}{fmt(Math.abs(resultadoLiq))}</span>
        </div>
        {pctRow("Margem Líquida", margemLiq, resultadoLiq >= 0 ? "#10B981" : COLORS.danger)}
      </div>
    </div>
  );
}

// ─── NOTAS FISCAIS ───
function NFPage() {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consultando, setConsultando] = useState(null);
  const [mesSel, setMesSel] = useState(() => { const n = new Date(); return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0"); });
  const mesNomes = { "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril", "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };

  const carregarNotas = async () => {
    setLoading(true);
    const { data } = await supabase.from("notas_fiscais").select("*").order("data_emissao", { ascending: false });
    if (data) setNotas(data);
    setLoading(false);
  };

  const consultarSefaz = async (nota) => {
    if (!nota.ref) return;
    setConsultando(nota.id);
    try {
      const res = await fetch("/api/consultar-nfe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: nota.ref, ambiente: "producao" }),
      });
      const data = await res.json();
      if (data.success && data.status) {
        await supabase.from("notas_fiscais").update({ status: data.status }).eq("id", nota.id);
        setNotas(notas.map(n => n.id === nota.id ? { ...n, status: data.status } : n));
      }
    } catch (e) { console.error(e); }
    setConsultando(null);
  };

  const consultarTodas = async () => {
    setLoading(true);
    for (const n of notasMes) {
      if (n.ref) {
        try {
          const res = await fetch("/api/consultar-nfe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ref: n.ref, ambiente: "producao" }),
          });
          const data = await res.json();
          if (data.success && data.status) {
            await supabase.from("notas_fiscais").update({ status: data.status }).eq("id", n.id);
          }
        } catch (e) { console.error(e); }
      }
    }
    await carregarNotas();
  };

  useEffect(() => { carregarNotas(); }, []);

  const notasMes = notas.filter(n => {
    const dt = n.data_emissao || "";
    return dt.startsWith(mesSel);
  });

  const statusColor = (s) => {
    if (s === "autorizado") return "#10B981";
    if (s === "cancelado") return "#F87171";
    return "#888";
  };

  const totalAutorizadas = notasMes.filter(n => n.status === "autorizado").reduce((s, n) => s + Number(n.valor || 0), 0);
  const totalCanceladas = notasMes.filter(n => n.status === "cancelado").length;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 4px" }}>Notas Fiscais</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>NF-e emitidas via SEFAZ</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select value={mesSel} onChange={e => setMesSel(e.target.value)} style={{ padding: "8px 16px", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date(); d.setMonth(d.getMonth() - 6 + i);
              const v = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
              return <option key={v} value={v}>{mesNomes[String(d.getMonth() + 1).padStart(2, "0")]} {d.getFullYear()}</option>;
            })}
          </select>
          <button onClick={carregarNotas} style={{ background: COLORS.orange + "15", border: `1px solid ${COLORS.orange}40`, color: COLORS.orange, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Atualizar</button>
          <button onClick={consultarTodas} style={{ background: "#3B82F615", border: "1px solid #3B82F640", color: "#3B82F6", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Consultar SEFAZ</button>
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 9 }}>Total NF-e</div>
          <div style={{ color: COLORS.white, fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{notasMes.length}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 9 }}>Autorizadas</div>
          <div style={{ color: "#10B981", fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{notasMes.filter(n => n.status === "autorizado").length}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 9 }}>Canceladas</div>
          <div style={{ color: "#F87171", fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{totalCanceladas}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 9 }}>Valor Autorizado</div>
          <div style={{ color: COLORS.orange, fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalAutorizadas)}</div>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 16, margin: 0 }}>NF-e — {mesNomes[mesSel.split("-")[1]]} {mesSel.split("-")[0]}</h2>
        </div>
        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>Carregando...</div>
        ) : notasMes.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: COLORS.textMuted, fontSize: 12 }}>Nenhuma NF-e neste mês</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Nº</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Data</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Destinatário</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>CNPJ</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Valor</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Vendedor</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>PDF</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>XML</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>SEFAZ</th>
                </tr>
              </thead>
              <tbody>
                {notasMes.map(n => (
                  <tr key={n.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: n.status === "cancelado" ? COLORS.danger + "05" : "transparent" }}>
                    <td style={{ padding: "8px 10px", color: COLORS.white, fontWeight: 700, fontSize: 13 }}>{n.numero || "—"}</td>
                    <td style={{ padding: "8px 10px", color: COLORS.textMuted }}>{n.data_emissao ? new Date(n.data_emissao).toLocaleDateString("pt-BR") : "—"}</td>
                    <td style={{ padding: "8px 10px", color: COLORS.text, fontWeight: 500 }}>{n.destinatario || "—"}</td>
                    <td style={{ padding: "8px 10px", color: COLORS.textDim, fontSize: 10 }}>{n.cnpj_destinatario || "—"}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: COLORS.orange, fontWeight: 700 }}>{fmt(Number(n.valor || 0))}</td>
                    <td style={{ padding: "8px 10px", color: COLORS.accent, fontWeight: 500 }}>{n.vendedor || "—"}</td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}>
                      <span style={{ background: statusColor(n.status) + "20", color: statusColor(n.status), padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700 }}>{n.status === "autorizado" ? "Autorizada" : n.status === "cancelado" ? "Cancelada" : n.status}</span>
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}>
                      {n.url_danfe && n.status === "autorizado" && <a href={n.url_danfe} target="_blank" rel="noopener noreferrer" style={{ color: "#10B981", fontSize: 9, fontWeight: 700, textDecoration: "none" }}>PDF</a>}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}>
                      {n.url_xml && n.status === "autorizado" && <a href={n.url_xml} target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6", fontSize: 9, fontWeight: 700, textDecoration: "none" }}>XML</a>}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}>
                      {consultando === n.id ? (
                        <span style={{ color: COLORS.textMuted, fontSize: 8 }}>...</span>
                      ) : (
                        <button onClick={() => consultarSefaz(n)} style={{ background: "#3B82F610", border: "1px solid #3B82F630", color: "#3B82F6", padding: "2px 6px", borderRadius: 4, fontSize: 8, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Consultar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CONCILIAÇÃO BANCÁRIA ───
const CONTAS = [
  { key: "sicredi", label: "Sicredi", color: "#2E7D32", icon: "🏦" },
  { key: "mercadopago", label: "Mercado Pago", color: "#00AEEF", icon: "💳" },
  { key: "neon", label: "Neon PF", color: "#8B5CF6", icon: "🟣" },
];

function ConciliacaoPage() {
  const [vendas, setVendas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [saldos, setSaldos] = useState({});
  const [mesSel, setMesSel] = useState(() => { const n = new Date(); return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0"); });
  const mesNomes = { "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril", "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };

  useEffect(() => {
    const load = async () => {
      const { data: orcData } = await supabase.from("orcamentos").select("*").eq("status", "Concluído");
      if (orcData) setVendas(orcData);
      const { data: despData } = await supabase.from("despesas").select("*");
      if (despData) setDespesas(despData);
    };
    load();
  }, []);

  useEffect(() => {
    const loadSaldos = async () => {
      const { data } = await supabase.from("despesas").select("*").eq("mes", mesSel).like("nome", "saldo_%");
      const s = {};
      if (data) data.forEach(d => {
        const key = d.nome.replace("saldo_", "").split("|")[0];
        const tipo = d.nome.replace("saldo_", "").split("|")[1];
        if (!s[key]) s[key] = { id_ini: null, id_fim: null, ini: 0, fim: 0 };
        if (tipo === "ini") { s[key].ini = d.valor || 0; s[key].id_ini = d.id; }
        if (tipo === "fim") { s[key].fim = d.valor || 0; s[key].id_fim = d.id; }
      });
      setSaldos(s);
    };
    loadSaldos();
  }, [mesSel]);

  const updateSaldo = async (conta, tipo, valor) => {
    const key = conta + "|" + tipo;
    const nome = "saldo_" + key;
    const existing = saldos[conta]?.[tipo === "ini" ? "id_ini" : "id_fim"];
    if (existing) {
      await supabase.from("despesas").update({ valor: Number(valor) || 0 }).eq("id", existing);
    } else {
      const id = genId();
      await supabase.from("despesas").insert({ id, nome, valor: Number(valor) || 0, mes: mesSel, fixa: false, status: "Pago" });
      setSaldos(prev => ({ ...prev, [conta]: { ...prev[conta], [tipo === "ini" ? "id_ini" : "id_fim"]: id } }));
    }
    setSaldos(prev => ({ ...prev, [conta]: { ...(prev[conta] || {}), [tipo]: Number(valor) || 0 } }));
  };

  // DRE do mês
  const vendasMes = vendas.filter(o => { const d = new Date(o.data); return (d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")) === mesSel; });
  const receitaBruta = vendasMes.reduce((s, o) => s + (o.total || 0), 0);
  const comissoes = vendasMes.reduce((s, o) => s + (o.comissao || 0), 0);
  const despMes = despesas.filter(d => d.mes === mesSel && !d.nome.startsWith("forn_") && !d.nome.startsWith("saldo_"));
  const fornMes = despesas.filter(d => d.nome.startsWith("forn_") && d.vencimento && d.vencimento.startsWith(mesSel));
  const totalDesp = despMes.reduce((s, d) => s + (d.valor || 0), 0) + fornMes.reduce((s, d) => s + (d.valor || 0), 0) + comissoes;
  const resultadoDRE = receitaBruta - totalDesp;

  // Saldos bancários
  const totalSaldoIni = CONTAS.reduce((s, c) => s + (saldos[c.key]?.ini || 0), 0);
  const totalSaldoFim = CONTAS.reduce((s, c) => s + (saldos[c.key]?.fim || 0), 0);
  const movimentacaoBanco = totalSaldoFim - totalSaldoIni;
  const diferenca = movimentacaoBanco - resultadoDRE;

  const inp = { padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 4px" }}>Conciliação Bancária</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Compare os saldos bancários com o DRE</p>
        </div>
        <select value={mesSel} onChange={e => setMesSel(e.target.value)} style={{ padding: "8px 16px", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date(); d.setMonth(d.getMonth() - 6 + i);
            const v = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
            return <option key={v} value={v}>{mesNomes[String(d.getMonth() + 1).padStart(2, "0")]} {d.getFullYear()}</option>;
          })}
        </select>
      </div>

      {/* Contas bancárias */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12, marginBottom: 20 }}>
        {CONTAS.map(c => {
          const s = saldos[c.key] || { ini: 0, fim: 0 };
          const mov = s.fim - s.ini;
          return (
            <div key={c.key} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", background: c.color + "15", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <span style={{ color: c.color, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{c.label}</span>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ color: COLORS.textMuted, fontSize: 9, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans', sans-serif" }}>Saldo Inicial</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: COLORS.textDim, fontSize: 11 }}>R$</span>
                    <input type="number" step="0.01" value={s.ini || ""} onChange={e => updateSaldo(c.key, "ini", e.target.value)} placeholder="0,00" style={{ ...inp, width: "100%", textAlign: "right", fontWeight: 700, color: COLORS.text }} />
                  </div>
                </div>
                <div>
                  <div style={{ color: COLORS.textMuted, fontSize: 9, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans', sans-serif" }}>Saldo Final</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: COLORS.textDim, fontSize: 11 }}>R$</span>
                    <input type="number" step="0.01" value={s.fim || ""} onChange={e => updateSaldo(c.key, "fim", e.target.value)} placeholder="0,00" style={{ ...inp, width: "100%", textAlign: "right", fontWeight: 700, color: COLORS.text }} />
                  </div>
                </div>
                <div style={{ background: COLORS.bg, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.textMuted, fontSize: 10 }}>Movimentação</span>
                  <span style={{ color: mov >= 0 ? "#10B981" : COLORS.danger, fontSize: 13, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{mov < 0 ? "- " : "+ "}{fmt(Math.abs(mov))}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparação */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 16, margin: 0 }}>Comparação DRE × Bancos</h2>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12 }}>Saldo Inicial (todas as contas)</span>
          <span style={{ color: COLORS.text, fontSize: 13, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{fmt(totalSaldoIni)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12 }}>Saldo Final (todas as contas)</span>
          <span style={{ color: COLORS.text, fontSize: 13, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{fmt(totalSaldoFim)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`, background: movimentacaoBanco >= 0 ? "#10B98108" : COLORS.danger + "08" }}>
          <span style={{ color: COLORS.white, fontSize: 13, fontWeight: 600 }}>Movimentação Bancária</span>
          <span style={{ color: movimentacaoBanco >= 0 ? "#10B981" : COLORS.danger, fontSize: 15, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{movimentacaoBanco < 0 ? "- " : ""}{fmt(Math.abs(movimentacaoBanco))}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12 }}>Receita (DRE)</span>
          <span style={{ color: COLORS.orange, fontSize: 13, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{fmt(receitaBruta)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12 }}>Despesas (DRE)</span>
          <span style={{ color: COLORS.danger, fontSize: 13, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>- {fmt(totalDesp)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`, background: resultadoDRE >= 0 ? "#3B82F608" : COLORS.danger + "08" }}>
          <span style={{ color: COLORS.white, fontSize: 13, fontWeight: 600 }}>Resultado DRE</span>
          <span style={{ color: resultadoDRE >= 0 ? "#3B82F6" : COLORS.danger, fontSize: 15, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{resultadoDRE < 0 ? "- " : ""}{fmt(Math.abs(resultadoDRE))}</span>
        </div>

        {/* Diferença */}
        <div style={{ padding: "16px", background: Math.abs(diferenca) < 1 ? "#10B98112" : "#F59E0B12" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: COLORS.white, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Diferença</div>
              <div style={{ color: COLORS.textMuted, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>Movimentação Bancária - Resultado DRE</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: Math.abs(diferenca) < 1 ? "#10B981" : "#F59E0B", fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{diferenca < 0 ? "- " : ""}{fmt(Math.abs(diferenca))}</div>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: Math.abs(diferenca) < 1 ? "#10B981" : "#F59E0B" }}>{Math.abs(diferenca) < 1 ? "✓ Conciliado" : "⚠ Divergência"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ───
export default function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const EMPTY_CLIENT = { empresa: "", cnpj: "", responsavel: "", telefone: "", email: "", endereco: "", numero: "", bairro: "", cidade: "", estado: "", cep: "" };
  const [clientData, setClientData] = useState(EMPTY_CLIENT);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [markup, setMarkup] = useState(0);
  const [frete, setFrete] = useState(0);
  const [uniplusProducts, setUniplusProducts] = useState([]);
  const uniplusPriceMap = useMemo(() => {
    const m = {};
    uniplusProducts.forEach(p => { m[p.id] = Number(p.preco_brasil) || 0; });
    return m;
  }, [uniplusProducts]);

  useEffect(() => {
    supabase.from("produtos_uniplus")
      .select("id, nome, preco_brasil, categoria, linha_planilha")
      .eq("ativo", true)
      .order("nome", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setUniplusProducts(data);
      });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("gs_client_data");
    }

    const mapSessionUser = (sessionUser) => {
      if (!sessionUser) return null;
      const meta = sessionUser.user_metadata || {};
      return {
        id: meta.legacy_id || sessionUser.id,
        name: meta.name || sessionUser.email,
        email: sessionUser.email,
        isAdmin: !!meta.isAdmin,
      };
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSessionUser(session.user));
        setPage("client");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const mapped = mapSessionUser(session?.user);
      setUser(mapped);
      if (!mapped) setPage("login");
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = u => { setUser(u); };
  const logout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") localStorage.removeItem("gs_client_data");
    setClientData(EMPTY_CLIENT);
    setCart([]);
    setMarkup(0);
    setFrete(0);
    setUser(null);
    setPage("login");
  };
  const addToQuote = (p, selectedVariants, qty) => {
    const addQty = Math.max(1, Number(qty) || 1);
    const sameVariants = (a, b) => JSON.stringify(a || {}) === JSON.stringify(b || {});
    const ex = cart.findIndex(i => i.product.id === p.id && sameVariants(i.selVariants, selectedVariants));
    if (ex >= 0) { const c = [...cart]; c[ex] = { ...c[ex], qty: c[ex].qty + addQty }; setCart(c); }
    else setCart([...cart, {
      product: p,
      qty: addQty,
      selOpts: p.options && p.options.length > 0 ? [0] : [],
      selVariants: selectedVariants || null,
    }]);
    setPage("quote");
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet" />
      <Nav page={page} setPage={setPage} user={user} onLogout={logout} cartCount={cart.length} />
      {page === "login" && <Login onLogin={login} setPage={setPage} />}
      {page === "client" && user && <ClientPage key={`client-${user.id}`} clientData={clientData} setClientData={setClientData} setPage={setPage} />}
      {page === "client" && !user && <Login onLogin={login} setPage={setPage} />}
      {page === "catalog" && <Catalog onAdd={addToQuote} uniplusProducts={uniplusProducts} uniplusPriceMap={uniplusPriceMap} />}
      {page === "quote" && <Quote items={cart} setItems={setCart} user={user} setPage={setPage} clientData={clientData} editingOrderId={editingOrderId} setEditingOrderId={setEditingOrderId} markup={markup} setMarkup={setMarkup} frete={frete} setFrete={setFrete} uniplusPriceMap={uniplusPriceMap} />}
      {page === "resumo" && <ResumoPage items={cart} user={user} setPage={setPage} clientData={clientData} editingOrderId={editingOrderId} setEditingOrderId={setEditingOrderId} setItems={setCart} markup={markup} setMarkup={setMarkup} frete={frete} setFrete={setFrete} uniplusPriceMap={uniplusPriceMap} />}
      {page === "orders" && user && <Orders user={user} setPage={setPage} setCart={setCart} clientData={clientData} setEditingOrderId={setEditingOrderId} />}
      {page === "orders" && !user && <Login onLogin={login} setPage={setPage} />}
      {page === "adm" && user?.isAdmin && <AdminPage />}
      {page === "adm" && !user?.isAdmin && <Login onLogin={login} setPage={setPage} />}
      {page === "financeiro" && user?.isAdmin && <FinanceiroPage />}
      {page === "financeiro" && !user?.isAdmin && <Login onLogin={login} setPage={setPage} />}
      {page === "dre" && user?.isAdmin && <DrePage />}
      {page === "dre" && !user?.isAdmin && <Login onLogin={login} setPage={setPage} />}
      {page === "nf" && user?.isAdmin && <NFPage />}
      {page === "nf" && !user?.isAdmin && <Login onLogin={login} setPage={setPage} />}
      {page === "conciliacao" && user?.isAdmin && <ConciliacaoPage />}
      {page === "conciliacao" && !user?.isAdmin && <Login onLogin={login} setPage={setPage} />}
      {page === "graficos" && user && <GraficosPage />}
      {page === "graficos" && !user && <Login onLogin={login} setPage={setPage} />}
    </div>
  );
}
