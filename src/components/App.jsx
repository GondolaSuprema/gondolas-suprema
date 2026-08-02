import { useState, useEffect, useMemo, useRef } from "react";
import { sharePDFWhatsApp, generatePDF } from "../lib/pdf";
import { supabase } from "../lib/supabase";

const COLORS = {
  bg: "#000000",
  surface: "#101012",
  card: "#17171B",
  border: "#2A2A31",
  accent: "#F5A623",
  accentHover: "#FFBD4A",
  text: "#ECEDF1",
  textMuted: "#8B8C97",
  textDim: "#56575F",
  success: "#34D399",
  danger: "#F87171",
  white: "#FFFFFF",
  orange: "#F5A623",
};

// Contorno neon dourado sutil aplicado a todos os cards/painéis do sistema.
// Ring fino no dourado da marca + brilho suave — discreto pra não poluir.
const CARD_GLOW = "0 0 0 1px rgba(245,166,35,0.24), 0 0 12px rgba(245,166,35,0.11)";

const CATEGORIES = [
  { key: "gondolas-parede", label: "Gôndolas de Parede" },
  { key: "gondolas-centro", label: "Gôndolas de Centro" },
  { key: "ponta-gondola", label: "Ponta de Gôndola" },
  { key: "mpp", label: "MPP" },
  { key: "slim", label: "Slim" },
  { key: "moveis", label: "Móveis" },
  { key: "mdf", label: "MDF" },
  { key: "outros", label: "Outros Produtos" },
  { key: "mpp-china", label: "MPP China" },
  { key: "fabrica", label: "Fábrica" },
];

const VARIANTS_GONDOLA_PAREDE = [
  { key: "altura", label: "Altura", options: ["1,37m", "1,70m", "2,00m"] },
  { key: "cor", label: "Cor", options: ["Branca", "Preta"] },
];

const VARIANTS_MPP = [
  { key: "largura", label: "Largura", options: ["1200mm", "1800mm"] },
  { key: "niveis", label: "Níveis", options: ["3", "4", "5"] },
];

const VARIANTS_SLIM_AMAPA = [
  { key: "largura", label: "Largura", options: ["1200mm", "1800mm"] },
  { key: "niveis",  label: "Níveis",  options: ["4", "5", "6"] },
  { key: "cor",     label: "Cor",     options: ["C+L", "Branco"] },
];

const VARIANTS_SLIM_SA = [
  { key: "largura", label: "Largura", options: ["1200mm", "1800mm"] },
  { key: "niveis",  label: "Níveis",  options: ["4", "5", "6"] },
  { key: "cor",     label: "Cor",     options: ["C+L"] },
];

// Receitas: cada produto + variante recebe uma lista [uniplusId, qtd]
// Quando o preco do componente muda em produtos_uniplus, o preco da gondola se atualiza automaticamente.
const PRODUCT_RECIPES = {
  // Parede Inicial c/ Bandeja - 1,37m - Branca
  "100|1,37m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 2],   // COLUNA PAREDE 1,06M BASE 40CM BRANCO
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-branco-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR P/ 1,37M BRANCO
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 4],  // PAINEL 90*34CM BRANCO
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],   // BANDEJA 40*90CM BRANCA
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 3],   // BANDEJA 30*90CM BRANCA
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 3],   // PAR SLG 30CM BRANCO
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],  // PORTA ETIQUETA 895MM LARANJA
  ],
  // Parede Continuação c/ Bandeja - 1,37m - Branca
  "101|1,37m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 3],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 3],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
  ],
  // Parede Inicial c/ Bandeja - 1,70m - Branca
  "100|1,70m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 2],   // COLUNA PAREDE 1,06M BASE 40CM BRANCO
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-branco-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR P/ 1,70M BRANCO
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 5],  // PAINEL 90*34CM BRANCO
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],   // BANDEJA 40*90CM BRANCA
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 4],   // BANDEJA 30*90CM BRANCA
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 4],   // PAR SLG 30CM BRANCO
    ["nome:fit-porta-etiqueta-895mm-laranja", 5],  // PORTA ETIQUETA 895MM LARANJA
  ],
  // Parede Continuação c/ Bandeja - 1,70m - Branca (1 coluna a menos que a Inicial)
  "101|1,70m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 4],
    ["nome:fit-porta-etiqueta-895mm-laranja", 5],
  ],
  // Parede Inicial c/ Bandeja - 2,00m - Branca
  "100|2,00m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 2],   // COLUNA PAREDE 1,06M BASE 40CM BRANCO
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-branco-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR P/ 2,02M BRANCO
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 6],  // PAINEL 90*34CM BRANCO
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],   // BANDEJA 40*90CM BRANCA
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 4],   // BANDEJA 30*90CM BRANCA
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 4],   // PAR SLG 30CM BRANCO
    ["nome:fit-porta-etiqueta-895mm-laranja", 5],  // PORTA ETIQUETA 895MM LARANJA
  ],
  // Parede Continuação c/ Bandeja - 2,00m - Branca (1 coluna a menos que a Inicial)
  "101|2,00m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 4],
    ["nome:fit-porta-etiqueta-895mm-laranja", 5],
  ],

  // ── PRETAS (mesma estrutura das brancas, componentes pretos) ──
  // Parede Inicial c/ Bandeja - 1,37m - Preta
  "100|1,37m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 2],   // COLUNA PAREDE 1,06M PRETO
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-preto-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,37M PRETO
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 4],  // PAINEL 90*34CM PRETO
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],   // BANDEJA 40*90CM PRETA
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 3],   // BANDEJA 30*90CM PRETA
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 3],   // PAR SLG 30CM PRETO
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],  // PORTA ETIQUETA (sem cor)
  ],
  // Parede Continuação c/ Bandeja - 1,37m - Preta
  "101|1,37m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 3],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 3],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
  ],
  // Parede Inicial c/ Bandeja - 1,70m - Preta
  "100|1,70m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-preto-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,70M PRETO
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 4],
    ["nome:fit-porta-etiqueta-895mm-laranja", 5],
  ],
  // Parede Continuação c/ Bandeja - 1,70m - Preta
  "101|1,70m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 4],
    ["nome:fit-porta-etiqueta-895mm-laranja", 5],
  ],
  // Parede Inicial c/ Bandeja - 2,00m - Preta
  "100|2,00m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-preto-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 2,02M PRETO
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 4],
    ["nome:fit-porta-etiqueta-895mm-laranja", 5],
  ],
  // Parede Continuação c/ Bandeja - 2,00m - Preta
  "101|2,00m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 4],
    ["nome:fit-porta-etiqueta-895mm-laranja", 5],
  ],

  // ── PAREDE C/ GANCHO ──
  // Parede Inicial c/ Gancho - 1,37m - Branca
  "102|1,37m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 2],   // COLUNA PAREDE 1,06M BRANCO
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-branco-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,37M BRANCO
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 4],  // PAINEL 90*34CM BRANCO
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],   // BANDEJA 40*90CM BRANCA (base mantida)
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 1],   // BANDEJA 30*90CM BRANCA (era 3, tirou 2)
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 1],   // PAR SLG 30CM BRANCO (era 3, tirou 2)
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],  // PORTA ETIQUETA (era 4, tirou 2)
    ["nome:amapa-fit-regua-90cm-branco-un", 3],  // RÉGUA 90CM BRANCO
    ["nome:amapa-gancho-simples-25cm-branco", 15], // GANCHO SIMPLES 25CM BRANCO (5 por régua)
  ],
  // Parede Continuação c/ Gancho - 1,37m - Branca (1 coluna a menos)
  "103|1,37m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-regua-90cm-branco-un", 3],
    ["nome:amapa-gancho-simples-25cm-branco", 15],
  ],
  // Parede Inicial c/ Gancho - 1,70m - Branca
  "102|1,70m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 2],   // COLUNA PAREDE 1,06M BRANCO
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-branco-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,70M BRANCO
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 5],  // PAINEL 90*34CM BRANCO (4+1)
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],   // BANDEJA 40*90CM BRANCA
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 1],   // BANDEJA 30*90CM BRANCA
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 1],   // PAR SLG 30CM BRANCO
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],  // PORTA ETIQUETA
    ["nome:amapa-fit-regua-90cm-branco-un", 4],  // RÉGUA 90CM BRANCO (2+1)
    ["nome:amapa-gancho-simples-25cm-branco", 20], // GANCHO SIMPLES 25CM BRANCO (10+5)
  ],
  // Parede Continuação c/ Gancho - 1,70m - Branca (1 coluna a menos)
  "103|1,70m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-regua-90cm-branco-un", 4],
    ["nome:amapa-gancho-simples-25cm-branco", 20],
  ],
  // Parede Inicial c/ Gancho - 2,00m - Branca
  "102|2,00m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-branco-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 2,02M BRANCO
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 6],  // PAINEL (5+1)
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-regua-90cm-branco-un", 4],  // REGUA (igual 1,70m)
    ["nome:amapa-gancho-simples-25cm-branco", 20], // GANCHO (igual 1,70m)
  ],
  // Parede Continuação c/ Gancho - 2,00m - Branca (1 coluna a menos)
  "103|2,00m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-regua-90cm-branco-un", 4],
    ["nome:amapa-gancho-simples-25cm-branco", 20],
  ],

  // ── PAREDE C/ GANCHO PRETA (mesma estrutura, componentes pretos) ──
  // Parede Inicial c/ Gancho - 1,37m - Preta
  "102|1,37m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 2],   // COLUNA PAREDE 1,06M PRETO
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-preto-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,37M PRETO
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 4],  // PAINEL PRETO
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],   // BANDEJA 40*90 PRETA
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 1],   // BANDEJA 30*90 PRETA
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 1],   // PAR SLG PRETO
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],  // PORTA ETIQUETA
    ["nome:amapa-fit-regua-90cm-preto-un", 3],  // RÉGUA 90CM PRETO
    ["nome:amapa-gancho-simples-25cm-preto", 15], // GANCHO 25CM PRETO
  ],
  // Parede Continuação c/ Gancho - 1,37m - Preta
  "103|1,37m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-regua-90cm-preto-un", 3],
    ["nome:amapa-gancho-simples-25cm-preto", 15],
  ],
  // Parede Inicial c/ Gancho - 1,70m - Preta
  "102|1,70m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-preto-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,70M PRETO
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-regua-90cm-preto-un", 4],
    ["nome:amapa-gancho-simples-25cm-preto", 20],
  ],
  // Parede Continuação c/ Gancho - 1,70m - Preta
  "103|1,70m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-regua-90cm-preto-un", 4],
    ["nome:amapa-gancho-simples-25cm-preto", 20],
  ],
  // Parede Inicial c/ Gancho - 2,00m - Preta
  "102|2,00m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-preto-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 2,02M PRETO
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-regua-90cm-preto-un", 4],
    ["nome:amapa-gancho-simples-25cm-preto", 20],
  ],
  // Parede Continuação c/ Gancho - 2,00m - Preta
  "103|2,00m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-regua-90cm-preto-un", 4],
    ["nome:amapa-gancho-simples-25cm-preto", 20],
  ],

  // ── PAREDE C/ CESTO (estrutura do Gancho, sem ganchos, reguas trocadas por cestos) ──
  // Parede Inicial c/ Cesto - 1,37m - Branca
  "104|1,37m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 2],   // COLUNA PAREDE 1,06M BRANCO
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-branco-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,37M BRANCO
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 4],  // PAINEL BRANCO
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],   // BANDEJA 40*90 BRANCA
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 1],   // BANDEJA 30*90 BRANCA
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 1],   // PAR SLG BRANCO
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],  // PORTA ETIQUETA
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-branco", 3],  // CESTO 2 DIVISORIAS BRANCO
  ],
  // Parede Continuação c/ Cesto - 1,37m - Branca
  "105|1,37m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-branco", 3],
  ],
  // Parede Inicial c/ Cesto - 1,70m - Branca
  "104|1,70m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-branco-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,70M BRANCO
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-branco", 4],
  ],
  // Parede Continuação c/ Cesto - 1,70m - Branca
  "105|1,70m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-branco", 4],
  ],
  // Parede Inicial c/ Cesto - 2,00m - Branca
  "104|2,00m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-branco-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 2,02M BRANCO
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-branco", 4],
  ],
  // Parede Continuação c/ Cesto - 2,00m - Branca
  "105|2,00m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-branco", 4],
  ],

  // ── PAREDE C/ CESTO PRETA ──
  // Parede Inicial c/ Cesto - 1,37m - Preta
  "104|1,37m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 2],   // COLUNA PAREDE 1,06M PRETO
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-preto-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,37M PRETO
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 4],  // PAINEL PRETO
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],   // BANDEJA 40*90 PRETA
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 1],   // BANDEJA 30*90 PRETA
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 1],   // PAR SLG PRETO
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],  // PORTA ETIQUETA
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-preto", 3],  // CESTO 2 DIVISORIAS PRETO
  ],
  // Parede Continuação c/ Cesto - 1,37m - Preta
  "105|1,37m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-preto", 3],
  ],
  // Parede Inicial c/ Cesto - 1,70m - Preta
  "104|1,70m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-preto", 4],
  ],
  // Parede Continuação c/ Cesto - 1,70m - Preta
  "105|1,70m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-preto", 4],
  ],
  // Parede Inicial c/ Cesto - 2,00m - Preta
  "104|2,00m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-preto", 4],
  ],
  // Parede Continuação c/ Cesto - 2,00m - Preta
  "105|2,00m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-preto", 4],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // ── GÔNDOLAS DE CENTRO ──
  // Mesma estrutura da Parede, com:
  //   - COLUNA CENTRO no lugar da COLUNA PAREDE (diversos-73 br / 74 pr)
  //   - Bandejas, pares SLG, porta-etiqueta, réguas, ganchos e cestos DOBRADOS (2 lados)
  //   - Painéis na MESMA quantidade da Parede
  //   - Colunas complementares (75-80) iguais à Parede
  // ═══════════════════════════════════════════════════════════════════

  // ── CENTRO C/ BANDEJA BRANCA ──
  // Centro Inicial c/ Bandeja - 1,37m - Branca
  "200|1,37m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 2],   // COLUNA CENTRO 1,06M BASE 40CM BRANCO
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-branco-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,37M BRANCO
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 4],  // PAINEL 90*34CM BRANCO (mesma qtd da Parede)
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],   // BANDEJA 40*90CM BRANCA (dobrada)
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 6],   // BANDEJA 30*90CM BRANCA (dobrada)
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 6],   // PAR SLG 30CM BRANCO (dobrado)
    ["nome:fit-porta-etiqueta-895mm-laranja", 8],  // PORTA ETIQUETA 895MM LARANJA (dobrado)
  ],
  // Centro Continuação c/ Bandeja - 1,37m - Branca
  "201|1,37m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 6],
    ["nome:fit-porta-etiqueta-895mm-laranja", 8],
  ],
  // Centro Inicial c/ Bandeja - 1,70m - Branca
  "200|1,70m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-branco-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,70M BRANCO
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 8],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 8],
    ["nome:fit-porta-etiqueta-895mm-laranja", 10],
  ],
  // Centro Continuação c/ Bandeja - 1,70m - Branca
  "201|1,70m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 8],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 8],
    ["nome:fit-porta-etiqueta-895mm-laranja", 10],
  ],
  // Centro Inicial c/ Bandeja - 2,00m - Branca
  "200|2,00m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-branco-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 2,02M BRANCO
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 8],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 8],
    ["nome:fit-porta-etiqueta-895mm-laranja", 10],
  ],
  // Centro Continuação c/ Bandeja - 2,00m - Branca
  "201|2,00m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 8],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 8],
    ["nome:fit-porta-etiqueta-895mm-laranja", 10],
  ],

  // ── CENTRO C/ BANDEJA PRETA ──
  // Centro Inicial c/ Bandeja - 1,37m - Preta
  "200|1,37m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 2],   // COLUNA CENTRO 1,06M BASE 40CM PRETO
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-preto-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,37M PRETO
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 4],  // PAINEL 90*34CM PRETO
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],   // BANDEJA 40*90 PRETA
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 6],   // BANDEJA 30*90 PRETA
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 6],   // PAR SLG PRETO
    ["nome:fit-porta-etiqueta-895mm-laranja", 8],  // PORTA ETIQUETA (sem cor)
  ],
  // Centro Continuação c/ Bandeja - 1,37m - Preta
  "201|1,37m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 6],
    ["nome:fit-porta-etiqueta-895mm-laranja", 8],
  ],
  // Centro Inicial c/ Bandeja - 1,70m - Preta
  "200|1,70m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-preto-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,70M PRETO
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 8],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 8],
    ["nome:fit-porta-etiqueta-895mm-laranja", 10],
  ],
  // Centro Continuação c/ Bandeja - 1,70m - Preta
  "201|1,70m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 8],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 8],
    ["nome:fit-porta-etiqueta-895mm-laranja", 10],
  ],
  // Centro Inicial c/ Bandeja - 2,00m - Preta
  "200|2,00m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-preto-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 2,02M PRETO
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 8],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 8],
    ["nome:fit-porta-etiqueta-895mm-laranja", 10],
  ],
  // Centro Continuação c/ Bandeja - 2,00m - Preta
  "201|2,00m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 8],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 8],
    ["nome:fit-porta-etiqueta-895mm-laranja", 10],
  ],

  // ── CENTRO C/ GANCHO BRANCO ──
  // Estrutura do Bandeja c/ menos bandejas (1×40 + 2×30 dobrado), + réguas e ganchos dobrados
  // Centro Inicial c/ Gancho - 1,37m - Branca
  "202|1,37m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],   // BANDEJA 40 base (dobrada)
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 2],   // BANDEJA 30 (1 dobrada → 2)
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 2],   // PAR SLG (1 dobrado → 2)
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],  // PORTA ETIQUETA (2 dobrado → 4)
    ["nome:amapa-fit-regua-90cm-branco-un", 6],  // RÉGUA 90CM BRANCO (2 dobradas → 4)
    ["nome:amapa-gancho-simples-25cm-branco", 30], // GANCHO SIMPLES 25CM BRANCO (10 dobrado → 20)
  ],
  // Centro Continuação c/ Gancho - 1,37m - Branca
  "203|1,37m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-regua-90cm-branco-un", 6],
    ["nome:amapa-gancho-simples-25cm-branco", 30],
  ],
  // Centro Inicial c/ Gancho - 1,70m - Branca
  "202|1,70m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-regua-90cm-branco-un", 8],  // 3 dobradas → 6
    ["nome:amapa-gancho-simples-25cm-branco", 40], // 15 dobrado → 30
  ],
  // Centro Continuação c/ Gancho - 1,70m - Branca
  "203|1,70m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-regua-90cm-branco-un", 8],
    ["nome:amapa-gancho-simples-25cm-branco", 40],
  ],
  // Centro Inicial c/ Gancho - 2,00m - Branca
  "202|2,00m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-regua-90cm-branco-un", 8],
    ["nome:amapa-gancho-simples-25cm-branco", 40],
  ],
  // Centro Continuação c/ Gancho - 2,00m - Branca
  "203|2,00m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-regua-90cm-branco-un", 8],
    ["nome:amapa-gancho-simples-25cm-branco", 40],
  ],

  // ── CENTRO C/ GANCHO PRETO ──
  // Centro Inicial c/ Gancho - 1,37m - Preta
  "202|1,37m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-regua-90cm-preto-un", 6],  // RÉGUA 90CM PRETO (dobrada)
    ["nome:amapa-gancho-simples-25cm-preto", 30], // GANCHO 25CM PRETO (dobrado)
  ],
  // Centro Continuação c/ Gancho - 1,37m - Preta
  "203|1,37m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-regua-90cm-preto-un", 6],
    ["nome:amapa-gancho-simples-25cm-preto", 30],
  ],
  // Centro Inicial c/ Gancho - 1,70m - Preta
  "202|1,70m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-regua-90cm-preto-un", 8],
    ["nome:amapa-gancho-simples-25cm-preto", 40],
  ],
  // Centro Continuação c/ Gancho - 1,70m - Preta
  "203|1,70m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-regua-90cm-preto-un", 8],
    ["nome:amapa-gancho-simples-25cm-preto", 40],
  ],
  // Centro Inicial c/ Gancho - 2,00m - Preta
  "202|2,00m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-regua-90cm-preto-un", 8],
    ["nome:amapa-gancho-simples-25cm-preto", 40],
  ],
  // Centro Continuação c/ Gancho - 2,00m - Preta
  "203|2,00m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-regua-90cm-preto-un", 8],
    ["nome:amapa-gancho-simples-25cm-preto", 40],
  ],

  // ── CENTRO C/ CESTO BRANCO ──
  // Estrutura do Gancho sem ganchos/réguas, com cestos dobrados
  // Centro Inicial c/ Cesto - 1,37m - Branca
  "204|1,37m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-branco", 6],  // CESTO 2 DIVISORIAS BRANCO (2 dobrado → 4)
  ],
  // Centro Continuação c/ Cesto - 1,37m - Branca
  "205|1,37m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-branco", 6],
  ],
  // Centro Inicial c/ Cesto - 1,70m - Branca
  "204|1,70m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-branco", 8],  // 4 dobrado → 8
  ],
  // Centro Continuação c/ Cesto - 1,70m - Branca
  "205|1,70m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-branco", 8],
  ],
  // Centro Inicial c/ Cesto - 2,00m - Branca
  "204|2,00m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-branco", 8],
  ],
  // Centro Continuação c/ Cesto - 2,00m - Branca
  "205|2,00m|Branca": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-branco-unidade", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-branco-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-branco-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-branca-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-branco", 8],
  ],

  // ── CENTRO C/ CESTO PRETO ──
  // Centro Inicial c/ Cesto - 1,37m - Preta
  "204|1,37m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-preto", 6],  // CESTO 2 DIVISORIAS PRETO (dobrado)
  ],
  // Centro Continuação c/ Cesto - 1,37m - Preta
  "205|1,37m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-preto", 6],
  ],
  // Centro Inicial c/ Cesto - 1,70m - Preta
  "204|1,70m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-preto", 8],
  ],
  // Centro Continuação c/ Cesto - 1,70m - Preta
  "205|1,70m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 5],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-preto", 8],
  ],
  // Centro Inicial c/ Cesto - 2,00m - Preta
  "204|2,00m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-preto", 8],
  ],
  // Centro Continuação c/ Cesto - 2,00m - Preta
  "205|2,00m|Preta": [
    ["nome:amapa-fit-40kg-coluna-centro-1-06m-base-40cm-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-preto-unidade-ch-18", 1],
    ["nome:amapa-fit-painel-90-34cm-preto-unidade-ch-26", 6],
    ["nome:amapa-fit-40kg-bandeja-40-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-bandeja-30-90cm-preta-unidade-ch-26", 2],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 2],
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
    ["nome:amapa-fit-cesto-c-2-divisorias-370-900mm-preto", 8],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // ── PONTA DE GÔNDOLA c/ BANDEJA ──
  // Coluna e complementar = mesmas da Parede
  // Painel troca p/ AMAPA FIT PAINEL PONTA 78×34 (133/134)
  // Bandeja 40 troca p/ AMAPA FIT 60KG BANDEJA PONTA 40×78 (90/91)
  // Bandeja 30 troca p/ AMAPA FIT 40KG BANDEJA PONTA 30×78 (69/70)
  // Par SLG e porta-etiqueta = mesmos
  // Quantidades = iguais à Parede c/ Bandeja
  // ═══════════════════════════════════════════════════════════════════

  // Ponta c/ Bandeja - 1,37m - Branca
  "300|1,37m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 2],   // COLUNA PAREDE 1,06M BRANCO
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-branco-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,37M BRANCO
    ["nome:amapa-fit-painel-ponta-78-34cm-branco-unidade", 4],  // PAINEL PONTA 78*34 BRANCO
    ["nome:amapa-fit-60kg-bandeja-ponta-40-78cm-branca-unidade-ch-22", 1],   // BANDEJA PONTA 40*78 BRANCA
    ["nome:amapa-fit-40kg-bandeja-ponta-30-78cm-branca-unidade-ch-26", 3],   // BANDEJA PONTA 30*78 BRANCA
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 3],   // PAR SLG 30CM BRANCO
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],  // PORTA ETIQUETA
  ],
  // Ponta c/ Bandeja - 1,70m - Branca
  "300|1,70m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-branco-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,70M BRANCO
    ["nome:amapa-fit-painel-ponta-78-34cm-branco-unidade", 5],
    ["nome:amapa-fit-60kg-bandeja-ponta-40-78cm-branca-unidade-ch-22", 1],
    ["nome:amapa-fit-40kg-bandeja-ponta-30-78cm-branca-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 4],
    ["nome:fit-porta-etiqueta-895mm-laranja", 5],
  ],
  // Ponta c/ Bandeja - 2,00m - Branca
  "300|2,00m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-branco-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 2,02M BRANCO
    ["nome:amapa-fit-painel-ponta-78-34cm-branco-unidade", 6],
    ["nome:amapa-fit-60kg-bandeja-ponta-40-78cm-branca-unidade-ch-22", 1],
    ["nome:amapa-fit-40kg-bandeja-ponta-30-78cm-branca-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 4],
    ["nome:fit-porta-etiqueta-895mm-laranja", 5],
  ],

  // Ponta c/ Bandeja - 1,37m - Preta
  "300|1,37m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 2],   // COLUNA PAREDE 1,06M PRETO
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-preto-unidade-ch-18", 2],   // COLUNA COMPLEMENTAR 1,37M PRETO
    ["nome:amapa-fit-painel-ponta-78-34cm-preto-unidade", 4],  // PAINEL PONTA 78*34 PRETO
    ["nome:amapa-fit-60kg-bandeja-ponta-40-78cm-preta-unidade-ch-22", 1],   // BANDEJA PONTA 40*78 PRETA
    ["nome:amapa-fit-40kg-bandeja-ponta-30-78cm-preta-unidade-ch-26", 3],   // BANDEJA PONTA 30*78 PRETA
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 3],   // PAR SLG 30CM PRETO
    ["nome:fit-porta-etiqueta-895mm-laranja", 4],
  ],
  // Ponta c/ Bandeja - 1,70m - Preta
  "300|1,70m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-ponta-78-34cm-preto-unidade", 5],
    ["nome:amapa-fit-60kg-bandeja-ponta-40-78cm-preta-unidade-ch-22", 1],
    ["nome:amapa-fit-40kg-bandeja-ponta-30-78cm-preta-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 4],
    ["nome:fit-porta-etiqueta-895mm-laranja", 5],
  ],
  // Ponta c/ Bandeja - 2,00m - Preta
  "300|2,00m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-ponta-78-34cm-preto-unidade", 6],
    ["nome:amapa-fit-60kg-bandeja-ponta-40-78cm-preta-unidade-ch-22", 1],
    ["nome:amapa-fit-40kg-bandeja-ponta-30-78cm-preta-unidade-ch-26", 4],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 4],
    ["nome:fit-porta-etiqueta-895mm-laranja", 5],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // ── PONTA DE GÔNDOLA c/ GANCHO ──
  // Base: 1 bandeja 40 + 1 bandeja 30 (mantém só a base embaixo)
  // Réguas 78cm + ganchos c/ porta etiqueta 25cm (5 ganchos por régua)
  // Inicial = 2 colunas / Continuação = 1 coluna (igual Parede/Centro)
  // 1,37m: 4 painel, 3 régua, 15 gancho
  // 1,70m: 5 painel, 4 régua, 20 gancho (compl 1,70m)
  // 2,00m: 6 painel, 4 régua, 20 gancho (compl 2,02m)
  // ═══════════════════════════════════════════════════════════════════

  // Ponta Inicial c/ Gancho - 1,37m - Branca
  "302|1,37m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-ponta-78-34cm-branco-unidade", 4],
    ["nome:amapa-fit-60kg-bandeja-ponta-40-78cm-branca-unidade-ch-22", 1],
    ["nome:amapa-fit-40kg-bandeja-ponta-30-78cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-regua-78cm-branco-un", 3],
    ["nome:amapa-gancho-simples-com-porta-etiqueta-25cm-branco", 15],
  ],
  // Ponta Inicial c/ Gancho - 1,70m - Branca
  "302|1,70m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-ponta-78-34cm-branco-unidade", 5],
    ["nome:amapa-fit-60kg-bandeja-ponta-40-78cm-branca-unidade-ch-22", 1],
    ["nome:amapa-fit-40kg-bandeja-ponta-30-78cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-regua-78cm-branco-un", 4],
    ["nome:amapa-gancho-simples-com-porta-etiqueta-25cm-branco", 20],
  ],
  // Ponta Inicial c/ Gancho - 2,00m - Branca
  "302|2,00m|Branca": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-branco-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-ponta-78-34cm-branco-unidade", 6],
    ["nome:amapa-fit-60kg-bandeja-ponta-40-78cm-branca-unidade-ch-22", 1],
    ["nome:amapa-fit-40kg-bandeja-ponta-30-78cm-branca-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-branco-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-regua-78cm-branco-un", 4],
    ["nome:amapa-gancho-simples-com-porta-etiqueta-25cm-branco", 20],
  ],

  // Ponta Inicial c/ Gancho - 1,37m - Preta
  "302|1,37m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-37m-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-ponta-78-34cm-preto-unidade", 4],
    ["nome:amapa-fit-60kg-bandeja-ponta-40-78cm-preta-unidade-ch-22", 1],
    ["nome:amapa-fit-40kg-bandeja-ponta-30-78cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-regua-78cm-preto-un", 3],
    ["nome:amapa-gancho-simples-com-porta-etiqueta-25cm-preto", 15],
  ],
  // Ponta Inicial c/ Gancho - 1,70m - Preta
  "302|1,70m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-1-70m-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-ponta-78-34cm-preto-unidade", 5],
    ["nome:amapa-fit-60kg-bandeja-ponta-40-78cm-preta-unidade-ch-22", 1],
    ["nome:amapa-fit-40kg-bandeja-ponta-30-78cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-regua-78cm-preto-un", 4],
    ["nome:amapa-gancho-simples-com-porta-etiqueta-25cm-preto", 20],
  ],
  // Ponta Inicial c/ Gancho - 2,00m - Preta
  "302|2,00m|Preta": [
    ["nome:amapa-fit-40kg-coluna-parede-1-06m-base-40cm-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-40kg-coluna-complementar-p-2-02m-preto-unidade-ch-18", 2],
    ["nome:amapa-fit-painel-ponta-78-34cm-preto-unidade", 6],
    ["nome:amapa-fit-60kg-bandeja-ponta-40-78cm-preta-unidade-ch-22", 1],
    ["nome:amapa-fit-40kg-bandeja-ponta-30-78cm-preta-unidade-ch-26", 1],
    ["nome:amapa-fit-40kg-par-slg-30cm-preto-ch-16", 1],
    ["nome:fit-porta-etiqueta-895mm-laranja", 2],
    ["nome:amapa-fit-regua-78cm-preto-un", 4],
    ["nome:amapa-gancho-simples-com-porta-etiqueta-25cm-preto", 20],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // ── MPP 2000×800 S/MDF ──
  // Inicial = 2 montantes / Continuação = 1 montante (diversos-196)
  // Por nível: 1 par de longarina (218=1200mm, 219=1800mm)
  //          + transversinas 800mm GRUPO SA BRANCA (diversos-499): 2 p/ 1200, 3 p/ 1800
  // Sem MDF, sem sapata, sem travessa
  // ═══════════════════════════════════════════════════════════════════

  // ── MPP 2000×1200×800 INICIAL S/MDF (id 400) ──
  "400|1200mm|3": [
    ["nome:amapa-montante-mpp-500kg-2000x800mm-cinza-cristal", 2],   // MONTANTE 2000×800
    ["nome:amapa-par-longarina-z-mpp-500kg-1200mm-laranja", 3],   // PAR LONGARINA 1200MM
    ["nome:amapa-transversina-lateral-de-800mm-laranja", 6],   // TRANSVERSINA 800MM (2/par × 3 pares)
  ],
  "400|1200mm|4": [
    ["nome:amapa-montante-mpp-500kg-2000x800mm-cinza-cristal", 2],
    ["nome:amapa-par-longarina-z-mpp-500kg-1200mm-laranja", 4],
    ["nome:amapa-transversina-lateral-de-800mm-laranja", 8],
  ],
  "400|1200mm|5": [
    ["nome:amapa-montante-mpp-500kg-2000x800mm-cinza-cristal", 2],
    ["nome:amapa-par-longarina-z-mpp-500kg-1200mm-laranja", 5],
    ["nome:amapa-transversina-lateral-de-800mm-laranja", 10],
  ],
  // ── MPP 2000×1800×800 INICIAL S/MDF (id 400) ──
  "400|1800mm|3": [
    ["nome:amapa-montante-mpp-500kg-2000x800mm-cinza-cristal", 2],
    ["nome:amapa-par-longarina-z-mpp-500kg-1800mm-laranja", 3],   // PAR LONGARINA 1800MM
    ["nome:amapa-transversina-lateral-de-800mm-laranja", 9],   // TRANSVERSINA 800MM (3/par × 3 pares)
  ],
  "400|1800mm|4": [
    ["nome:amapa-montante-mpp-500kg-2000x800mm-cinza-cristal", 2],
    ["nome:amapa-par-longarina-z-mpp-500kg-1800mm-laranja", 4],
    ["nome:amapa-transversina-lateral-de-800mm-laranja", 12],
  ],
  "400|1800mm|5": [
    ["nome:amapa-montante-mpp-500kg-2000x800mm-cinza-cristal", 2],
    ["nome:amapa-par-longarina-z-mpp-500kg-1800mm-laranja", 5],
    ["nome:amapa-transversina-lateral-de-800mm-laranja", 15],
  ],

  // ── MPP 2000×1200×800 CONTINUAÇÃO S/MDF (id 401) ──
  "401|1200mm|3": [
    ["nome:amapa-montante-mpp-500kg-2000x800mm-cinza-cristal", 1],
    ["nome:amapa-par-longarina-z-mpp-500kg-1200mm-laranja", 3],
    ["nome:amapa-transversina-lateral-de-800mm-laranja", 6],
  ],
  "401|1200mm|4": [
    ["nome:amapa-montante-mpp-500kg-2000x800mm-cinza-cristal", 1],
    ["nome:amapa-par-longarina-z-mpp-500kg-1200mm-laranja", 4],
    ["nome:amapa-transversina-lateral-de-800mm-laranja", 8],
  ],
  "401|1200mm|5": [
    ["nome:amapa-montante-mpp-500kg-2000x800mm-cinza-cristal", 1],
    ["nome:amapa-par-longarina-z-mpp-500kg-1200mm-laranja", 5],
    ["nome:amapa-transversina-lateral-de-800mm-laranja", 10],
  ],
  // ── MPP 2000×1800×800 CONTINUAÇÃO S/MDF (id 401) ──
  "401|1800mm|3": [
    ["nome:amapa-montante-mpp-500kg-2000x800mm-cinza-cristal", 1],
    ["nome:amapa-par-longarina-z-mpp-500kg-1800mm-laranja", 3],
    ["nome:amapa-transversina-lateral-de-800mm-laranja", 9],
  ],
  "401|1800mm|4": [
    ["nome:amapa-montante-mpp-500kg-2000x800mm-cinza-cristal", 1],
    ["nome:amapa-par-longarina-z-mpp-500kg-1800mm-laranja", 4],
    ["nome:amapa-transversina-lateral-de-800mm-laranja", 12],
  ],
  "401|1800mm|5": [
    ["nome:amapa-montante-mpp-500kg-2000x800mm-cinza-cristal", 1],
    ["nome:amapa-par-longarina-z-mpp-500kg-1800mm-laranja", 5],
    ["nome:amapa-transversina-lateral-de-800mm-laranja", 15],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // ── SLIM 2000×600 S/MDF — versão AMAPA (montante AMAPA + long. AMAPA) ──
  // C+L = montante Cinza Cristal AMAPA (205) + longarina laranja
  // Branco = montante Branco AMAPA (204) + longarina laranja
  // Longarinas laranja AMAPA: 221 (1200mm) / 223 (1800mm)
  // Inicial = 2 montantes / Continuação = 1. Sem transversina, sem MDF
  // Níveis: 4, 5 e 6
  // ═══════════════════════════════════════════════════════════════════

  // ── SLIM INICIAL AMAPA (id 500) — C+L ──
  "500|1200mm|4|C+L": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-cinza-cristal", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 4],
  ],
  "500|1200mm|5|C+L": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-cinza-cristal", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 5],
  ],
  "500|1800mm|4|C+L": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-cinza-cristal", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 4],
  ],
  "500|1800mm|5|C+L": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-cinza-cristal", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 5],
  ],
  "500|1200mm|6|C+L": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-cinza-cristal", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 6],
  ],
  "500|1800mm|6|C+L": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-cinza-cristal", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 6],
  ],

  // ── SLIM INICIAL AMAPA (id 500) — BRANCO ──
  "500|1200mm|4|Branco": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-branco", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 4],
  ],
  "500|1200mm|5|Branco": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-branco", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 5],
  ],
  "500|1800mm|4|Branco": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-branco", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 4],
  ],
  "500|1800mm|5|Branco": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-branco", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 5],
  ],
  "500|1200mm|6|Branco": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-branco", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 6],
  ],
  "500|1800mm|6|Branco": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-branco", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 6],
  ],

  // ── SLIM CONTINUAÇÃO AMAPA (id 501) — C+L ──
  "501|1200mm|4|C+L": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-cinza-cristal", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 4],
  ],
  "501|1200mm|5|C+L": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-cinza-cristal", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 5],
  ],
  "501|1800mm|4|C+L": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-cinza-cristal", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 4],
  ],
  "501|1800mm|5|C+L": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-cinza-cristal", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 5],
  ],
  "501|1200mm|6|C+L": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-cinza-cristal", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 6],
  ],
  "501|1800mm|6|C+L": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-cinza-cristal", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 6],
  ],

  // ── SLIM CONTINUAÇÃO AMAPA (id 501) — BRANCO ──
  "501|1200mm|4|Branco": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-branco", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 4],
  ],
  "501|1200mm|5|Branco": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-branco", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 5],
  ],
  "501|1800mm|4|Branco": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-branco", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 4],
  ],
  "501|1800mm|5|Branco": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-branco", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 5],
  ],
  "501|1200mm|6|Branco": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-branco", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 6],
  ],
  "501|1800mm|6|Branco": [
    ["nome:amapa-montante-slim-250kg-2000x600mm-branco", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 6],
  ],

  // ═══════════════════════════════════════════════════════════════════
  // ── SLIM SA+AMAPA 2000×600 S/MDF (montante GRUPO SA + long. AMAPA) ──
  // C+L = montante Cinza Grafite GRUPO SA (458) + longarina laranja AMAPA
  // Inicial = 2 montantes / Continuação = 1. Sem transversina, sem MDF
  // Níveis: 4, 5 e 6
  // ═══════════════════════════════════════════════════════════════════

  // ── SLIM SA+AMAPA INICIAL (id 502) — C+L ──
  "502|1200mm|4|C+L": [
    ["nome:grupo-sa-montante-slim-200kg-2000x600mm-cinza-grafite", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 4],
  ],
  "502|1200mm|5|C+L": [
    ["nome:grupo-sa-montante-slim-200kg-2000x600mm-cinza-grafite", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 5],
  ],
  "502|1200mm|6|C+L": [
    ["nome:grupo-sa-montante-slim-200kg-2000x600mm-cinza-grafite", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 6],
  ],
  "502|1800mm|4|C+L": [
    ["nome:grupo-sa-montante-slim-200kg-2000x600mm-cinza-grafite", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 4],
  ],
  "502|1800mm|5|C+L": [
    ["nome:grupo-sa-montante-slim-200kg-2000x600mm-cinza-grafite", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 5],
  ],
  "502|1800mm|6|C+L": [
    ["nome:grupo-sa-montante-slim-200kg-2000x600mm-cinza-grafite", 2],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 6],
  ],

  // ── SLIM SA+AMAPA CONTINUAÇÃO (id 503) — C+L ──
  "503|1200mm|4|C+L": [
    ["nome:grupo-sa-montante-slim-200kg-2000x600mm-cinza-grafite", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 4],
  ],
  "503|1200mm|5|C+L": [
    ["nome:grupo-sa-montante-slim-200kg-2000x600mm-cinza-grafite", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 5],
  ],
  "503|1200mm|6|C+L": [
    ["nome:grupo-sa-montante-slim-200kg-2000x600mm-cinza-grafite", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1200mm-laranja", 6],
  ],
  "503|1800mm|4|C+L": [
    ["nome:grupo-sa-montante-slim-200kg-2000x600mm-cinza-grafite", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 4],
  ],
  "503|1800mm|5|C+L": [
    ["nome:grupo-sa-montante-slim-200kg-2000x600mm-cinza-grafite", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 5],
  ],
  "503|1800mm|6|C+L": [
    ["nome:grupo-sa-montante-slim-200kg-2000x600mm-cinza-grafite", 1],
    ["nome:amapa-par-longarina-z-slim-250kg-1800mm-laranja", 6],
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

  // ── GÔNDOLAS DE CENTRO (novo modelo com variantes) ──
  { id: 200, name: "Centro Inicial c/ Bandeja",     category: "gondolas-centro", icon: "🏬", price: 0, specs: {}, options: [], variants: VARIANTS_GONDOLA_PAREDE },
  { id: 201, name: "Centro Continuação c/ Bandeja", category: "gondolas-centro", icon: "🏬", price: 0, specs: {}, options: [], variants: VARIANTS_GONDOLA_PAREDE },
  { id: 202, name: "Centro Inicial c/ Gancho",      category: "gondolas-centro", icon: "🏬", price: 0, specs: {}, options: [], variants: VARIANTS_GONDOLA_PAREDE },
  { id: 203, name: "Centro Continuação c/ Gancho",  category: "gondolas-centro", icon: "🏬", price: 0, specs: {}, options: [], variants: VARIANTS_GONDOLA_PAREDE },
  { id: 204, name: "Centro Inicial c/ Cesto",       category: "gondolas-centro", icon: "🏬", price: 0, specs: {}, options: [], variants: VARIANTS_GONDOLA_PAREDE },
  { id: 205, name: "Centro Continuação c/ Cesto",   category: "gondolas-centro", icon: "🏬", price: 0, specs: {}, options: [], variants: VARIANTS_GONDOLA_PAREDE },

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
  // ── PONTA DE GÔNDOLA (novo modelo com variantes) ──
  { id: 300, name: "Ponta c/ Bandeja", category: "ponta-gondola", icon: "▶️", price: 0, specs: {}, options: [], variants: VARIANTS_GONDOLA_PAREDE },
  { id: 302, name: "Ponta c/ Gancho",     category: "ponta-gondola", icon: "🪝", price: 0, specs: {}, options: [], variants: VARIANTS_GONDOLA_PAREDE },
  // ── SLIM 2000×600 S/MDF (novo modelo com variantes) ──
  { id: 500, name: "Slim 2000×600 Inicial",            category: "slim", icon: "📦", price: 0, specs: {}, options: [], variants: VARIANTS_SLIM_AMAPA },
  { id: 501, name: "Slim 2000×600 Continuação",        category: "slim", icon: "📦", price: 0, specs: {}, options: [], variants: VARIANTS_SLIM_AMAPA },
  { id: 502, name: "Slim SA+Amapa 2000×600 Inicial",     category: "slim", icon: "📦", price: 0, specs: {}, options: [], variants: VARIANTS_SLIM_SA },
  { id: 503, name: "Slim SA+Amapa 2000×600 Continuação", category: "slim", icon: "📦", price: 0, specs: {}, options: [], variants: VARIANTS_SLIM_SA },
  // ── MPP 2000×800 S/MDF (novo modelo com variantes) ──
  { id: 400, name: "MPP 2000×800 Inicial S/MDF",     category: "mpp", icon: "🏗️", price: 0, specs: {}, options: [], variants: VARIANTS_MPP },
  { id: 401, name: "MPP 2000×800 Continuação S/MDF", category: "mpp", icon: "🏗️", price: 0, specs: {}, options: [], variants: VARIANTS_MPP },
  // ── MDF ──
  { id: 52, name: "MDF 1200x600", category: "mdf", icon: "🪵", price: 43.80, specs: { dimensao: "1200x600mm" }, options: [] },
  { id: 53, name: "MDF 1200x800", category: "mdf", icon: "🪵", price: 54.75, specs: { dimensao: "1200x800mm" }, options: [] },
  { id: 54, name: "MDF 1800x600", category: "mdf", icon: "🪵", price: 54.75, specs: { dimensao: "1800x600mm" }, options: [] },
  { id: 55, name: "MDF 1800x800", category: "mdf", icon: "🪵", price: 73.00, specs: { dimensao: "1800x800mm" }, options: [] },
];

const fmt = (v) => v === 0 ? "Sob consulta" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtMoney = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Data/hora atual em ISO com offset -03:00 (BRT). Evita bug do
// `new Date().toISOString()` que retorna UTC (dia seguinte após 21h).
// Usada quando salvamos data_emissao no banco pra manter fuso local.
const dataEmissaoBRT = () => {
  const d = new Date();
  const brt = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().replace(/Z$/, "-03:00");
};

// Retorna YYYY-MM da data em BRT (independente se veio salva em UTC).
// Usado pra agrupar notas por mês respeitando o fuso local.
const mesBRT = (dataStr) => {
  if (!dataStr) return "";
  const d = new Date(dataStr);
  if (isNaN(d)) return "";
  const brt = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 7);
};
const genId = () => Math.random().toString(36).substr(2, 9);
const catLabel = (key) => CATEGORIES.find(c => c.key === key)?.label || key;

// Texto das variantes escolhidas de um item do orçamento ("Largura 1200mm · Níveis 5 · Cor C+L").
// Itens novos têm opts_label pronto; antigos caem no join dos opts crus.
const itemOptsLabel = (it) => it?.opts_label || (Array.isArray(it?.opts) && it.opts.length ? it.opts.join(" · ") : "");

function getItemCusto(item, order) {
  const itemTotal = Number(item.total) || 0;
  const orderTotal = Number(order.total) || 0;
  const orderComissao = Number(order.comissao) || 0;
  const orderFrete = Number(order.frete) || 0;
  const orderDesconto = Number(order.desconto) || 0;
  // Total salvo = (subtotalCusto - desconto) + comissao + frete
  // => subtotalCusto esperado = total + desconto - comissao - frete
  const subtotalEsperado = orderTotal + orderDesconto - orderComissao - orderFrete;
  const somaItens = (order.items || []).reduce((s, i) => s + (Number(i.total) || 0), 0);
  // Se a soma dos itens ja bate com o custo (caso normal: items salvos em CUSTO PURO),
  // retorna o valor direto.
  if (subtotalEsperado <= 0 || somaItens <= 0) return itemTotal;
  if (Math.abs(somaItens - subtotalEsperado) < 1) return itemTotal;
  // Senao, items tem comissao embutida (legado): aplica fator pra extrair so o custo.
  return itemTotal * subtotalEsperado / somaItens;
}

function formatarCnpj(valor) {
  const d = (valor || "").replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

// Formata CPF (000.000.000-00) ou CNPJ (00.000.000/0001-00) automaticamente
// pelo número de dígitos digitados. Útil para campos que aceitam ambos.
function formatarCnpjOuCpf(valor) {
  const d = (valor || "").replace(/\D/g, "").slice(0, 14);
  // Se tem até 11 dígitos, formata como CPF; acima disso, vira CNPJ
  if (d.length <= 11) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
  }
  return formatarCnpj(d);
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

const pdfStyles = `@page{size:A4;margin:20mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Helvetica,Arial,sans-serif;padding:36px;color:#1a1a1a;max-width:800px;margin:auto;position:relative}.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.06;z-index:0;pointer-events:none;width:400px;height:auto}.content{position:relative;z-index:1}.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #F5A623;padding-bottom:18px;margin-bottom:24px}.logo-area{display:flex;align-items:center;gap:12px}.logo-area img{height:60px}.logo-text{font-size:10px;color:#666;line-height:1.5;margin-top:4px}.info{text-align:right;font-size:11px;color:#666;line-height:1.6}table{width:100%;border-collapse:collapse;margin:12px 0}th{background:#f5f5f5;text-align:left;padding:8px 10px;font-size:11px;border-bottom:2px solid #ddd;color:#555;text-transform:uppercase;letter-spacing:.5px}td{padding:8px 10px;border-bottom:1px solid #eee;font-size:12px;vertical-align:middle}.tr td{font-weight:700;font-size:14px;border-top:2px solid #333;border-bottom:none;padding-top:12px}.n{background:#fafafa;padding:14px;border-radius:6px;margin:16px 0;font-size:12px;color:#555}.ft{margin-top:32px;padding-top:12px;border-top:1px solid #eee;font-size:10px;color:#999;text-align:center}.foto-cell{width:54px;text-align:center}.foto-cell img{width:46px;height:46px;object-fit:contain;border-radius:4px;background:#fafafa}.pgto-title{font-size:13px;font-weight:700;color:#333;margin:18px 0 6px;text-transform:uppercase;letter-spacing:.5px}.pgto-info{font-size:12px;color:#555;margin:2px 0}.pgto-table th{font-size:10px;text-align:center}.pgto-table td{text-align:center;font-size:11px}.pgto-obs{font-size:11px;color:#888;font-style:italic;margin-top:8px}.pgto-2col td,.pgto-2col th{font-size:10px;padding:5px 7px}.pgto-table .gap{width:16px;background:transparent;border-left:none;border-right:none}tbody tr:nth-child(even){background:#fbfbfb}.resumo{width:100%;margin:0 0 8px}.resumo .row{display:flex;justify-content:space-between;align-items:center;padding:10px;font-size:12px;color:#555;border-bottom:1px solid #eee}.resumo .row span:last-child{font-weight:700;color:#1a1a1a;font-size:13px}.resumo .grand{display:flex;justify-content:space-between;align-items:center;padding:12px 10px;border-top:2px solid #333}.resumo .grand .lbl{font-size:14px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#1a1a1a}.resumo .grand .val{font-size:18px;font-weight:800;font-family:Georgia,'Times New Roman',serif;color:#F5A623}.resumo .frete-note{font-size:10px;color:#999;text-align:right;padding:6px 10px 0;font-style:italic}@media print{body{padding:0}.watermark{position:fixed;opacity:0.06}.resumo{box-shadow:none}}`;

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
  { parcelas: 1,  juros: 0.022 },
  { parcelas: 2,  juros: 0.033 },
  { parcelas: 3,  juros: 0.044 },
  { parcelas: 4,  juros: 0.055 },
  { parcelas: 5,  juros: 0.066 },
  { parcelas: 6,  juros: 0.077 },
  { parcelas: 7,  juros: 0.088 },
  { parcelas: 8,  juros: 0.100 },
  { parcelas: 9,  juros: 0.110 },
  { parcelas: 10, juros: 0.120 },
  { parcelas: 11, juros: 0.130 },
  { parcelas: 12, juros: 0.140 },
];

function buildPaymentSection(total, comissao) {
  const entrada = Number(comissao) || 0;
  if (!total || total <= entrada) return "";
  const saldo = total - entrada;
  const ops = TABELA_JUROS_BOLETO_HTML.map(({ parcelas, juros }) => {
    const totalParcelado = saldo * (1 + juros);
    return {
      parcelas,
      valorParcela: totalParcelado / parcelas,
      totalGeral: entrada + totalParcelado,
      acrescimo: juros === 0 ? "Sem juros" : "+" + (juros * 100).toFixed(1).replace(".", ",") + "%",
    };
  });
  const meio = Math.ceil(ops.length / 2);
  const esq = ops.slice(0, meio);
  const dir = ops.slice(meio);
  const cel = (o) => o
    ? `<td><strong>${o.parcelas}x</strong></td><td>${fmt(o.valorParcela)}</td><td>${fmt(o.totalGeral)}</td>`
    : `<td></td><td></td><td></td>`;
  const linhas = esq.map((o, i) =>
    `<tr>${cel(o)}<td class="gap"></td>${cel(dir[i])}</tr>`
  ).join("");
  const th = `<th>Parc.</th><th>Valor parcela</th><th>Total</th>`;
  return `
    <div class="pgto-title">Opções de Pagamento — Boleto</div>
    ${entrada > 0 ? `<div class="pgto-info"><strong>Entrada (à vista):</strong> ${fmt(entrada)}</div>` : ""}
    <div class="pgto-info"><strong>Saldo a parcelar:</strong> ${fmt(saldo)}</div>
    <table class="pgto-table pgto-2col">
      <thead><tr>${th}<th class="gap"></th>${th}</tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <div class="pgto-obs">*obs: Mediante análise de crédito</div>
  `;
}

// Cartão de crédito (Mercado Pago Point). taxa = taxa total decimal
// validada contra o simulador oficial. Gross-up: cobra-se total/(1-taxa)
// pra que a Suprema receba o valor cheio do orçamento.
const CARTAO_TAXAS_HTML = [
  { parcelas: 2,  taxa: 0.0404 }, { parcelas: 3,  taxa: 0.0489 },
  { parcelas: 4,  taxa: 0.0574 }, { parcelas: 5,  taxa: 0.0659 },
  { parcelas: 6,  taxa: 0.0744 }, { parcelas: 7,  taxa: 0.0897 },
  { parcelas: 8,  taxa: 0.0982 }, { parcelas: 9,  taxa: 0.1067 },
  { parcelas: 10, taxa: 0.1152 }, { parcelas: 11, taxa: 0.1237 },
  { parcelas: 12, taxa: 0.1322 }, { parcelas: 14, taxa: 0.1527 },
  { parcelas: 16, taxa: 0.1697 }, { parcelas: 18, taxa: 0.1867 },
];

function buildCardSection(total) {
  if (!total || total <= 0) return "";
  const ops = CARTAO_TAXAS_HTML.map(({ parcelas, taxa }) => {
    const totalCobrado = total / (1 - taxa);
    return { parcelas, valorParcela: totalCobrado / parcelas, totalCobrado };
  });
  // Divide em 2 blocos lado a lado pra economizar altura no orçamento
  const meio = Math.ceil(ops.length / 2);
  const esq = ops.slice(0, meio);
  const dir = ops.slice(meio);
  const cel = (o) => o
    ? `<td><strong>${o.parcelas}x</strong></td><td>${fmt(o.valorParcela)}</td><td>${fmt(o.totalCobrado)}</td>`
    : `<td></td><td></td><td></td>`;
  const linhas = esq.map((o, i) =>
    `<tr>${cel(o)}<td class="gap"></td>${cel(dir[i])}</tr>`
  ).join("");
  const th = `<th>Parc.</th><th>Valor parcela</th><th>Total</th>`;
  return `
    <div class="pgto-title">Opções de Pagamento — Cartão de Crédito</div>
    <table class="pgto-table pgto-2col">
      <thead><tr>${th}<th class="gap"></th>${th}</tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <div class="pgto-obs">*Parcelamento no cartão sujeito às taxas da operadora.</div>
  `;
}

function buildPdfPage({ orderNum, date, clientName, clientCompany, clientPhone, clientCnpj, clientEndereco, clientEmail, items, total, frete, notes, comissao, incluirParcelamento, incluirCartao }) {
  const tituloDestaque = clientCompany || (orderNum ? `#${orderNum}` : "");
  // Observações NÃO entram no PDF do cliente — campo é só p/ uso interno.
  // Esconde "China" só no PDF do cliente (mantem o nome original no banco e nas telas internas)
  const cleanForPdf = (s) => (s || "").replace(/\bchina\b/gi, "").replace(/\s+/g, " ").trim();
  // Distribui comissao (e frete) proporcionalmente em cada item, pra soma dos subtotais bater com o TOTAL
  const freteNum = Number(frete) || 0;
  const totalSemFrete = Math.max(0, (Number(total) || 0) - freteNum);
  const subtotalBase = (items || []).reduce((s, i) => s + (Number(i.total) || 0), 0);
  // Distribui só comissão/desconto proporcionalmente nos itens — o frete
  // sai como linha própria pra ficar discriminado pro cliente.
  const fator = (subtotalBase > 0 && totalSemFrete > 0) ? (totalSemFrete / subtotalBase) : 1;
  const subtotalDoItem = (i) => (Number(i.total) || 0) * fator;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Orçamento Gôndolas Suprema</title><style>${pdfStyles}</style></head><body>
<img class="watermark" src="${LOGO_B64}" alt=""/>
<div class="content">
<div class="hdr">
  <div><div class="logo-area"><img src="${LOGO_B64}" alt="Logo"/></div>
  <div class="logo-text">${COMPANY.razao}<br>CNPJ: ${COMPANY.cnpj}<br>${COMPANY.endereco}<br>Tel: ${COMPANY.telefone}<br>${COMPANY.site}</div></div>
  <div class="info"><strong style="font-size:16px;color:#333">ORÇAMENTO</strong>${tituloDestaque ? `<br><span style="color:#F5A623;font-weight:700;font-size:13px">${tituloDestaque}</span>` : ""}<br>Data: ${date}${clientCnpj ? `<br><strong>CNPJ:</strong> ${clientCnpj}` : ""}${clientName ? `<br><strong>Responsável:</strong> ${clientName}` : ""}${clientPhone ? `<br><strong>Tel:</strong> ${clientPhone}` : ""}${clientEmail ? `<br><strong>E-mail:</strong> ${clientEmail}` : ""}${clientEndereco ? `<br><strong>End:</strong> ${clientEndereco}` : ""}</div>
</div>
<table><thead><tr><th>Foto</th><th>Produto</th><th>Categoria</th><th>Qtd</th><th>Opcionais</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>
${items.map(i => `<tr><td class="foto-cell">${getIconHtml(i)}</td><td><strong>${cleanForPdf(i.name)}</strong></td><td>${cleanForPdf(i.cat)}</td><td>${i.qty}</td><td>${i.opts?.length ? i.opts.join(", ") : "—"}</td><td style="text-align:right">${fmt(subtotalDoItem(i))}</td></tr>`).join("")}
</tbody></table>
<div class="resumo">
${total === 0
  ? `<div class="grand"><span class="lbl">Total</span><span class="val">Sob consulta</span></div>`
  : (freteNum > 0
    ? `<div class="row"><span>Subtotal dos produtos</span><span>${fmt(totalSemFrete)}</span></div>
<div class="row"><span>Frete e entrega</span><span>${fmt(freteNum)}</span></div>
<div class="grand"><span class="lbl">Total à vista (com frete)</span><span class="val">${fmt(total)}</span></div>
<div class="frete-note">Entrega e montagem inclusas no valor do frete</div>`
    : `<div class="row"><span>Subtotal dos produtos</span><span>${fmt(total)}</span></div>
<div class="grand"><span class="lbl">Total à vista</span><span class="val">${fmt(total)}</span></div>`)}
</div>
${incluirParcelamento ? buildPaymentSection(total, comissao) : ""}
${incluirCartao ? buildCardSection(total) : ""}
<div class="ft">Orçamento válido por 15 dias • ${COMPANY.razao} • CNPJ: ${COMPANY.cnpj} • ${COMPANY.endereco} • ${COMPANY.telefone}</div>
</div>
</body></html>`;
}

// ─── NAV ───
function Nav({ page, setPage, user, onLogout, cartCount }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detecta mobile via media query (cliente only). Atualiza no resize.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update); // Safari antigo
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  // Fecha o drawer sempre que troca de página
  useEffect(() => { setMobileOpen(false); }, [page]);

  const tabs = [
    { k: "client", l: "Cliente" },
    { k: "catalog", l: "Produtos" },
    { k: "resumo", l: "Resumo" },
    { k: "orders", l: "Orçamentos" },
    { k: "leads", l: "Leads do Site" },
    { k: "graficos", l: "Gráficos" },
    { k: "mariana", l: "Painel Mariana" },
    { k: "logistica", l: "Logística" },
    { k: "comissoes", l: "Comissões" },
    { k: "adm", l: "ADM" },
    { k: "financeiro", l: "Financeiro" },
    { k: "dre", l: "DRE" },
    { k: "nf", l: "NF" },
    { k: "conciliacao", l: "Conciliação" },
  ].filter(i => canAccess(user, i.k));

  const activeTab = tabs.find(t => t.k === page);

  return (
    <>
      <nav style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, minWidth: 0, flex: 1 }}>
          <div onClick={() => setPage("client")} style={{ cursor: "pointer", fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, whiteSpace: "nowrap" }}>
            <span style={{ color: "#888" }}>Gôndolas</span><span style={{ color: COLORS.orange }}> Suprema</span>
          </div>
          {/* Desktop: menu horizontal */}
          {user && !isMobile && (
            <div style={{ display: "flex", gap: 2 }}>
              {tabs.map(i => (
                <button key={i.k} onClick={() => setPage(i.k)} style={{ background: page === i.k ? COLORS.orange + "18" : "transparent", color: page === i.k ? COLORS.orange : COLORS.textMuted, border: "none", padding: "7px 14px", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{i.l}</button>
              ))}
            </div>
          )}
          {/* Mobile: nome da aba ativa */}
          {user && isMobile && activeTab && (
            <div style={{ color: COLORS.orange, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeTab.l}</div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              {!isMobile && (
                <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Olá, <strong style={{ color: COLORS.text }}>{user.name}</strong></span>
              )}
              {!isMobile && (
                <button onClick={onLogout} style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Sair</button>
              )}
              {/* Mobile: hamburguer */}
              {isMobile && (
                <button
                  onClick={() => setMobileOpen(o => !o)}
                  aria-label="Abrir menu"
                  style={{ background: mobileOpen ? COLORS.orange + "18" : "transparent", border: `1px solid ${mobileOpen ? COLORS.orange : COLORS.border}`, color: mobileOpen ? COLORS.orange : COLORS.text, padding: "6px 12px", borderRadius: 7, cursor: "pointer", fontSize: 18, lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}
                >{mobileOpen ? "✕" : "☰"}</button>
              )}
            </>
          ) : (
            <button onClick={() => setPage("login")} style={{ background: COLORS.orange, border: "none", color: "#000", padding: "7px 18px", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Entrar</button>
          )}
        </div>
      </nav>

      {/* Drawer mobile: cobre a tela com a lista de abas */}
      {isMobile && mobileOpen && user && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: "fixed", top: 60, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }}
          />
          <div style={{ position: "fixed", top: 60, left: 0, right: 0, background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, zIndex: 100, maxHeight: "calc(100vh - 60px)", overflowY: "auto", padding: "8px 12px" }}>
            <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", padding: "8px 12px 4px" }}>
              Olá, <strong style={{ color: COLORS.text }}>{user.name}</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
              {tabs.map(i => (
                <button
                  key={i.k}
                  onClick={() => { setPage(i.k); setMobileOpen(false); }}
                  style={{ background: page === i.k ? COLORS.orange + "18" : "transparent", color: page === i.k ? COLORS.orange : COLORS.text, border: "none", padding: "12px 14px", borderRadius: 8, cursor: "pointer", fontSize: 15, fontWeight: page === i.k ? 700 : 500, fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}
                >{i.l}</button>
              ))}
              <button
                onClick={() => { setMobileOpen(false); onLogout(); }}
                style={{ background: COLORS.danger + "10", color: COLORS.danger, border: `1px solid ${COLORS.danger}30`, padding: "12px 14px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", textAlign: "left", marginTop: 8 }}
              >Sair</button>
            </div>
          </div>
        </>
      )}
    </>
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

  // Anti-autofill sem quebrar mobile: o truque antigo usava readOnly + onFocus
  // pra destravar, mas no celular (iOS Safari / Android) tocar num campo
  // readOnly não dispara o onFocus de forma confiável — o campo ficava
  // impossível de editar. Agora só autoComplete=off + campos-isca ocultos +
  // nomes não-padrão (gs_*_nofill), que já seguram o autofill sem travar nada.
  const noFill = {
    autoComplete: "off",
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
      // Consulta via API Route interna (servidor) — evita bloqueios
      // de CORS, extensoes e service workers no navegador.
      const resp = await fetch(`/api/consultar-cnpj/${cnpjLimpo}`, { cache: "no-store" });
      const d = await resp.json().catch(() => ({}));

      if (!resp.ok || d?.success === false) {
        if (resp.status === 404) {
          setErro("CNPJ não encontrado na Receita.");
        } else {
          setErro(d?.mensagem || "Falha ao consultar CNPJ. Tente novamente.");
        }
        return;
      }

      setForm(prev => ({
        ...prev,
        empresa:  prev.empresa.trim()  || d.razao_social || d.nome_fantasia || "",
        email:    prev.email.trim()    || d.email        || "",
        telefone: prev.telefone.trim() || formatarCelular(d.telefone || "") || "",
        endereco: prev.endereco.trim() || d.logradouro   || "",
        numero:   (prev.numero || "").trim() || d.numero || "",
        bairro:   prev.bairro.trim()   || d.bairro       || "",
        cep:      (prev.cep || "").trim() || d.cep       || "",
        cidade:   prev.cidade.trim()   || d.municipio    || "",
        estado:   prev.estado.trim()   || d.uf           || "",
      }));

      const faltando = [];
      if (!d.logradouro) faltando.push("rua");
      if (!d.numero) faltando.push("número");
      if (!d.email) faltando.push("e-mail");
      if (faltando.length > 0) {
        setErro(`Empresa encontrada. A Receita não tem ${faltando.join(", ")} cadastrado(s) — preencha manualmente.`);
      }
    } catch (e) {
      setErro("Falha de rede ao consultar o CNPJ. Verifique sua internet.");
    } finally {
      setBuscandoCnpj(false);
    }
  };

  const handleSave = () => {
    const faltando = [];
    if (!form.empresa.trim()) faltando.push("Nome da Empresa");
    // CNPJ não é mais obrigatório aqui — passou a ser exigido só na conclusão do orçamento
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

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 14, padding: 24 }}>
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
            <input {...noFill} placeholder="Ex: Supermercado Bom Preço" name="gs_empresa_nofill" value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value.toUpperCase() })} style={!form.empresa.trim() && erro ? inpErr : inp} />
          </div>
          <div>
            <label style={labelStyle}>CNPJ ou CPF <span style={{ color: COLORS.textDim, fontWeight: 400 }}>(opcional — obrigatório só na conclusão)</span></label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                {...noFill}
                placeholder="00.000.000/0001-00 ou 000.000.000-00"
                name="gs_cnpj_nofill"
                value={form.cnpj}
                onChange={e => setForm({ ...form, cnpj: formatarCnpjOuCpf(e.target.value) })}
                onFocus={(e) => e.target.removeAttribute("readonly")}
                onBlur={() => {
                  const c = (form.cnpj || "").replace(/\D/g, "");
                  // Auto-busca dados na Receita só se for CNPJ (14 dígitos)
                  if (c.length === 14 && !buscandoCnpj) buscarCnpj();
                }}
                maxLength={18}
                style={{ ...inp, flex: 1 }}
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
            <input {...noFill} placeholder="Nome do responsável" name="gs_resp_nofill" value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value.toUpperCase() })} style={inp} />
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
              <input {...noFill} placeholder="Ex: Av. Brasil" name="gs_end_nofill" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value.toUpperCase() })} style={inp} />
            </div>
            <div>
              <label style={labelStyle}>Número</label>
              <input {...noFill} placeholder="123" name="gs_num_nofill" value={form.numero || ""} onChange={e => setForm({ ...form, numero: e.target.value.toUpperCase() })} style={inp} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Bairro</label>
              <input {...noFill} placeholder="Bairro" name="gs_bairro_nofill" value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value.toUpperCase() })} style={inp} />
            </div>
            <div>
              <label style={labelStyle}>CEP (recomendado p/ NFe)</label>
              <input {...noFill} placeholder="00000-000" name="gs_cep_nofill" value={form.cep || ""} onChange={e => setForm({ ...form, cep: e.target.value })} style={inp} maxLength={9} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Cidade *</label>
              <input {...noFill} placeholder="Cidade" name="gs_cidade_nofill" value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value.toUpperCase() })} style={!form.cidade.trim() && erro ? inpErr : inp} />
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <input {...noFill} placeholder="UF" name="gs_uf_nofill" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value.toUpperCase() })} style={inp} maxLength={2} />
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
  // O isAdmin aqui (no array) tem outro proposito: excluir nao-vendedores
  // dos rankings/agregacoes. Zanella e socio (nao vende) entao fica true.
  // O acesso real as abas usa user.role + ROLE_PERMISSIONS abaixo.
  { id: "v1", name: "Alessandro Thonsen",   email: "ale.thonsen@gmail.com",            isAdmin: true  },
  { id: "v2", name: "Adelmo Martinello",    email: "adelmo_ade@yahoo.com.br",          isAdmin: false },
  { id: "v3", name: "Willian Zanella",      email: "comercial@gondolasuprema.com",     isAdmin: true  },
  { id: "v4", name: "João Marcos Martins",  email: "joaomarcosmartinsmot@gmail.com",   isAdmin: false },
];

// ─── PERMISSOES POR ROLE ───
// O role vem do raw_user_meta_data.role no Supabase Auth.
// Cada role lista exatamente quais abas de navegacao pode acessar.
// Mudar permissao = editar este objeto. Nao espalhe ifs pelo codigo.
const ROLE_PERMISSIONS = {
  // admin (Ale) ve todas, incluindo Comissoes consolidado de todos vendedores
  admin:           ["client", "catalog", "resumo", "orders", "leads", "graficos", "mariana", "logistica", "comissoes", "adm", "financeiro", "dre", "nf", "conciliacao"],
  // gestor (Zanella) — SEM comissoes (regra do Ale). TEM financeiro mas SOMENTE
  // LEITURA (escrita bloqueada via somenteLeitura no FinanceiroPage). TEM nf
  // com acesso COMPLETO (pode emitir/cancelar/CC-e via podeEmitir=gestor).
  gestor:          ["client", "catalog", "resumo", "orders", "leads", "graficos", "mariana", "logistica", "adm", "financeiro", "nf"],
  // vendedor (Adelmo) ve graficos + logistica (somente leitura, controlado
  // por canEditLogistica) + suas proprias comissoes + ADM SOMENTE LEITURA
  // (acoes de escrita escondidas via canEditAdm)
  vendedor:        ["client", "catalog", "resumo", "orders", "graficos", "logistica", "comissoes", "adm"],
  // vendedor_basico (Joao) so o operacional + suas proprias comissoes + logistica
  // (Joao tambem é montador/motorista, precisa ver a agenda de entregas)
  vendedor_basico: ["client", "catalog", "resumo", "orders", "logistica", "comissoes"],
};

// Abas com acesso restrito SOMENTE ao Alessandro (user.id === "v1"),
// independente da role. Mesmo que alguém vire admin no futuro, essas
// abas continuam exclusivas dele.
// financeiro e nf SAÍRAM desta lista: Zanella (gestor) VÊ o financeiro (só
// leitura) e tem acesso COMPLETO à NF (emite). DRE e Conciliação seguem
// exclusivos do Ale.
const ALE_ONLY_TABS = ["dre", "conciliacao"];

// canAccess(user, "adm") => true/false
// Se nao tiver role no metadata, deriva de isAdmin (back-compat).
function canAccess(user, tab) {
  if (!user) return false;
  // Acesso exclusivo do Ale (v1) pras 4 abas financeiras
  if (ALE_ONLY_TABS.includes(tab)) return user.id === "v1";
  const role = user.role || (user.isAdmin ? "admin" : "vendedor");
  return (ROLE_PERMISSIONS[role] || []).includes(tab);
}

// ─── PAINEL MARIANA (performance do agente de IA) ───
// Le tudo da funcao SECURITY DEFINER mariana_dashboard() no Supabase.
function fillDiasMariana(arr) {
  if (!arr || !arr.length) return [];
  const toDate = (s) => { const p = String(s).split("/"); return new Date(2026, Number(p[1]) - 1, Number(p[0])); };
  const map = {}; arr.forEach((x) => { map[x.d] = x.n; });
  const out = []; const last = toDate(arr[arr.length - 1].d);
  for (let t = toDate(arr[0].d); t <= last; t.setDate(t.getDate() + 1)) {
    const dd = String(t.getDate()).padStart(2, "0"), mm = String(t.getMonth() + 1).padStart(2, "0");
    const key = dd + "/" + mm; out.push({ d: key, n: map[key] || 0 });
  }
  return out;
}

function PainelMarianaPage() {
  const [d, setD] = useState(null);
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(true);
  const C = COLORS;

  const load = async () => {
    setLoading(true); setErro(null);
    const { data, error } = await supabase.rpc("mariana_dashboard");
    if (error) setErro(error.message); else setD(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const wrap = { maxWidth: 1000, margin: "0 auto", padding: "24px 18px 64px", fontFamily: "'DM Sans', sans-serif" };
  const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 };
  const secLabel = { fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: C.textMuted, fontWeight: 700, margin: "28px 0 12px" };
  const num = { fontVariantNumeric: "tabular-nums" };

  if (loading && !d) return <div style={wrap}><p style={{ color: C.textMuted }}>Carregando painel da Mariana…</p></div>;
  if (erro) return <div style={wrap}><p style={{ color: C.danger, marginBottom: 12 }}>Nao consegui carregar o painel: {erro}</p><button onClick={load} style={{ background: C.orange, color: "#000", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700, cursor: "pointer" }}>Tentar de novo</button></div>;
  if (!d) return null;

  const t = d.temp || {}, sat = d.satisfacao || {}, prod = d.produto || {}, re = d.reengaj || {};
  const tempTot = (t.quente || 0) + (t.morno || 0) + (t.frio || 0);
  const prodTot = Math.max(1, (prod.gondola || 0) + (prod.mpp || 0) + (prod.ambos || 0) + (prod.duvida || 0));
  const p = (n, tot) => (tot ? Math.round((100 * n) / tot) : 0);
  const dias = fillDiasMariana(d.por_dia);
  const maxDia = Math.max(1, ...dias.map((x) => x.n));
  const cons = d.consultores || [];
  const maxCons = Math.max(1, ...cons.map((c) => c.leads || 0));
  const comentarios = d.comentarios || [];
  const positivos = comentarios.filter((c) => c.nota >= 9).slice(0, 2);
  const detrator = comentarios.find((c) => c.nota <= 6);
  const dist = sat.dist || {};

  const Kpi = ({ cap, big, foot, accent }) => (
    <div style={{ background: C.card, border: `1px solid ${accent ? C.accent + "66" : C.border}`, borderRadius: 12, padding: "18px 18px 15px" }}>
      <p style={{ fontSize: 12.5, color: C.textMuted, margin: 0 }}>{cap}</p>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, lineHeight: 1, margin: "10px 0 4px", color: accent ? C.accent : C.white, ...num }}>{big}</p>
      <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>{foot}</p>
    </div>
  );
  const Meter = ({ label, right, w, color }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: C.text }}>
        <b style={{ fontWeight: 600 }}>{label}</b><span style={{ color: C.textMuted, fontWeight: 600, ...num }}>{right}</span>
      </div>
      <div style={{ height: 9, background: C.bg, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: "100%", width: Math.max(w, 2) + "%", background: color, borderRadius: 6, transition: "width .8s ease" }} />
      </div>
    </div>
  );

  return (
    <div style={wrap}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 14, borderBottom: `1px solid ${C.border}`, paddingBottom: 18 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: C.orange, fontWeight: 700, margin: "0 0 6px" }}>Pré-atendimento WhatsApp</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: C.white, fontSize: 26, margin: 0 }}>Painel da Mariana</h1>
          <p style={{ color: C.textMuted, fontSize: 13, margin: "6px 0 0" }}>Agente de IA que qualifica leads e encaminha pros consultores</p>
        </div>
        <div style={{ textAlign: "right", fontSize: 12, color: C.textMuted, lineHeight: 1.7 }}>
          <div>Período <b style={{ color: C.text }}>{d.periodo_ini} – {d.periodo_fim}</b></div>
          <div>Atualizado <b style={{ color: C.text }}>{d.gerado_em}</b></div>
          <button onClick={load} style={{ marginTop: 6, background: "transparent", color: C.orange, border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 12px", fontWeight: 600, cursor: "pointer", fontSize: 12 }}>↻ Atualizar</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 18 }}>
        <Kpi cap="Conversão (conversa → lead)" big={(d.conv_pct ?? "–") + "%"} foot={`${d.leads_unicos} leads de ${d.conversas} conversas`} accent />
        <Kpi cap="NPS da satisfação" big={sat.nps ?? "–"} foot="acima de 70 = excelência" accent />
        <Kpi cap="Nota média" big={String(sat.media ?? "–").replace(".", ",")} foot={`${sat.aval || 0} avaliações`} />
        <Kpi cap="Leads gerados" big={d.leads_unicos ?? "–"} foot={`~${String(d.msgs_media ?? "").replace(".", ",")} msgs por conversa`} />
      </div>

      {/* Trend */}
      <p style={secLabel}>Leads por dia</p>
      <div style={card}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 168, overflowX: "auto" }}>
          {dias.map((x, i) => (
            <div key={i} style={{ flex: 1, minWidth: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ fontSize: 10.5, color: C.text, fontWeight: 600, ...num }}>{x.n || ""}</div>
              <div style={{ width: "100%", maxWidth: 30, height: Math.max((x.n / maxDia) * 128, x.n === 0 ? 3 : 5) + "px", borderRadius: "4px 4px 2px 2px", background: x.n === 0 ? C.border : (x.n >= 12 ? C.accentHover : C.accent), transition: "height .7s ease" }} />
              <div style={{ fontSize: 9, color: C.textMuted, whiteSpace: "nowrap" }}>{x.d.slice(0, 2)}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: C.textMuted, margin: "12px 0 0" }}>Dias com barra cinza = sem leads (ex.: campanha Meta sem crédito). Volume acompanha o tráfego pago.</p>
      </div>

      {/* Temperatura + Produto */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginTop: 4 }}>
        <div>
          <p style={secLabel}>Temperatura dos leads</p>
          <div style={card}>
            <Meter label="🔥 Quente" right={`${t.quente || 0} · ${p(t.quente, tempTot)}%`} w={p(t.quente, tempTot)} color="#E0703A" />
            <Meter label="🌤 Morno" right={`${t.morno || 0} · ${p(t.morno, tempTot)}%`} w={p(t.morno, tempTot)} color={C.accent} />
            <Meter label="❄ Frio" right={`${t.frio || 0} · ${p(t.frio, tempTot)}%`} w={p(t.frio, tempTot)} color="#6F93AD" />
            <p style={{ fontSize: 12, color: C.textMuted, margin: "12px 0 0" }}>Pesquisa de satisfação sai só pros quentes.</p>
          </div>
        </div>
        <div>
          <p style={secLabel}>Interesse por produto</p>
          <div style={card}>
            <Meter label="Gôndolas" right={prod.gondola || 0} w={p(prod.gondola, prodTot)} color={C.accent} />
            <Meter label="Mini Porta Palete" right={prod.mpp || 0} w={p(prod.mpp, prodTot)} color={C.accentHover} />
            <Meter label="Ambos / em dúvida" right={(prod.ambos || 0) + (prod.duvida || 0)} w={p((prod.ambos || 0) + (prod.duvida || 0), prodTot)} color="#6F93AD" />
          </div>
        </div>
      </div>

      {/* Satisfação */}
      <p style={secLabel}>Notas de atendimento</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <div style={{ ...card, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, lineHeight: 1, color: C.success, ...num }}>{String(sat.media ?? "–").replace(".", ",")}</div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textMuted, marginTop: 6, fontWeight: 600 }}>Média / 10</div>
          <div style={{ display: "flex", gap: 5, marginTop: 14 }}>
            <div style={{ flex: Math.max(sat.promotores || 1, 1), height: 8, borderRadius: 4, background: C.success }} title="promotores" />
            <div style={{ flex: Math.max(sat.neutros || 0, 0.4), height: 8, borderRadius: 4, background: C.accent }} title="neutros" />
            <div style={{ flex: Math.max(sat.detratores || 0, 0.4), height: 8, borderRadius: 4, background: C.danger }} title="detratores" />
          </div>
          <p style={{ fontSize: 11.5, color: C.textMuted, margin: "10px 0 0" }}>{sat.promotores || 0} promotores · {sat.neutros || 0} neutro · {sat.detratores || 0} detrator</p>
        </div>
        <div style={card}>
          {[10, 9, 8, 7, 6, 1].filter((n) => dist[n]).map((n) => (
            <div key={n} style={{ display: "grid", gridTemplateColumns: "42px 1fr 26px", alignItems: "center", gap: 10, marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: C.accent, fontWeight: 700 }}>{n} ★</span>
              <div style={{ height: 9, background: C.bg, borderRadius: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: p(dist[n], sat.aval) + "%", background: n >= 9 ? C.success : (n <= 6 ? C.danger : C.accent), borderRadius: 6 }} />
              </div>
              <span style={{ textAlign: "right", color: C.textMuted, fontWeight: 600, ...num }}>{dist[n]}</span>
            </div>
          ))}
        </div>
      </div>

      {positivos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 12 }}>
          {positivos.map((c, i) => (
            <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 15px" }}>
              <p style={{ margin: "0 0 8px", fontStyle: "italic", color: C.text, fontSize: 13.5 }}>“{c.comentario}”</p>
              <span style={{ fontSize: 11.5, color: C.textMuted, fontWeight: 600 }}>Cliente · lead do {c.consultor || "—"} · {c.nota}★</span>
            </div>
          ))}
        </div>
      )}
      {detrator && (
        <div style={{ background: C.danger + "18", border: `1px solid ${C.danger}55`, borderRadius: 10, padding: "13px 15px", marginTop: 12, fontSize: 13.5, color: C.text, display: "flex", gap: 12 }}>
          <b style={{ color: C.danger, whiteSpace: "nowrap" }}>{detrator.nota}★</b>
          <div>Única nota baixa: <i>“{detrator.comentario}”</i> — geralmente cliente que queria falar com uma pessoa. Padrão a vigiar; já reforçado no prompt (aceitar e transferir na hora).</div>
        </div>
      )}

      {/* Consultores + Reengajamento/Cidades */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginTop: 4 }}>
        <div>
          <p style={secLabel}>Rodízio entre consultores</p>
          <div style={card}>
            {cons.map((c, i) => (
              <Meter key={i} label={c.nome} right={`${c.leads} leads${c.nota ? " · nota " + String(c.nota).replace(".", ",") : ""}`} w={p(c.leads, maxCons)} color={C.accent} />
            ))}
            <p style={{ fontSize: 12, color: C.textMuted, margin: "12px 0 0" }}>Distribuição equilibrada — rodízio girando justo.</p>
          </div>
        </div>
        <div>
          <p style={secLabel}>Follow-up automático</p>
          <div style={{ ...card, display: "flex", gap: 12 }}>
            <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: C.success, lineHeight: 1, ...num }}>{re.recuperados || 0}</div>
              <p style={{ fontSize: 12, color: C.textMuted, margin: "6px 0 0" }}>recuperados<br />(voltaram após o nudge)</p>
            </div>
            <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: C.accent, lineHeight: 1, ...num }}>{re.followup_ativo || 0}</div>
              <p style={{ fontSize: 12, color: C.textMuted, margin: "6px 0 0" }}>na fila ativa<br />(sendo reengajados)</p>
            </div>
          </div>
          <p style={secLabel}>Alcance · {d.cidades_distintas || 0} cidades</p>
          <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(d.top_cidades || []).map((c, i) => (
              <span key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "5px 12px", fontSize: 12.5, color: C.text }}>{c.cidade} <b style={{ color: C.accent }}>{c.n}</b></span>
            ))}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 26, lineHeight: 1.7, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
        <b style={{ color: C.text }}>Leitura:</b> a Mariana converte muito bem e encanta (nota alta / NPS alto). O limite hoje é o <b style={{ color: C.text }}>volume de entrada</b> — mais tráfego no Meta = mais leads, porque o atendimento aguenta. Dados ao vivo, direto do banco.
      </p>
    </div>
  );
}

// ─── REGIOES DE ENTREGA (LOGISTICA) ───
// Mapeamento cidade -> regiao para agrupamento. Cidades em UPPERCASE
// e sem acento ja que vem do banco assim. Edite aqui pra ajustar.
const REGIOES_ENTREGA = [
  { nome: "Grande Florianópolis", uf: "SC", cidades: ["FLORIANOPOLIS", "FLORIANÓPOLIS", "SAO JOSE", "SÃO JOSÉ", "PALHOCA", "PALHOÇA", "BIGUACU", "BIGUAÇU", "MAJOR GERCINO", "TIJUCAS", "ANTONIO CARLOS", "ANTÔNIO CARLOS", "GOVERNADOR CELSO RAMOS", "SANTO AMARO", "SANTO AMARO DA IMPERATRIZ"] },
  { nome: "Norte SC / Litoral Norte", uf: "SC", cidades: ["JOINVILLE", "ITAJAI", "ITAJAÍ", "BALNEARIO CAMBORIU", "BALNEÁRIO CAMBORIÚ", "ITAPEMA", "CAMBORIU", "CAMBORIÚ", "NAVEGANTES", "JARAGUA DO SUL", "JARAGUÁ DO SUL", "PENHA", "PIÇARRAS", "PICARRAS", "BARRA VELHA", "ITAPOA", "ITAPOÁ", "SAO FRANCISCO DO SUL", "SÃO FRANCISCO DO SUL"] },
  { nome: "Vale do Itajaí", uf: "SC", cidades: ["BLUMENAU", "BRUSQUE", "INDAIAL", "RIO DO SUL", "TIMBO", "TIMBÓ", "POMERODE", "GASPAR", "ITUPORANGA"] },
  { nome: "Sul Catarinense", uf: "SC", cidades: ["TUBARAO", "TUBARÃO", "CRICIUMA", "CRICIÚMA", "ARARANGUA", "ARARANGUÁ", "ICARA", "IÇARA", "IMBITUBA", "LAGUNA", "BRACO DO NORTE", "BRAÇO DO NORTE", "ORLEANS"] },
  { nome: "Oeste Catarinense", uf: "SC", cidades: ["CHAPECO", "CHAPECÓ", "SAO MIGUEL DO OESTE", "SÃO MIGUEL DO OESTE", "CONCORDIA", "CONCÓRDIA", "XANXERE", "XANXERÊ", "JOACABA", "JOAÇABA"] },
  { nome: "Serra Catarinense", uf: "SC", cidades: ["LAGES", "SAO JOAQUIM", "SÃO JOAQUIM", "BOM RETIRO", "URUBICI"] },
  { nome: "Grande Porto Alegre", uf: "RS", cidades: ["PORTO ALEGRE", "CANOAS", "SAO LEOPOLDO", "SÃO LEOPOLDO", "NOVO HAMBURGO", "GRAVATAI", "GRAVATAÍ", "VIAMAO", "VIAMÃO", "CACHOEIRINHA", "ALVORADA", "ESTEIO", "SAPUCAIA DO SUL"] },
  { nome: "Serra Gaúcha", uf: "RS", cidades: ["CAXIAS DO SUL", "BENTO GONCALVES", "BENTO GONÇALVES", "GARIBALDI", "CARLOS BARBOSA", "FARROUPILHA", "VERANOPOLIS", "VERANÓPOLIS", "FLORES DA CUNHA"] },
];

function getRegiao(cidade, uf) {
  if (!cidade) return "Outras regiões";
  const c = String(cidade).toUpperCase().trim();
  for (const r of REGIOES_ENTREGA) {
    if (r.cidades.includes(c)) return r.nome;
  }
  // Se nao matchou nenhuma cidade mas tem UF, agrupa em "Outras de SC/RS/etc"
  return uf ? "Outras de " + String(uf).toUpperCase() : "Outras regiões";
}

// canEditLogistica(user) => admin (Ale), gestor (Zanella) e vendedor_basico
// (Joao — motorista/montador) podem editar entregas. Vendedor (Adelmo)
// continua só com leitura.
function canEditLogistica(user) {
  if (!user) return false;
  const role = user.role || (user.isAdmin ? "admin" : "vendedor");
  return role === "admin" || role === "gestor" || role === "vendedor_basico";
}

// ─── ORCAMENTOS RS-OCULTOS (regra de negocio do Ale) ───
// Orcamentos do estado RS feitos pelo Alessandro (v1) sao "particulares":
// nao aparecem em ADM / Graficos / DRE / Logistica para Adelmo e Zanella,
// nao entram em relatorios consolidados, nao contabilizam no ranking.
// So aparecem na aba Orcamentos do proprio Alessandro.
//
// Aceita tanto o formato cru do banco (cliente_estado, vendedor_id) quanto
// o formato adaptado pra UI (client.estado, vendedorId).
function isOrcamentoRsOculto(o) {
  if (!o) return false;
  const estado = String(o.cliente_estado || o.client?.estado || "").trim().toUpperCase();
  const vendedorId = o.vendedor_id || o.vendedorId || "";
  return estado === "RS" && vendedorId === "v1";
}

// Determina se o usuario atual deve ver os orcamentos RS-ocultos.
// So o proprio Alessandro ve.
function podeVerOrcamentosRsOcultos(user) {
  return user?.id === "v1" || user?.email === "ale.thonsen@gmail.com";
}

// Ordem de prioridade dos status de orçamento na listagem (Fazer Pedido
// primeiro, Concluído por último). Usado pra ordenar Orçamentos e ADM.
const STATUS_ORDEM = ["Fazer Pedido", "Aguardando Retorno", "Não Responde", "Desistiu", "Fechou Concorrência", "Concluído"];
// Temperatura do lead: quente → morno → frio → sem temperatura
const TEMP_ORDEM = ["quente", "morno", "frio"];
const tempIndex = (t) => {
  const i = TEMP_ORDEM.indexOf(t || "");
  return i === -1 ? 999 : i;
};
const ordenarPorStatus = (a, b) => {
  const sa = a.status || "Aguardando Retorno";
  const sb = b.status || "Aguardando Retorno";
  const ia = STATUS_ORDEM.indexOf(sa);
  const ib = STATUS_ORDEM.indexOf(sb);
  const pa = ia === -1 ? 999 : ia;
  const pb = ib === -1 ? 999 : ib;
  if (pa !== pb) return pa - pb;
  // Dentro de "Aguardando Retorno", ordena por temperatura (quente > morno > frio > sem)
  if (sa === "Aguardando Retorno" && sb === "Aguardando Retorno") {
    const ta = tempIndex(a.temperatura);
    const tb = tempIndex(b.temperatura);
    if (ta !== tb) return ta - tb;
  }
  // Dentro do mesmo bucket, mais recente primeiro
  return new Date(b.date || 0) - new Date(a.date || 0);
};

// Botões de temperatura do lead (🔥 quente / 😶‍🌫️ morno / 🥶 frio) — seleção exclusiva
function TermometroLead({ value, onChange, canEdit }) {
  const opts = [
    { val: "frio",   emoji: "🥶", color: "#3B82F6" },
    { val: "morno",  emoji: "😶‍🌫️", color: "#F5A623" },
    { val: "quente", emoji: "🔥", color: "#F87171" },
  ];
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {opts.map(o => {
        const sel = value === o.val;
        return (
          <button
            key={o.val}
            disabled={!canEdit}
            onClick={(e) => { e.stopPropagation(); if (!canEdit) return; onChange(sel ? null : o.val); }}
            title={o.val.charAt(0).toUpperCase() + o.val.slice(1)}
            style={{
              background: sel ? o.color + "30" : "transparent",
              border: `1px solid ${sel ? o.color : "transparent"}`,
              opacity: sel ? 1 : 0.30,
              filter: sel ? "none" : "grayscale(0.7)",
              padding: "4px 8px", borderRadius: 7,
              cursor: canEdit ? "pointer" : "default",
              fontSize: 16, lineHeight: 1,
            }}
          >{o.emoji}</button>
        );
      })}
    </div>
  );
}

const STATUS_ENTREGA_OPTIONS = ["Agendada", "Em Rota", "Entregue", "Atrasada", "Reagendada"];
const STATUS_ENTREGA_COLORS = {
  "Agendada":   "#3B82F6",
  "Em Rota":    "#F5A623",
  "Entregue":   "#10B981",
  "Atrasada":   "#F87171",
  "Reagendada": "#8B5CF6",
};

// Detecta venda com boleto parcelado pro fornecedor (RRE): o cliente paga o
// boleto direto pro fornecedor, então quando a venda é marcada "Pago" só a
// COMISSÃO da Suprema entra como receita (não o total). Lê do texto de
// pagamento gravado nas notes do orçamento (ex: "... + Boleto 3x ...").
function isBoletoParceladoRRE(notes) {
  const m = (notes || "").match(/Boleto\s+(\d+)\s*x/i);
  return !!(m && parseInt(m[1], 10) > 1);
}

// ─── CONTABILIDADE: TIPOS PARA DRE ───
// Cada despesa/movimentação tem um tipo contabil que define onde aparece na DRE.
// Receitas de venda vem da tabela orcamentos (status='Concluído'), nao de despesas.
// Ordem canonica do DRE brasileiro (CPC 26 / ITG 1000 CFC):
//   Receita Bruta → (-) Deduções → Receita Líquida → (-) CMV → Lucro Bruto
//   → (-) Despesas Operacionais → EBIT
//   → (+/-) Resultado Financeiro → LAIR
//   → (-) Provisão de Tributos (DAS) → Lucro Líquido
//   → (-) Distribuição de Lucros (informativo — sai do PL, não do resultado)
const TIPOS_DESPESA = [
  { key: "DEDUCAO_RECEITA",     label: "Dedução da Receita",      grupo: "Deduções",         color: "#F59E0B" },
  { key: "CMV",                 label: "Custo dos Produtos (CMV)", grupo: "CMV",              color: "#F87171" },
  { key: "DESPESA_VENDAS",      label: "Despesa com Vendas",      grupo: "Operacional",      color: "#8B5CF6" },
  { key: "DESPESA_ADM",         label: "Despesa Administrativa",  grupo: "Operacional",      color: "#8B5CF6" },
  { key: "DESPESA_LOGISTICA",   label: "Despesa Logística",       grupo: "Operacional",      color: "#8B5CF6" },
  { key: "DESPESA_GERAL",       label: "Despesa Geral",           grupo: "Operacional",      color: "#8B5CF6" },
  { key: "DESPESA_FINANCEIRA",  label: "Despesa Financeira",      grupo: "Financeiro",       color: "#EC4899" },
  { key: "RECEITA_FINANCEIRA",  label: "Receita Financeira",      grupo: "Financeiro",       color: "#10B981" },
  { key: "PROVISAO_TRIBUTOS",   label: "Provisão de Tributos",    grupo: "Tributos",         color: "#F59E0B" },
  // Abaixo do Lucro Líquido — não afetam o resultado, só o Patrimônio/Fluxo de Caixa
  { key: "RETIRADA_LUCRO",      label: "Distribuição de Lucros",  grupo: "PatrimonioLiquido", color: "#94A3B8" },
  { key: "APORTE_SOCIO",        label: "Aporte de Sócio",         grupo: "PatrimonioLiquido", color: "#10B981" },
  { key: "FINANCIAMENTO",       label: "Empréstimos/Financiamentos", grupo: "Financiamento",  color: "#94A3B8" },
];

// Tipos que NÃO entram no cálculo do DRE (só aparecem em Fluxo de Caixa e cards separados)
const TIPOS_FORA_DRE = new Set(["RETIRADA_LUCRO", "APORTE_SOCIO", "FINANCIAMENTO"]);

// Categorias sugeridas por tipo (autocomplete pro select)
const CATEGORIAS_SUGERIDAS = {
  DEDUCAO_RECEITA:    ["ICMS", "ICMS-ST", "ISS", "PIS/COFINS", "Devoluções", "Cancelamentos", "Descontos Concedidos"],
  CMV:                ["Fornecedores Gôndolas", "Fornecedores MDF", "Fornecedores Outros", "Mão-de-obra Produção", "Insumos", "Frete de Entrada"],
  DESPESA_VENDAS:     ["Comissões", "Tráfego Pago", "Ferramentas Comerciais", "Materiais de Venda", "Frete de Saída"],
  DESPESA_ADM:        ["Pró-labore", "Encargos Trabalhistas", "Honorários", "Infraestrutura", "Software & TI", "Material de Escritório"],
  DESPESA_LOGISTICA:  ["Salários Operacionais", "Veículos", "Combustível", "Manutenção Veículos", "Frete Terceirizado"],
  DESPESA_GERAL:      ["A classificar", "Outros"],
  DESPESA_FINANCEIRA: ["Tarifas Bancárias", "Juros Pagos", "IOF", "Multas por Atraso"],
  RECEITA_FINANCEIRA: ["Rendimentos", "Juros Recebidos"],
  PROVISAO_TRIBUTOS:  ["Simples Nacional (DAS)", "IRPJ", "CSLL"],
  RETIRADA_LUCRO:     ["Retirada de Lucro"],
  APORTE_SOCIO:       ["Aporte de Sócio"],
  FINANCIAMENTO:      ["Empréstimo Recebido", "Amortização de Empréstimo"],
};

// Heuristica para inferir tipo a partir do nome da despesa (usado ao criar
// novas despesas no Financeiro pra ja sair classificada corretamente).
function inferirTipoDespesa(nome) {
  if (!nome) return { tipo: "DESPESA_GERAL", categoria: "A classificar" };
  // Normaliza: minúsculas + remove acentos + colapsa espaços/pontuação repetida.
  // Assim "Facebook - Ads" e "facebook ads" batem na mesma regex.
  const n = String(nome).toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // remove acentos (combining marks)
    .replace(/[.\-_/]+/g, " ")                        // pontuações viram espaço
    .replace(/\s+/g, " ")                             // colapsa múltiplos espaços
    .trim();

  // Prefixos internos (id gerado pelo sistema)
  if (n.startsWith("forn gondolas") || nome.startsWith("forn_gondolas")) return { tipo: "CMV", categoria: "Fornecedores Gôndolas" };
  if (n.startsWith("forn mdf")      || nome.startsWith("forn_mdf"))      return { tipo: "CMV", categoria: "Fornecedores MDF" };
  if (n.startsWith("forn outros")   || nome.startsWith("forn_outros"))   return { tipo: "CMV", categoria: "Fornecedores Outros" };
  if (n.startsWith("forn ")         || nome.startsWith("forn_"))         return { tipo: "CMV", categoria: "Fornecedores Outros" };

  // Aportes/retiradas de sócio e financiamentos ficam FORA do DRE
  if (n.includes("retirada de lucro") || n.includes("distribuicao de lucro") || n.includes("distribuicao de lucros")) return { tipo: "RETIRADA_LUCRO", categoria: "Retirada de Lucro" };
  if (n.includes("aporte de socio") || n.includes("aporte socio") || n.includes("aporte")) return { tipo: "APORTE_SOCIO", categoria: "Aporte de Sócio" };
  if (n.includes("emprestimo") || n.includes("financiamento")) return { tipo: "FINANCIAMENTO", categoria: "Empréstimo Recebido" };

  // Fornecedores recorrentes da Suprema
  if (n.includes("rre maquinas") || /\brre\b/.test(n)) return { tipo: "CMV", categoria: "Fornecedores Gôndolas" };
  if (n.includes("imperio das gondolas") || n.includes("imperio gondolas")) return { tipo: "CMV", categoria: "Fornecedores Gôndolas" };
  if (n.includes("fibrasul") || n.includes("fibra sul")) return { tipo: "CMV", categoria: "Fornecedores MDF" };

  // Tributos — DAS agora vai pra PROVISAO_TRIBUTOS (linha 11 do DRE, não Deduções)
  if (n.includes("simples") || n.includes("imposto das") || n.startsWith("das ") || n === "das") return { tipo: "PROVISAO_TRIBUTOS", categoria: "Simples Nacional (DAS)" };
  if (n.includes("irpj")) return { tipo: "PROVISAO_TRIBUTOS", categoria: "IRPJ" };
  if (n.includes("csll")) return { tipo: "PROVISAO_TRIBUTOS", categoria: "CSLL" };

  // Impostos sobre venda (esses SIM são deduções da receita)
  if (n.includes("icms")) return { tipo: "DEDUCAO_RECEITA", categoria: "ICMS" };
  if (/\biss\b/.test(n)) return { tipo: "DEDUCAO_RECEITA", categoria: "ISS" };
  if (n.includes("pis cofins") || n.includes("pis/cofins")) return { tipo: "DEDUCAO_RECEITA", categoria: "PIS/COFINS" };

  if (n.startsWith("salario") || n.startsWith("salário")) return { tipo: "DESPESA_LOGISTICA", categoria: "Salários Operacionais" };
  if (n.includes("manuten") && (n.includes("veic") || n.includes("hr") || n.includes("carro") || n.includes("caminh") || n.includes("doutor diesel"))) return { tipo: "DESPESA_LOGISTICA", categoria: "Manutenção Veículos" };
  if (/\bhr\b/.test(n) || n.startsWith("carro") || n.startsWith("seguro") || n.includes("combust")) return { tipo: "DESPESA_LOGISTICA", categoria: "Veículos" };
  if (n.includes("pgto socio") || n.includes("pro labore") || n.includes("prolabore")) return { tipo: "DESPESA_ADM", categoria: "Pró-labore" };
  if (n === "fgts" || n === "inss") return { tipo: "DESPESA_ADM", categoria: "Encargos Trabalhistas" };
  if (n.startsWith("contabilidade") || n.startsWith("advogad") || n.startsWith("honorario")) return { tipo: "DESPESA_ADM", categoria: "Honorários" };
  if (n.startsWith("aluguel") || n.startsWith("internet") || n.startsWith("energia") || n.startsWith("agua") || n.startsWith("telefone")) return { tipo: "DESPESA_ADM", categoria: "Infraestrutura" };
  if (n === "sistema" || n.startsWith("sistema") || n.startsWith("software") || n.startsWith("hospedagem") || n.startsWith("dominio") || n.startsWith("vercel") || n.startsWith("openai") || n.startsWith("anthropic") || n.startsWith("supabase") || n.startsWith("ia ") || n.includes(" ia ")) return { tipo: "DESPESA_ADM", categoria: "Software & TI" };
  if (n.startsWith("google ads") || n.startsWith("meta ads") || n.startsWith("facebook ads") || n.startsWith("facebook") && n.includes("ads") || n.startsWith("instagram ads") || n.startsWith("trafego")) return { tipo: "DESPESA_VENDAS", categoria: "Tráfego Pago" };
  if (n.startsWith("wasseler") || n.startsWith("crm")) return { tipo: "DESPESA_VENDAS", categoria: "Ferramentas Comerciais" };
  if (n.includes("comissao")) return { tipo: "DESPESA_VENDAS", categoria: "Comissões" };
  if (n.includes("tarifa") || n.includes("iof")) return { tipo: "DESPESA_FINANCEIRA", categoria: n.includes("iof") ? "IOF" : "Tarifas Bancárias" };
  if (n.includes("juros") && (n.includes("pagos") || n.includes("cobrado"))) return { tipo: "DESPESA_FINANCEIRA", categoria: "Juros Pagos" };
  return { tipo: "DESPESA_GERAL", categoria: "A classificar" };
}

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
      role: meta.role || (meta.isAdmin ? "admin" : "vendedor"),
    };
    onLogin(u);
    setPage("client");
  };

  const inp = { width: "100%", padding: "11px 14px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)", padding: 20 }}>
      <div style={{ background: COLORS.surface, border: "1px solid rgba(245,166,35,0.28)", borderRadius: 14, padding: 36, width: 380, maxWidth: "100%", boxShadow: "0 0 12px rgba(245,166,35,0.18), 0 0 30px rgba(245,166,35,0.08)" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 6px" }}>Entrar</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 24px", fontFamily: "'DM Sans', sans-serif" }}>Acesse com suas credenciais</p>
        {err && <div style={{ background: COLORS.danger + "15", color: COLORS.danger, padding: "8px 12px", borderRadius: 7, fontSize: 12, marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>{err}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder="E-mail" type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} style={inp} disabled={loading} />
          <input placeholder="Senha" type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} style={inp} onKeyDown={e => e.key === "Enter" && !loading && go()} disabled={loading} />
          <button onClick={go} disabled={loading} style={{ background: loading ? COLORS.border : COLORS.orange, color: "#000", border: "none", padding: "12px", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 2, boxShadow: loading ? "none" : "0 0 12px rgba(245,166,35,0.24)" }}>{loading ? "Entrando..." : "Entrar"}</button>
        </div>
      </div>
    </div>
  );
}

// Detecta se a tela é mobile (< 720px). Escuta resize pra reagir a giros de
// celular/tablet. Em SSR (sem window) começa false e atualiza no mount.
function useIsMobile(breakpoint = 720) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

// ─── CATALOG ───
function Catalog({ onAdd, uniplusProducts: uniplusFromApp, mppChinaProducts: mppChinaFromApp, uniplusPriceMap }) {
  const [filter, setFilter] = useState("gondolas-parede");
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile();
  const [outrosProdutos, setOutrosProdutos] = useState([]);
  const [mppChinaProdutos, setMppChinaProdutos] = useState([]);
  const [loadingOutros, setLoadingOutros] = useState(false);
  const [variantSel, setVariantSel] = useState({}); // { [productId]: { altura: "1,37m", cor: "Branca" } }
  const [qtyByProduct, setQtyByProduct] = useState({});
  // Form da aba "Fábrica" — produtos sob medida adicionados na hora pelo vendedor
  const [fabricaForm, setFabricaForm] = useState({ nome: "", quantidade: "1", valorCusto: "", valorComissao: "" });

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

  // Depois de adicionar ao orçamento, os chips do produto voltam pro padrão
  // (primeira opção de cada variante) e a quantidade volta pra 1. Evita a
  // "seleção fantasma": variante marcada num orçamento anterior ficava ativa
  // e o vendedor adicionava sem perceber (ex: Slim 1800mm no lugar de 1200mm).
  const addAndReset = (p, sel, qty) => {
    onAdd(p, sel, qty);
    setVariantSel(prev => { const n = { ...prev }; delete n[p.id]; return n; });
    setQtyByProduct(prev => { const n = { ...prev }; delete n[p.id]; return n; });
  };

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

  // Adapta produtos MPP China pro mesmo formato do catalogo
  useEffect(() => {
    const adaptados = (mppChinaFromApp || []).map(r => ({
      id: r.id,
      name: r.nome,
      category: "mpp-china",
      icon: "🇨🇳",
      price: Number(r.preco_brasil) || 0,
      specs: { categoria: r.categoria || "MPP China", codigo: r.codigo || "" },
      options: []
    }));
    setMppChinaProdutos(adaptados);
  }, [mppChinaFromApp]);

  const todosProdutos = [...PRODUCTS, ...outrosProdutos, ...mppChinaProdutos];
  const filtered = todosProdutos.filter(p => p.category === filter && p.name.toLowerCase().includes(search.toLowerCase()));

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
        {filter === "fabrica" ? "Produto sob medida — preencha os campos abaixo" : `${filtered.length} produto(s) encontrado(s)${filter === "outros" && loadingOutros ? " — carregando..." : ""}`}
      </div>
      {filter === "fabrica" ? (
        // ─── ABA FÁBRICA — produtos sob medida cadastrados na hora ───
        // Vendedor preenche os campos e o produto é criado e adicionado
        // direto ao orçamento. Não persiste em tabela do Supabase — é um
        // item avulso por orçamento.
        (() => {
          const qtd = Math.max(1, Number(fabricaForm.quantidade) || 1);
          const custo = Number(fabricaForm.valorCusto) || 0;
          const comissao = Number(fabricaForm.valorComissao) || 0;
          const valorTotal = custo * qtd + comissao;
          const podeAdicionar = fabricaForm.nome.trim().length > 0 && (custo > 0 || comissao > 0);
          const inp = { width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };
          const lbl = { color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: 0.5 };
          const adicionar = () => {
            if (!podeAdicionar) return;
            // Cria produto avulso. price = (custo*qtd + comissão) embutido,
            // qty=1 no carrinho pra evitar recálculo errado se o vendedor
            // mudar a quantidade depois.
            const id = "fabrica-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
            const produto = {
              id,
              name: fabricaForm.nome.trim(),
              category: "fabrica",
              icon: "🏭",
              price: valorTotal,
              specs: {
                "qtd interna": String(qtd),
                "custo unit": fmt(custo),
                "comissão": fmt(comissao),
              },
              options: [],
            };
            onAdd(produto, null, 1);
            setFabricaForm({ nome: "", quantidade: "1", valorCusto: "", valorComissao: "" });
          };
          return (
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, padding: 24, maxWidth: 600 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 18, margin: "0 0 4px" }}>🏭 Produto sob medida — Fábrica</h3>
              <p style={{ color: COLORS.textMuted, fontSize: 12, margin: "0 0 18px", fontFamily: "'DM Sans', sans-serif" }}>Cadastre um produto fabricado especialmente para este orçamento. Os valores aparecerão direto no orçamento.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={lbl}>Nome do produto *</label>
                  <input
                    placeholder="Ex: Mesa sob medida 2,00m x 1,00m"
                    value={fabricaForm.nome}
                    onChange={e => setFabricaForm({ ...fabricaForm, nome: e.target.value })}
                    style={inp}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={lbl}>Quantidade *</label>
                    <input
                      type="number" min="1" step="1"
                      value={fabricaForm.quantidade}
                      onChange={e => setFabricaForm({ ...fabricaForm, quantidade: e.target.value })}
                      style={inp}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Valor de Custo (unit) *</label>
                    <input
                      type="number" min="0" step="0.01" placeholder="0,00"
                      value={fabricaForm.valorCusto}
                      onChange={e => setFabricaForm({ ...fabricaForm, valorCusto: e.target.value })}
                      style={inp}
                    />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Valor de Comissão (R$ total)</label>
                  <input
                    type="number" min="0" step="0.01" placeholder="0,00"
                    value={fabricaForm.valorComissao}
                    onChange={e => setFabricaForm({ ...fabricaForm, valorComissao: e.target.value })}
                    style={inp}
                  />
                  <div style={{ color: COLORS.textDim, fontSize: 10, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                    Markup que o vendedor cobra além do custo. Some no total final.
                  </div>
                </div>
                <div style={{ background: `linear-gradient(135deg, ${COLORS.orange}15, ${COLORS.orange}05)`, border: `1px solid ${COLORS.orange}40`, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'DM Sans', sans-serif" }}>Valor Total</div>
                    <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                      {qtd}× custo {fmt(custo)} + comissão {fmt(comissao)}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: valorTotal > 0 ? COLORS.orange : COLORS.textDim }}>
                    {valorTotal > 0 ? fmt(valorTotal) : "R$ 0,00"}
                  </div>
                </div>
                <button
                  onClick={adicionar}
                  disabled={!podeAdicionar}
                  style={{
                    background: podeAdicionar ? COLORS.orange : COLORS.textDim,
                    color: "#000",
                    border: "none",
                    padding: "12px 20px",
                    borderRadius: 9,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: podeAdicionar ? "pointer" : "not-allowed",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >+ Adicionar ao Orçamento</button>
              </div>
            </div>
          );
        })()
      ) : filter === "outros" || filter === "mpp-china" ? (
        // Visualização em lista simples (Outros Produtos / MPP China)
        // MPP China ganha uma coluna extra "Capacidade" (200KG / 500KG)
        (() => {
          const isMpp = filter === "mpp-china";
          // Layout MPP: Produto cresce 1.5fr, Capacidade ocupa 1fr (centralizada),
          // Valor 110px, botao 100px — Capacidade fica visualmente entre nome e preco.
          const grid = isMpp ? "1.5fr 1fr 110px 100px" : "1fr auto auto";
          return (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, overflow: "hidden" }}>
          {!isMobile && (
            <div style={{ display: "grid", gridTemplateColumns: grid, gap: 12, padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: COLORS.textDim, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
              <div>Produto</div>
              {isMpp && <div style={{ textAlign: "center" }}>Capacidade</div>}
              <div style={{ textAlign: "right", minWidth: 110 }}>Valor Suprema</div>
              <div style={{ minWidth: 100 }}></div>
            </div>
          )}
          {filtered.length === 0 && !loadingOutros && (
            <div style={{ padding: "30px 16px", color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>
              {isMpp ? "🇨🇳 Nenhum produto MPP China cadastrado ainda. Em breve você poderá adicionar produtos aqui." : "Nenhum produto encontrado"}
            </div>
          )}
          {filtered.map((p, idx) => {
            const cap = p.specs?.categoria || "";
            // Mobile: card empilhado em 2 linhas (nome+preço / capacidade+botão)
            if (isMobile) {
              return (
                <div key={p.id} style={{ padding: "12px 14px", borderBottom: idx < filtered.length - 1 ? `1px solid ${COLORS.border}` : "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0, fontFamily: "'DM Sans', sans-serif", color: COLORS.text, fontSize: 13, lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: p.price === 0 ? COLORS.textDim : COLORS.orange, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(p.price)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    {isMpp ? (
                      <span style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "4px 12px", borderRadius: 14, fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{cap || "—"}</span>
                    ) : <span />}
                    <button onClick={() => onAdd(p)} style={{ background: COLORS.orange, color: "#000", border: "none", padding: "8px 14px", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Orçamento</button>
                  </div>
                </div>
              );
            }
            return (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: grid, gap: 12, padding: "10px 16px", borderBottom: idx < filtered.length - 1 ? `1px solid ${COLORS.border}` : "none", alignItems: "center" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", color: COLORS.text, fontSize: 13, lineHeight: 1.3 }}>{p.name}</div>
              {isMpp && (
                <div style={{ textAlign: "center" }}>
                  <span style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "3px 10px", borderRadius: 14, fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{cap || "—"}</span>
                </div>
              )}
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: p.price === 0 ? COLORS.textDim : COLORS.orange, textAlign: "right", minWidth: 110 }}>{fmt(p.price)}</div>
              <button onClick={() => onAdd(p)} style={{ background: COLORS.orange, color: "#000", border: "none", padding: "6px 12px", borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", minWidth: 100 }}>+ Orçamento</button>
            </div>
            );
          })}
        </div>
          );
        })()
      ) : filter === "gondolas-parede" || filter === "gondolas-centro" || filter === "ponta-gondola" || filter === "mpp" || filter === "slim" || filter === "mdf" ? (
        // Visualização em lista para Gôndolas de Parede, Centro, Ponta, MPP, Slim e MDF
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, overflow: "hidden" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "20px 16px", color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>Nenhum produto encontrado</div>
          )}
          {filtered.map((p, idx) => {
            const sel = getProductVariantSel(p);
            const qty = getProductQty(p);
            const computedPrice = computeProductPrice(p, sel, [0], uniplusPriceMap);
            const pillStyle = (active) => ({ background: active ? COLORS.orange + "20" : COLORS.bg, border: `1px solid ${active ? COLORS.orange : COLORS.border}`, color: active ? COLORS.orange : COLORS.textMuted, padding: "3px 9px", borderRadius: 14, cursor: "pointer", fontSize: 10.5, fontFamily: "'DM Sans', sans-serif", fontWeight: active ? 600 : 400, whiteSpace: "nowrap", lineHeight: 1.2 });
            // No mobile (< 720px) o layout empilha em 3 linhas pra evitar
            // sobreposição de texto/preço. No desktop mantém em 1 linha
            // horizontal (padrão original).
            if (isMobile) {
              return (
                <div key={p.id} style={{ padding: "12px 14px", borderBottom: idx < filtered.length - 1 ? `1px solid ${COLORS.border}` : "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Linha 1: nome + preço */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0, fontFamily: "'DM Sans', sans-serif", color: COLORS.text, fontSize: 13, fontWeight: 600, lineHeight: 1.3 }} title={p.name}>{p.name}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: computedPrice === 0 ? COLORS.textDim : COLORS.orange, whiteSpace: "nowrap", flexShrink: 0 }}>{computedPrice === 0 ? "Sob consulta" : fmt(computedPrice)}</div>
                  </div>
                  {/* Linha 2: variantes (com wrap) */}
                  {(p.variants || []).length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {(p.variants || []).map(v => (
                        <div key={v.key} style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                          <span style={{ color: COLORS.textDim, fontSize: 10.5, fontFamily: "'DM Sans', sans-serif", marginRight: 2 }}>{v.label}:</span>
                          {v.options.map(op => (
                            <button key={op} onClick={() => setProductVariant(p.id, v.key, op)} style={pillStyle(sel[v.key] === op)}>
                              {sel[v.key] === op ? "✓ " : ""}{op}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Linha 3: qty + botão */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <button onClick={() => setProductQty(p.id, qty - 1)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, width: 32, height: 32, borderRadius: "6px 0 0 6px", cursor: "pointer", fontSize: 14 }}>−</button>
                      <input
                        type="number" min="1"
                        value={qty}
                        onFocus={e => e.target.select()}
                        onChange={e => setProductQty(p.id, Math.max(1, Number(e.target.value) || 1))}
                        style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderLeft: "none", borderRight: "none", width: 50, height: 32, textAlign: "center", color: COLORS.white, fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", padding: 0, MozAppearance: "textfield" }}
                      />
                      <button onClick={() => setProductQty(p.id, qty + 1)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, width: 32, height: 32, borderRadius: "0 6px 6px 0", cursor: "pointer", fontSize: 14 }}>+</button>
                    </div>
                    <button onClick={() => addAndReset(p, sel, qty)} style={{ flex: 1, background: COLORS.orange, color: "#000", border: "none", padding: "8px 14px", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>+ Orçamento</button>
                  </div>
                </div>
              );
            }
            return (
              <div key={p.id} style={{ padding: "10px 16px", borderBottom: idx < filtered.length - 1 ? `1px solid ${COLORS.border}` : "none", display: "flex", flexWrap: "nowrap", alignItems: "center", gap: 14, minWidth: 0 }}>
                <div style={{ flex: "0 1 220px", minWidth: 0, fontFamily: "'DM Sans', sans-serif", color: COLORS.text, fontSize: 13, fontWeight: 600, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={p.name}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 auto", flexWrap: "nowrap", justifyContent: "flex-start", minWidth: 0 }}>
                  {(p.variants || []).map(v => (
                    <div key={v.key} style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "nowrap" }}>
                      <span style={{ color: COLORS.textDim, fontSize: 10.5, fontFamily: "'DM Sans', sans-serif", marginRight: 2, whiteSpace: "nowrap" }}>{v.label}:</span>
                      {v.options.map(op => (
                        <button key={op} onClick={() => setProductVariant(p.id, v.key, op)} style={pillStyle(sel[v.key] === op)}>
                          {sel[v.key] === op ? "✓ " : ""}{op}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: computedPrice === 0 ? COLORS.textDim : COLORS.orange, textAlign: "right", minWidth: 100, whiteSpace: "nowrap", flexShrink: 0 }}>{computedPrice === 0 ? "Sob consulta" : fmt(computedPrice)}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button onClick={() => setProductQty(p.id, qty - 1)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, width: 24, height: 26, borderRadius: "6px 0 0 6px", cursor: "pointer", fontSize: 13 }}>−</button>
                    <input
                      type="number" min="1"
                      value={qty}
                      onFocus={e => e.target.select()}
                      onChange={e => setProductQty(p.id, Math.max(1, Number(e.target.value) || 1))}
                      style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderLeft: "none", borderRight: "none", width: 50, height: 26, textAlign: "center", color: COLORS.white, fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", padding: 0, MozAppearance: "textfield" }}
                    />
                    <button onClick={() => setProductQty(p.id, qty + 1)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, width: 24, height: 26, borderRadius: "0 6px 6px 0", cursor: "pointer", fontSize: 13 }}>+</button>
                  </div>
                  <button onClick={() => addAndReset(p, sel, qty)} style={{ background: COLORS.orange, color: "#000", border: "none", padding: "6px 12px", borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>+ Orçamento</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, overflow: "hidden", transition: "all .2s" }}>
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
function Quote({ items, setItems, user, setPage, clientData, editingOrderId, setEditingOrderId, editingOrderInfo, markup, setMarkup, frete, setFrete, desconto, setDesconto, uniplusPriceMap }) {
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
  // Modo "acrescentando ao orcamento existente": usa markup/frete/desconto do ORIGINAL
  // pra mostrar o total combinado certinho. Senao usa os do state (orcamento novo).
  const acrescentando = !!(editingOrderId && editingOrderInfo);
  const subAntigo = acrescentando ? (editingOrderInfo.subtotalAntigo || 0) : 0;
  const pctMk = acrescentando ? (editingOrderInfo.pctMarkup || 0) : ((markup || 0) / 100);
  const desc = acrescentando ? (editingOrderInfo.descontoAtual || 0) : (Number(desconto) || 0);
  const fr = acrescentando ? (editingOrderInfo.freteAtual || 0) : (Number(frete) || 0);
  const subtotalCombinado = subAntigo + total;
  const baseComDesconto = Math.max(0, subtotalCombinado - desc);
  const totalComissao = baseComDesconto * pctMk;
  const totalFinal = baseComDesconto + totalComissao + fr;

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
          <span style={{ color: COLORS.orange, fontSize: 13 }}>
            ➕ Acrescentando itens ao orçamento <strong>#{editingOrderInfo?.num || editingOrderId.slice(0, 6).toUpperCase()}</strong>
            {editingOrderInfo?.empresa ? ` — ${editingOrderInfo.empresa}` : ""}
          </span>
          <button onClick={() => { setEditingOrderId(null); setItems([]); setPage("orders"); }} style={{ background: "transparent", border: "none", color: COLORS.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
        </div>
      )}
      <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 20px" }}>{editingOrderId ? "Adicionar Itens" : "Calculadora de Orçamento"}</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, padding: 16 }}>
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
              <input
                type="number" min="1"
                value={it.qty}
                onFocus={e => e.target.select()}
                onChange={e => upd(i, "qty", Math.max(1, Number(e.target.value) || 1))}
                style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderLeft: "none", borderRight: "none", width: 50, height: 30, textAlign: "center", color: COLORS.white, fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", padding: 0, MozAppearance: "textfield" }}
              />
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
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações adicionais..." rows={3} style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, color: COLORS.text, padding: "12px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box", marginTop: 14 }} />

      {acrescentando ? (
        <div style={{ background: `linear-gradient(135deg, ${COLORS.orange}10, ${COLORS.orange}05)`, border: `1px dashed ${COLORS.orange}40`, borderRadius: 12, padding: "14px 18px", marginTop: 14, fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ color: COLORS.orange, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Valores preservados do orçamento original</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: COLORS.textMuted }}>
            <span>Margem: <strong style={{ color: COLORS.success }}>{(pctMk * 100).toFixed(2).replace(".",",")}%</strong></span>
            <span>Desconto: <strong style={{ color: desc > 0 ? COLORS.danger : COLORS.textDim }}>{fmt(desc)}</strong></span>
            <span>Frete: <strong style={{ color: fr > 0 ? COLORS.text : COLORS.textDim }}>{fmt(fr)}</strong></span>
          </div>
          <div style={{ color: COLORS.textDim, fontSize: 10, marginTop: 8 }}>Pra alterar margem/desconto/frete, use o botão Editar no card do orçamento.</div>
        </div>
      ) : (
        <>
          {/* Desconto (aplicado no custo, antes da comissao e frete) */}
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, padding: 16, marginTop: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Desconto no custo (R$):</span>
            <input type="number" min="0" value={desconto || ""} onChange={e => setDesconto(Number(e.target.value) || 0)} placeholder="0,00" style={{ width: 120, padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.danger, fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center" }} />
            <span style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{desconto > 0 ? `Custo após desconto: ${fmt(baseComDesconto)}` : "Sem desconto"}</span>
          </div>

          {/* Comissão */}
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, padding: 16, marginTop: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Comissão/Margem (%):</span>
            <input type="number" min="0" max="500" value={markup || ""} onChange={e => setMarkup(Number(e.target.value) || 0)} placeholder="0" style={{ width: 80, padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.orange, fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center" }} />
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ color: COLORS.success, fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{fmt(totalComissao)}</div>
              <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{markup > 0 ? markup + "% sobre custo c/ desconto" : "Sem comissão"}</div>
            </div>
          </div>

          {/* Frete */}
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, padding: 16, marginTop: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Frete (R$):</span>
            <input type="number" min="0" value={frete || ""} onChange={e => setFrete(Number(e.target.value) || 0)} placeholder="0,00" style={{ width: 120, padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.orange, fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center" }} />
            <span style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{frete > 0 ? "Frete incluso no total" : "Sem frete"}</span>
          </div>
        </>
      )}

      <div style={{ background: `linear-gradient(135deg, ${COLORS.orange}12, ${COLORS.orange}06)`, border: `1px solid ${COLORS.orange}30`, borderRadius: 12, padding: "18px 22px", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{acrescentando ? "Novo total do orçamento (atual + itens acrescentados)" : "Total do orçamento (Custo − Desconto + Comissão + Frete)"}</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: totalFinal === 0 ? COLORS.textDim : COLORS.orange }}>{totalFinal === 0 ? "Valores sob consulta" : fmt(totalFinal)}</div>
          <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>
            {acrescentando
              ? `${editingOrderInfo.qtdItens} item(ns) atual + ${items.length} novo(s) · subtotal combinado ${fmt(subtotalCombinado)}`
              : `${items.length} produto(s) · ${items.reduce((s, i) => s + i.qty, 0)} un · Subtotal ${fmt(total)}${desconto > 0 ? ` − desconto ${fmt(desconto)}` : ""}`}
          </div>
        </div>
        <button onClick={() => setPage("resumo")} style={{ background: COLORS.orange, color: "#000", border: "none", padding: "12px 24px", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Ver Resumo →</button>
      </div>
    </div>
  );
}

// ─── RESUMO ───
function ResumoPage({ items, user, setPage, clientData, editingOrderId, setEditingOrderId, editingOrderInfo, setEditingOrderInfo, setItems, markup, setMarkup, frete, setFrete, desconto, setDesconto, uniplusPriceMap, bumpOrdersRefresh }) {
  const [notes, setNotes] = useState("");
  // Cálculo automático de frete por distância (Palhoça → cidade do cliente)
  const [freteCalc, setFreteCalc] = useState({ loading: false, tipo: "", texto: "" });
  const calcularFrete = async () => {
    const cd = clientData || {};
    const cidade = (cd.cidade || "").trim();
    const uf = (cd.estado || "").trim();
    if (!cidade) {
      setFreteCalc({ loading: false, tipo: "erro", texto: "Cadastre a cidade do cliente primeiro (aba Cliente)." });
      return;
    }
    setFreteCalc({ loading: true, tipo: "", texto: "Calculando distância…" });
    try {
      const qs = new URLSearchParams({
        cidade, uf,
        endereco: (cd.endereco || "").trim(),
        numero: (cd.numero || "").trim(),
        bairro: (cd.bairro || "").trim(),
      }).toString();
      const resp = await fetch(`/api/calcular-frete?${qs}`, { cache: "no-store" });
      const d = await resp.json().catch(() => ({}));
      if (!resp.ok || d?.success === false) {
        setFreteCalc({ loading: false, tipo: "erro", texto: d?.mensagem || "Não foi possível calcular o frete." });
        return;
      }
      setFrete(d.frete);
      setFreteCalc({
        loading: false,
        tipo: "ok",
        texto: `${d.distancia_km} km até ${d.destino} (${d.precisao === "endereço" ? "endereço exato" : "centro da cidade"}) · ida e volta ${d.km_cobrados} km × R$ ${d.custo_por_km.toFixed(3)}/km → ${d.frete.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
      });
    } catch (e) {
      setFreteCalc({ loading: false, tipo: "erro", texto: "Falha de rede ao calcular o frete." });
    }
  };

  const itemPrice = it => computeProductPrice(it.product, it.selVariants, it.selOpts, uniplusPriceMap);
  const itemBase = it => itemPrice(it) * it.qty;

  const subtotalProdutos = items.reduce((s, i) => s + itemBase(i), 0);
  // Modo "acrescentando ao orcamento existente": preserva markup%/desconto/frete originais
  const acrescentando = !!(editingOrderId && editingOrderInfo);
  const subAntigo = acrescentando ? (editingOrderInfo.subtotalAntigo || 0) : 0;
  const pctMk = acrescentando ? (editingOrderInfo.pctMarkup || 0) : ((markup || 0) / 100);
  // Desconto aplicado no SUBTOTAL DE CUSTO, antes de comissao e frete.
  const descontoNum = acrescentando
    ? (editingOrderInfo.descontoAtual || 0)
    : Math.min(Math.max(0, Number(desconto) || 0), subtotalProdutos);
  const subtotalCombinado = subAntigo + subtotalProdutos;
  const subtotalComDesconto = Math.max(0, subtotalCombinado - descontoNum);
  const freteEfetivo = acrescentando ? (editingOrderInfo.freteAtual || 0) : (Number(frete) || 0);
  const itemComissao = it => itemBase(it) * (acrescentando ? pctMk * 100 : (markup || 0)) / 100; // preview por item
  const itemFinal = it => itemBase(it) + itemComissao(it);
  const totalComissao = subtotalComDesconto * pctMk;
  const totalFinal = subtotalComDesconto + totalComissao + freteEfetivo;

  const [saving, setSaving] = useState(false);
  const [erroDados, setErroDados] = useState("");
  const save = async () => {
    if (!user || saving) return;
    const cd = clientData || {};
    // Exige dados mínimos do cliente APENAS para orçamento novo.
    // Ao acrescentar produtos em orçamento existente (editingOrderId)
    // o cliente já foi cadastrado antes — não barra.
    if (!editingOrderId) {
      const faltando = [];
      if (!String(cd.empresa || "").trim()) faltando.push("Nome do Cliente");
      const telDigits = String(cd.telefone || "").replace(/\D/g, "");
      if (telDigits.length < 10 || telDigits.length > 11) faltando.push("Celular (DDD + número)");
      if (!String(cd.cidade || "").trim()) faltando.push("Cidade");
      if (faltando.length > 0) {
        setErroDados("Faltam dados do cliente: " + faltando.join(", ") + ". Clique abaixo para preencher.");
        return;
      }
    }
    setErroDados("");
    setSaving(true);
    const newItems = items.map(i => {
      const optsFromOptions = (i.selOpts || []).map(oi => (i.product.options || [])[oi]?.label).filter(Boolean);
      // Variantes SEMPRE na ordem canônica do produto (largura, níveis, cor...) —
      // Object.entries dependia da ordem de clique do vendedor, o que gerava
      // opts fora de ordem no PDF e dificultava conferir o orçamento.
      const variants = i.product.variants || [];
      const optsFromVariants = i.selVariants
        ? (variants.length
            ? variants.map(v => i.selVariants[v.key]).filter(Boolean)
            : Object.values(i.selVariants))
        : [];
      // Label legível pro PDF: "Largura 1200mm · Níveis 5 · Cor C+L"
      const optsLabel = i.selVariants && variants.length
        ? variants.map(v => i.selVariants[v.key] ? `${v.label} ${i.selVariants[v.key]}` : null).filter(Boolean).join(" · ")
        : "";
      return {
        product_id: i.product.id,
        name: i.product.name,
        cat: catLabel(i.product.category),
        qty: i.qty,
        opts: [...optsFromVariants, ...optsFromOptions],
        opts_label: optsLabel || undefined,
        total: itemBase(i),
      };
    });

    try {
      if (editingOrderId) {
        // Fetch existing order, append items
        const { data: existing } = await supabase.from("orcamentos").select("*").eq("id", editingOrderId).single();
        if (existing) {
          const updatedItems = [...(existing.items || []), ...newItems];
          const descAtual = Number(existing.desconto) || 0;
          // Recupera markup% original: pct = comissao / (subtotalAntigo - desconto)
          const subtotalAntigo = (existing.items || []).reduce((s, i) => s + (Number(i.total) || 0), 0);
          const baseAntiga = Math.max(0, subtotalAntigo - descAtual);
          const pctMarkup = baseAntiga > 0 ? (Number(existing.comissao) || 0) / baseAntiga : 0;
          // Recalcula com o novo subtotal (preservando desconto e markup% originais)
          const novoSubtotal = updatedItems.reduce((s, i) => s + (Number(i.total) || 0), 0);
          const novaBase = Math.max(0, novoSubtotal - descAtual);
          const novaComissao = novaBase * pctMarkup;
          const novoFrete = (Number(existing.frete) || 0) + (Number(frete) || 0);
          const updatedTotal = novaBase + novaComissao + novoFrete;
          await supabase.from("orcamentos").update({
            items: updatedItems,
            total: updatedTotal,
            frete: novoFrete,
            comissao: novaComissao,
            data: new Date().toISOString(),
            notes: notes ? (existing.notes ? existing.notes + "\n" + notes : notes) : existing.notes,
          }).eq("id", editingOrderId);
        }
        setEditingOrderId(null);
      } else {
        const novoId = genId();
        await supabase.from("orcamentos").insert({
          id: novoId,
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
          desconto: descontoNum,
          notes,
          status: "Aguardando Retorno",
        });

        // Ponte CAPI (Fase 1 - coleta): manda o Lead pro Meta assim que o orcamento nasce.
        // So o telefone -- e o unico dado 100% real nessa fase (email/nome so
        // ficam validados depois do orcamento virar "Concluido").
        // Fire-and-forget: nunca trava nem quebra o fluxo de salvar o orcamento.
        try {
          fetch("/api/meta-capi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              evento: "Lead",
              id: novoId,
              telefone: cd.telefone,
              valor: totalFinal,
            }),
          }).catch(() => {});
        } catch (e) {}
      }
    } catch (e) { console.error("Erro ao salvar:", e); }
    setSaving(false);
    setItems([]);
    setMarkup(0);
    setFrete(0);
    setDesconto(0);
    if (setEditingOrderInfo) setEditingOrderInfo(null);
    if (bumpOrdersRefresh) bumpOrdersRefresh(); // Forca a tela "Orcamentos" a recarregar do banco
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
      {editingOrderId && editingOrderInfo ? (
        <>
          <div style={{ background: `linear-gradient(135deg, ${COLORS.orange}25, ${COLORS.orange}10)`, border: `1.5px solid ${COLORS.orange}`, borderRadius: 12, padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
              <span style={{ fontSize: 22 }}>➕</span>
              <div>
                <div style={{ color: COLORS.orange, fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Acrescentando itens ao orçamento</div>
                <div style={{ color: COLORS.white, fontSize: 15, fontWeight: 700, fontFamily: "'Playfair Display', serif", marginTop: 2 }}>
                  #{editingOrderInfo.num}{editingOrderInfo.empresa ? ` — ${editingOrderInfo.empresa}` : ""}
                </div>
                <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                  Orçamento atual: {editingOrderInfo.qtdItens} item(ns) • Total {fmt(editingOrderInfo.totalAtual)} → será somado aos itens abaixo
                </div>
              </div>
            </div>
            <button
              onClick={() => { setEditingOrderId(null); if (setEditingOrderInfo) setEditingOrderInfo(null); setItems([]); setMarkup(0); setFrete(0); setDesconto(0); setPage("orders"); }}
              style={{ background: "transparent", border: `1px solid ${COLORS.textMuted}40`, color: COLORS.textMuted, padding: "6px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
            >Cancelar</button>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 22, margin: "0 0 6px" }}>Itens novos sendo adicionados</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 12, margin: "0 0 20px", fontFamily: "'DM Sans', sans-serif" }}>Os produtos abaixo serão somados ao orçamento #{editingOrderInfo.num}. Margem e frete originais são preservados.</p>
        </>
      ) : (
        <>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 6px" }}>Resumo do Orçamento</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 20px", fontFamily: "'DM Sans', sans-serif" }}>Confira os produtos, adicione margem e frete</p>
        </>
      )}

      {/* Lista de produtos */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, overflow: "hidden" }}>
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

      {acrescentando ? (
        <div style={{ background: `linear-gradient(135deg, ${COLORS.orange}10, ${COLORS.orange}05)`, border: `1px dashed ${COLORS.orange}40`, borderRadius: 12, padding: "14px 18px", marginTop: 14, fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ color: COLORS.orange, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Valores preservados do orçamento original</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: COLORS.textMuted }}>
            <span>Margem: <strong style={{ color: COLORS.success }}>{(pctMk * 100).toFixed(2).replace(".",",")}%</strong></span>
            <span>Desconto: <strong style={{ color: descontoNum > 0 ? COLORS.danger : COLORS.textDim }}>{fmt(descontoNum)}</strong></span>
            <span>Frete: <strong style={{ color: freteEfetivo > 0 ? COLORS.text : COLORS.textDim }}>{fmt(freteEfetivo)}</strong></span>
          </div>
          <div style={{ color: COLORS.textDim, fontSize: 10, marginTop: 8 }}>Pra alterar margem/desconto/frete, use o botão Editar no card do orçamento.</div>
        </div>
      ) : (
        <>
          {/* Desconto (aplicado no custo, antes da comissao e frete) */}
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, padding: 16, marginTop: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Desconto no custo (R$):</span>
            <input type="number" min="0" value={desconto || ""} onChange={e => setDesconto(Number(e.target.value) || 0)} placeholder="0,00" style={{ width: 120, padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.danger, fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center" }} />
            <span style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{descontoNum > 0 ? `Custo após desconto: ${fmt(subtotalComDesconto)}` : "Sem desconto"}</span>
          </div>

          {/* Comissão */}
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, padding: 16, marginTop: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Comissão/Margem (%):</span>
            <input type="number" min="0" max="500" value={markup || ""} onChange={e => setMarkup(Number(e.target.value) || 0)} placeholder="0" style={{ width: 80, padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.orange, fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center" }} />
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ color: COLORS.success, fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{fmt(totalComissao)}</div>
              <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{markup > 0 ? markup + "% sobre custo c/ desconto" : "Sem comissão"}</div>
            </div>
          </div>

          {/* Frete */}
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, padding: 16, marginTop: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Frete (R$):</span>
            <input type="number" min="0" value={frete || ""} onChange={e => setFrete(Number(e.target.value) || 0)} placeholder="0,00" style={{ width: 120, padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.orange, fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center" }} />
            <button
              type="button"
              onClick={calcularFrete}
              disabled={freteCalc.loading}
              style={{ background: freteCalc.loading ? COLORS.textDim : COLORS.orange, color: "#000", border: "none", padding: "9px 16px", borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: freteCalc.loading ? "wait" : "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              {freteCalc.loading ? "Calculando…" : "📍 Calcular frete"}
            </button>
            <span style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{frete > 0 ? "Frete incluso no total" : "Sem frete"}</span>
            {freteCalc.texto && (
              <div style={{ width: "100%", fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: freteCalc.tipo === "erro" ? COLORS.danger : freteCalc.tipo === "ok" ? COLORS.success : COLORS.textMuted }}>
                {freteCalc.tipo === "ok" ? "✓ " : freteCalc.tipo === "erro" ? "⚠ " : ""}{freteCalc.texto}
              </div>
            )}
          </div>
        </>
      )}

      {/* Observações */}
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações adicionais..." rows={3} style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, color: COLORS.text, padding: "12px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box", marginTop: 14 }} />

      {/* Total final */}
      <div style={{ background: `linear-gradient(135deg, ${COLORS.orange}15, ${COLORS.orange}05)`, border: `1px solid ${COLORS.orange}30`, borderRadius: 12, padding: "20px 22px", marginTop: 14 }}>
        {acrescentando && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Custo do orçamento atual</span>
          <span style={{ color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{fmt(subAntigo)}</span>
        </div>}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{acrescentando ? "+ Itens novos" : "Produtos"}</span>
          <span style={{ color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{fmt(subtotalProdutos)}</span>
        </div>
        {descontoNum > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Desconto</span>
          <span style={{ color: COLORS.danger, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>− {fmt(descontoNum)}</span>
        </div>}
        {(acrescentando ? pctMk > 0 : markup > 0) && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Comissão ({((acrescentando ? pctMk * 100 : markup)).toFixed(2).replace(".",",")}%)</span>
          <span style={{ color: COLORS.success, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>+ {fmt(totalComissao)}</span>
        </div>}
        {(acrescentando ? freteEfetivo > 0 : frete > 0) && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Frete</span>
          <span style={{ color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>+ {fmt(freteEfetivo)}</span>
        </div>}
        <div style={{ borderTop: `1px solid ${COLORS.orange}30`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: COLORS.white, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{acrescentando ? "NOVO TOTAL DO ORÇAMENTO" : "TOTAL FINAL"}</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: COLORS.orange }}>{fmt(totalFinal)}</span>
        </div>
      </div>

      {/* Aviso de dados obrigatórios do cliente faltando */}
      {erroDados && (
        <div style={{ marginTop: 16, background: COLORS.danger + "15", border: `1px solid ${COLORS.danger}55`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ color: COLORS.danger, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>⚠ {erroDados}</div>
          <button onClick={() => setPage("client")} style={{ width: "100%", background: COLORS.danger, color: "#fff", border: "none", padding: "12px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Preencher dados do cliente</button>
        </div>
      )}

      {/* Botão salvar */}
      <button onClick={save} disabled={saving} style={{ width: "100%", background: saving ? COLORS.textDim : COLORS.orange, color: "#000", border: "none", padding: "14px", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: saving ? "wait" : "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 16 }}>{saving ? "Salvando..." : editingOrderId ? "Adicionar ao Orçamento" : "Salvar Orçamento"}</button>
    </div>
  );
}

// ─── ORDERS ───
function Orders({ user, setPage, setCart, clientData, setEditingOrderId, setEditingOrderInfo, refreshKey = 0, uniplusProducts = [] }) {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  // Filtro por mês (formato YYYY-MM ou "all")
  const [filterMes, setFilterMes] = useState("all");
  // Filtro por status ("all" ou um dos status)
  const [filterStatus, setFilterStatus] = useState("all");
  // Busca livre por nome do cliente / nº do orçamento
  const [buscaNome, setBuscaNome] = useState("");
  // Modal de anotações internas — { orderId, texto }
  const [anotacoesModal, setAnotacoesModal] = useState(null);
  const [savingAnotacoes, setSavingAnotacoes] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editFrete, setEditFrete] = useState(0);
  const [editDesconto, setEditDesconto] = useState(0);
  // Cálculo de frete por distância no modo edição (só ao clicar no botão)
  const [freteCalcEdit, setFreteCalcEdit] = useState({ loading: false, tipo: "", texto: "" });
  const calcularFreteEdit = async (o) => {
    const cd = o?.client || {};
    const cidade = (cd.cidade || "").trim();
    const uf = (cd.estado || "").trim();
    if (!cidade) {
      setFreteCalcEdit({ loading: false, tipo: "erro", texto: "Orçamento sem cidade do cliente cadastrada." });
      return;
    }
    setFreteCalcEdit({ loading: true, tipo: "", texto: "Calculando distância…" });
    try {
      const qs = new URLSearchParams({
        cidade, uf,
        endereco: (cd.endereco || "").trim(),
        numero: (cd.numero || "").trim(),
        bairro: (cd.bairro || "").trim(),
      }).toString();
      const resp = await fetch(`/api/calcular-frete?${qs}`, { cache: "no-store" });
      const d = await resp.json().catch(() => ({}));
      if (!resp.ok || d?.success === false) {
        setFreteCalcEdit({ loading: false, tipo: "erro", texto: d?.mensagem || "Não foi possível calcular o frete." });
        return;
      }
      setEditFrete(d.frete);
      setFreteCalcEdit({
        loading: false,
        tipo: "ok",
        texto: `${d.distancia_km} km até ${d.destino} (${d.precisao === "endereço" ? "endereço exato" : "centro da cidade"}) · ida e volta ${d.km_cobrados} km × R$ ${d.custo_por_km.toFixed(3)}/km → ${d.frete.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
      });
    } catch (e) {
      setFreteCalcEdit({ loading: false, tipo: "erro", texto: "Falha de rede ao calcular o frete." });
    }
  };
  const [editMarkup, setEditMarkup] = useState(0);
  const [editNotes, setEditNotes] = useState("");
  const [editClient, setEditClient] = useState({ empresa: "", cnpj: "", responsavel: "", telefone: "", email: "", endereco: "", bairro: "", cidade: "", estado: "", cep: "", ie: "" });
  const [editBuscandoCnpj, setEditBuscandoCnpj] = useState(false);
  const [editCnpjMsg, setEditCnpjMsg] = useState({ tipo: "", texto: "" }); // tipo: "ok" | "erro" | ""
  const ultimoCnpjConsultadoRef = useRef("");
  const [saving, setSaving] = useState(false);
  const [pecasModal, setPecasModal] = useState(null); // { lista: [...], naoExpandidos: [...] }
  const [pecasFeitas, setPecasFeitas] = useState({}); // { [uniplusId]: true } — marcacao "ja pedido"
  const [parcelamentoOpts, setParcelamentoOpts] = useState({}); // { [orderId]: bool } — incluir tabela de parcelamento por boleto no PDF/HTML
  const [parcelamentoCartaoOpts, setParcelamentoCartaoOpts] = useState({}); // { [orderId]: bool } — incluir tabela de parcelamento por cartão (valores definidos depois)

  const togglePecaFeita = (id) => {
    setPecasFeitas(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id]; else next[id] = true;
      return next;
    });
  };

  // Mapa { uniplusId -> nome } montado dos produtos sincronizados via Supabase.
  // Indexa também por chave estável "nome:<slug>" pra suportar receitas que
  // referenciam produtos pelo nome (não pelo row_number, que é instável).
  const uniplusNomes = useMemo(() => {
    const m = {};
    const slug = (s) => (s || "").toString().toUpperCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ").trim()
      .replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
    uniplusProducts.forEach(p => {
      if (p.id) m[p.id] = p.nome;
      if (p.nome) m["nome:" + slug(p.nome)] = p.nome;
    });
    return m;
  }, [uniplusProducts]);

  // Decompoe os items do orcamento em pecas brutas (uniplus) usando PRODUCT_RECIPES
  const gerarListaPecas = (items) => {
    const peças = {};
    const naoExpandidos = [];
    (items || []).forEach(it => {
      const qtd = Number(it.qty) || 0;
      const sel = it.selVariants || {};

      // Orcamentos salvos no banco so tem name/cat/qty/opts (sem product/id).
      // Tenta achar produto em PRODUCTS por: product.id -> product_id -> nome exato
      const orig =
        (it.product?.id != null && PRODUCTS.find(p => p.id === it.product.id)) ||
        (it.product_id != null && PRODUCTS.find(p => p.id === it.product_id)) ||
        (it.name && PRODUCTS.find(p => p.name === it.name)) ||
        it.product ||
        null;

      let key = orig && orig.variants && Object.keys(sel).length
        ? recipeKeyForProduct(orig, sel)
        : null;

      // Fallback: monta key com it.opts. A ordem salva em it.opts depende
      // de em qual sequência o vendedor clicou as variantes — NÃO é
      // confiável. Tenta a ordem como veio e, se não bater, reordena
      // conforme orig.variants (cada valor casado com a variante cujas
      // options o contêm).
      if (!key && orig && orig.id != null && Array.isArray(it.opts) && it.opts.length) {
        const candidate = [orig.id, ...it.opts].join("|");
        if (PRODUCT_RECIPES[candidate]) {
          key = candidate;
        } else if (Array.isArray(orig.variants) && orig.variants.length) {
          const ordenado = orig.variants.map(v =>
            it.opts.find(o => (v.options || []).includes(o))
          );
          if (ordenado.every(Boolean)) {
            const c2 = [orig.id, ...ordenado].join("|");
            if (PRODUCT_RECIPES[c2]) key = c2;
          }
        }
      }

      const receita = key && PRODUCT_RECIPES[key];
      if (!receita) {
        // Não é um conjunto com receita. Antes de marcar como "sem receita",
        // verifica se o item JÁ É uma peça UniPlus avulsa (ex: "Outros Produtos").
        // Nesse caso ele entra direto na lista 1:1, somando com as peças que
        // vierem do desmembramento das gôndolas/MPP.
        const slugPeca = (s) => (s || "").toString().toUpperCase()
          .normalize("NFD").replace(/[̀-ͯ]/g, "")
          .replace(/\s+/g, " ").trim()
          .replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
        const nomeItem = orig?.name || it.name || it.product?.name || "";
        // Prioriza a chave canônica "nome:slug" — é a MESMA que as receitas
        // usam — pra que a peça avulsa SOME com a vinda do desmembramento
        // (em vez de virar uma linha duplicada por id diferente).
        const candidatos = [
          nomeItem && ("nome:" + slugPeca(nomeItem)),
          it.product?.id,
          it.product_id,
          orig?.id,
        ].filter(Boolean);
        const pid = candidatos.find(c => uniplusNomes[c]);
        if (pid) {
          if (!peças[pid]) peças[pid] = 0;
          peças[pid] += qtd;
          return;
        }
        const nome = nomeItem || "(sem nome)";
        naoExpandidos.push({ nome, qty: qtd, opts: it.opts || [] });
        return;
      }
      receita.forEach(([uniplusId, qtdPorUnidade]) => {
        const total = qtdPorUnidade * qtd;
        if (!peças[uniplusId]) peças[uniplusId] = 0;
        peças[uniplusId] += total;
      });
    });
    const lista = Object.entries(peças)
      .map(([id, qty]) => ({ id, nome: uniplusNomes[id] || id, qty }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return { lista, naoExpandidos };
  };

  const buscarCnpjEdit = async (cnpjBruto) => {
    const cnpjLimpo = (cnpjBruto || "").replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) return;
    if (cnpjLimpo === ultimoCnpjConsultadoRef.current) return; // ja consultou esse mesmo CNPJ
    setEditCnpjMsg({ tipo: "", texto: "" });
    setEditBuscandoCnpj(true);
    try {
      const resp = await fetch(`/api/consultar-cnpj/${cnpjLimpo}`, { cache: "no-store" });
      const d = await resp.json().catch(() => ({}));
      if (!resp.ok || d?.success === false) {
        if (resp.status === 404) setEditCnpjMsg({ tipo: "erro", texto: "CNPJ não encontrado na Receita." });
        else setEditCnpjMsg({ tipo: "erro", texto: d?.mensagem || "Falha ao consultar CNPJ." });
        return;
      }
      ultimoCnpjConsultadoRef.current = cnpjLimpo;
      // Sobrescreve com dados da Receita; mantem campos que ela nao retorna (responsavel, etc.)
      setEditClient(prev => ({
        ...prev,
        empresa:  d.razao_social || d.nome_fantasia || prev.empresa,
        email:    d.email      || prev.email,
        telefone: d.telefone ? formatarCelular(d.telefone) : prev.telefone,
        endereco: d.logradouro || prev.endereco,
        bairro:   d.bairro     || prev.bairro,
        cep:      d.cep        || prev.cep,
        cidade:   d.municipio  || prev.cidade,
        estado:   d.uf         || prev.estado,
      }));
      const faltando = [];
      if (!d.logradouro) faltando.push("rua");
      if (!d.email) faltando.push("e-mail");
      if (faltando.length > 0) setEditCnpjMsg({ tipo: "ok", texto: `Dados atualizados. Receita não tem ${faltando.join(", ")} — preencha manualmente.` });
      else setEditCnpjMsg({ tipo: "ok", texto: "Dados do cliente atualizados pela Receita." });
    } catch (e) {
      setEditCnpjMsg({ tipo: "erro", texto: "Falha de rede ao consultar o CNPJ." });
    } finally {
      setEditBuscandoCnpj(false);
    }
  };

  const startEdit = (o) => {
    setEditingId(o.id);
    // Decompor itens pra garantir que a edicao sempre comece com CUSTO puro
    const itensCusto = (o.items || []).map(it => ({ ...it, total: getItemCusto(it, o) }));
    setEditItems(itensCusto);
    setEditFrete(o.frete || 0);
    setEditDesconto(o.desconto || 0);
    setEditNotes(o.notes || "");
    // Reseta o cache de CNPJ consultado (cada orcamento tem seu CNPJ; nao bloquear nova consulta)
    ultimoCnpjConsultadoRef.current = (o.client?.cnpj || "").replace(/\D/g, "");
    setEditCnpjMsg({ tipo: "", texto: "" });
    // Pre-preenche dados do cliente (editaveis no modo edit)
    const c = o.client || {};
    setEditClient({
      empresa: c.empresa || "",
      cnpj: c.cnpj || "",
      responsavel: c.responsavel || "",
      telefone: c.telefone || "",
      email: c.email || "",
      endereco: c.endereco || "",
      bairro: c.bairro || "",
      cidade: c.cidade || "",
      estado: c.estado || "",
      cep: c.cep || "",
      ie: c.ie || "",
    });
    // Recuperar a margem do orcamento como percentual aplicado (sobre custo COM desconto)
    const subCusto = itensCusto.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const baseComDesc = Math.max(0, subCusto - (Number(o.desconto) || 0));
    const markupAtual = baseComDesc > 0 ? Math.round(((Number(o.comissao) || 0) / baseComDesc) * 100) : 0;
    setEditMarkup(markupAtual);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditItems([]);
    setEditFrete(0);
    setEditDesconto(0);
    setEditMarkup(0);
    setEditNotes("");
    setEditClient({ empresa: "", cnpj: "", responsavel: "", telefone: "", email: "", endereco: "", bairro: "", cidade: "", estado: "", cep: "", ie: "" });
    setEditCnpjMsg({ tipo: "", texto: "" });
    ultimoCnpjConsultadoRef.current = "";
  };

  const saveEdit = async (orderId) => {
    setSaving(true);
    const subtotalCusto = editItems.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const desconto = Math.min(Math.max(0, Number(editDesconto) || 0), subtotalCusto);
    const baseComDesconto = subtotalCusto - desconto;
    const comissao = baseComDesconto * (Number(editMarkup) || 0) / 100;
    const frete = Number(editFrete) || 0;
    const newTotal = baseComDesconto + comissao + frete;
    // Normaliza cnpj (so digitos) e cep
    const cnpjDigits = (editClient.cnpj || "").replace(/\D/g, "");
    const cepDigits = (editClient.cep || "").replace(/\D/g, "");
    const telDigits = (editClient.telefone || "").replace(/\D/g, "");
    await supabase.from("orcamentos").update({
      items: editItems,
      total: newTotal,
      frete,
      comissao,
      desconto,
      notes: editNotes,
      // Dados do cliente (atualizados no modo edicao)
      cliente_empresa: editClient.empresa || null,
      cliente_cnpj: cnpjDigits || null,
      cliente_responsavel: editClient.responsavel || null,
      cliente_telefone: telDigits || null,
      cliente_email: editClient.email || null,
      cliente_endereco: editClient.endereco || null,
      cliente_bairro: editClient.bairro || null,
      cliente_cidade: editClient.cidade || null,
      cliente_estado: editClient.estado || null,
      cliente_cep: cepDigits || null,
      cliente_ie: (editClient.ie || "").trim() || null,
    }).eq("id", orderId);
    setOrders(orders.map(o => o.id === orderId ? {
      ...o,
      items: editItems, total: newTotal, frete, comissao, desconto, notes: editNotes,
      client: { ...(o.client || {}), ...editClient, cnpj: cnpjDigits, cep: cepDigits, telefone: telDigits },
    } : o));
    setSaving(false);
    cancelEdit();
  };

  useEffect(() => {
    const loadOrders = async () => {
      const { data } = await supabase.from("orcamentos").select("*").eq("vendedor_id", user.id).order("data", { ascending: false });
      if (data) {
        setOrders(data.map(o => ({
          id: o.id, date: o.data, total: o.total, frete: o.frete, comissao: o.comissao || 0, notes: o.notes, anotacoes: o.anotacoes || "", status: o.status, items: o.items, vendedor: o.vendedor_nome,
          temperatura: o.temperatura || null,
          client: { empresa: o.cliente_empresa, cnpj: o.cliente_cnpj, responsavel: o.cliente_responsavel, telefone: o.cliente_telefone, email: o.cliente_email, endereco: o.cliente_endereco, numero: o.cliente_numero, bairro: o.cliente_bairro, cidade: o.cliente_cidade, estado: o.cliente_estado, cep: o.cliente_cep, ie: o.cliente_ie }
        })));
      }
    };
    loadOrders();
  }, [user.id, refreshKey]);

  const salvarAnotacoes = async () => {
    if (!anotacoesModal) return;
    setSavingAnotacoes(true);
    const { orderId, texto } = anotacoesModal;
    await supabase.from("orcamentos").update({ anotacoes: texto || null }).eq("id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, anotacoes: texto || "" } : o));
    setSavingAnotacoes(false);
    setAnotacoesModal(null);
  };

  const deleteOrder = async (orderId) => {
    await supabase.from("orcamentos").delete().eq("id", orderId);
    setOrders(orders.filter(o => o.id !== orderId));
    if (expanded === orderId) setExpanded(null);
    setConfirmDel(null);
  };

  const updateTemperatura = async (orderId, temp) => {
    // atualização otimista
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, temperatura: temp } : o));
    await supabase.from("orcamentos").update({ temperatura: temp }).eq("id", orderId);
  };

  const addMoreItems = (orderId) => {
    const o = orders.find(x => x.id === orderId);
    setEditingOrderId(orderId);
    if (setEditingOrderInfo && o) {
      // Calcula markup% original a partir do banco (mesma logica do save)
      const subtotalAntigo = (o.items || []).reduce((s, i) => s + (Number(i.total) || 0), 0);
      const descAtual = Number(o.desconto) || 0;
      const baseAntiga = Math.max(0, subtotalAntigo - descAtual);
      const pctMarkup = baseAntiga > 0 ? (Number(o.comissao) || 0) / baseAntiga : 0;
      setEditingOrderInfo({
        num: orderId.slice(0, 6).toUpperCase(),
        empresa: o.client?.empresa || o.vendedor || "",
        qtdItens: (o.items || []).length,
        totalAtual: Number(o.total) || 0,
        subtotalAntigo,             // custo dos itens existentes
        pctMarkup,                  // ex: 0.2 = 20%
        freteAtual: Number(o.frete) || 0,
        descontoAtual: descAtual,
      });
    }
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
      frete: order.frete || 0,
      comissao: order.comissao || 0,
      incluirParcelamento: !!parcelamentoOpts[order.id],
      incluirCartao: !!parcelamentoCartaoOpts[order.id],
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
  const [downloadInfo, setDownloadInfo] = useState(null); // { fileName } pra exibir modal pos-download em desktop
  const handleWhatsApp = async (order) => {
    if (sharingOrder) return; // evita disparar 2x se clicar rapido
    setSharingOrder(true);
    const o = order || pdfOrder;
    if (!o) { setSharingOrder(false); return; }
    const cd = o.client || clientData || {};
    try {
      const result = await sharePDFWhatsApp({
        orderNum: o.id.slice(0, 6).toUpperCase(),
        date: new Date(o.date).toLocaleDateString("pt-BR"),
        client: cd,
        items: o.items, total: o.total, notes: o.notes,
        frete: o.frete || 0,
        comissao: o.comissao || 0,
        // Telefone do header sai do vendedor que fez o orcamento (fallback: usuario logado)
        user: { name: o.vendedor_nome || o.vendedor || user.name, email: user.email },
        incluirParcelamento: !!parcelamentoOpts[o.id],
        incluirCartao: !!parcelamentoCartaoOpts[o.id],
      });
      // No desktop, sharePDFWhatsApp baixa o arquivo e retorna { method: "download" }.
      // Mostramos modal com instrucoes pro vendedor (especialmente no Windows).
      if (result && result.method === "download") {
        const telefone = (cd.telefone || "").replace(/\D/g, "");
        setDownloadInfo({ fileName: result.fileName, telefone });
      }
    } catch(e) { console.error(e); }
    setSharingOrder(false);
  };

  const sc = { "Aguardando Retorno": "#3B82F6", "Fazer Pedido": "#8B5CF6", "Não Responde": "#9CA3AF", "Desistiu": "#F87171", "Fechou Concorrência": "#34D399", "Concluído": "#10B981" };
  const statusOptions = ["Aguardando Retorno", "Fazer Pedido", "Não Responde", "Desistiu", "Fechou Concorrência", "Concluído"];
  const [concluidoId, setConcluidoId] = useState(null);
  const [concluidoData, setConcluidoData] = useState({ cnpj: "", data_entrega: "", numero_pedido: "", pag1: "", pag1_parcelas: "", pag1_valor: "", pag2: "", pag2_parcelas: "", pag2_valor: "", venda_empresa_recebedora: "", venda_banco_recebedor: "", valor_recebido: "" });

  const updateStatus = async (orderId, newStatus) => {
    if (newStatus === "Concluído") {
      // Pre-preenche CNPJ se ja estiver no orcamento; senao, vendedor vai digitar
      const ord = orders.find(o => o.id === orderId);
      const cnpjExistente = ord?.client?.cnpj || "";
      setConcluidoId(orderId);
      setConcluidoData({ cnpj: cnpjExistente, data_entrega: "", numero_pedido: "", pag1: "", pag1_parcelas: "", pag1_valor: "", pag2: "", pag2_parcelas: "", pag2_valor: "", venda_empresa_recebedora: "", venda_banco_recebedor: "", valor_recebido: "" });
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
    // Contábil automático (o vendedor não preenche mais isso — Ale ajusta no
    // financeiro se precisar). A venda nasce como Gôndolas Suprema.
    // Valor recebido:
    // - Pag2 = Boleto parcelado (>1x) → só a ENTRADA (Pag 1) entra no DRE;
    //   o restante vai pra RRE (cliente paga direto pro fornecedor)
    // - demais casos → total da venda
    // Venda nasce "a receber": valor_recebido = 0 até ser marcada "Pago" no ADM
    // (cliente só paga após a montagem). O método de pagamento fica nas notes.
    await supabase.from("orcamentos").update({
      status: "Concluído",
      notes: existingNotes + info,
      // CNPJ obrigatorio na conclusao — atualiza no orcamento (caso nao tinha)
      cliente_cnpj: cd.cnpj || null,
      // Colunas dedicadas para a aba Logistica
      data_entrega: cd.data_entrega || null,
      numero_pedido: cd.numero_pedido || null,
      status_entrega: cd.data_entrega ? "Agendada" : null,
      // Momento em que a venda foi marcada como Concluída — base do gráfico mensal
      data_conclusao: new Date().toISOString(),
      // Contábil: default Gôndolas Suprema. Receita entra só quando marcar "Pago".
      venda_empresa_recebedora: "gondolas_suprema",
      valor_recebido: 0,
    }).eq("id", concluidoId);

    // Ponte CAPI (Fase 1 - coleta): manda a verdade da venda pro Meta aprender.
    // Fire-and-forget: nunca trava nem quebra o fluxo do "Concluído".
    try {
      const ord = orders.find(o => o.id === concluidoId);
      if (ord) {
        fetch("/api/meta-capi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: ord.id,
            telefone: ord.client?.telefone,
            valor: ord.total,
            email: ord.client?.email,
            nome: ord.client?.responsavel,
            cidade: ord.client?.cidade,
            estado: ord.client?.estado,
            cep: ord.client?.cep,
            cnpj: cd.cnpj || ord.client?.cnpj,
          }),
        }).catch(() => {});
      }
    } catch (e) {}

    setOrders(orders.map(o => o.id === concluidoId
      ? { ...o, status: "Concluído", notes: (o.notes || "") + info, client: { ...(o.client || {}), cnpj: cd.cnpj || "" } }
      : o
    ));
    setConcluidoId(null);
  };

  // PDF viewer
  if (pdfHtml) {
    const bodyMatch = pdfHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const styleMatch = pdfHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);

    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <button onClick={() => { setPdfHtml(null); setPdfOrder(null); }} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.text, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>
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

  // Lista de meses disponíveis nos orçamentos (mais recente primeiro)
  const mesesDisponiveis = (() => {
    const set = new Set();
    orders.forEach(o => {
      if (!o.date) return;
      const d = new Date(o.date);
      if (isNaN(d.getTime())) return;
      set.add(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
    });
    return Array.from(set).sort().reverse();
  })();
  const mesNomes = { "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril", "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };
  const formatarMes = (m) => {
    const [ano, mes] = m.split("-");
    return `${mesNomes[mes]} ${ano}`;
  };
  const buscaNorm = buscaNome.trim().toLowerCase();
  const ordersFiltrados = orders.filter(o => {
    if (filterMes !== "all") {
      if (!o.date) return false;
      const d = new Date(o.date);
      if (isNaN(d.getTime())) return false;
      const chave = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      if (chave !== filterMes) return false;
    }
    if (filterStatus !== "all") {
      const st = o.status || "Aguardando Retorno";
      if (st !== filterStatus) return false;
    }
    if (buscaNorm) {
      const alvo = [
        o.client?.empresa, o.client?.responsavel,
        o.client?.cidade, o.client?.cnpj,
        o.id, (o.id || "").slice(0, 6),
      ].filter(Boolean).join(" ").toLowerCase();
      if (!alvo.includes(buscaNorm)) return false;
    }
    return true;
  }).sort(ordenarPorStatus);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 20px" }}>Orçamentos</h1>

      {/* Filtro por mês — disponível pra todos os usuários */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>📅 Filtrar por mês:</span>
        <select
          value={filterMes}
          onChange={e => setFilterMes(e.target.value)}
          style={{ padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", minWidth: 180 }}
        >
          <option value="all">Todos os meses</option>
          {mesesDisponiveis.map(m => <option key={m} value={m}>{formatarMes(m)}</option>)}
        </select>
        <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>🏷️ Status:</span>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", minWidth: 170 }}
        >
          <option value="all">Todos os status</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginLeft: "auto" }}>
          {ordersFiltrados.length} {ordersFiltrados.length === 1 ? "orçamento" : "orçamentos"}
          {filterMes !== "all" && ` em ${formatarMes(filterMes)}`}
        </span>
      </div>

      {/* Busca livre por nome do cliente / nº do orçamento */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, position: "relative" }}>
        <span style={{ position: "absolute", left: 12, color: COLORS.textDim, fontSize: 14, pointerEvents: "none" }}>🔍</span>
        <input
          type="text"
          value={buscaNome}
          onChange={e => setBuscaNome(e.target.value)}
          placeholder="Buscar por nome do cliente, cidade, CNPJ ou nº…"
          style={{ width: "100%", padding: "11px 14px 11px 36px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
        />
        {buscaNome && (
          <button onClick={() => setBuscaNome("")} style={{ position: "absolute", right: 10, background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 16, lineHeight: 1 }} title="Limpar busca">×</button>
        )}
      </div>

      {/* Modal Lista de Peças (UniPlus) */}
      {pecasModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 620, maxWidth: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.accent, fontSize: 20, margin: 0 }}>Peças para o Pedido (UniPlus)</h2>
                <p style={{ color: COLORS.textMuted, fontSize: 12, margin: "4px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
                  {pecasModal.lista.length} item(s) — quantidades agregadas de todos os produtos do orçamento
                </p>
              </div>
              <button onClick={() => { setPecasModal(null); setPecasFeitas({}); }} style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Fechar</button>
            </div>
            <div style={{ overflowY: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                <thead>
                  <tr style={{ background: COLORS.bg, position: "sticky", top: 0 }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>Peça (UniPlus)</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, width: 80 }}>Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  {pecasModal.lista.length === 0 && (
                    <tr><td colSpan={2} style={{ padding: 16, textAlign: "center", color: COLORS.textMuted }}>Nenhum produto deste orçamento tem receita configurada.</td></tr>
                  )}
                  {pecasModal.lista.map((p, idx) => {
                    const feita = !!pecasFeitas[p.id];
                    return (
                      <tr
                        key={p.id}
                        onClick={() => togglePecaFeita(p.id)}
                        title={feita ? "Clique pra desmarcar" : "Clique pra marcar como ja pedido"}
                        style={{
                          borderBottom: idx < pecasModal.lista.length - 1 ? `1px solid ${COLORS.border}` : "none",
                          cursor: "pointer",
                          background: feita ? COLORS.bg : "transparent",
                          transition: "background 0.15s",
                          userSelect: "none",
                        }}
                      >
                        <td style={{
                          padding: "8px 12px",
                          color: feita ? COLORS.textDim : COLORS.text,
                          textDecoration: feita ? "line-through" : "none",
                        }}>{p.nome}</td>
                        <td style={{
                          padding: "8px 12px",
                          color: feita ? COLORS.textDim : COLORS.accent,
                          textAlign: "right",
                          fontWeight: 700,
                          textDecoration: feita ? "line-through" : "none",
                        }}>{p.qty}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pecasModal.naoExpandidos.length > 0 && (
              <div style={{ marginTop: 12, padding: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
                <div style={{ color: COLORS.danger, fontSize: 11, fontWeight: 600, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                  ⚠ Sem receita (não puderam ser destrinchados):
                </div>
                {pecasModal.naoExpandidos.map((it, i) => (
                  <div key={i} style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                    • {it.qty}× {it.nome}{it.opts.length ? ` (${it.opts.join(", ")})` : ""}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  const linhas = pecasModal.lista.map(p => `${p.qty}\t${p.nome}`).join("\n");
                  navigator.clipboard?.writeText(linhas);
                }}
                style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.text, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
              >
                Copiar lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pos-download (desktop) — instrucoes pra anexar PDF no WhatsApp Web */}
      {downloadInfo && (
        <div onClick={() => setDownloadInfo(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, maxWidth: 460, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>✅</span>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 18, margin: 0 }}>PDF baixado!</h2>
            </div>
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 12, color: COLORS.textMuted, fontFamily: "'DM Sans', sans-serif", wordBreak: "break-all" }}>
              📄 <strong style={{ color: COLORS.text }}>{downloadInfo.fileName}</strong>
              <div style={{ color: COLORS.textDim, fontSize: 11, marginTop: 3 }}>Salvo na pasta Downloads do seu computador</div>
            </div>
            <div style={{ color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginBottom: 16, lineHeight: 1.5 }}>
              <strong style={{ color: COLORS.accent }}>Como enviar pelo WhatsApp:</strong>
              <ol style={{ margin: "8px 0 0", paddingLeft: 22, color: COLORS.textMuted }}>
                <li>Clique em <strong style={{ color: "#25D366" }}>"Abrir WhatsApp Web"</strong> abaixo</li>
                <li>Selecione a conversa do cliente</li>
                <li>Clique no <strong>📎 (clipe)</strong> e escolha <strong>"Documento"</strong></li>
                <li>Selecione <em>{downloadInfo.fileName}</em> da pasta Downloads</li>
                <li>Envie</li>
              </ol>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a
                href={downloadInfo.telefone ? `https://wa.me/55${downloadInfo.telefone}` : "https://web.whatsapp.com"}
                target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, minWidth: 160, background: "#25D366", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "center", textDecoration: "none" }}
              >📱 Abrir WhatsApp Web</a>
              <button
                onClick={() => setDownloadInfo(null)}
                style={{ flex: 1, minWidth: 100, background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.text, padding: "10px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
              >Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Anotações Internas — bloco de notas do vendedor sobre o orçamento.
          Não aparece no PDF do cliente (campo separado de notes). */}
      {anotacoesModal && (() => {
        const ord = orders.find(o => o.id === anotacoesModal.orderId);
        const cliente = ord?.client?.empresa || ord?.client?.responsavel || "Sem cliente";
        return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 540, maxWidth: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#F59E0B", fontSize: 20, margin: "0 0 4px" }}>📝 Bloco de Notas</h2>
                  <p style={{ color: COLORS.textMuted, fontSize: 12, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                    Anotações sobre <strong style={{ color: COLORS.text }}>{cliente}</strong> · só você vê (não vai no PDF)
                  </p>
                </div>
                <button onClick={() => setAnotacoesModal(null)} style={{ background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 18, padding: "4px 8px" }}>✕</button>
              </div>
              <textarea
                value={anotacoesModal.texto}
                onChange={e => setAnotacoesModal({ ...anotacoesModal, texto: e.target.value.toUpperCase() })}
                placeholder="Ex: Cliente pediu pra retornar segunda-feira... | Negociar desconto de 5% no fechamento... | Aguardando aprovação interna..."
                rows={10}
                autoFocus
                style={{
                  width: "100%",
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  color: COLORS.text,
                  padding: "12px 14px",
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: 14,
                  minHeight: 180,
                }}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setAnotacoesModal(null)}
                  disabled={savingAnotacoes}
                  style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: savingAnotacoes ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}
                >Cancelar</button>
                <button
                  onClick={salvarAnotacoes}
                  disabled={savingAnotacoes}
                  style={{ flex: 1, background: "#F59E0B", color: "#000", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: savingAnotacoes ? "wait" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}
                >{savingAnotacoes ? "Salvando..." : "💾 Salvar"}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Concluído */}
      {concluidoId && (() => {
        const cd = concluidoData;
        const selStyle = { width: "100%", padding: "10px 14px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };
        const lblStyle = { color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: 0.5 };
        // Aceita CNPJ (14 dígitos) ou CPF (11 dígitos)
        const cnpjDigits = (cd.cnpj || "").replace(/\D/g, "");
        const cnpjOk = cnpjDigits.length === 14 || cnpjDigits.length === 11;
        const canSave = cnpjOk && cd.data_entrega && cd.numero_pedido && cd.pag1 && (cd.pag1 !== "Cartão de Crédito" && cd.pag1 !== "Boleto" || cd.pag1_parcelas);
        return (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 28, width: 460, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#10B981", fontSize: 20, margin: "0 0 6px" }}>Concluir Orçamento</h2>
            <p style={{ color: COLORS.textMuted, fontSize: 12, margin: "0 0 20px", fontFamily: "'DM Sans', sans-serif" }}>Preencha os dados da conclusão</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lblStyle}>CNPJ ou CPF *</label>
                <input
                  placeholder="00.000.000/0001-00 ou 000.000.000-00"
                  value={cd.cnpj}
                  onChange={e => setConcluidoData({ ...cd, cnpj: formatarCnpjOuCpf(e.target.value) })}
                  maxLength={18}
                  style={!cnpjOk && cd.cnpj ? { ...selStyle, borderColor: COLORS.danger } : selStyle}
                />
                {!cnpjOk && cd.cnpj && (
                  <div style={{ color: COLORS.danger, fontSize: 10, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>CNPJ deve ter 14 dígitos ou CPF deve ter 11 dígitos.</div>
                )}
              </div>
              <div>
                <label style={lblStyle}>Data de Entrega *</label>
                <input type="date" value={cd.data_entrega} onChange={e => setConcluidoData({ ...cd, data_entrega: e.target.value })} style={selStyle} />
              </div>
              <div>
                <label style={lblStyle}>Número do Pedido *</label>
                <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                  <input placeholder="Ex: PED-001" value={cd.numero_pedido} onChange={e => setConcluidoData({ ...cd, numero_pedido: e.target.value.toUpperCase() })} style={{ ...selStyle, flex: 1 }} />
                  <button
                    type="button"
                    onClick={() => {
                      const o = orders.find(x => x.id === concluidoId);
                      if (!o) return;
                      setPecasModal(gerarListaPecas(o.items));
                    }}
                    title="Ver pecas para pedido no UniPlus"
                    aria-label="Abrir lista de pecas"
                    style={{
                      background: COLORS.card,
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.accent,
                      borderRadius: 8,
                      padding: "0 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Pagamento 1 */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14 }}>
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
                      {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}x</option>)}
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
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14 }}>
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
                      {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}x</option>)}
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
                <button onClick={() => setConcluidoId(null)} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                <button onClick={saveConcluido} disabled={!canSave} style={{ flex: 1, background: !canSave ? COLORS.textDim : "#10B981", color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: !canSave ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Concluir</button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {ordersFiltrados.length === 0 && filterMes !== "all" && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: "32px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
          <div style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            Nenhum orçamento em {formatarMes(filterMes)}.
          </div>
          <button onClick={() => setFilterMes("all")} style={{ marginTop: 12, background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.accent, padding: "6px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Mostrar todos</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ordersFiltrados.map(o => {
          const isOpen = expanded === o.id;
          const isConfirming = confirmDel === o.id;
          return (
            <div key={o.id} style={{ background: COLORS.card, border: `1px solid ${isOpen ? COLORS.orange + "40" : COLORS.border}`, borderRadius: 12, overflow: "hidden", transition: "all .2s" }}>
              {/* Header */}
              <div onClick={() => setExpanded(isOpen ? null : o.id)} style={{ padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: COLORS.textDim, fontSize: 18, transition: "transform .2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>▸</span>
                  <div>
                    <span style={{ fontSize: 14, color: COLORS.white, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{o.client?.empresa || o.client?.responsavel || "Sem cliente"}</span>
                    {/* Marcador "RS particular" — orcamentos RS do Ale ficam fora de ADM/DRE/Logistica/ranking */}
                    {user.id === "v1" && String(o.client?.estado || "").trim().toUpperCase() === "RS" && (
                      <span style={{ marginLeft: 8, background: "#8B5CF6" + "20", color: "#8B5CF6", padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }} title="Orçamento particular RS — não aparece em ADM, DRE, Logística nem ranking">🔒 RS</span>
                    )}
                    <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
                      Vendedor: <strong style={{ color: COLORS.accent }}>{o.vendedor || user.name}</strong>
                      <span style={{ marginLeft: 8, color: COLORS.textDim }}>{new Date(o.date).toLocaleDateString("pt-BR")}</span>
                      <span style={{ marginLeft: 8, color: COLORS.textDim }}>{o.items.length} {o.items.length === 1 ? "item" : "itens"}</span>
                    </div>
                    {(o.client?.telefone || o.client?.cidade) && (
                      <div style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginTop: 3, fontWeight: 600, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                        {o.client?.telefone && (
                          <span style={{ color: "#10B981" }}>📱 {formatarCelular(o.client.telefone)}</span>
                        )}
                        {o.client?.cidade && (
                          <span style={{ color: COLORS.textMuted }}>📍 {o.client.cidade}{o.client?.estado ? `/${o.client.estado}` : ""}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <TermometroLead value={o.temperatura} onChange={(v) => updateTemperatura(o.id, v)} canEdit={true} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setAnotacoesModal({ orderId: o.id, texto: o.anotacoes || "" }); }}
                    title={o.anotacoes ? "Ver/editar anotações" : "Adicionar anotação"}
                    style={{
                      position: "relative",
                      background: o.anotacoes ? "#F59E0B20" : "transparent",
                      border: `1px solid ${o.anotacoes ? "#F59E0B60" : COLORS.border}`,
                      color: o.anotacoes ? "#F59E0B" : COLORS.textMuted,
                      padding: "5px 9px",
                      borderRadius: 7,
                      cursor: "pointer",
                      fontSize: 13,
                      lineHeight: 1,
                    }}
                  >
                    📝
                    {o.anotacoes && (
                      <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: "50%", background: "#F59E0B", border: `1.5px solid ${COLORS.card}` }} />
                    )}
                  </button>
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
                            <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                              <span style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{it.cat}</span>
                              <span style={{ color: COLORS.textDim, fontSize: 11 }}>×{it.qty}</span>
                              {itemOptsLabel(it) && <span style={{ color: COLORS.orange, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{itemOptsLabel(it)}</span>}
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
                    const valorDesconto = Number(o.desconto) || 0;
                    // Total = (Custo - Desconto) + Comissao + Frete  =>  Custo = Total + Desconto - Comissao - Frete
                    const valorCusto = (Number(o.total) || 0) + valorDesconto - valorComissao - valorFrete;
                    const linhaStyle = { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "4px 0", fontFamily: "'DM Sans', sans-serif" };
                    const labelStyle = { color: COLORS.textMuted, fontSize: 12 };
                    const valorStyle = { color: COLORS.text, fontSize: 13, fontWeight: 600 };
                    return (
                      <div style={{ background: `linear-gradient(135deg, ${COLORS.orange}10, ${COLORS.orange}05)`, border: `1px solid ${COLORS.orange}25`, borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                        <div style={linhaStyle}>
                          <span style={labelStyle}>Valor Custo</span>
                          <span style={valorStyle}>{fmtMoney(valorCusto)}</span>
                        </div>
                        {valorDesconto > 0 && (
                          <div style={linhaStyle}>
                            <span style={labelStyle}>− Desconto</span>
                            <span style={{ ...valorStyle, color: COLORS.danger }}>{fmtMoney(valorDesconto)}</span>
                          </div>
                        )}
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
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDel(null); }} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                        <button onClick={(e) => { e.stopPropagation(); deleteOrder(o.id); }} style={{ background: COLORS.danger, border: "none", color: "#fff", padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Sim, excluir</button>
                      </div>
                    </div>
                  )}

                  {/* Toggle: incluir tabela de parcelamento por boleto no PDF/HTML enviado pro cliente */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "10px 12px", background: parcelamentoOpts[o.id] ? "#10B98112" : COLORS.bg, border: `1px solid ${parcelamentoOpts[o.id] ? "#10B98140" : COLORS.border}`, borderRadius: 8 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setParcelamentoOpts(prev => ({ ...prev, [o.id]: !prev[o.id] })); }}
                      title={parcelamentoOpts[o.id] ? "Parcelamento será incluído no orçamento" : "Clique para incluir parcelamento"}
                      style={{
                        background: parcelamentoOpts[o.id] ? "#10B981" : "transparent",
                        border: `1.5px solid ${parcelamentoOpts[o.id] ? "#10B981" : COLORS.border}`,
                        width: 22, height: 22, borderRadius: 5, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 13, fontWeight: 800, padding: 0, lineHeight: 1
                      }}
                    >{parcelamentoOpts[o.id] ? "✓" : ""}</button>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: parcelamentoOpts[o.id] ? "#10B981" : COLORS.text, fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>🧾 Incluir parcelamento por boleto</div>
                      <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>
                        {parcelamentoOpts[o.id] ? "A tabela de parcelas (1x a 12x) será adicionada no orçamento." : "Sem parcelamento — orçamento envia só o total."}
                      </div>
                    </div>
                  </div>

                  {/* Toggle: incluir tabela de parcelamento por cartao de credito (valores ainda nao definidos) */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "10px 12px", background: parcelamentoCartaoOpts[o.id] ? "#3B82F612" : COLORS.bg, border: `1px solid ${parcelamentoCartaoOpts[o.id] ? "#3B82F640" : COLORS.border}`, borderRadius: 8 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setParcelamentoCartaoOpts(prev => ({ ...prev, [o.id]: !prev[o.id] })); }}
                      title={parcelamentoCartaoOpts[o.id] ? "Cartão de crédito será incluído no orçamento" : "Clique para incluir cartão de crédito"}
                      style={{
                        background: parcelamentoCartaoOpts[o.id] ? "#3B82F6" : "transparent",
                        border: `1.5px solid ${parcelamentoCartaoOpts[o.id] ? "#3B82F6" : COLORS.border}`,
                        width: 22, height: 22, borderRadius: 5, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 13, fontWeight: 800, padding: 0, lineHeight: 1
                      }}
                    >{parcelamentoCartaoOpts[o.id] ? "✓" : ""}</button>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: parcelamentoCartaoOpts[o.id] ? "#3B82F6" : COLORS.text, fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>💳 Incluir parcelamento por cartão de crédito</div>
                      <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>
                        {parcelamentoCartaoOpts[o.id] ? "A tabela de parcelas (2x a 18x) será adicionada no orçamento." : "Sem cartão — orçamento envia só o total."}
                      </div>
                    </div>
                  </div>

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

                  {/* Dados do Cliente (editaveis) */}
                  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>👤 Dados do Cliente</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <div style={{ color: COLORS.textDim, fontSize: 10, marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>Empresa</div>
                        <input value={editClient.empresa} onChange={e => setEditClient({ ...editClient, empresa: e.target.value })} placeholder="Nome da empresa" style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                          <span style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>CNPJ ou CPF</span>
                          {editBuscandoCnpj && <span style={{ color: COLORS.orange, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>🔍 buscando...</span>}
                        </div>
                        <input
                          value={editClient.cnpj}
                          onChange={e => setEditClient({ ...editClient, cnpj: formatarCnpjOuCpf(e.target.value) })}
                          onBlur={e => buscarCnpjEdit(e.target.value)}
                          maxLength={18}
                          placeholder="00.000.000/0001-00 ou 000.000.000-00"
                          style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
                        />
                        {editCnpjMsg.texto && (
                          <div style={{ marginTop: 4, fontSize: 10, fontFamily: "'DM Sans', sans-serif", color: editCnpjMsg.tipo === "erro" ? COLORS.danger : COLORS.success }}>
                            {editCnpjMsg.tipo === "erro" ? "⚠️ " : "✓ "}{editCnpjMsg.texto}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ color: COLORS.textDim, fontSize: 10, marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>Responsável</div>
                        <input value={editClient.responsavel} onChange={e => setEditClient({ ...editClient, responsavel: e.target.value })} placeholder="Nome do responsável" style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <div style={{ color: COLORS.textDim, fontSize: 10, marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>Celular</div>
                        <input value={editClient.telefone} onChange={e => setEditClient({ ...editClient, telefone: formatarCelular(e.target.value) })} maxLength={14} placeholder="(00)00000-0000" style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <div style={{ color: COLORS.textDim, fontSize: 10, marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>E-mail</div>
                        <input value={editClient.email} onChange={e => setEditClient({ ...editClient, email: e.target.value })} placeholder="email@cliente.com" style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <div style={{ color: COLORS.textDim, fontSize: 10, marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>Endereço</div>
                        <input value={editClient.endereco} onChange={e => setEditClient({ ...editClient, endereco: e.target.value })} placeholder="Rua, número" style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <div style={{ color: COLORS.textDim, fontSize: 10, marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>Bairro</div>
                        <input value={editClient.bairro} onChange={e => setEditClient({ ...editClient, bairro: e.target.value })} placeholder="Bairro" style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <div style={{ color: COLORS.textDim, fontSize: 10, marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>CEP</div>
                        <input value={editClient.cep} onChange={e => setEditClient({ ...editClient, cep: e.target.value })} placeholder="00000-000" maxLength={9} style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <div style={{ color: COLORS.textDim, fontSize: 10, marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>Cidade</div>
                        <input value={editClient.cidade} onChange={e => setEditClient({ ...editClient, cidade: e.target.value })} placeholder="Cidade" style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <div style={{ color: COLORS.textDim, fontSize: 10, marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>Estado (UF)</div>
                        <input value={editClient.estado} onChange={e => setEditClient({ ...editClient, estado: e.target.value.toUpperCase().slice(0, 2) })} placeholder="SC" maxLength={2} style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", textTransform: "uppercase" }} />
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                          <span style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>
                            Inscrição Estadual <span style={{ fontStyle: "italic" }}>(obrigatória pra NF-e quando o cliente é contribuinte)</span>
                          </span>
                          <a
                            href="http://www.sintegra.gov.br/"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Consultar IE no SINTEGRA — escolha o estado"
                            style={{ color: COLORS.orange, fontSize: 10, fontFamily: "'DM Sans', sans-serif", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}
                          >🔍 Consultar SINTEGRA ↗</a>
                        </div>
                        <input value={editClient.ie} onChange={e => setEditClient({ ...editClient, ie: e.target.value })} placeholder='Apenas dígitos · ou escreva "ISENTO" se o cliente for isento' style={{ width: "100%", padding: "7px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </div>
                    </div>
                  </div>

                  {/* Edit Items */}
                  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
                    <div style={{ padding: "10px 14px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>Itens ({editItems.length})</span>
                      <button onClick={() => { addMoreItems(o.id); cancelEdit(); }} style={{ background: "transparent", border: "none", color: COLORS.orange, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>+ Adicionar item</button>
                    </div>
                    {editItems.map((it, i) => {
                      // Calcula preco unitario a partir do total/qty originais
                      // pra recalcular total quando o usuario mudar a qty.
                      const qtyAtual = Number(it.qty) || 1;
                      const precoUnit = (Number(it.total) || 0) / qtyAtual;
                      const setQty = (novaQty) => {
                        const q = Math.max(1, Number(novaQty) || 1);
                        setEditItems(editItems.map((x, j) => j === i ? { ...x, qty: q, total: precoUnit * q } : x));
                      };
                      return (
                      <div key={i} style={{ padding: "10px 14px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{it.name}</div>
                          <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{it.cat}{itemOptsLabel(it) ? <span style={{ color: COLORS.orange }}> · {itemOptsLabel(it)}</span> : null}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <button onClick={() => setQty(qtyAtual - 1)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, width: 24, height: 26, borderRadius: "6px 0 0 6px", cursor: "pointer", fontSize: 13 }}>−</button>
                            <input
                              type="number" min="1"
                              value={qtyAtual}
                              onFocus={e => e.target.select()}
                              onChange={e => setQty(e.target.value)}
                              style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderLeft: "none", borderRight: "none", width: 44, height: 26, textAlign: "center", color: COLORS.white, fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", padding: 0, MozAppearance: "textfield" }}
                            />
                            <button onClick={() => setQty(qtyAtual + 1)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, width: 24, height: 26, borderRadius: "0 6px 6px 0", cursor: "pointer", fontSize: 13 }}>+</button>
                          </div>
                          <span style={{ color: COLORS.text, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", minWidth: 80, textAlign: "right" }}>{fmt(precoUnit * qtyAtual)}</span>
                          <button onClick={() => setEditItems(editItems.filter((_, j) => j !== i))} style={{ background: COLORS.danger + "15", border: "none", color: COLORS.danger, padding: "4px 7px", borderRadius: 5, cursor: "pointer", fontSize: 11, lineHeight: 1 }}>✕</button>
                        </div>
                      </div>
                      );
                    })}
                  </div>

                  {/* Edit Desconto */}
                  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Desconto no custo (R$):</span>
                    <input type="number" min="0" value={editDesconto || ""} onChange={e => setEditDesconto(Number(e.target.value) || 0)} placeholder="0,00" style={{ width: 100, padding: "6px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.danger, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center" }} />
                    <span style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{editDesconto > 0 ? "Aplicado antes da comissão" : "Sem desconto"}</span>
                  </div>

                  {/* Edit Markup */}
                  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Aplicar margem (%):</span>
                    <input type="number" min="0" max="500" value={editMarkup || ""} onChange={e => setEditMarkup(Number(e.target.value) || 0)} placeholder="0" style={{ width: 70, padding: "6px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.orange, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center" }} />
                    <span style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{editMarkup > 0 ? "+" + editMarkup + "% sobre custo c/ desconto" : "Sem margem extra"}</span>
                  </div>

                  {/* Edit Frete */}
                  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Frete (R$):</span>
                    <input type="number" min="0" value={editFrete || ""} onChange={e => setEditFrete(Number(e.target.value) || 0)} placeholder="0,00" style={{ width: 100, padding: "6px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.orange, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center" }} />
                    <button
                      type="button"
                      onClick={() => calcularFreteEdit(o)}
                      disabled={freteCalcEdit.loading}
                      style={{ background: freteCalcEdit.loading ? COLORS.textDim : COLORS.orange, color: "#000", border: "none", padding: "8px 14px", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: freteCalcEdit.loading ? "wait" : "pointer", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {freteCalcEdit.loading ? "Calculando…" : "📍 Calcular frete"}
                    </button>
                    {freteCalcEdit.texto && (
                      <div style={{ width: "100%", fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: freteCalcEdit.tipo === "erro" ? COLORS.danger : freteCalcEdit.tipo === "ok" ? COLORS.success : COLORS.textMuted }}>
                        {freteCalcEdit.tipo === "ok" ? "✓ " : freteCalcEdit.tipo === "erro" ? "⚠ " : ""}{freteCalcEdit.texto}
                      </div>
                    )}
                  </div>

                  {/* Edit Notes */}
                  <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Observações..." rows={2} style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, color: COLORS.text, padding: "10px 14px", fontSize: 12, fontFamily: "'DM Sans', sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 14 }} />

                  {/* Edit Total Preview */}
                  {(() => {
                    const subCusto = editItems.reduce((s, it) => s + (Number(it.total) || 0), 0);
                    const desc = Math.min(Math.max(0, Number(editDesconto) || 0), subCusto);
                    const baseDesc = subCusto - desc;
                    const com = baseDesc * (Number(editMarkup) || 0) / 100;
                    const fr = Number(editFrete) || 0;
                    const novoTotal = baseDesc + com + fr;
                    return (
                      <div style={{ background: `linear-gradient(135deg, #3B82F615, #3B82F605)`, border: "1px solid #3B82F630", borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: COLORS.textMuted, fontSize: 11 }}>Subtotal itens</span>
                          <span style={{ color: COLORS.text, fontSize: 11 }}>{fmt(subCusto)}</span>
                        </div>
                        {desc > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: COLORS.textMuted, fontSize: 11 }}>Desconto</span>
                          <span style={{ color: COLORS.danger, fontSize: 11 }}>−{fmt(desc)}</span>
                        </div>}
                        {editMarkup > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: COLORS.textMuted, fontSize: 11 }}>Margem ({editMarkup}%)</span>
                          <span style={{ color: COLORS.success, fontSize: 11 }}>+{fmt(com)}</span>
                        </div>}
                        {fr > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: COLORS.textMuted, fontSize: 11 }}>Frete</span>
                          <span style={{ color: COLORS.text, fontSize: 11 }}>+{fmt(fr)}</span>
                        </div>}
                        <div style={{ borderTop: "1px solid #3B82F630", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: COLORS.white, fontSize: 13, fontWeight: 700 }}>NOVO TOTAL</span>
                          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: "#3B82F6" }}>{fmt(novoTotal)}</span>
                        </div>
                      </div>
                    );
                  })()}

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

// ─── LOGISTICA ───
function LogisticaPage({ user }) {
  const [allEntregas, setAllEntregas] = useState([]);
  // Chave do mês atual no formato YYYY-MM (padrão do filtro)
  const _hojeRef = new Date();
  const _mesAtualKey = _hojeRef.getFullYear() + "-" + String(_hojeRef.getMonth() + 1).padStart(2, "0");
  const [filterMes, setFilterMes] = useState(_mesAtualKey);
  const [filterRegiao, setFilterRegiao] = useState("all");
  // Default: só pendentes (entregas que ainda não foram concluídas).
  // "pendentes" = tudo menos "Entregue". Pode trocar pra "all", "Entregue"
  // ou um status específico no dropdown.
  const [filterStatus, setFilterStatus] = useState("pendentes");
  const [confirmDelLog, setConfirmDelLog] = useState(null); // id do orcamento aguardando confirmacao
  // Modal de itens desmembrados ao clicar no nome do cliente
  const [pecasModal, setPecasModal] = useState(null); // { entrega, lista, naoExpandidos }
  // Produtos UniPlus pra resolver nomes das peças no desmembramento
  const [uniplusProducts, setUniplusProducts] = useState([]);

  const podeEditar = canEditLogistica(user);
  // Mesmos roles que editam (admin/gestor = Alessandro/Zanella) tambem excluem
  const podeExcluir = podeEditar;

  useEffect(() => {
    const load = async () => {
      // Todos os usuarios veem TODAS as entregas (Logistica é visao consolidada
      // de equipe — Ale, Zanella, Adelmo e Joao precisam ver a mesma agenda).
      // Apenas a edicao continua restrita (canEditLogistica).
      const q = supabase.from("orcamentos").select("*").not("data_entrega", "is", null);
      const { data } = await q.order("data_entrega", { ascending: true });
      if (data) {
        // Orcamentos RS-ocultos do Ale ficam fora da Logistica consolidada
        const visiveis = data.filter(o => !isOrcamentoRsOculto(o));
        setAllEntregas(visiveis.map(o => ({
          id: o.id,
          empresa: o.cliente_empresa || "",
          cidade: o.cliente_cidade || "",
          uf: o.cliente_estado || "",
          endereco: o.cliente_endereco || "",
          numero: o.cliente_numero || "",
          bairro: o.cliente_bairro || "",
          cep: o.cliente_cep || "",
          vendedor: o.vendedor_nome || "",
          total: o.total || 0,
          dataEntrega: o.data_entrega,
          numeroPedido: o.numero_pedido || "",
          statusEntrega: o.status_entrega || "Agendada",
          items: o.items || [],
          // Forma de pagamento fica embutida nas notes ("... | Pagamento: ...")
          pagamento: (() => {
            const m = (o.notes || "").match(/Pagamento:\s*([^\n]+)/i);
            return m ? m[1].trim() : "";
          })(),
        })));
      }
    };
    load();
  }, [user]);

  // Carrega produtos UniPlus para resolver nomes de peças no desmembramento
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("produtos_uniplus").select("id, nome").eq("ativo", true);
      if (data) setUniplusProducts(data);
    };
    load();
  }, []);

  const uniplusNomes = useMemo(() => {
    const m = {};
    const slug = (s) => (s || "").toString().toUpperCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ").trim()
      .replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
    uniplusProducts.forEach(p => {
      if (p.id) m[p.id] = p.nome;
      if (p.nome) m["nome:" + slug(p.nome)] = p.nome;
    });
    return m;
  }, [uniplusProducts]);

  // Desmembra itens do orçamento em peças UniPlus (mesma lógica usada
  // no modal "Peças para o Pedido" da aba Orçamentos).
  const gerarListaPecasEntrega = (items) => {
    const pecas = {};
    const naoExpandidos = [];
    const slugPeca = (s) => (s || "").toString().toUpperCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ").trim()
      .replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
    (items || []).forEach(it => {
      const qtd = Number(it.qty) || 0;
      const orig =
        (it.product?.id != null && PRODUCTS.find(p => p.id === it.product.id)) ||
        (it.product_id != null && PRODUCTS.find(p => p.id === it.product_id)) ||
        (it.name && PRODUCTS.find(p => p.name === it.name)) ||
        it.product || null;
      let key = null;
      if (orig && orig.id != null && Array.isArray(it.opts) && it.opts.length) {
        const candidate = [orig.id, ...it.opts].join("|");
        if (PRODUCT_RECIPES[candidate]) {
          key = candidate;
        } else if (Array.isArray(orig.variants) && orig.variants.length) {
          const ordenado = orig.variants.map(v => it.opts.find(o => (v.options || []).includes(o)));
          if (ordenado.every(Boolean)) {
            const c2 = [orig.id, ...ordenado].join("|");
            if (PRODUCT_RECIPES[c2]) key = c2;
          }
        }
      }
      const receita = key && PRODUCT_RECIPES[key];
      if (!receita) {
        // Tenta como peça UniPlus avulsa (mesma chave que as receitas)
        const nomeItem = orig?.name || it.name || it.product?.name || "";
        const candidatos = [
          nomeItem && ("nome:" + slugPeca(nomeItem)),
          it.product?.id, it.product_id, orig?.id,
        ].filter(Boolean);
        const pid = candidatos.find(c => uniplusNomes[c]);
        if (pid) {
          pecas[pid] = (pecas[pid] || 0) + qtd;
          return;
        }
        naoExpandidos.push({ nome: nomeItem || "(sem nome)", qty: qtd, opts: it.opts || [] });
        return;
      }
      receita.forEach(([uniplusId, qtdPorUnidade]) => {
        pecas[uniplusId] = (pecas[uniplusId] || 0) + qtdPorUnidade * qtd;
      });
    });
    const lista = Object.entries(pecas)
      .map(([id, qty]) => ({ id, nome: uniplusNomes[id] || id, qty }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return { lista, naoExpandidos };
  };

  const abrirPecasEntrega = (entrega) => {
    const { lista, naoExpandidos } = gerarListaPecasEntrega(entrega.items);
    setPecasModal({ entrega, lista, naoExpandidos });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const chaveMesEntrega = (s) => {
    if (!s) return null;
    const d = new Date(s + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  };

  const inPeriodo = (entrega) => {
    if (filterMes === "all") return true;
    if (filterMes === "atrasadas") {
      if (!entrega.dataEntrega) return false;
      const d = new Date(entrega.dataEntrega + "T00:00:00");
      return d < today && entrega.statusEntrega !== "Entregue";
    }
    return chaveMesEntrega(entrega.dataEntrega) === filterMes;
  };

  // Lista de meses disponíveis nas entregas (descendente; mês atual sempre presente)
  const mesesDisponiveisLog = (() => {
    const set = new Set();
    allEntregas.forEach(o => { const k = chaveMesEntrega(o.dataEntrega); if (k) set.add(k); });
    set.add(_mesAtualKey);
    return Array.from(set).sort().reverse();
  })();
  const _mesNomesLog = { "01":"Janeiro","02":"Fevereiro","03":"Março","04":"Abril","05":"Maio","06":"Junho","07":"Julho","08":"Agosto","09":"Setembro","10":"Outubro","11":"Novembro","12":"Dezembro" };
  const formatarMesLog = (m) => { const [ano, mes] = m.split("-"); return `${_mesNomesLog[mes]} ${ano}`; };

  const filtered = allEntregas.filter(o => {
    if (!inPeriodo(o)) return false;
    if (filterStatus === "pendentes" && o.statusEntrega === "Entregue") return false;
    if (filterStatus !== "all" && filterStatus !== "pendentes" && o.statusEntrega !== filterStatus) return false;
    if (filterRegiao !== "all" && getRegiao(o.cidade, o.uf) !== filterRegiao) return false;
    return true;
  });

  // Agrupa por DATA de entrega (cada bloco = um dia). Datas crescente.
  // Entregas sem data caem num grupo "sem-data" no fim.
  const grouped = filtered.reduce((acc, o) => {
    const d = o.dataEntrega || "sem-data";
    if (!acc[d]) acc[d] = [];
    acc[d].push(o);
    return acc;
  }, {});
  const datasOrdenadas = Object.keys(grouped).sort((a, b) => {
    if (a === "sem-data") return 1;
    if (b === "sem-data") return -1;
    return a.localeCompare(b);
  });

  // Stats
  const totalEntregas = filtered.length;
  const atrasadas = allEntregas.filter(o => {
    const d = new Date(o.dataEntrega + "T00:00:00");
    return d < today && o.statusEntrega !== "Entregue";
  }).length;
  const proxima = allEntregas
    .filter(o => o.dataEntrega && new Date(o.dataEntrega + "T00:00:00") >= today && o.statusEntrega !== "Entregue")
    .sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega))[0];
  const valorTotal = filtered.reduce((s, o) => s + (o.total || 0), 0);

  const updateStatus = async (id, novoStatus) => {
    await supabase.from("orcamentos").update({ status_entrega: novoStatus }).eq("id", id);
    setAllEntregas(prev => prev.map(o => o.id === id ? { ...o, statusEntrega: novoStatus } : o));
  };
  const updateData = async (id, novaData) => {
    await supabase.from("orcamentos").update({ data_entrega: novaData || null }).eq("id", id);
    setAllEntregas(prev => prev.map(o => o.id === id ? { ...o, dataEntrega: novaData } : o));
  };
  // Remove a entrega APENAS da Logística — não apaga o orçamento.
  // Zera data_entrega e status_entrega; o orçamento continua existindo
  // nas abas Orçamentos, ADM, Comissões etc. A query desta página filtra
  // por "data_entrega IS NOT NULL", então setar null é o suficiente pra
  // sumir daqui.
  const excluirOrcamentoLog = async (id) => {
    await supabase.from("orcamentos").update({
      data_entrega: null,
      status_entrega: null,
    }).eq("id", id);
    setAllEntregas(prev => prev.filter(o => o.id !== id));
    setConfirmDelLog(null);
  };

  const fmtData = (s) => {
    if (!s) return "—";
    const d = new Date(s + "T00:00:00");
    return d.toLocaleDateString("pt-BR");
  };
  const sel = { padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none" };
  const statCard = (label, value, color, small) => (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, padding: 16 }}>
      <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ color: color, fontSize: small ? 18 : 24, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{value}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 4px" }}>📦 Logística</h1>
      <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 20px", fontFamily: "'DM Sans', sans-serif" }}>
        Cronograma de entregas organizado por data
        {!podeEditar && <span style={{ color: COLORS.textDim, fontStyle: "italic" }}> · somente leitura</span>}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
        {statCard("Entregas no Período", totalEntregas, COLORS.orange)}
        {statCard("Atrasadas", atrasadas, atrasadas > 0 ? "#F87171" : COLORS.textMuted)}
        {statCard("Próxima Entrega", proxima ? fmtData(proxima.dataEntrega) : "—", "#3B82F6", true)}
        {statCard("Valor Total", fmt(valorTotal), COLORS.success, true)}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        <select value={filterMes} onChange={e => setFilterMes(e.target.value)} style={sel}>
          <option value="all">Todos os meses</option>
          <option value="atrasadas">Atrasadas</option>
          {mesesDisponiveisLog.map(m => <option key={m} value={m}>{formatarMesLog(m)}</option>)}
        </select>
        <select value={filterRegiao} onChange={e => setFilterRegiao(e.target.value)} style={sel}>
          <option value="all">Todas as regiões</option>
          {[...REGIOES_ENTREGA.map(r => r.nome), "Outras de SC", "Outras de RS", "Outras regiões"].map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={sel}>
          <option value="pendentes">Pendentes (não entregues)</option>
          <option value="all">Todos os status</option>
          {STATUS_ENTREGA_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {datasOrdenadas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ color: COLORS.textMuted, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>Nenhuma entrega com os filtros atuais</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {datasOrdenadas.map(dataKey => {
            const items = grouped[dataKey];
            // Cabeçalho do bloco: data formatada (ou "Sem data definida")
            const dataLabel = dataKey === "sem-data" ? "Sem data definida" : (() => {
              const d = new Date(dataKey + "T00:00:00");
              const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
              const dia = d.toLocaleDateString("pt-BR");
              const semana = diasSemana[d.getDay()];
              const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
              let rel = "";
              if (diff === 0) rel = " · hoje";
              else if (diff === 1) rel = " · amanhã";
              else if (diff === -1) rel = " · ontem";
              else if (diff < 0) rel = ` · há ${-diff} dias`;
              else if (diff <= 30) rel = ` · em ${diff} dias`;
              return `${dia} (${semana})${rel}`;
            })();
            const atrasado = dataKey !== "sem-data" && new Date(dataKey + "T00:00:00") < today;
            return (
              <div key={dataKey} style={{ background: COLORS.card, border: `1px solid ${atrasado ? "#F8717140" : COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: atrasado ? "#F87171" : COLORS.accent, fontSize: 16, margin: 0 }}>📅 {dataLabel}</h3>
                  <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{items.length} {items.length === 1 ? "entrega" : "entregas"}</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                    <thead>
                      <tr style={{ background: COLORS.bg }}>
                        <th style={{ padding: "10px 14px", textAlign: "left", color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Cliente</th>
                        <th style={{ padding: "10px 14px", textAlign: "left", color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Cidade</th>
                        <th style={{ padding: "10px 14px", textAlign: "left", color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Vendedor</th>
                        <th style={{ padding: "10px 14px", textAlign: "left", color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Pedido</th>
                        <th style={{ padding: "10px 14px", textAlign: "right", color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Valor</th>
                        <th style={{ padding: "10px 14px", textAlign: "left", color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Pagamento</th>
                        <th style={{ padding: "10px 14px", textAlign: "left", color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Data Entrega</th>
                        <th style={{ padding: "10px 14px", textAlign: "left", color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</th>
                        {podeExcluir && <th style={{ padding: "10px 14px", textAlign: "center", color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, width: 60 }}>Ações</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(o => {
                        const cor = STATUS_ENTREGA_COLORS[o.statusEntrega] || COLORS.textMuted;
                        return (
                          <tr key={o.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                            <td style={{ padding: "12px 14px", color: COLORS.text, fontWeight: 600 }}>
                              <button
                                onClick={() => abrirPecasEntrega(o)}
                                title="Clique para ver os itens desmembrados do pedido"
                                style={{ background: "transparent", border: "none", color: COLORS.text, fontWeight: 600, fontSize: 12, fontFamily: "'DM Sans', sans-serif", padding: 0, cursor: "pointer", textDecoration: "underline", textDecorationColor: COLORS.accent + "60", textUnderlineOffset: 3, textAlign: "left" }}
                              >{o.empresa || "—"}</button>
                            </td>
                            <td style={{ padding: "12px 14px", color: COLORS.textMuted }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span>{o.cidade}{o.uf ? "/" + o.uf : ""}</span>
                                {(() => {
                                  const partes = [
                                    o.endereco && o.numero ? `${o.endereco}, ${o.numero}` : o.endereco,
                                    o.bairro,
                                    o.cidade,
                                    o.uf,
                                  ].filter(Boolean);
                                  if (partes.length === 0) return null;
                                  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(partes.join(", "))}&navigate=yes`;
                                  return (
                                    <a
                                      href={wazeUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      title={`Abrir rota no Waze: ${partes.join(", ")}`}
                                      style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#33ccff15", border: "1px solid #33ccff40", color: "#33ccff", padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, textDecoration: "none", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}
                                    >🚗 Waze</a>
                                  );
                                })()}
                              </div>
                            </td>
                            <td style={{ padding: "12px 14px", color: COLORS.accent, fontSize: 12, fontWeight: 500 }}>{o.vendedor || "—"}</td>
                            <td style={{ padding: "12px 14px", color: COLORS.text, fontFamily: "monospace" }}>{o.numeroPedido || "—"}</td>
                            <td style={{ padding: "12px 14px", color: COLORS.orange, fontWeight: 700, textAlign: "right", whiteSpace: "nowrap" }}>{fmt(o.total)}</td>
                            <td style={{ padding: "12px 14px", color: o.pagamento ? COLORS.text : COLORS.textDim, fontSize: 12 }}>{o.pagamento || "—"}</td>
                            <td style={{ padding: "12px 14px", color: COLORS.text }}>
                              {podeEditar ? (
                                <input type="date" value={o.dataEntrega || ""} onChange={(e) => updateData(o.id, e.target.value)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, padding: "4px 8px", borderRadius: 6, fontSize: 12, fontFamily: "'DM Sans', sans-serif", colorScheme: "dark" }} />
                              ) : (
                                fmtData(o.dataEntrega)
                              )}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              {podeEditar ? (
                                <select value={o.statusEntrega} onChange={(e) => updateStatus(o.id, e.target.value)} style={{ background: cor + "20", border: `1px solid ${cor}40`, color: cor, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
                                  {STATUS_ENTREGA_OPTIONS.map(s => <option key={s} value={s} style={{ background: COLORS.bg, color: COLORS.text }}>{s}</option>)}
                                </select>
                              ) : (
                                <span style={{ background: cor + "20", color: cor, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{o.statusEntrega}</span>
                              )}
                            </td>
                            {podeExcluir && (
                              <td style={{ padding: "12px 14px", textAlign: "center" }}>
                                {confirmDelLog === o.id ? (
                                  <div style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                                    <button
                                      onClick={() => excluirOrcamentoLog(o.id)}
                                      title="Remover entrega da Logística (orçamento permanece)"
                                      style={{ background: COLORS.danger, border: "none", color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                                    >Sim</button>
                                    <button
                                      onClick={() => setConfirmDelLog(null)}
                                      title="Cancelar"
                                      style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "4px 8px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                                    >✕</button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDelLog(o.id)}
                                    title="Remover desta lista (não apaga o orçamento)"
                                    style={{ background: COLORS.danger + "10", border: `1px solid ${COLORS.danger}30`, color: COLORS.danger, padding: "4px 8px", borderRadius: 6, fontSize: 13, cursor: "pointer", lineHeight: 1 }}
                                  >🗑️</button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: itens desmembrados do pedido (ao clicar no nome do cliente) */}
      {pecasModal && (
        <div onClick={() => setPecasModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 640, maxWidth: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.accent, fontSize: 18, margin: 0 }}>📦 Itens do Pedido — {pecasModal.entrega.empresa || "Cliente"}</h2>
                <p style={{ color: COLORS.textMuted, fontSize: 12, margin: "4px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
                  {pecasModal.entrega.numeroPedido ? `Pedido ${pecasModal.entrega.numeroPedido} · ` : ""}
                  Entrega: {pecasModal.entrega.dataEntrega ? fmtData(pecasModal.entrega.dataEntrega) : "—"}
                  {" · "}{pecasModal.lista.length} peça(s) para descarga
                </p>
              </div>
              <button onClick={() => setPecasModal(null)} style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Fechar</button>
            </div>
            <div style={{ overflowY: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                <thead>
                  <tr style={{ background: COLORS.bg, position: "sticky", top: 0 }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>Peça</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, width: 80 }}>Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  {pecasModal.lista.length === 0 && pecasModal.naoExpandidos.length === 0 && (
                    <tr><td colSpan={2} style={{ padding: 16, textAlign: "center", color: COLORS.textMuted }}>Pedido sem itens.</td></tr>
                  )}
                  {pecasModal.lista.map((p, idx) => (
                    <tr key={p.id} style={{ borderBottom: idx < pecasModal.lista.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                      <td style={{ padding: "8px 12px", color: COLORS.text }}>{p.nome}</td>
                      <td style={{ padding: "8px 12px", color: COLORS.accent, textAlign: "right", fontWeight: 700 }}>{p.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pecasModal.naoExpandidos.length > 0 && (
              <div style={{ marginTop: 12, padding: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
                <div style={{ color: COLORS.danger, fontSize: 11, fontWeight: 600, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                  ⚠ Sem receita (não puderam ser destrinchados):
                </div>
                {pecasModal.naoExpandidos.map((it, i) => (
                  <div key={i} style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                    • {it.qty}× {it.nome}{it.opts.length ? ` (${it.opts.join(", ")})` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COMISSOES ───
// Cada vendedor (Adelmo, Joao) ve suas proprias comissoes de vendas concluidas.
// Admin (Ale) ve consolidado de todos. Zanella (gestor) NAO tem acesso.
// Comissao = valor gravado em orcamentos.comissao (markup que o vendedor aplicou).
// Comissao do vendedor = 20% da comissao da Suprema (markup).
// Suprema fica com 80%, vendedor recebe os 20%.
// Apenas o Ale (admin) marca como "Pago" — vendedores apenas visualizam.
const COMISSAO_VENDEDOR_FATOR = 0.20;

function ComissoesPage({ user }) {
  const [vendas, setVendas] = useState([]);
  const [mesSel, setMesSel] = useState(() => { const n = new Date(); return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0"); });
  const [filtroVendedor, setFiltroVendedor] = useState("all");
  // Padrão: só mostra "A Pagar" (vendedor ainda não recebeu). Pode trocar pra
  // "Pago" ou "Todos" no dropdown pra consultar histórico.
  const [filtroPagamento, setFiltroPagamento] = useState("apagar"); // "all" | "pago" | "apagar"
  const mesNomes = { "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril", "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };

  const role = user?.role || (user?.isAdmin ? "admin" : "vendedor");
  const isAdmin = role === "admin"; // so admin marca pago/a pagar; vendedores so visualizam

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Por padrao filtra comissoes excluidas (so vendas vivas).
      // Admin pode mostrar excluidas com botao no topo.
      let q = supabase.from("orcamentos").select("*").eq("status", "Concluído").eq("comissao_excluida", false);
      // Vendedor (Adelmo, Joao) ve so as proprias vendas
      if (!isAdmin) q = q.eq("vendedor_id", user.id);
      const { data } = await q.order("data", { ascending: false });
      if (data) {
        // Comissão é só pra Adelmo (v2) e João (v4). Alessandro (v1) e
        // Zanella (v3) são sócios e não entram no cálculo de comissão —
        // suas vendas ficam fora desta aba mesmo quando concluídas.
        const VENDEDORES_COM_COMISSAO = ["v2", "v4"];
        const visiveis = data
          .filter(o => !isOrcamentoRsOculto(o))
          .filter(o => VENDEDORES_COM_COMISSAO.includes(o.vendedor_id));
        setVendas(visiveis.map(o => ({
          id: o.id,
          data: o.data,
          dataEntrega: o.data_entrega,
          numeroPedido: o.numero_pedido || "",
          empresa: o.cliente_empresa || "—",
          cidade: o.cliente_cidade || "",
          uf: o.cliente_estado || "",
          vendedor: o.vendedor_nome || "—",
          vendedorId: o.vendedor_id || "",
          total: Number(o.total) || 0,
          comissaoSuprema: Number(o.comissao) || 0,
          comissaoVendedor: (Number(o.comissao) || 0) * COMISSAO_VENDEDOR_FATOR,
          comissaoPaga: !!o.comissao_paga,
        })));
      }
    };
    load();
  }, [user?.id, isAdmin]);

  // Toggle pago/a pagar (so admin) — atualiza banco e estado local, e espelha
  // a comissão paga como DESPESA variável no financeiro/DRE.
  const togglePago = async (id, novoStatus) => {
    if (!isAdmin) return;
    await supabase.from("orcamentos").update({ comissao_paga: novoStatus }).eq("id", id);
    setVendas(prev => prev.map(v => v.id === id ? { ...v, comissaoPaga: novoStatus } : v));
    const venda = vendas.find(v => v.id === id);
    if (venda) await sincronizarDespesaComissao(venda, novoStatus);
  };

  // Espelha a comissão do vendedor como despesa variável paga (DESPESA_VENDAS/
  // Comissões). Id estável "comissao-<orcamentoId>" → idempotente: marcar pago
  // cria/atualiza a despesa; reabrir remove. Assim toda comissão paga entra no
  // DRE como despesa, no mesmo mês da venda.
  const sincronizarDespesaComissao = async (venda, paga) => {
    if (!isAdmin) return;
    const despId = "comissao-" + venda.id;
    if (paga) {
      const d = venda.data ? new Date(venda.data) : new Date();
      const yyyy = d.getFullYear(), mm = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
      await supabase.from("despesas").upsert({
        id: despId,
        nome: "Comissão " + (venda.vendedor || "vendedor") + (venda.empresa && venda.empresa !== "—" ? " · " + venda.empresa : "") + (venda.numeroPedido ? " #" + venda.numeroPedido : ""),
        vencimento: `${yyyy}-${mm}-${dd}`,
        valor: Math.round((Number(venda.comissaoVendedor) || 0) * 100) / 100,
        status: "Pago",
        mes: `${yyyy}-${mm}`,
        fixa: false,
        tipo: "DESPESA_VENDAS",
        categoria: "Comissões",
        empresa: "gondolas_suprema",
      }, { onConflict: "id" });
    } else {
      await supabase.from("despesas").delete().eq("id", despId);
    }
  };

  // Confirma antes de excluir (so admin). Marca comissao_excluida=true,
  // o orcamento original continua intacto na aba Orcamentos/ADM.
  const [confirmExcluir, setConfirmExcluir] = useState(null);
  const excluirComissao = async (id) => {
    if (!isAdmin) return;
    await supabase.from("orcamentos").update({ comissao_excluida: true }).eq("id", id);
    setVendas(prev => prev.filter(v => v.id !== id));
    setConfirmExcluir(null);
  };

  // Filtros
  const noMes = (dataStr) => {
    if (!dataStr) return false;
    const d = new Date(dataStr);
    return (d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")) === mesSel;
  };

  // Comissao aparece no mes em que a venda foi CONCLUIDA (data do orcamento),
  // nao no mes da entrega futura. Se a entrega for em outro mes, isso nao
  // afeta o calculo da comissao do vendedor.
  // Base do mês: filtra por mês + vendedor, mas NÃO pelo status de pagamento.
  // Alimenta os CARDS do topo (A Pagar / Já Pago) — assim o "Já Pago" soma
  // certo mesmo com o filtro da tabela em "A Pagar".
  const vendasDoMes = vendas.filter(v => {
    if (!noMes(v.data)) return false;
    if (filtroVendedor !== "all" && v.vendedorId !== filtroVendedor) return false;
    return true;
  });
  // A tabela aplica também o filtro de status escolhido no dropdown.
  const vendasFiltradas = vendasDoMes.filter(v => {
    if (filtroPagamento === "pago" && !v.comissaoPaga) return false;
    if (filtroPagamento === "apagar" && v.comissaoPaga) return false;
    return true;
  });

  const vendedoresUnicos = isAdmin
    ? [...new Set(vendas.map(v => v.vendedorId).filter(Boolean))]
        .map(vid => VENDEDORES.find(x => x.id === vid))
        .filter(Boolean)
    : [];

  // Resumos — os CARDS do topo somam o MÊS INTEIRO (vendasDoMes), independente
  // do filtro de status, pra "A Pagar" e "Já Pago" atualizarem na hora que
  // marca uma comissão como paga.
  const totalAPagar             = vendasDoMes.filter(v => !v.comissaoPaga).reduce((s, v) => s + v.comissaoVendedor, 0);
  const totalPago               = vendasDoMes.filter(v => v.comissaoPaga).reduce((s, v) => s + v.comissaoVendedor, 0);
  const totalComissaoSupremaMes = vendasDoMes.reduce((s, v) => s + v.comissaoSuprema, 0);
  const qtdVendas               = vendasDoMes.length;
  // Totais da linha TOTAL da tabela — batem com as linhas visíveis (filtradas).
  const totalComissaoSuprema    = vendasFiltradas.reduce((s, v) => s + v.comissaoSuprema, 0);
  const totalComissaoVendedor   = vendasFiltradas.reduce((s, v) => s + v.comissaoVendedor, 0);
  const totalAPagarTabela       = vendasFiltradas.filter(v => !v.comissaoPaga).reduce((s, v) => s + v.comissaoVendedor, 0);

  const fmtData = (s) => {
    if (!s) return "—";
    const d = new Date(s);
    return d.toLocaleDateString("pt-BR");
  };
  // fmt() global mostra "Sob consulta" pra zero (regra do catalogo). Aqui em
  // comissoes valor zero significa "ainda nao recebeu" — sempre mostra R$ 0,00.
  const fmtMoney = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const sel = { padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none" };
  const statCard = (label, value, color, small) => (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, padding: 16 }}>
      <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ color: color, fontSize: small ? 18 : 24, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{value}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 4px" }}>💰 Comissões</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            {isAdmin ? "Consolidado de comissões — clique no status pra marcar pago/a pagar" : "Suas comissões — somente visualização"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {isAdmin && (
            <select value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)} style={sel}>
              <option value="all">Todos vendedores</option>
              {vendedoresUnicos.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          )}
          <select value={filtroPagamento} onChange={e => setFiltroPagamento(e.target.value)} style={sel}>
            <option value="all">Todos status</option>
            <option value="apagar">A Pagar</option>
            <option value="pago">Pago</option>
          </select>
          <select value={mesSel} onChange={e => setMesSel(e.target.value)} style={sel}>
            {Array.from({ length: 18 }, (_, i) => {
              const d = new Date(); d.setMonth(d.getMonth() - 9 + i);
              const v = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
              return <option key={v} value={v}>{mesNomes[String(d.getMonth() + 1).padStart(2, "0")]} {d.getFullYear()}</option>;
            })}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
        {statCard("A Pagar (Vendedor)", fmtMoney(totalAPagar), "#F59E0B")}
        {statCard("Já Pago (Vendedor)", fmtMoney(totalPago), "#3B82F6")}
        {statCard("Vendas Concluídas", qtdVendas, COLORS.orange, true)}
        {isAdmin && statCard("Total Comissão Suprema", fmtMoney(totalComissaoSupremaMes), COLORS.text, true)}
      </div>

      {/* Tabela de comissoes */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 14, margin: 0 }}>
            Vendas concluídas em {mesNomes[mesSel.split("-")[1]]} {mesSel.split("-")[0]}
          </h3>
        </div>
        {vendasFiltradas.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💰</div>
            <p style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
              {qtdVendas === 0 ? "Nenhuma venda concluída neste mês" : "Nenhuma venda com os filtros atuais"}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Data</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Cliente</th>
                  {isAdmin && <th style={{ padding: "10px 14px", textAlign: "left", color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Vendedor</th>}
                  <th style={{ padding: "10px 14px", textAlign: "right", color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Comissão Suprema</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Comissão Vendedor<br/><span style={{ fontSize: 8, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(20% da Suprema)</span></th>
                  <th style={{ padding: "10px 14px", textAlign: "center", color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {vendasFiltradas.map(v => {
                  const corStatus = v.comissaoPaga ? "#3B82F6" : "#F59E0B";
                  const labelStatus = v.comissaoPaga ? "✓ Pago" : "A Pagar";
                  return (
                  <tr key={v.id} style={{ borderTop: `1px solid ${COLORS.border}`, opacity: v.comissaoPaga ? 0.7 : 1 }}>
                    <td style={{ padding: "10px 14px", color: COLORS.textMuted, whiteSpace: "nowrap" }}>{fmtData(v.data)}</td>
                    <td style={{ padding: "10px 14px", color: COLORS.text, fontWeight: 600 }}>
                      {v.empresa}
                      <div style={{ color: COLORS.textDim, fontSize: 10, fontWeight: 400 }}>{v.cidade}{v.uf ? "/" + v.uf : ""}{v.numeroPedido ? " · #" + v.numeroPedido : ""}</div>
                    </td>
                    {isAdmin && <td style={{ padding: "10px 14px", color: COLORS.accent, fontWeight: 500 }}>{v.vendedor}</td>}
                    <td style={{ padding: "10px 14px", textAlign: "right", color: COLORS.text, fontWeight: 700, whiteSpace: "nowrap" }}>{fmtMoney(v.comissaoSuprema)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", color: COLORS.success, fontWeight: 800, whiteSpace: "nowrap" }}>{fmtMoney(v.comissaoVendedor)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {isAdmin ? (
                          <button
                            onClick={() => togglePago(v.id, !v.comissaoPaga)}
                            title="Clique para alternar"
                            style={{ background: corStatus + "20", border: `1px solid ${corStatus}50`, color: corStatus, padding: "4px 12px", borderRadius: 14, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}
                          >{labelStatus}</button>
                        ) : (
                          <span style={{ background: corStatus + "20", color: corStatus, padding: "4px 12px", borderRadius: 14, fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>{labelStatus}</span>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setConfirmExcluir(v)}
                            title="Excluir esta comissão da listagem (não apaga o orçamento)"
                            style={{ background: COLORS.danger + "10", border: `1px solid ${COLORS.danger}30`, color: COLORS.danger, padding: "4px 7px", borderRadius: 6, cursor: "pointer", fontSize: 12, lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}
                          >🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
                <tr style={{ borderTop: `2px solid ${COLORS.orange}40`, background: COLORS.bg }}>
                  <td colSpan={isAdmin ? 3 : 2} style={{ padding: "12px 14px", color: COLORS.white, fontWeight: 800, fontSize: 13 }}>TOTAL</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", color: COLORS.text, fontWeight: 800, fontSize: 13, whiteSpace: "nowrap" }}>{fmtMoney(totalComissaoSuprema)}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", color: COLORS.success, fontWeight: 800, fontSize: 14, whiteSpace: "nowrap" }}>{fmtMoney(totalComissaoVendedor)}</td>
                  <td style={{ padding: "12px 14px", textAlign: "center", color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>
                    A pagar: <strong style={{ color: "#F59E0B" }}>{fmtMoney(totalAPagarTabela)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmacao de exclusao (so admin) */}
      {confirmExcluir && (
        <div onClick={() => setConfirmExcluir(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, maxWidth: 460, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>⚠️</span>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 18, margin: 0 }}>Excluir comissão?</h2>
            </div>
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 14, fontSize: 12, color: COLORS.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
              <div><strong style={{ color: COLORS.text }}>{confirmExcluir.empresa}</strong></div>
              <div style={{ color: COLORS.textDim, fontSize: 11, marginTop: 3 }}>
                Vendedor: <strong style={{ color: COLORS.accent }}>{confirmExcluir.vendedor}</strong> · Comissão: <strong style={{ color: COLORS.success }}>{fmtMoney(confirmExcluir.comissaoVendedor)}</strong>
              </div>
            </div>
            <div style={{ color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginBottom: 16, lineHeight: 1.5 }}>
              Essa comissão vai sair da listagem (Ale, Adelmo, João não verão mais).
              <br/><span style={{ color: COLORS.textDim, fontSize: 11 }}>O orçamento original continua intacto na aba <strong>Orçamentos</strong> e no <strong>ADM</strong>.</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmExcluir(null)} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.text, padding: "10px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
              <button onClick={() => excluirComissao(confirmExcluir.id)} style={{ flex: 1, background: COLORS.danger, border: "none", color: "#fff", padding: "10px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🗑️ Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADMIN ───
function LeadsPage({ user }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("todos"); // todos | novo | atendido

  const carregar = async () => {
    setLoading(true); setErro("");
    const { data, error } = await supabase
      .from("site_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setErro(error.message);
    else setLeads(data || []);
    setLoading(false);
  };
  useEffect(() => { carregar(); }, []);

  const toggleStatus = async (lead) => {
    const novo = lead.status === "atendido" ? "novo" : "atendido";
    setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, status: novo } : l));
    const { error } = await supabase.from("site_leads").update({ status: novo }).eq("id", lead.id);
    if (error) { setErro(error.message); carregar(); }
  };

  const fmt = (iso) => {
    try { return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso; }
  };
  const wppLink = (tel) => {
    const d = String(tel || "").replace(/\D/g, "");
    if (d.length < 10) return null;
    return `https://wa.me/${d.length <= 11 ? "55" + d : d}`;
  };

  const filtrados = leads.filter(l => filtro === "todos" ? true : l.status === filtro);
  const novos = leads.filter(l => l.status === "novo").length;

  const chip = (txt, cor) => (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: cor + "1A", color: cor, border: `1px solid ${cor}44` }}>{txt}</span>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 96px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.text, margin: 0 }}>Leads do Site</h1>
        {novos > 0 && chip(`${novos} novo${novos > 1 ? "s" : ""}`, COLORS.accent)}
      </div>
      <p style={{ color: COLORS.textMuted, fontSize: 14, margin: "0 0 18px" }}>
        Contatos que preencheram o formulário em gondolasuprema.com — inclusive quem não concluiu no WhatsApp. Ligue e faça o follow-up.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[["todos", "Todos"], ["novo", "Novos"], ["atendido", "Atendidos"]].map(([k, l]) => (
          <button key={k} onClick={() => setFiltro(k)} style={{
            padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: filtro === k ? COLORS.accent : COLORS.card,
            color: filtro === k ? "#000" : COLORS.textMuted,
            border: `1px solid ${filtro === k ? COLORS.accent : COLORS.border}`,
          }}>{l}</button>
        ))}
        <button onClick={carregar} style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", background: COLORS.card, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>Atualizar</button>
      </div>

      {erro && <div style={{ color: COLORS.danger, fontSize: 13, marginBottom: 14 }}>Erro ao carregar: {erro}</div>}
      {loading && <div style={{ color: COLORS.textMuted, fontSize: 14 }}>Carregando…</div>}
      {!loading && filtrados.length === 0 && (
        <div style={{ color: COLORS.textDim, fontSize: 14, textAlign: "center", padding: "48px 0" }}>Nenhum lead {filtro !== "todos" ? `(${filtro})` : ""} por aqui ainda.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtrados.map((l) => {
          const wpp = wppLink(l.telefone);
          const atendido = l.status === "atendido";
          return (
            <div key={l.id} style={{ background: COLORS.card, border: `1px solid ${atendido ? COLORS.border : COLORS.accent + "55"}`, borderRadius: 12, padding: 16, opacity: atendido ? 0.7 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: COLORS.textDim }}>{fmt(l.created_at)}</span>
                {chip(atendido ? "Atendido" : "Novo", atendido ? COLORS.success : COLORS.accent)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.text }}>{l.nome || "Sem nome"}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0" }}>
                {l.segmento && chip(l.segmento, COLORS.textMuted)}
                {l.interesse && chip(l.interesse, COLORS.accent)}
              </div>
              {l.detalhe && <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.5, margin: "8px 0 0" }}>{l.detalhe}</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                {wpp ? (
                  <a href={wpp} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "#25D366", color: "#fff", textDecoration: "none" }}>
                    Chamar no WhatsApp{l.telefone ? ` · ${l.telefone}` : ""}
                  </a>
                ) : (
                  <span style={{ fontSize: 13, color: COLORS.textDim, alignSelf: "center" }}>{l.telefone ? `Tel.: ${l.telefone}` : "Sem telefone informado"}</span>
                )}
                <button onClick={() => toggleStatus(l)} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}` }}>
                  {atendido ? "Reabrir" : "Marcar como atendido"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminPage({ user }) {
  const [allOrders, setAllOrders] = useState([]);
  const [deletedCount, setDeletedCount] = useState({});
  // "filter*" = rascunho (o que o usuario esta digitando/selecionando);
  // "applied*" = filtros efetivamente aplicados (so muda ao clicar Filtrar).
  // Enquanto nada for aplicado, a lista exibe TUDO.
  const [filterVendedor, setFilterVendedor] = useState("all");
  const [filterCidade, setFilterCidade] = useState("all");
  // Default do filtro de mês = mês atual (formato YYYY-MM), pra abrir
  // a ADM já mostrando só os orçamentos do mês corrente.
  const _hojeAdm = new Date();
  const _mesAtualAdm = _hojeAdm.getFullYear() + "-" + String(_hojeAdm.getMonth() + 1).padStart(2, "0");
  const [filterMes, setFilterMes] = useState(_mesAtualAdm); // YYYY-MM ou "all"
  const [appliedVendedor, setAppliedVendedor] = useState("all");
  const [appliedCidade, setAppliedCidade] = useState("all");
  const [appliedMes, setAppliedMes] = useState(_mesAtualAdm);
  // Busca livre por nome do cliente / nº do orçamento (aplica na hora)
  const [buscaNome, setBuscaNome] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  // Edicao inline do orcamento direto da ADM (admin/gestor — Ale e Zanella)
  const [editingId, setEditingId] = useState(null);
  // Edição inline (clique no valor) do total da venda e da comissão, direto na ADM
  const [editVenda, setEditVenda] = useState({ id: null, campo: null });
  const [editFrete, setEditFrete] = useState(0);
  const [editMarkup, setEditMarkup] = useState(0);
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [mesSel, setMesSel] = useState("");
  const [vendaStatus, setVendaStatus] = useState({});
  // Feedback da troca de vendedor: { orderId, tipo: "ok"|"erro", texto }
  const [vendedorChangeMsg, setVendedorChangeMsg] = useState(null);
  // Feedback da troca de status: { orderId, tipo: "ok"|"erro", texto }
  const [statusChangeMsg, setStatusChangeMsg] = useState(null);
  const [emitindoNfe, setEmitindoNfe] = useState(null);
  const [nfeResult, setNfeResult] = useState(null);
  const [confirmEmitir, setConfirmEmitir] = useState(null);
  // Seleção de empresa emitente: null | 'gondolas' | 'instalacoes'
  // (passo 1 do modal de emissão — escolhe a empresa antes de confirmar)
  const [emitenteSel, setEmitenteSel] = useState(null);
  const [cancelandoNfe, setCancelandoNfe] = useState(null);
  const [cancelJustificativa, setCancelJustificativa] = useState("");
  const [cancelRef, setCancelRef] = useState("");
  // Confirmação de exclusão na tabela "Vendas Concluídas" (somente admin/Alessandro)
  const [confirmDelVenda, setConfirmDelVenda] = useState(null);
  const isAdminOnly = (user?.role || (user?.isAdmin ? "admin" : "vendedor")) === "admin";
  // Quem pode EDITAR na ADM: admin (Ale) e gestor (Zanella). Vendedor
  // (Adelmo) tem ADM somente leitura — todas as ações de escrita
  // (editar, excluir, trocar vendedor/status, NF) ficam escondidas.
  const _admRole = user?.role || (user?.isAdmin ? "admin" : "vendedor");
  const canEditAdm = _admRole === "admin" || _admRole === "gestor";
  // Filtro de mês dedicado do Relatório por Vendedor (independente do filtro
  // geral abaixo). "all" = todos os meses
  // Default = mês atual (mesma lógica do filtro principal)
  const [relatorioMes, setRelatorioMes] = useState(_mesAtualAdm);
  // Preview/salvar do PDF do orçamento (ao clicar no nome do cliente)
  const [pdfHtmlAdm, setPdfHtmlAdm] = useState(null);
  const [pdfOrderAdm, setPdfOrderAdm] = useState(null);
  const [pdfTitleAdm, setPdfTitleAdm] = useState("");
  const [savingPdfAdm, setSavingPdfAdm] = useState(false);
  const [pdfDownloadMsg, setPdfDownloadMsg] = useState(null);

  const emitirNfe = async (ordem, opts = {}) => {
    // opts.emitente: "gondolas" (NF-e mercadoria, Suprema) | "instalacoes" (NFS-e serviço, Inst.)
    // opts.ambiente: "producao" | "homologacao" — pra Suprema Instalações começa em homologação
    const emitente = opts.emitente || "gondolas";
    setConfirmEmitir(null);
    setEmitindoNfe(ordem.id);
    setNfeResult(null);
    try {
      const endpoint = emitente === "instalacoes" ? "/api/emitir-nfse" : "/api/emitir-nfe";
      const ambiente = opts.ambiente || (emitente === "instalacoes" ? "homologacao" : "producao");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordem, ambiente }),
      });
      const data = await res.json();
      setNfeResult(data);
      if (data.success) {
        // Valor da NF varia pelo emitente:
        // - Gôndolas Suprema → valor total da venda
        // - Suprema Instalações → comissão da venda (data.valor já vem da API)
        const valorNota = emitente === "instalacoes"
          ? (Number(data.valor) || Number(ordem.comissao) || 0)
          : (Number(ordem.total) || 0);
        const destinatarioNome = emitente === "instalacoes"
          ? (data.tomador || "RRE MAQUINAS E EQUIPAMENTOS LTDA")
          : (ordem.client?.empresa || "");
        const cnpjDest = emitente === "instalacoes"
          ? (data.cnpj_tomador || "23505287000107")
          : (ordem.client?.cnpj || "");
        await supabase.from("notas_fiscais").insert({
          id: data.ref || genId(),
          ordem_id: ordem.id,
          numero: data.numero,
          chave: data.chave,
          ref: data.ref,
          status: data.status || (emitente === "instalacoes" ? "processando" : "autorizado"),
          valor: valorNota,
          destinatario: destinatarioNome,
          cnpj_destinatario: cnpjDest,
          data_emissao: dataEmissaoBRT(),
          url_danfe: data.url_danfe || "",
          url_xml: data.url_xml || "",
          vendedor: ordem.vendedor || "",
          tipo: emitente === "instalacoes" ? "nfse" : "nfe",
          emitente,
          ambiente,
        });
        // Não mexe mais no "Status venda" automaticamente — o pagamento agora
        // é separado da emissão de NF (Em Aberto / Pago marcado manualmente).
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
        // Orcamentos RS-ocultos do Ale ficam fora da visao consolidada da ADM,
        // mesmo se o proprio Ale estiver na ADM (ele ve esses na aba Orcamentos).
        const visiveis = data.filter(o => !isOrcamentoRsOculto(o));
        setAllOrders(visiveis.map(o => ({
          id: o.id, date: o.data, total: o.total, frete: o.frete, comissao: o.comissao || 0, notes: o.notes, status: o.status, items: o.items,
          vendedor: o.vendedor_nome, vendedorId: o.vendedor_id,
          temperatura: o.temperatura || null,
          vendaEmpresaRecebedora: o.venda_empresa_recebedora || null,
          vendaBancoRecebedor: o.venda_banco_recebedor || null,
          data_pagamento: o.data_pagamento || null,
          client: { empresa: o.cliente_empresa, cnpj: o.cliente_cnpj, responsavel: o.cliente_responsavel, telefone: o.cliente_telefone, email: o.cliente_email, endereco: o.cliente_endereco, numero: o.cliente_numero, bairro: o.cliente_bairro, cidade: o.cliente_cidade, estado: o.cliente_estado, cep: o.cliente_cep, ie: o.cliente_ie }
        })));
      }
    };
    loadAll();
  }, []);

  // Reatribuir orcamento a outro vendedor (so disponivel no ADM).
  // Atualiza vendedor_id + vendedor_nome no banco e estado local.
  // Captura erro do Supabase (ex: RLS bloqueando) para que falha nao passe em silencio.
  const updateOrderVendedor = async (orderId, newVendedorId) => {
    const v = VENDEDORES.find(x => x.id === newVendedorId);
    if (!v) return;
    const { error } = await supabase.from("orcamentos").update({
      vendedor_id: v.id,
      vendedor_nome: v.name,
    }).eq("id", orderId);
    if (error) {
      setVendedorChangeMsg({ orderId, tipo: "erro", texto: `Falha: ${error.message}` });
      setTimeout(() => setVendedorChangeMsg(curr => curr?.orderId === orderId ? null : curr), 5000);
      return;
    }
    setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, vendedor: v.name, vendedorId: v.id } : o));
    setVendedorChangeMsg({ orderId, tipo: "ok", texto: `Reatribuído para ${v.name}` });
    setTimeout(() => setVendedorChangeMsg(curr => curr?.orderId === orderId ? null : curr), 3000);
  };

  // Trocar status do orcamento direto no ADM (admin/gestor — Ale e Zanella).
  // Modal de Conclusão (igual ao da aba Orçamentos) — aparece quando Ale/Zanella
  // mudam o status pra "Concluído" pela ADM. Antes só fechava o status; agora
  // exige preencher CNPJ, data entrega, número pedido e formas de pagamento.
  const [concluidoIdAdm, setConcluidoIdAdm] = useState(null);
  const [concluidoDataAdm, setConcluidoDataAdm] = useState({ cnpj: "", data_entrega: "", numero_pedido: "", pag1: "", pag1_parcelas: "", pag1_valor: "", pag2: "", pag2_parcelas: "", pag2_valor: "", venda_empresa_recebedora: "", venda_banco_recebedor: "", valor_recebido: "" });

  // Salva edição inline do total (valor de venda) ou da comissão direto na ADM.
  // Se a venda está marcada "Pago", recalcula o valor_recebido (o que entra no
  // DRE e na entrada de valores): total normal, ou só a comissão se for boleto RRE.
  const salvarCampoVenda = async (o, campo, valorRaw) => {
    if (!canEditAdm) { setEditVenda({ id: null, campo: null }); return; }
    const valor = Number(String(valorRaw).replace(",", "."));
    if (!isFinite(valor) || valor < 0) { setEditVenda({ id: null, campo: null }); return; }
    const update = { [campo]: valor };
    const m = (o.notes || "").match(/🏷️ Status venda: (.+)$/m);
    const st = m ? m[1] : "Em Aberto";
    const pago = st === "Pago" || st === "Concluído" || st === "Gerar NF";
    if (pago) {
      const novoTotal = campo === "total" ? valor : (Number(o.total) || 0);
      const novaComissao = campo === "comissao" ? valor : (Number(o.comissao) || 0);
      update.valor_recebido = isBoletoParceladoRRE(o.notes) ? novaComissao : novoTotal;
    }
    await supabase.from("orcamentos").update(update).eq("id", o.id);
    setAllOrders(prev => prev.map(x => x.id === o.id ? { ...x, ...update } : x));
    setEditVenda({ id: null, campo: null });
  };

  const updateOrderStatus = async (orderId, novoStatus) => {
    if (!novoStatus) return;
    // Concluído pela ADM → abre o mesmo modal do vendedor (preenche CNPJ,
    // entrega, pedido, pagamento). O update final acontece no saveConcluidoAdm.
    if (novoStatus === "Concluído") {
      const ord = allOrders.find(o => o.id === orderId);
      const cnpjExistente = ord?.client?.cnpj || "";
      setConcluidoIdAdm(orderId);
      setConcluidoDataAdm({ cnpj: cnpjExistente, data_entrega: "", numero_pedido: "", pag1: "", pag1_parcelas: "", pag1_valor: "", pag2: "", pag2_parcelas: "", pag2_valor: "", venda_empresa_recebedora: ord?.vendaEmpresaRecebedora || "", venda_banco_recebedor: ord?.vendaBancoRecebedor || "", valor_recebido: "" });
      return;
    }
    const updateObj = { status: novoStatus };
    const { error } = await supabase.from("orcamentos").update(updateObj).eq("id", orderId);
    if (error) {
      setStatusChangeMsg({ orderId, tipo: "erro", texto: `Falha: ${error.message}` });
      setTimeout(() => setStatusChangeMsg(curr => curr?.orderId === orderId ? null : curr), 5000);
      return;
    }
    setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: novoStatus } : o));
    setStatusChangeMsg({ orderId, tipo: "ok", texto: `Status: ${novoStatus}` });
    setTimeout(() => setStatusChangeMsg(curr => curr?.orderId === orderId ? null : curr), 3000);
  };

  const saveConcluidoAdm = async () => {
    if (!concluidoIdAdm) return;
    const cd = concluidoDataAdm;
    let pagStr = cd.pag1;
    if (cd.pag1_parcelas) pagStr += " " + cd.pag1_parcelas + "x";
    if (cd.pag1_valor) pagStr += " R$ " + Number(cd.pag1_valor).toFixed(2);
    if (cd.pag2) {
      pagStr += " + " + cd.pag2;
      if (cd.pag2_parcelas) pagStr += " " + cd.pag2_parcelas + "x";
      if (cd.pag2_valor) pagStr += " R$ " + Number(cd.pag2_valor).toFixed(2);
    }
    const info = "\n📋 CONCLUÍDO — Entrega: " + cd.data_entrega + " | Pedido: " + cd.numero_pedido + " | Pagamento: " + pagStr;
    const existingNotes = allOrders.find(o => o.id === concluidoIdAdm)?.notes || "";
    // Venda nasce "a receber": valor_recebido = 0 até ser marcada "Pago" no ADM.
    await supabase.from("orcamentos").update({
      status: "Concluído",
      notes: existingNotes + info,
      cliente_cnpj: cd.cnpj || null,
      data_entrega: cd.data_entrega || null,
      numero_pedido: cd.numero_pedido || null,
      status_entrega: cd.data_entrega ? "Agendada" : null,
      data_conclusao: new Date().toISOString(),
      venda_empresa_recebedora: "gondolas_suprema",
      valor_recebido: 0,
    }).eq("id", concluidoIdAdm);

    // Ponte CAPI (Fase 1 - coleta): manda a verdade da venda pro Meta aprender.
    // Fire-and-forget: nunca trava nem quebra o fluxo do "Concluído".
    try {
      if (ordAdm) {
        fetch("/api/meta-capi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: ordAdm.id,
            telefone: ordAdm.client?.telefone,
            valor: ordAdm.total,
            email: ordAdm.client?.email,
            nome: ordAdm.client?.responsavel,
            cidade: ordAdm.client?.cidade,
            estado: ordAdm.client?.estado,
            cep: ordAdm.client?.cep,
            cnpj: cd.cnpj || ordAdm.client?.cnpj,
          }),
        }).catch(() => {});
      }
    } catch (e) {}

    setAllOrders(prev => prev.map(o => o.id === concluidoIdAdm
      ? { ...o, status: "Concluído", notes: (o.notes || "") + info, client: { ...(o.client || {}), cnpj: cd.cnpj || "" } }
      : o
    ));
    setStatusChangeMsg({ orderId: concluidoIdAdm, tipo: "ok", texto: "Status: Concluído" });
    setTimeout(() => setStatusChangeMsg(curr => curr?.orderId === concluidoIdAdm ? null : curr), 3000);
    setConcluidoIdAdm(null);
  };

  const updateTemperaturaAdm = async (orderId, temp) => {
    // atualização otimista
    setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, temperatura: temp } : o));
    await supabase.from("orcamentos").update({ temperatura: temp }).eq("id", orderId);
  };

  // ─── Edicao inline (Ale/Zanella) ───
  // Edita frete, markup% e notes preservando a estrutura de itens.
  // Os items vem do banco com total ja com markup aplicado, entao precisamos
  // calcular o subtotal puro de custo e reaplicar a margem nova ao salvar.
  const startEditOrder = (o) => {
    setEditingId(o.id);
    setEditFrete(o.frete || 0);
    setEditNotes(o.notes || "");
    // Recupera markup atual a partir da relacao comissao / subtotal-custo
    const items = o.items || [];
    const somaItens = items.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const frete = Number(o.frete) || 0;
    const totalSemFrete = (Number(o.total) || 0) - frete;
    const comissao = Number(o.comissao) || 0;
    const custoTotal = totalSemFrete - comissao;
    const markupAtual = custoTotal > 0 ? Math.round((comissao / custoTotal) * 100) : 0;
    setEditMarkup(markupAtual);
  };
  const cancelEditOrder = () => {
    setEditingId(null);
    setEditFrete(0);
    setEditMarkup(0);
    setEditNotes("");
  };
  const saveEditOrder = async (orderId) => {
    setSavingEdit(true);
    const o = allOrders.find(x => x.id === orderId);
    if (!o) { setSavingEdit(false); return; }
    const items = o.items || [];
    // Subtotal de custo puro (remove markup atual de cada item antes de reaplicar)
    const somaItens = items.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const freteAntigo = Number(o.frete) || 0;
    const totalSemFreteAntigo = (Number(o.total) || 0) - freteAntigo;
    const comissaoAntiga = Number(o.comissao) || 0;
    const custoBase = Math.max(totalSemFreteAntigo - comissaoAntiga, 0);
    // Aplica novo markup sobre custo base
    const markup = Number(editMarkup) || 0;
    const novaComissao = custoBase * markup / 100;
    const frete = Number(editFrete) || 0;
    // Reaplica markup proporcionalmente em cada item para que somem o novo total
    const fator = somaItens > 0 ? (custoBase * (1 + markup / 100)) / somaItens : 1;
    const novosItems = items.map(it => ({ ...it, total: (Number(it.total) || 0) * fator }));
    const novoTotal = custoBase + novaComissao + frete;
    await supabase.from("orcamentos").update({
      items: novosItems,
      total: novoTotal,
      frete,
      comissao: novaComissao,
      notes: editNotes,
    }).eq("id", orderId);
    setAllOrders(prev => prev.map(x => x.id === orderId ? { ...x, items: novosItems, total: novoTotal, frete, comissao: novaComissao, notes: editNotes } : x));
    setSavingEdit(false);
    cancelEditOrder();
  };

  const vendedores = [...new Set(allOrders.map(o => o.vendedor))];
  // Normaliza pra UPPERCASE só pra ordenação, preservando o texto original
  // exibido (assim "florianopolis", "Florianopolis", "FLORIANOPOLIS" agrupam
  // certinho em ordem alfabética independente de como foram digitados).
  const cidades = [...new Set(allOrders.map(o => o.client?.cidade).filter(Boolean))]
    .sort((a, b) => String(a).toUpperCase().localeCompare(String(b).toUpperCase(), "pt-BR"));

  const chaveMes = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  };

  const buscaNorm = buscaNome.trim().toLowerCase();
  const filtered = allOrders.filter(o => {
    if (appliedVendedor !== "all" && o.vendedor !== appliedVendedor) return false;
    if (appliedCidade !== "all" && o.client?.cidade !== appliedCidade) return false;
    if (appliedMes !== "all" && chaveMes(o.date) !== appliedMes) return false;
    if (buscaNorm) {
      const alvo = [
        o.client?.empresa, o.client?.responsavel, o.vendedor,
        o.client?.cidade, o.id, (o.id || "").slice(0, 6),
      ].filter(Boolean).join(" ").toLowerCase();
      if (!alvo.includes(buscaNorm)) return false;
    }
    return true;
  }).sort(ordenarPorStatus);

  // Lista de meses disponíveis nos orçamentos (mais recente primeiro)
  const mesesDisponiveis = (() => {
    const set = new Set(allOrders.map(o => chaveMes(o.date)).filter(Boolean));
    set.add(_mesAtualAdm); // garante mês atual no dropdown, mesmo sem orçamentos
    return Array.from(set).sort().reverse();
  })();
  const mesNomesAdm = { "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril", "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };
  const formatarMesAdm = (m) => {
    if (!m || m === "all") return "";
    const [ano, mes] = m.split("-");
    return `${mesNomesAdm[mes]} ${ano}`;
  };

  // Helpers para o botao Filtrar / Limpar
  const filtrosRascunhoPreenchidos = filterVendedor !== "all" || filterCidade !== "all" || filterMes !== "all";
  const filtrosAplicados = appliedVendedor !== "all" || appliedCidade !== "all" || appliedMes !== "all";
  const aplicarFiltros = () => {
    setAppliedVendedor(filterVendedor);
    setAppliedCidade(filterCidade);
    setAppliedMes(filterMes);
  };
  const limparFiltros = () => {
    setFilterVendedor("all"); setFilterCidade("all"); setFilterMes("all");
    setAppliedVendedor("all"); setAppliedCidade("all"); setAppliedMes("all");
  };

  const totalGeral = filtered.reduce((s, o) => s + (o.total || 0), 0);
  const sc = { "Aguardando Retorno": "#3B82F6", "Fazer Pedido": "#8B5CF6", "Não Responde": "#9CA3AF", "Desistiu": "#F87171", "Fechou Concorrência": "#34D399", "Concluído": "#10B981" };
  const sel = { padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none" };

  // Monta o HTML do orçamento (mesmo layout do PDF do vendedor)
  const buildPdfHtmlAdm = (order) => {
    const cd = order.client || {};
    return buildPdfPage({
      orderNum: order.id.slice(0, 6).toUpperCase(),
      date: new Date(order.date).toLocaleDateString("pt-BR"),
      clientName: cd.responsavel || "", clientCompany: cd.empresa || "", clientPhone: cd.telefone || "",
      clientCnpj: cd.cnpj, clientEndereco: cd.endereco && cd.cidade ? `${cd.endereco}${cd.bairro ? `, ${cd.bairro}` : ""} — ${cd.cidade}${cd.estado ? `/${cd.estado}` : ""}` : "",
      clientEmail: cd.email,
      items: order.items, total: order.total, notes: order.notes,
      frete: order.frete || 0,
      comissao: order.comissao || 0,
      incluirParcelamento: false,
      incluirCartao: false,
    });
  };

  const showPdfAdm = (order) => {
    const cd = order.client || {};
    setPdfHtmlAdm(buildPdfHtmlAdm(order));
    setPdfTitleAdm(cd.empresa || cd.responsavel || order.id.slice(0, 6).toUpperCase());
    setPdfOrderAdm(order);
    setPdfDownloadMsg(null);
  };

  const salvarPdfAdm = async (order) => {
    if (savingPdfAdm) return;
    const o = order || pdfOrderAdm;
    if (!o) return;
    setSavingPdfAdm(true);
    try {
      const cd = o.client || {};
      const doc = await generatePDF({
        orderNum: o.id.slice(0, 6).toUpperCase(),
        date: new Date(o.date).toLocaleDateString("pt-BR"),
        client: cd,
        items: o.items, total: o.total, notes: o.notes,
        frete: o.frete || 0,
        comissao: o.comissao || 0,
        user: { name: o.vendedor || user.name, email: user.email },
        incluirParcelamento: false,
        incluirCartao: false,
      });
      const nomeArq = (cd.empresa || o.id.slice(0, 6)).replace(/[^a-zA-Z0-9À-ɏ]/g, "-").replace(/-+/g, "-");
      doc.save(`orcamento-${nomeArq}.pdf`);
      setPdfDownloadMsg("PDF salvo na pasta de Downloads.");
    } catch (e) {
      console.error(e);
      setPdfDownloadMsg("Erro ao gerar o PDF. Tente de novo.");
    }
    setSavingPdfAdm(false);
  };

  if (pdfHtmlAdm) {
    const bodyMatch = pdfHtmlAdm.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const styleMatch = pdfHtmlAdm.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <button onClick={() => { setPdfHtmlAdm(null); setPdfOrderAdm(null); setPdfDownloadMsg(null); }} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.text, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 20 }}>Orçamento — {pdfTitleAdm}</h2>
          <button onClick={() => salvarPdfAdm()} disabled={savingPdfAdm} style={{ background: savingPdfAdm ? COLORS.textDim : COLORS.orange, color: "#000", border: "none", padding: "8px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: savingPdfAdm ? "wait" : "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            {savingPdfAdm ? "Gerando PDF..." : "⬇ Salvar PDF"}
          </button>
        </div>
        {pdfDownloadMsg && <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.text, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>{pdfDownloadMsg}</div>}
        <div style={{ borderRadius: 10, overflow: "auto", border: `1px solid ${COLORS.border}`, maxHeight: "70vh" }}>
          <div style={{ background: "#fff", padding: 36, fontFamily: "Helvetica, Arial, sans-serif", color: "#1a1a1a", width: 794 }}>
            <style>{styleMatch ? styleMatch[1] : ""}</style>
            <div dangerouslySetInnerHTML={{ __html: bodyMatch ? bodyMatch[1] : "" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 4px" }}>Painel Administrativo</h1>
      <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 20px", fontFamily: "'DM Sans', sans-serif" }}>Todos os orçamentos de todos os vendedores</p>

      {/* Stats Gerais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 16 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Total Orçamentos</div>
          <div style={{ color: COLORS.white, fontSize: 24, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{filtered.length}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 16 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Valor Total</div>
          <div style={{ color: COLORS.orange, fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalGeral)}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 16 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Aguardando Retorno</div>
          <div style={{ color: "#3B82F6", fontSize: 24, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{allOrders.filter(o => o.status === "Aguardando Retorno").length}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 16 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Concluídos</div>
          <div style={{ color: "#10B981", fontSize: 24, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{allOrders.filter(o => o.status === "Concluído").length}</div>
        </div>
      </div>

      {/* Relatório por Vendedor */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 18, margin: 0 }}>Relatório por Vendedor</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>📅 Mês:</span>
            <select value={relatorioMes} onChange={e => setRelatorioMes(e.target.value)} style={{ padding: "6px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
              <option value="all">Todos os meses</option>
              {mesesDisponiveis.map(m => <option key={m} value={m}>{formatarMesAdm(m)}</option>)}
            </select>
          </div>
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
                <th style={{ padding: "10px 14px", textAlign: "center", color: "#8B5CF6", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Fazer Pedido</th>
                <th style={{ padding: "10px 14px", textAlign: "center", color: "#34D399", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Fechou Conc.</th>
                <th style={{ padding: "10px 14px", textAlign: "right", color: COLORS.orange, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Mostra TODOS os vendedores cadastrados sempre (Ale, Adelmo,
                  Zanella, João), mesmo sem orçamentos no período — o Ale
                  pediu pra ver todos. Orçamentos RS-particulares do Ale
                  continuam fora (filtrados antes em loadAll).
                  Aplica o filtro de mês selecionado no header do Relatório. */}
              {(() => {
                const ordersDoRelatorio = relatorioMes === "all"
                  ? allOrders
                  : allOrders.filter(o => chaveMes(o.date) === relatorioMes);
                return VENDEDORES.map(v => {
                  const vo = ordersDoRelatorio.filter(o => o.vendedorId === v.id);
                  return (
                  <tr key={v.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "12px 14px", color: COLORS.text, fontWeight: 600 }}>{v.name}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: COLORS.white, fontWeight: 700, fontSize: 14 }}>{vo.length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#3B82F6", fontWeight: 700 }}>{vo.filter(o => o.status === "Aguardando Retorno").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#10B981", fontWeight: 700 }}>{vo.filter(o => o.status === "Concluído").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#F87171", fontWeight: 700 }}>{vo.filter(o => o.status === "Desistiu").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#8B5CF6", fontWeight: 700 }}>{vo.filter(o => o.status === "Fazer Pedido").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#34D399", fontWeight: 700 }}>{vo.filter(o => o.status === "Fechou Concorrência").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", color: COLORS.orange, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{fmt(vo.reduce((s, o) => s + (o.total || 0), 0))}</td>
                  </tr>
                );
                });
              })()}
              {/* Orçamentos sem vendedor identificado (vendedorId não bate
                  com nenhum cadastro) — só aparece se houver registros assim,
                  considerando o filtro de mês selecionado. */}
              {(() => {
                const ordersDoRelatorio = relatorioMes === "all"
                  ? allOrders
                  : allOrders.filter(o => chaveMes(o.date) === relatorioMes);
                const semVendedor = ordersDoRelatorio.filter(o => !VENDEDORES.some(v => v.id === o.vendedorId));
                if (semVendedor.length === 0) return null;
                return (
                  <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "12px 14px", color: COLORS.textMuted, fontWeight: 600, fontStyle: "italic" }}>Sem vendedor</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: COLORS.white, fontWeight: 700, fontSize: 14 }}>{semVendedor.length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#3B82F6", fontWeight: 700 }}>{semVendedor.filter(o => o.status === "Aguardando Retorno").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#10B981", fontWeight: 700 }}>{semVendedor.filter(o => o.status === "Concluído").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#F87171", fontWeight: 700 }}>{semVendedor.filter(o => o.status === "Desistiu").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#8B5CF6", fontWeight: 700 }}>{semVendedor.filter(o => o.status === "Fazer Pedido").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#34D399", fontWeight: 700 }}>{semVendedor.filter(o => o.status === "Fechou Concorrência").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", color: COLORS.orange, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{fmt(semVendedor.reduce((s, o) => s + (o.total || 0), 0))}</td>
                  </tr>
                );
              })()}
              {(() => {
                const ordersTotal = relatorioMes === "all"
                  ? allOrders
                  : allOrders.filter(o => chaveMes(o.date) === relatorioMes);
                const totalRel = ordersTotal.reduce((s, o) => s + (o.total || 0), 0);
                return (
                  <tr style={{ background: COLORS.bg }}>
                    <td style={{ padding: "12px 14px", color: COLORS.white, fontWeight: 700 }}>TOTAL{relatorioMes !== "all" ? ` — ${formatarMesAdm(relatorioMes)}` : ""}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: COLORS.white, fontWeight: 800, fontSize: 14 }}>{ordersTotal.length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#3B82F6", fontWeight: 800 }}>{ordersTotal.filter(o => o.status === "Aguardando Retorno").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#10B981", fontWeight: 800 }}>{ordersTotal.filter(o => o.status === "Concluído").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#F87171", fontWeight: 800 }}>{ordersTotal.filter(o => o.status === "Desistiu").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#8B5CF6", fontWeight: 800 }}>{ordersTotal.filter(o => o.status === "Fazer Pedido").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center", color: "#34D399", fontWeight: 800 }}>{ordersTotal.filter(o => o.status === "Fechou Concorrência").length}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", color: COLORS.orange, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalRel)}</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 16, marginBottom: 16, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Filtros:</span>
        <select value={filterVendedor} onChange={e => setFilterVendedor(e.target.value)} style={sel}>
          <option value="all">Todos os vendedores</option>
          {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={filterCidade} onChange={e => setFilterCidade(e.target.value)} style={sel}>
          <option value="all">Todas as cidades</option>
          {cidades.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterMes} onChange={e => setFilterMes(e.target.value)} style={sel}>
          <option value="all">Todos os meses</option>
          {mesesDisponiveis.map(m => <option key={m} value={m}>{formatarMesAdm(m)}</option>)}
        </select>
        <button
          onClick={aplicarFiltros}
          disabled={!filtrosRascunhoPreenchidos}
          style={{
            background: filtrosRascunhoPreenchidos ? COLORS.orange : "transparent",
            border: `1px solid ${filtrosRascunhoPreenchidos ? COLORS.orange : COLORS.border}`,
            color: filtrosRascunhoPreenchidos ? "#fff" : COLORS.textDim,
            padding: "6px 16px", borderRadius: 6,
            cursor: filtrosRascunhoPreenchidos ? "pointer" : "not-allowed",
            fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif"
          }}
        >🔎 Filtrar</button>
        {filtrosAplicados && (
          <button onClick={limparFiltros} style={{ background: "transparent", border: `1px solid ${COLORS.danger}`, color: COLORS.danger, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Limpar filtros</button>
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
                <button onClick={() => { setCancelandoNfe(null); setCancelRef(""); setCancelJustificativa(""); }} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Voltar</button>
                <button onClick={() => cancelarNfe(cancelRef, cancelJustificativa)} disabled={!cancelRef || cancelJustificativa.length < 15} style={{ flex: 1, background: !cancelRef || cancelJustificativa.length < 15 ? COLORS.textDim : COLORS.danger, color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: !cancelRef || cancelJustificativa.length < 15 ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancelar NF-e</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Emissão NF — 2 passos: escolher empresa emitente + confirmar */}
      {confirmEmitir && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 460, maxWidth: "100%" }}>

            {/* PASSO 1 — Escolher empresa emitente */}
            {emitenteSel === null && (
              <>
                <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 18, margin: "0 0 6px" }}>Emitir Nota Fiscal</h2>
                <p style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: "0 0 16px" }}>Escolha qual empresa vai emitir:</p>

                <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
                  <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" }}>Venda</div>
                  <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 600 }}>{confirmEmitir.client?.empresa}</div>
                  <div style={{ color: COLORS.textMuted, fontSize: 11 }}>CNPJ: {confirmEmitir.client?.cnpj || "—"}</div>
                  <div style={{ color: COLORS.orange, fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif", marginTop: 4 }}>{fmt(confirmEmitir.total)}</div>
                  {confirmEmitir.comissao > 0 && (
                    <div style={{ color: "#10B981", fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>Comissão: {fmt(confirmEmitir.comissao)}</div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button
                    onClick={() => setEmitenteSel("gondolas")}
                    style={{ background: COLORS.orange + "12", border: `1px solid ${COLORS.orange}40`, color: COLORS.text, padding: "14px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}
                  >
                    <div style={{ color: COLORS.orange, fontSize: 13, fontWeight: 700 }}>🏪 Gôndolas Suprema</div>
                    <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 2 }}>NF-e de mercadoria · destinatário: <strong style={{ color: COLORS.text }}>{confirmEmitir.client?.empresa}</strong></div>
                    <div style={{ color: COLORS.textDim, fontSize: 10, marginTop: 2 }}>Valor: {fmt(confirmEmitir.total)}</div>
                  </button>

                  <button
                    onClick={() => setEmitenteSel("instalacoes")}
                    style={{ background: "#3B82F612", border: "1px solid #3B82F640", color: COLORS.text, padding: "14px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}
                  >
                    <div style={{ color: "#3B82F6", fontSize: 13, fontWeight: 700 }}>🔧 Suprema Instalações</div>
                    <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 2 }}>NFS-e de serviço · destinatário: <strong style={{ color: COLORS.text }}>Gôndolas Brasil</strong> (23.505.287/0001-07)</div>
                    <div style={{ color: COLORS.textDim, fontSize: 10, marginTop: 2 }}>Valor: {fmt(confirmEmitir.comissao || 0)} <em style={{ color: COLORS.textDim }}>(comissão da venda)</em></div>
                  </button>
                </div>

                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <button onClick={() => setConfirmEmitir(null)} style={{ background: "transparent", border: "none", color: COLORS.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                </div>
              </>
            )}

            {/* PASSO 2A — Confirmação Gôndolas Suprema (NF-e mercadoria) */}
            {emitenteSel === "gondolas" && (
              <>
                <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#F59E0B", fontSize: 18, margin: "0 0 12px" }}>⚠️ Confirmar Emissão — Gôndolas Suprema</h2>
                <p style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: "0 0 14px" }}>Esta ação irá emitir uma <strong style={{ color: COLORS.danger }}>NF-e REAL</strong> na SEFAZ com valor fiscal. Não pode ser desfeita (apenas cancelada em até 24h).</p>
                <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                  <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 600 }}>{confirmEmitir.client?.empresa}</div>
                  <div style={{ color: COLORS.textMuted, fontSize: 11 }}>CNPJ: {confirmEmitir.client?.cnpj} | {confirmEmitir.client?.cidade}/{confirmEmitir.client?.estado}</div>
                  <div style={{ color: COLORS.orange, fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif", marginTop: 4 }}>{fmt(confirmEmitir.total)}</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setEmitenteSel(null)} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>
                  <button onClick={() => emitirNfe(confirmEmitir)} style={{ flex: 1, background: "#10B981", color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Sim, Emitir NF-e</button>
                </div>
              </>
            )}

            {/* PASSO 2B — Confirmação Suprema Instalações (NFS-e serviço) */}
            {emitenteSel === "instalacoes" && (
              <>
                <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#3B82F6", fontSize: 18, margin: "0 0 12px" }}>🔧 Confirmar Emissão — Suprema Instalações</h2>
                <p style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: "0 0 12px", lineHeight: 1.5 }}>
                  Esta ação irá emitir uma <strong style={{ color: "#F59E0B" }}>NFS-e em HOMOLOGAÇÃO</strong> (ambiente de teste, sem valor fiscal). Quando confirmar a configuração com o contador, eu troco pra produção.
                </p>
                <div style={{ background: "#F59E0B12", border: "1px solid #F59E0B40", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
                  <div style={{ color: "#F59E0B", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>⚠️ AMBIENTE DE HOMOLOGAÇÃO — nota de teste</div>
                </div>
                <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                  <div style={{ color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>Tomador</div>
                  <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 600 }}>RRE MAQUINAS E EQUIPAMENTOS LTDA (Gôndolas Brasil)</div>
                  <div style={{ color: COLORS.textMuted, fontSize: 11 }}>CNPJ: 23.505.287/0001-07 · São José/SC</div>
                  <div style={{ color: "#3B82F6", fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif", marginTop: 4 }}>{fmt(confirmEmitir.comissao || 0)}</div>
                  <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>(valor da comissão da venda · ISS 3% · Simples Nacional · item 10.05)</div>
                </div>
                {(!confirmEmitir.comissao || confirmEmitir.comissao <= 0) && (
                  <div style={{ background: COLORS.danger + "12", border: `1px solid ${COLORS.danger}40`, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                    <div style={{ color: COLORS.danger, fontSize: 12, fontWeight: 600 }}>⚠️ Comissão zero ou inválida</div>
                    <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 4 }}>Esta venda não tem valor de comissão. Não é possível emitir NFS-e sem valor de serviço.</div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setEmitenteSel(null)} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>← Voltar</button>
                  <button
                    onClick={() => emitirNfe(confirmEmitir, { emitente: "instalacoes", ambiente: "homologacao" })}
                    disabled={!confirmEmitir.comissao || confirmEmitir.comissao <= 0}
                    style={{ flex: 1, background: (!confirmEmitir.comissao || confirmEmitir.comissao <= 0) ? COLORS.textDim : "#3B82F6", color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: (!confirmEmitir.comissao || confirmEmitir.comissao <= 0) ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Sim, Emitir NFS-e (homologação)
                  </button>
                </div>
              </>
            )}

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
                          <button onClick={() => setCancelandoNfe(null)} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "8px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Voltar</button>
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
            <button onClick={() => { setNfeResult(null); setCancelandoNfe(null); setCancelJustificativa(""); }} style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 12 }}>Fechar</button>
          </div>
        </div>
      )}

      {/* Relatório Vendas Concluídas por Mês */}
      {(() => {
        // Respeita os filtros principais (vendedor + cidade) na tabela Vendas Concluidas.
        // Mes: usa o filtro principal se aplicado, senao o select interno.
        const concluidos = allOrders.filter(o => {
          if (o.status !== "Concluído") return false;
          if (appliedVendedor !== "all" && o.vendedor !== appliedVendedor) return false;
          if (appliedCidade !== "all" && (o.client?.cidade || "") !== appliedCidade) return false;
          return true;
        });
        const meses = [...new Set(concluidos.map(o => { const d = new Date(o.date); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }))].sort().reverse();
        const mesNomes = { "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril", "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };
        // Filtro de mes principal tem prioridade sobre o select interno
        const activeMes = (appliedMes !== "all" ? appliedMes : mesSel) || meses[0] || "";

        const updateVendaStatus = async (orderId, newSt) => {
          setVendaStatus(prev => ({ ...prev, [orderId]: newSt }));
          const ord = allOrders.find(x => x.id === orderId);
          const existingNotes = ord?.notes || "";
          const cleanNotes = existingNotes.replace(/\n🏷️ Status venda:.*$/m, "");
          // Atualiza notes + grava/limpa data_pagamento e valor_recebido conforme status
          const update = { notes: cleanNotes + "\n🏷️ Status venda: " + newSt };
          if (newSt === "Pago") {
            update.data_pagamento = new Date().toISOString();
            // Receita da venda entra agora: valor TOTAL, ou só a COMISSÃO se for
            // boleto parcelado pro fornecedor (cliente paga o boleto direto pra RRE).
            const boleto = isBoletoParceladoRRE(ord?.notes);
            update.valor_recebido = boleto ? (Number(ord?.comissao) || 0) : (Number(ord?.total) || 0);
          }
          await supabase.from("orcamentos").update(update).eq("id", orderId);
          // Se voltou pra "Em Aberto", vira "a receber": zera valor_recebido e
          // limpa empresa, banco recebedor e data_pagamento.
          if (newSt === "Em Aberto") {
            await supabase.from("orcamentos").update({
              venda_empresa_recebedora: null,
              venda_banco_recebedor: null,
              data_pagamento: null,
              valor_recebido: 0,
            }).eq("id", orderId);
            setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, vendaEmpresaRecebedora: null, vendaBancoRecebedor: null, data_pagamento: null, valor_recebido: 0 } : o));
          } else if (newSt === "Pago") {
            setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, data_pagamento: update.data_pagamento, valor_recebido: update.valor_recebido } : o));
          }
        };

        const getVendaStatus = (o) => {
          if (vendaStatus[o.id]) return vendaStatus[o.id];
          const match = (o.notes || "").match(/🏷️ Status venda: (.+)$/m);
          const s = match ? match[1] : "Em Aberto";
          // Valores antigos ("Concluído" / "Gerar NF") são tratados como "Pago"
          // (o status agora é só Em Aberto ou Pago)
          if (s === "Concluído" || s === "Gerar NF") return "Pago";
          return s;
        };

        // Empresa recebedora — quando status = Pago
        const updateVendaEmpresa = async (orderId, novaEmpresa) => {
          await supabase.from("orcamentos").update({
            venda_empresa_recebedora: novaEmpresa || null,
            // Trocar de empresa zera o banco (cada empresa tem bancos diferentes)
            venda_banco_recebedor: null,
          }).eq("id", orderId);
          setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, vendaEmpresaRecebedora: novaEmpresa || null, vendaBancoRecebedor: null } : o));
        };

        // Banco recebedor — quando empresa está selecionada
        const updateVendaBanco = async (orderId, novoBanco) => {
          await supabase.from("orcamentos").update({ venda_banco_recebedor: novoBanco || null }).eq("id", orderId);
          setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, vendaBancoRecebedor: novoBanco || null } : o));
        };

        // Opções de banco dependem da empresa
        const BANCOS_POR_EMPRESA = {
          gondolas_suprema: [
            { v: "pf_mp", label: "PF MP" },
            { v: "sicredi", label: "Sicredi" },
            { v: "mercado_pago", label: "Mercado Pago" },
          ],
          suprema_instalacoes: [
            { v: "c6_bank", label: "C6 Bank" },
            { v: "pf_mp", label: "PF MP" },
          ],
        };
        const labelEmpresa = (v) => v === "gondolas_suprema" ? "Gôndolas Suprema" : v === "suprema_instalacoes" ? "Suprema Instalações" : "—";
        const labelBanco = (v) => ({ pf_mp: "PF MP", sicredi: "Sicredi", mercado_pago: "Mercado Pago", c6_bank: "C6 Bank" })[v] || "—";

        const mesConcluidos = concluidos.filter(o => { const d = new Date(o.date); return (d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")) === activeMes; });
        const totalMes = mesConcluidos.reduce((s, o) => s + (o.total || 0), 0);
        const vstSc = { "Em Aberto": "#F59E0B", "Pago": "#10B981" };

        return concluidos.length > 0 ? (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
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
              <div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <th style={{ padding: "8px 6px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.3 }}>Empresa</th>
                      <th style={{ padding: "8px 6px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.3 }}>CNPJ</th>
                      <th style={{ padding: "8px 6px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.3 }}>Cidade</th>
                      <th style={{ padding: "8px 6px", textAlign: "right", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.3 }}>Valor</th>
                      <th style={{ padding: "8px 6px", textAlign: "right", color: "#10B981", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.3 }}>Lucro</th>
                      <th style={{ padding: "8px 6px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.3 }}>Vendedor</th>
                      <th style={{ padding: "8px 6px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.3 }}>Status</th>
                      <th style={{ padding: "8px 6px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.3 }}>Empresa Receb.</th>
                      <th style={{ padding: "8px 6px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.3 }}>Banco</th>
                      {isAdminOnly && <th style={{ padding: "8px 6px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.3 }}>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {mesConcluidos.map(o => {
                      const vs = getVendaStatus(o);
                      return (
                        <tr key={o.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                          <td onClick={() => showPdfAdm(o)} title="Clique para ver o orçamento em PDF" style={{ padding: "8px 6px", color: COLORS.accent, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", maxWidth: 160 }}>{o.client?.empresa || "-"} 📄</td>
                          <td style={{ padding: "8px 6px", color: COLORS.textMuted, whiteSpace: "nowrap" }}>{o.client?.cnpj || "-"}</td>
                          <td style={{ padding: "8px 6px", color: COLORS.textMuted, whiteSpace: "nowrap" }}>{o.client?.cidade || "-"}{o.client?.estado ? "/" + o.client.estado : ""}</td>
                          <td style={{ padding: "8px 6px", textAlign: "right", color: COLORS.orange, fontWeight: 700, whiteSpace: "nowrap" }}>{fmt(o.total || 0)}</td>
                          <td style={{ padding: "8px 6px", textAlign: "right", color: "#10B981", fontWeight: 700, whiteSpace: "nowrap" }}>{fmt(o.comissao || 0)}</td>
                          <td style={{ padding: "8px 6px", color: COLORS.accent, fontWeight: 500, whiteSpace: "nowrap" }}>{o.vendedor || "-"}</td>
                          <td style={{ padding: "8px 6px", textAlign: "center" }}>
                            {canEditAdm ? (
                              <select value={vs} onChange={e => updateVendaStatus(o.id, e.target.value)} style={{ background: (vstSc[vs] || "#888") + "20", color: vstSc[vs] || "#888", border: `1px solid ${(vstSc[vs] || "#888")}40`, padding: "3px 6px", borderRadius: 10, fontSize: 9, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", outline: "none" }}>
                                <option value="Em Aberto">Em Aberto</option>
                                <option value="Pago">Pago</option>
                              </select>
                            ) : (
                              <span style={{ background: (vstSc[vs] || "#888") + "20", color: vstSc[vs] || "#888", border: `1px solid ${(vstSc[vs] || "#888")}40`, padding: "3px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{vs}</span>
                            )}
                          </td>
                          {/* Empresa Recebedora — só aparece quando Status = Pago */}
                          <td style={{ padding: "8px 6px", textAlign: "center" }}>
                            {vs === "Pago" ? (
                              canEditAdm ? (
                                <select value={o.vendaEmpresaRecebedora || ""} onChange={e => updateVendaEmpresa(o.id, e.target.value)} style={{ background: COLORS.bg, color: o.vendaEmpresaRecebedora ? COLORS.text : COLORS.textMuted, border: `1px solid ${COLORS.border}`, padding: "3px 6px", borderRadius: 6, fontSize: 9, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", outline: "none" }}>
                                  <option value="">—</option>
                                  <option value="gondolas_suprema">Gôndolas Suprema</option>
                                  <option value="suprema_instalacoes">Suprema Instalações</option>
                                </select>
                              ) : (
                                <span style={{ color: COLORS.text, fontSize: 10 }}>{labelEmpresa(o.vendaEmpresaRecebedora)}</span>
                              )
                            ) : (
                              <span style={{ color: COLORS.textDim, fontSize: 10 }}>—</span>
                            )}
                          </td>
                          {/* Banco — só aparece quando Empresa está selecionada */}
                          <td style={{ padding: "8px 6px", textAlign: "center" }}>
                            {vs === "Pago" && o.vendaEmpresaRecebedora ? (
                              canEditAdm ? (
                                <select value={o.vendaBancoRecebedor || ""} onChange={e => updateVendaBanco(o.id, e.target.value)} style={{ background: COLORS.bg, color: o.vendaBancoRecebedor ? COLORS.text : COLORS.textMuted, border: `1px solid ${COLORS.border}`, padding: "3px 6px", borderRadius: 6, fontSize: 9, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", outline: "none" }}>
                                  <option value="">—</option>
                                  {(BANCOS_POR_EMPRESA[o.vendaEmpresaRecebedora] || []).map(b => (
                                    <option key={b.v} value={b.v}>{b.label}</option>
                                  ))}
                                </select>
                              ) : (
                                <span style={{ color: COLORS.text, fontSize: 10 }}>{labelBanco(o.vendaBancoRecebedor)}</span>
                              )
                            ) : (
                              <span style={{ color: COLORS.textDim, fontSize: 10 }}>—</span>
                            )}
                          </td>
                          {isAdminOnly && (
                            <td style={{ padding: "10px 8px", textAlign: "center" }}>
                              {confirmDelVenda === o.id ? (
                                <div style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                                  <button
                                    onClick={async () => {
                                      await supabase.from("orcamentos").delete().eq("id", o.id);
                                      setAllOrders(allOrders.filter(x => x.id !== o.id));
                                      setConfirmDelVenda(null);
                                    }}
                                    title="Confirmar exclusão da venda"
                                    style={{ background: COLORS.danger, border: "none", color: "#fff", padding: "3px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                                  >Sim</button>
                                  <button
                                    onClick={() => setConfirmDelVenda(null)}
                                    title="Cancelar"
                                    style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "3px 6px", borderRadius: 6, fontSize: 9, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                                  >✕</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDelVenda(o.id)}
                                  title="Excluir venda"
                                  style={{ background: COLORS.danger + "10", border: `1px solid ${COLORS.danger}30`, color: COLORS.danger, padding: "3px 7px", borderRadius: 6, fontSize: 11, cursor: "pointer", lineHeight: 1 }}
                                >🗑️</button>
                              )}
                            </td>
                          )}
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

      {/* Busca por nome do cliente / nº do orçamento */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 14px", position: "relative" }}>
        <span style={{ position: "absolute", left: 12, color: COLORS.textDim, fontSize: 14, pointerEvents: "none" }}>🔍</span>
        <input
          type="text"
          value={buscaNome}
          onChange={e => setBuscaNome(e.target.value)}
          placeholder="Buscar orçamento por nome do cliente, cidade, vendedor ou nº…"
          style={{ width: "100%", padding: "11px 14px 11px 36px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
        />
        {buscaNome && (
          <button onClick={() => setBuscaNome("")} style={{ position: "absolute", right: 10, background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 16, lineHeight: 1 }} title="Limpar busca">×</button>
        )}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📂</div>
          <p style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Nenhum orçamento encontrado</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(o => (
            <div key={o.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, overflow: "hidden" }}>
              <div onClick={() => showPdfAdm(o)} title="Clique para ver o orçamento em PDF" style={{ padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>#{o.id.slice(0, 6).toUpperCase()} · {new Date(o.date).toLocaleDateString("pt-BR")} · {o.items?.length || 0} itens</div>
                  <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginTop: 2, display: "inline-flex", alignItems: "center", gap: 5 }}>{o.client?.empresa || "Sem empresa"} <span style={{ fontSize: 11 }}>📄</span></div>
                  <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Vendedor: <strong style={{ color: COLORS.accent }}>{o.vendedor}</strong>{o.client?.cidade ? " · " + o.client.cidade + (o.client.estado ? "/" + o.client.estado : "") : ""}</div>
                  {o.client?.telefone && (() => {
                    const d = String(o.client.telefone).replace(/\D/g, "");
                    const tel = d.length === 11 ? `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
                      : d.length === 10 ? `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
                      : o.client.telefone;
                    return (
                      <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                        📞 <a href={`https://wa.me/55${d}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: COLORS.accent, textDecoration: "none" }}>{tel}</a>
                      </div>
                    );
                  })()}
                </div>
                <TermometroLead value={o.temperatura} onChange={(v) => updateTemperaturaAdm(o.id, v)} canEdit={o.vendedorId === user.id} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ background: sc[o.status] || sc["Aguardando Retorno"], color: "#000", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{o.status || "Aguardando Retorno"}</span>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: COLORS.orange, marginTop: 4 }}>{fmt(o.total || 0)}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setExpanded(expanded === o.id ? null : o.id); }} title="Ver detalhes / editar" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "8px 10px", borderRadius: 7, cursor: "pointer", fontSize: 13, lineHeight: 1 }}>{expanded === o.id ? "▲" : "▼"}</button>
                  {canEditAdm && <button onClick={async (e) => { e.stopPropagation(); if (window.confirm("Excluir este orçamento?")) { await supabase.from("orcamentos").delete().eq("id", o.id); setAllOrders(allOrders.filter(x => x.id !== o.id)); }}} style={{ background: COLORS.danger + "15", border: `1px solid ${COLORS.danger}30`, color: COLORS.danger, padding: "8px", borderRadius: 7, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>🗑️</button>}
                </div>
              </div>
              {expanded === o.id && (
                <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "12px 16px" }}>
                  {o.client?.responsavel && <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Responsável: <strong style={{ color: COLORS.text }}>{o.client.responsavel}</strong></div>}
                  {o.client?.telefone && <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Tel: {o.client.telefone}</div>}
                  {o.client?.email && <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>E-mail: {o.client.email}</div>}
                  {o.client?.endereco && <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>End: {o.client.endereco}{o.client.bairro ? ", " + o.client.bairro : ""} — {o.client.cidade}{o.client.estado ? "/" + o.client.estado : ""}</div>}
                  {/* Vendedor: só leitura (Ale/Zanella mudam o STATUS, não o vendedor) */}
                  {canEditAdm && (<>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 10px" }}>
                    <label style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Vendedor:</label>
                    <span style={{ color: COLORS.accent, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{o.vendedor || "—"}</span>
                  </div>

                  {/* Trocar status (visivel apenas no ADM — Ale e Zanella) */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 10px", flexWrap: "wrap" }}>
                    <label style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Status:</label>
                    <select
                      value={o.status || "Aguardando Retorno"}
                      onClick={e => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); updateOrderStatus(o.id, e.target.value); }}
                      style={{ ...sel, padding: "6px 10px", fontSize: 12, flex: "0 0 auto" }}
                    >
                      {Object.keys(sc).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {statusChangeMsg?.orderId === o.id && (
                      <span style={{ color: statusChangeMsg.tipo === "ok" ? COLORS.success : COLORS.danger, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                        {statusChangeMsg.tipo === "ok" ? "✓ " : "⚠ "}{statusChangeMsg.texto}
                      </span>
                    )}
                  </div>
                  </>)}

                  {/* Resumo financeiro do orcamento (visivel apenas no ADM).
                      Valor da Venda e Comissão são editáveis no clique (Ale/Zanella). */}
                  {(() => {
                    const custo = Math.max(0, (o.total || 0) - (o.comissao || 0) - (o.frete || 0));
                    const lblDim = { color: COLORS.textDim, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 };
                    const roStyle = { color: COLORS.text, fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" };
                    const editando = (campo) => editVenda.id === o.id && editVenda.campo === campo;
                    const cellEdit = (campo, cor) => (
                      <input type="number" min="0" step="0.01" autoFocus defaultValue={Number(o[campo]) || 0}
                        onClick={e => e.stopPropagation()}
                        onBlur={e => salvarCampoVenda(o, campo, e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditVenda({ id: null, campo: null }); }}
                        style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.accent}`, borderRadius: 6, color: cor, padding: "4px 6px", fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                    );
                    const cellView = (campo, cor) => (
                      <div onClick={canEditAdm ? (e) => { e.stopPropagation(); setEditVenda({ id: o.id, campo }); } : undefined}
                        title={canEditAdm ? "Clique para editar" : ""}
                        style={{ color: cor, fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: canEditAdm ? "pointer" : "default", borderBottom: canEditAdm ? `1px dashed ${COLORS.textDim}` : "none", display: "inline-block", paddingBottom: 1 }}>
                        {fmt(Number(o[campo]) || 0)}
                      </div>
                    );
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, margin: "4px 0 10px", padding: "10px 12px", background: COLORS.bg, borderRadius: 7, border: `1px solid ${COLORS.border}` }}>
                        <div>
                          <div style={lblDim}>Valor da Venda</div>
                          {editando("total") ? cellEdit("total", COLORS.orange) : cellView("total", COLORS.orange)}
                        </div>
                        <div>
                          <div style={lblDim}>Comissão</div>
                          {editando("comissao") ? cellEdit("comissao", COLORS.success) : cellView("comissao", COLORS.success)}
                        </div>
                        <div>
                          <div style={lblDim}>Custo</div>
                          <div style={roStyle}>{fmt(custo)}</div>
                        </div>
                        <div>
                          <div style={lblDim}>Frete</div>
                          <div style={roStyle}>{fmt(o.frete || 0)}</div>
                        </div>
                      </div>
                    );
                  })()}
                  {o.notes && <div style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 8, fontStyle: "italic" }}>Obs: {o.notes}</div>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(o.items || []).map((it, j) => (
                      <div key={j} style={{ background: COLORS.bg, borderRadius: 6, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{it.name}</div>
                          <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{it.cat} · Qtd: {it.qty}{itemOptsLabel(it) ? <span style={{ color: COLORS.orange }}> · {itemOptsLabel(it)}</span> : null}</div>
                        </div>
                        <span style={{ color: COLORS.orange, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{fmt(it.total)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Modo de edicao inline (Ale/Zanella editam direto da ADM) */}
                  {editingId === o.id && (
                    <div style={{ marginTop: 14, padding: "14px 16px", background: "#3B82F608", border: `1px solid #3B82F640`, borderRadius: 10 }}>
                      <h4 style={{ fontFamily: "'Playfair Display', serif", color: "#3B82F6", fontSize: 13, margin: "0 0 12px" }}>✏️ Editando orçamento</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <div>
                          <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans', sans-serif" }}>Frete (R$)</div>
                          <input type="number" min="0" step="0.01" value={editFrete} onChange={e => setEditFrete(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans', sans-serif" }}>Markup / Comissão (%)</div>
                          <input type="number" min="0" step="1" value={editMarkup} onChange={e => setEditMarkup(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans', sans-serif" }}>Observações</div>
                        <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} style={{ width: "100%", padding: "8px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
                      </div>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={(e) => { e.stopPropagation(); cancelEditOrder(); }} disabled={savingEdit} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "7px 16px", borderRadius: 7, cursor: savingEdit ? "not-allowed" : "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                        <button onClick={(e) => { e.stopPropagation(); saveEditOrder(o.id); }} disabled={savingEdit} style={{ background: "#3B82F6", border: "none", color: "#fff", padding: "7px 16px", borderRadius: 7, cursor: savingEdit ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{savingEdit ? "Salvando..." : "💾 Salvar"}</button>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 12, display: canEditAdm ? "flex" : "none", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    {editingId !== o.id && confirmDel !== o.id && (
                      <button onClick={(e) => { e.stopPropagation(); startEditOrder(o); }} style={{ background: "#3B82F615", border: `1px solid #3B82F640`, color: "#3B82F6", padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>✏️ Editar</button>
                    )}
                    {confirmDel === o.id ? (
                      <>
                        <span style={{ color: COLORS.danger, fontSize: 12, fontFamily: "'DM Sans', sans-serif", alignSelf: "center" }}>Tem certeza?</span>
                        <button onClick={async (e) => { e.stopPropagation(); await supabase.from("orcamentos").delete().eq("id", o.id); setAllOrders(allOrders.filter(x => x.id !== o.id)); setConfirmDel(null); setExpanded(null); }} style={{ background: COLORS.danger, border: "none", color: "#fff", padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Sim, excluir</button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDel(null); }} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                      </>
                    ) : editingId !== o.id && (
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDel(o.id); }} style={{ background: COLORS.danger + "10", border: `1px solid ${COLORS.danger}30`, color: COLORS.danger, padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>🗑️ Excluir orçamento</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Conclusão — abre quando Ale/Zanella escolhem "Concluído" no status */}
      {concluidoIdAdm && (() => {
        const cd = concluidoDataAdm;
        const selStyle = { width: "100%", padding: "10px 14px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };
        const lblStyle = { color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: 0.5 };
        const cnpjDigits = (cd.cnpj || "").replace(/\D/g, "");
        const cnpjOk = cnpjDigits.length === 14 || cnpjDigits.length === 11;
        const canSave = cnpjOk && cd.data_entrega && cd.numero_pedido && cd.pag1 && ((cd.pag1 !== "Cartão de Crédito" && cd.pag1 !== "Boleto") || cd.pag1_parcelas);
        return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 28, width: 460, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#10B981", fontSize: 20, margin: "0 0 6px" }}>Concluir Orçamento</h2>
              <p style={{ color: COLORS.textMuted, fontSize: 12, margin: "0 0 20px", fontFamily: "'DM Sans', sans-serif" }}>Preencha os dados da conclusão</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={lblStyle}>CNPJ ou CPF *</label>
                  <input placeholder="00.000.000/0001-00 ou 000.000.000-00" value={cd.cnpj} onChange={e => setConcluidoDataAdm({ ...cd, cnpj: formatarCnpjOuCpf(e.target.value) })} maxLength={18} style={!cnpjOk && cd.cnpj ? { ...selStyle, borderColor: COLORS.danger } : selStyle} />
                  {!cnpjOk && cd.cnpj && (<div style={{ color: COLORS.danger, fontSize: 10, marginTop: 4 }}>CNPJ deve ter 14 dígitos ou CPF deve ter 11 dígitos.</div>)}
                </div>
                <div>
                  <label style={lblStyle}>Data de Entrega *</label>
                  <input type="date" value={cd.data_entrega} onChange={e => setConcluidoDataAdm({ ...cd, data_entrega: e.target.value })} style={selStyle} />
                </div>
                <div>
                  <label style={lblStyle}>Número do Pedido *</label>
                  <input placeholder="Ex: PED-001" value={cd.numero_pedido} onChange={e => setConcluidoDataAdm({ ...cd, numero_pedido: e.target.value.toUpperCase() })} style={selStyle} />
                </div>

                {/* Pagamento 1 */}
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14 }}>
                  <label style={lblStyle}>Forma de Pagamento 1 *</label>
                  <select value={cd.pag1} onChange={e => setConcluidoDataAdm({ ...cd, pag1: e.target.value, pag1_parcelas: "" })} style={selStyle}>
                    <option value="">Selecione...</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Boleto">Boleto</option>
                  </select>
                  {cd.pag1 === "Cartão de Crédito" && (
                    <div style={{ marginTop: 10 }}>
                      <label style={lblStyle}>Parcelas *</label>
                      <select value={cd.pag1_parcelas} onChange={e => setConcluidoDataAdm({ ...cd, pag1_parcelas: e.target.value })} style={selStyle}>
                        <option value="">Selecione...</option>
                        {Array.from({ length: 18 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}x</option>)}
                      </select>
                    </div>
                  )}
                  {cd.pag1 === "Boleto" && (
                    <div style={{ marginTop: 10 }}>
                      <label style={lblStyle}>Parcelas *</label>
                      <select value={cd.pag1_parcelas} onChange={e => setConcluidoDataAdm({ ...cd, pag1_parcelas: e.target.value })} style={selStyle}>
                        <option value="">Selecione...</option>
                        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}x</option>)}
                      </select>
                    </div>
                  )}
                  {cd.pag1 && (
                    <div style={{ marginTop: 10 }}>
                      <label style={lblStyle}>Valor (R$)</label>
                      <input type="number" min="0" step="0.01" placeholder="0,00" value={cd.pag1_valor} onChange={e => setConcluidoDataAdm({ ...cd, pag1_valor: e.target.value })} style={selStyle} />
                    </div>
                  )}
                </div>

                {/* Pagamento 2 (opcional) */}
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14 }}>
                  <label style={lblStyle}>Forma de Pagamento 2 (opcional)</label>
                  <select value={cd.pag2} onChange={e => setConcluidoDataAdm({ ...cd, pag2: e.target.value, pag2_parcelas: "", pag2_valor: "" })} style={selStyle}>
                    <option value="">Sem segundo pagamento</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Boleto">Boleto</option>
                  </select>
                  {cd.pag2 === "Cartão de Crédito" && (
                    <div style={{ marginTop: 10 }}>
                      <label style={lblStyle}>Parcelas *</label>
                      <select value={cd.pag2_parcelas} onChange={e => setConcluidoDataAdm({ ...cd, pag2_parcelas: e.target.value })} style={selStyle}>
                        <option value="">Selecione...</option>
                        {Array.from({ length: 18 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}x</option>)}
                      </select>
                    </div>
                  )}
                  {cd.pag2 === "Boleto" && (
                    <div style={{ marginTop: 10 }}>
                      <label style={lblStyle}>Parcelas *</label>
                      <select value={cd.pag2_parcelas} onChange={e => setConcluidoDataAdm({ ...cd, pag2_parcelas: e.target.value })} style={selStyle}>
                        <option value="">Selecione...</option>
                        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}x</option>)}
                      </select>
                    </div>
                  )}
                  {cd.pag2 && (
                    <div style={{ marginTop: 10 }}>
                      <label style={lblStyle}>Valor (R$)</label>
                      <input type="number" min="0" step="0.01" placeholder="0,00" value={cd.pag2_valor} onChange={e => setConcluidoDataAdm({ ...cd, pag2_valor: e.target.value })} style={selStyle} />
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  <button onClick={() => setConcluidoIdAdm(null)} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13 }}>Cancelar</button>
                  <button onClick={saveConcluidoAdm} disabled={!canSave} style={{ flex: 1, background: !canSave ? COLORS.textDim : "#10B981", color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: !canSave ? "not-allowed" : "pointer", fontSize: 13 }}>Concluir</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
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
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 14, padding: "20px 16px 14px", textAlign: "center" }}>
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

function GraficosPage({ user }) {
  const [allOrders, setAllOrders] = useState([]);
  const [mesSel, setMesSel] = useState("");
  const META = 100000;

  // Admin, gestor e vendedor (Adelmo) veem todos; só vendedor_basico
  // (João) vê apenas os próprios.
  const role = user?.role || (user?.isAdmin ? "admin" : "vendedor");
  const isVendedorComum = role === "vendedor_basico";

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      let q = supabase.from("orcamentos").select("*").eq("status", "Concluído");
      if (isVendedorComum) q = q.eq("vendedor_id", user.id);
      const { data } = await q.order("data_conclusao", { ascending: false, nullsFirst: false });
      if (data) {
        // Remove orcamentos RS-ocultos do ranking/graficos consolidados
        const visiveis = data.filter(o => !isOrcamentoRsOculto(o));
        setAllOrders(visiveis.map(o => ({
          id: o.id,
          // Base do agrupamento por mês: data em que a venda foi marcada como
          // Concluída. Fallback pra data_entrega e depois data do orçamento
          // (pra eventuais concluídos sem data_conclusao registrada).
          date: o.data_conclusao || o.data_entrega || o.data,
          total: o.total || 0, vendedor: o.vendedor_nome, vendedorId: o.vendedor_id
        })));
      }
    };
    load();
  }, [user?.id, isVendedorComum]);

  // Mês atual no formato YYYY-MM — sempre presente no dropdown e usado
  // como default ao abrir a aba (mesmo que ainda não tenha vendas no mês)
  const _hojeGraf = new Date();
  const _mesAtualGraf = _hojeGraf.getFullYear() + "-" + String(_hojeGraf.getMonth() + 1).padStart(2, "0");
  const _mesesSet = new Set(allOrders.map(o => { const d = new Date(o.date); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }));
  _mesesSet.add(_mesAtualGraf);
  const meses = [..._mesesSet].sort().reverse();
  const mesNomes = { "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril", "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };
  const activeMes = mesSel || _mesAtualGraf;
  const cores = { v1: "#F5A623", v2: "#3B82F6", v3: "#10B981" };

  // Admin/gestor: ranking entre os 3 vendedores
  // Vendedor: so aparece o proprio (a query ja vem filtrada)
  const SELLERS = isVendedorComum
    ? VENDEDORES.filter(v => v.id === user.id)
    : VENDEDORES.filter(v => v.id === "v1" || v.id === "v2" || v.id === "v3");

  const vendedoresData = SELLERS.map(v => {
    const vendasMes = allOrders.filter(o => {
      const d = new Date(o.date);
      return o.vendedorId === v.id && (d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")) === activeMes;
    });
    return { ...v, totalMes: vendasMes.reduce((s, o) => s + o.total, 0), qtdVendas: vendasMes.length };
  });

  const totalEquipe = vendedoresData.reduce((s, v) => s + v.totalMes, 0);

  // Total de vendas concluídas no mês ativo (para o contador do filtro)
  const qtdVendasMes = vendedoresData.reduce((s, v) => s + v.qtdVendas, 0);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 4px" }}>Gráficos de Vendas</h1>
        <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          Acompanhamento de metas por vendedor
          <span style={{ color: COLORS.textDim, fontStyle: "italic" }}> · somente vendas concluídas</span>
        </p>
      </div>

      {/* Filtro por mês — disponível pra todos os usuários */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>📅 Filtrar por mês:</span>
        <select
          value={activeMes}
          onChange={e => setMesSel(e.target.value)}
          style={{ padding: "8px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", minWidth: 180 }}
        >
          {meses.length === 0 && <option value="">Sem dados</option>}
          {meses.map(m => <option key={m} value={m}>{mesNomes[m.split("-")[1]]} {m.split("-")[0]}</option>)}
        </select>
        <span style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginLeft: "auto" }}>
          {qtdVendasMes} {qtdVendasMes === 1 ? "venda concluída" : "vendas concluídas"}{activeMes && ` em ${mesNomes[activeMes.split("-")[1]]} ${activeMes.split("-")[0]}`}
        </span>
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
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, marginTop: 20, overflow: "hidden" }}>
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

function FinanceiroPage({ user }) {
  // Somente leitura: só o Ale (admin/v1) edita o Financeiro. Zanella (gestor)
  // e qualquer outro que tenha acesso à aba enxergam tudo mas não alteram nada.
  const somenteLeitura = !(user?.role === "admin" || user?.id === "v1");
  const [subTab, setSubTab] = useState("fixas");
  const [despesas, setDespesas] = useState([]);
  const [mesSel, setMesSel] = useState(() => { const n = new Date(); return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0"); });
  // Sprint 2.2 — empresa que "possui" as despesas exibidas/criadas nesta tela.
  // Cada CNPJ (Gôndolas Suprema, Suprema Instalações) tem seu próprio conjunto de despesas.
  const [empresaSel, setEmpresaSel] = useState("gondolas_suprema");
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
  // Despesas fixas do mês anterior que ainda não foram pagas (atrasadas).
  // Exibidas em destaque no topo do tab Fixas do mês atual.
  const [atrasadas, setAtrasadas] = useState([]);
  // Boletos a pagar — tabela boletos_a_pagar
  const [boletos, setBoletos] = useState([]);
  // Filtro de status dos boletos: "em_aberto" (default) | "pagos" | "todos"
  const [boletoStatusFiltro, setBoletoStatusFiltro] = useState("em_aberto");
  // Célula de boleto em edição inline: { id, campo: "vencimento"|"valor" }
  const [editBoleto, setEditBoleto] = useState({ id: null, campo: null });

  const mesNomes = { "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril", "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };

  // Carrega boletos (todos — pra mostrar atrasados de qualquer mês)
  const carregarBoletos = async () => {
    const { data } = await supabase.from("boletos_a_pagar").select("*").order("vencimento", { ascending: true });
    if (data) setBoletos(data);
  };

  // Marca boleto como pago
  const marcarBoletoPago = async (id) => {
    if (somenteLeitura) return;
    await supabase.from("boletos_a_pagar").update({ status: "pago", data_pagamento: new Date().toISOString() }).eq("id", id);
    setBoletos(prev => prev.map(b => b.id === id ? { ...b, status: "pago", data_pagamento: new Date().toISOString() } : b));
  };

  // Volta boleto pra pendente (se marcou pago por engano)
  const desmarcarBoletoPago = async (id) => {
    if (somenteLeitura) return;
    await supabase.from("boletos_a_pagar").update({ status: "pendente", data_pagamento: null }).eq("id", id);
    setBoletos(prev => prev.map(b => b.id === id ? { ...b, status: "pendente", data_pagamento: null } : b));
  };

  // Edição inline de vencimento/valor direto na lista de boletos.
  // Clica em cima → vira input → salva no blur/Enter. Escape cancela.
  const atualizarBoletoCampo = async (id, campo, valorRaw) => {
    if (somenteLeitura) { setEditBoleto({ id: null, campo: null }); return; }
    let valor = valorRaw;
    if (campo === "valor") {
      valor = Number(String(valorRaw).replace(",", "."));
      if (!isFinite(valor) || valor < 0) { setEditBoleto({ id: null, campo: null }); return; }
    }
    if (campo === "vencimento" && !valorRaw) { setEditBoleto({ id: null, campo: null }); return; }
    // Sem mudança real → só fecha o editor
    const atual = boletos.find(b => b.id === id);
    if (atual && String(atual[campo]) === String(valor)) { setEditBoleto({ id: null, campo: null }); return; }
    await supabase.from("boletos_a_pagar").update({ [campo]: valor }).eq("id", id);
    setBoletos(prev => prev.map(b => b.id === id ? { ...b, [campo]: valor } : b));
    setEditBoleto({ id: null, campo: null });
  };

  // Quantos boletos atrasados (vencidos e não pagos)
  const hojeISO = new Date().toISOString().slice(0, 10);
  const boletosAtrasados = boletos.filter(b => b.status === "pendente" && b.vencimento < hojeISO).length;

  // Calcula a chave do mes anterior no formato YYYY-MM (ex: "2026-05" -> "2026-04")
  const calcularMesAnterior = (mes) => {
    const [ano, m] = mes.split("-").map(Number);
    let novoMes = m - 1;
    let novoAno = ano;
    if (novoMes === 0) { novoMes = 12; novoAno = ano - 1; }
    return novoAno + "-" + String(novoMes).padStart(2, "0");
  };

  // Avança o vencimento do mês anterior pro mês corrente, preservando o dia.
  // Ex: "2026-05-15" + mesNovo "2026-06" → "2026-06-15"
  // Se o dia não existir no mês novo (ex: 31 em fevereiro), usa o último dia.
  const avancarVencimento = (vencAnt, novoMesAno) => {
    if (!vencAnt) return null;
    const partes = String(vencAnt).split("-");
    if (partes.length < 3) return null;
    const dia = parseInt(partes[2], 10);
    if (isNaN(dia)) return null;
    const [novoAno, novoMes] = novoMesAno.split("-").map(Number);
    const ultimoDia = new Date(novoAno, novoMes, 0).getDate();
    const diaAjustado = Math.min(dia, ultimoDia);
    return `${novoAno}-${String(novoMes).padStart(2, "0")}-${String(diaAjustado).padStart(2, "0")}`;
  };

  const carregarDespesas = async (mes) => {
    setLoading(true);
    const { data } = await supabase.from("despesas").select("*").eq("mes", mes).eq("empresa", empresaSel).order("nome");
    if (data && data.length > 0) {
      setDespesas(data);
    } else if (somenteLeitura) {
      // Zanella (só leitura) não gera esqueleto de fixas — só mostra o que existe.
      setDespesas([]);
    } else {
      // Mês ainda sem despesas — replica TODAS as despesas fixas do mês
      // anterior (com valores E vencimentos já preenchidos), pra evitar
      // redigitação. O vencimento avança 1 mês mantendo o mesmo dia.
      // Reseta status para "Em Aberto". Se não houver mês anterior, cai
      // no template padrão de DESPESAS_FIXAS.
      const mesAnt = calcularMesAnterior(mes);
      const { data: anteriores } = await supabase.from("despesas")
        .select("*")
        .eq("mes", mesAnt)
        .eq("empresa", empresaSel)
        .eq("fixa", true)
        .order("nome");

      let novas;
      if (anteriores && anteriores.length > 0) {
        novas = anteriores.map(d => ({
          id: genId(),
          nome: d.nome,
          vencimento: avancarVencimento(d.vencimento, mes),
          valor: Number(d.valor) || 0,
          status: "Em Aberto",
          mes,
          fixa: true,
          tipo: d.tipo,
          categoria: d.categoria,
          empresa: empresaSel,
        }));
      } else {
        novas = DESPESAS_FIXAS.map(nome => {
          const { tipo, categoria } = inferirTipoDespesa(nome);
          return { id: genId(), nome, vencimento: null, valor: 0, status: "Em Aberto", mes, fixa: true, tipo, categoria, empresa: empresaSel };
        });
      }
      for (const d of novas) { await supabase.from("despesas").insert(d); }
      setDespesas(novas);
    }
    // Busca despesas fixas do mês anterior ainda não pagas (atrasadas).
    // Aparecem em destaque no topo do tab Fixas do mês atual.
    const mesAntAtras = calcularMesAnterior(mes);
    const { data: atrs } = await supabase.from("despesas")
      .select("*")
      .eq("mes", mesAntAtras)
      .eq("empresa", empresaSel)
      .eq("fixa", true)
      .neq("status", "Pago")
      .order("vencimento");
    setAtrasadas((atrs || []).filter(d => Number(d.valor) > 0)); // só destaca quem tem valor preenchido
    setLoading(false);
  };

  // Marca despesa atrasada (do mês anterior) como Paga.
  // Atualiza o registro no MÊS ORIGINAL dela (não cria nada no mês atual)
  // e remove da lista de atrasadas.
  const marcarAtrasadaPaga = async (despesa) => {
    if (somenteLeitura) return;
    await supabase.from("despesas").update({ status: "Pago" }).eq("id", despesa.id);
    setAtrasadas(prev => prev.filter(d => d.id !== despesa.id));
  };

  // Carrega só os fornecedores do mês selecionado — cada parcela aparece
  // no seu próprio mês de vencimento. Antes puxava TODAS as parcelas de
  // todos os meses de uma vez, poluindo a visão do mês atual.
  const carregarFornecedores = async (mes) => {
    const { data } = await supabase.from("despesas").select("*").like("nome", "forn_%").eq("mes", mes).eq("empresa", empresaSel).order("vencimento");
    if (data) setFornecedores(data);
  };

  useEffect(() => { carregarDespesas(mesSel); carregarFornecedores(mesSel); carregarBoletos(); }, [mesSel, empresaSel]);

  const atualizarDespesa = async (id, campo, valor) => {
    if (somenteLeitura) return;
    const update = {}; update[campo] = valor;
    await supabase.from("despesas").update(update).eq("id", id);
    setDespesas(despesas.map(d => d.id === id ? { ...d, [campo]: valor } : d));
  };

  const adicionarDespesa = async (fixa) => {
    if (somenteLeitura) return;
    if (fixa) {
      if (!novaDespesa.trim()) return;
      const { tipo, categoria } = inferirTipoDespesa(novaDespesa.trim());
      const nova = { id: genId(), nome: novaDespesa.trim(), vencimento: null, valor: 0, status: "Em Aberto", mes: mesSel, fixa: true, tipo, categoria, empresa: empresaSel };
      await supabase.from("despesas").insert(nova);
      setDespesas([...despesas, nova]);
      setNovaDespesa("");
    }
  };

  const adicionarVariavel = async () => {
    if (somenteLeitura) return;
    const vf = varForm;
    if (!vf.categoria) return;
    const nome = vf.categoria === "Pagamento Socios" ? "Pgto Sócio — " + vf.socio : vf.categoria;
    const y = mesSel.split("-")[0];
    const m = vf.vencimento_mes || mesSel.split("-")[1];
    const d = vf.vencimento_dia || "01";
    const venc = y + "-" + m + "-" + d;
    const cls = inferirTipoDespesa(nome);
    // Regra do Ale: despesa variável é sempre um gasto já feito na hora,
    // então sai direto como "Pago" (não fica em Em Aberto esperando).
    const nova = { id: genId(), nome, vencimento: venc, valor: Number(vf.valor) || 0, status: "Pago", mes: mesSel, fixa: false, tipo: cls.tipo, categoria: cls.categoria, empresa: empresaSel };
    await supabase.from("despesas").insert(nova);
    setDespesas([...despesas, nova]);
    setVarForm({ categoria: "", socio: "", vencimento_dia: "", vencimento_mes: "", valor: "" });
    setShowAddVar(false);
  };

  const adicionarFornecedor = async (tipo) => {
    if (somenteLeitura) return;
    const ff = fornForm;
    if (!ff.valor) return;
    const y = mesSel.split("-")[0];
    const dia = ff.data || "01";
    const mes = mesSel.split("-")[1];
    const venc = y + "-" + mes + "-" + String(dia).padStart(2, "0");
    let nomeFinal = "forn_" + tipo;
    if (ff.pedido || ff.parcela) nomeFinal = "forn_" + tipo + "|" + (ff.pedido || "") + "|" + (ff.parcela || "");
    const cls = inferirTipoDespesa(nomeFinal);
    const nova = { id: genId(), nome: nomeFinal, vencimento: venc, valor: Number(ff.valor) || 0, status: "Em Aberto", mes: mesSel, fixa: false, tipo: cls.tipo, categoria: cls.categoria, empresa: empresaSel };
    await supabase.from("despesas").insert(nova);
    setFornecedores([...fornecedores, nova]);
    setFornForm({ data: "", pedido: "", parcela: "", valor: "" });
    setShowAddForn("");
  };

  const excluirFornecedor = async (id) => {
    if (somenteLeitura) return;
    await supabase.from("despesas").delete().eq("id", id);
    setFornecedores(fornecedores.filter(f => f.id !== id));
  };

  const atualizarFornecedor = async (id, campo, valor) => {
    if (somenteLeitura) return;
    const update = {}; update[campo] = valor;
    await supabase.from("despesas").update(update).eq("id", id);
    setFornecedores(fornecedores.map(f => f.id === id ? { ...f, [campo]: valor } : f));
  };

  const adicionarMdf = async () => {
    if (somenteLeitura) return;
    const mf = mdfForm;
    if (!mf.dia || !mf.mes || !mf.valor) return;
    const y = mesSel.split("-")[0];
    const venc = y + "-" + mf.mes + "-" + mf.dia;
    const mesKey = y + "-" + mf.mes;
    const nova = { id: genId(), nome: "forn_mdf||" + (mf.qtd || "1") + "|", vencimento: venc, valor: Number(mf.valor) || 0, status: "Em Aberto", mes: mesKey, fixa: false, tipo: "CMV", categoria: "Fornecedores MDF", empresa: empresaSel };
    await supabase.from("despesas").insert(nova);
    setFornecedores([...fornecedores, nova]);
    setMdfForm({ dia: "", mes: "", qtd: "", valor: "" });
    setShowAddForn("");
  };

  const adicionarOutros = async () => {
    if (somenteLeitura) return;
    const of2 = outrosForm;
    if (!of2.dia || !of2.mes || !of2.fornecedor || !of2.valor) return;
    const y = mesSel.split("-")[0];
    const venc = y + "-" + of2.mes + "-" + of2.dia;
    const mesKey = y + "-" + of2.mes;
    const nova = { id: genId(), nome: "forn_outros|" + of2.fornecedor + "||", vencimento: venc, valor: Number(of2.valor) || 0, status: "Em Aberto", mes: mesKey, fixa: false, tipo: "CMV", categoria: "Fornecedores Outros", empresa: empresaSel };
    await supabase.from("despesas").insert(nova);
    setFornecedores([...fornecedores, nova]);
    setOutrosForm({ dia: "", mes: "", fornecedor: "", valor: "" });
    setShowAddForn("");
  };

  const adicionarGondolas = async () => {
    if (somenteLeitura) return;
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
        fixa: false,
        tipo: "CMV",
        categoria: "Fornecedores Gôndolas",
        empresa: empresaSel,
      };
      novas.push(nova);
      await supabase.from("despesas").insert(nova);
    }
    setFornecedores([...fornecedores, ...novas]);
    setGondForm({ documento: "", pagador: "", dia: "", mes: "", qtdParcelas: "1", valor: "" });
    setShowAddForn("");
  };

  const excluirDespesa = async (id) => {
    if (somenteLeitura) return;
    await supabase.from("despesas").delete().eq("id", id);
    setDespesas(despesas.filter(d => d.id !== id));
  };

  const hoje = new Date().toISOString().split("T")[0];
  const fixas = despesas.filter(d => d.fixa);
  // Variáveis = despesas variáveis reais (pagas via extrato bancário ou
  // lançadas à mão). Exclui os lançamentos de fornecedor (nome "forn_..."),
  // que pertencem SÓ à aba Fornecedores e não devem poluir a aba Variáveis.
  const variaveis = despesas.filter(d => !d.fixa && !String(d.nome || "").startsWith("forn_"));
  const current = subTab === "fixas" ? fixas : variaveis;
  const totalFixas = fixas.reduce((s, d) => s + (d.valor || 0), 0);
  const totalVar = variaveis.reduce((s, d) => s + (d.valor || 0), 0);
  const totalForn = fornecedores.reduce((s, f) => s + (f.valor || 0), 0);
  const totalMes = totalFixas + totalVar + totalForn;
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
                  <input disabled={somenteLeitura} value={d.nome} onChange={e => atualizarDespesa(d.id, "nome", e.target.value)} style={{ ...inp, width: "100%", padding: "4px 6px", fontSize: 11, fontWeight: 500, color: COLORS.text, border: "1px solid transparent" }} onFocus={e => e.target.style.borderColor = COLORS.border} onBlur={e => e.target.style.borderColor = "transparent"} />
                </td>
                <td style={{ padding: "4px 4px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                    <select disabled={somenteLeitura} value={d.vencimento ? d.vencimento.split("-")[2] : ""} onChange={e => { const m = d.vencimento ? d.vencimento.split("-")[1] : mesSel.split("-")[1]; const y = mesSel.split("-")[0]; atualizarDespesa(d.id, "vencimento", y + "-" + m + "-" + e.target.value); }} style={{ ...inp, width: 42, padding: "4px 2px", fontSize: 10 }}>
                      <option value="">--</option>
                      {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{i + 1}</option>)}
                    </select>
                    <select disabled={somenteLeitura} value={d.vencimento ? d.vencimento.split("-")[1] : ""} onChange={e => { const dia = d.vencimento ? d.vencimento.split("-")[2] : "01"; const y = mesSel.split("-")[0]; atualizarDespesa(d.id, "vencimento", y + "-" + e.target.value + "-" + dia); }} style={{ ...inp, width: 50, padding: "4px 2px", fontSize: 10 }}>
                      <option value="">--</option>
                      <option value="01">Jan</option><option value="02">Fev</option><option value="03">Mar</option><option value="04">Abr</option><option value="05">Mai</option><option value="06">Jun</option><option value="07">Jul</option><option value="08">Ago</option><option value="09">Set</option><option value="10">Out</option><option value="11">Nov</option><option value="12">Dez</option>
                    </select>
                  </div>
                </td>
                <td style={{ padding: "4px 8px", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                    <span style={{ color: COLORS.textDim, fontSize: 10 }}>R$</span>
                    <input disabled={somenteLeitura} type="number" min="0" step="0.01" value={d.valor || ""} onChange={e => atualizarDespesa(d.id, "valor", Number(e.target.value) || 0)} placeholder="0,00" style={{ ...inp, width: 95, textAlign: "right", color: COLORS.orange, fontWeight: 700, padding: "4px 6px", fontSize: 11 }} />
                  </div>
                </td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>
                  <span style={{ background: sit.color + "20", color: sit.color, padding: "2px 6px", borderRadius: 10, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>{sit.label}</span>
                </td>
                <td style={{ padding: "4px 6px", textAlign: "center" }}>
                  <select disabled={somenteLeitura} value={d.status} onChange={e => atualizarDespesa(d.id, "status", e.target.value)} style={{ background: d.status === "Pago" ? "#10B98120" : "#F59E0B20", color: d.status === "Pago" ? "#10B981" : "#F59E0B", border: `1px solid ${d.status === "Pago" ? "#10B98140" : "#F59E0B40"}`, padding: "2px 6px", borderRadius: 10, fontSize: 9, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: somenteLeitura ? "default" : "pointer", outline: "none" }}>
                    <option value="Em Aberto">Aberto</option>
                    <option value="Pago">Pago</option>
                  </select>
                </td>
                <td style={{ padding: "4px 2px", textAlign: "center" }}>
                  {!somenteLeitura && (
                  <button onClick={() => excluirDespesa(d.id)} style={{ background: "transparent", border: "none", color: COLORS.danger, cursor: "pointer", fontSize: 12, lineHeight: 1, padding: 0 }}>✕</button>
                  )}
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
          <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            {empresaSel === "gondolas_suprema" ? "Gôndolas Suprema LTDA" : "Suprema Instalações LTDA"} · Contas a pagar do mês
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={empresaSel} onChange={e => setEmpresaSel(e.target.value)} style={{ padding: "8px 16px", background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
            <option value="gondolas_suprema">Gôndolas Suprema</option>
            <option value="suprema_instalacoes">Suprema Instalações</option>
          </select>
          <select value={mesSel} onChange={e => setMesSel(e.target.value)} style={{ padding: "8px 16px", background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date(); d.setMonth(d.getMonth() - 6 + i);
              const v = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
              return <option key={v} value={v}>{mesNomes[String(d.getMonth() + 1).padStart(2, "0")]} {d.getFullYear()}</option>;
            })}
          </select>
        </div>
      </div>

      {somenteLeitura && (
        <div style={{ background: "#3B82F612", border: `1px solid #3B82F640`, borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>👁️</span>
          <span style={{ color: "#93C5FD", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Modo somente leitura — você pode consultar o financeiro, mas não editar.</span>
        </div>
      )}

      {/* Cards resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 8, padding: 12 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>Total Geral</div>
          <div style={{ color: COLORS.orange, fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalMes)}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 8, padding: 12 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>Fixas: {fmt(totalFixas)}</div>
          <div style={{ color: COLORS.textMuted, fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>Variáveis: {fmt(totalVar)}</div>
          <div style={{ color: COLORS.textMuted, fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>Fornec.: {fmt(totalForn)}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 8, padding: 12 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>Pago</div>
          <div style={{ color: "#10B981", fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalPago)}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 8, padding: 12 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>Aberto</div>
          <div style={{ color: "#F87171", fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalAberto)}</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        <button onClick={() => setSubTab("fixas")} style={{ background: subTab === "fixas" ? COLORS.orange + "20" : COLORS.card, color: subTab === "fixas" ? COLORS.orange : COLORS.textMuted, border: `1px solid ${subTab === "fixas" ? COLORS.orange + "40" : COLORS.border}`, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Fixas ({fixas.length})</button>
        <button onClick={() => setSubTab("variaveis")} style={{ background: subTab === "variaveis" ? "#8B5CF6" + "20" : COLORS.card, color: subTab === "variaveis" ? "#8B5CF6" : COLORS.textMuted, border: `1px solid ${subTab === "variaveis" ? "#8B5CF640" : COLORS.border}`, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Variáveis ({variaveis.length})</button>
        <button onClick={() => setSubTab("fornecedores")} style={{ background: subTab === "fornecedores" ? "#3B82F6" + "20" : COLORS.card, color: subTab === "fornecedores" ? "#3B82F6" : COLORS.textMuted, border: `1px solid ${subTab === "fornecedores" ? "#3B82F640" : COLORS.border}`, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Fornecedores{boletosAtrasados > 0 && <span style={{ background: COLORS.danger, color: "#fff", padding: "1px 6px", borderRadius: 8, fontSize: 9, marginLeft: 6 }}>{boletosAtrasados} boleto{boletosAtrasados > 1 ? "s" : ""} atrasado{boletosAtrasados > 1 ? "s" : ""}</span>}</button>
      </div>

      {/* Destaque de despesas fixas atrasadas (mês anterior em aberto) */}
      {subTab === "fixas" && atrasadas.length > 0 && (() => {
        const totalAtrasado = atrasadas.reduce((s, d) => s + Number(d.valor || 0), 0);
        const fmtVenc = (s) => {
          if (!s) return "—";
          const partes = String(s).split("-");
          if (partes.length < 3) return s;
          return `${partes[2]}/${partes[1]}/${partes[0]}`;
        };
        const mesAtrasoStr = atrasadas[0]?.mes ? (() => {
          const [a, m] = atrasadas[0].mes.split("-");
          return `${mesNomes[m]} ${a}`;
        })() : "mês anterior";
        return (
          <div style={{ background: "#F8717112", border: `2px solid #F87171`, borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#F87171", fontSize: 15, margin: 0 }}>⚠️ Atrasado de {mesAtrasoStr}</h2>
              <span style={{ color: "#F87171", fontSize: 13, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{atrasadas.length} {atrasadas.length === 1 ? "despesa" : "despesas"} · {Number(totalAtrasado).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {atrasadas.map(d => (
                <div key={d.id} style={{ background: COLORS.bg, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{d.nome}</div>
                    <div style={{ color: "#F87171", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>Venceu em {fmtVenc(d.vencimento)}</div>
                  </div>
                  <div style={{ color: COLORS.orange, fontSize: 13, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
                    {Number(d.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                  {!somenteLeitura && (
                  <button
                    onClick={() => marcarAtrasadaPaga(d)}
                    style={{ background: "#10B981", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 7, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}
                  >
                    ✓ Marcar Pago
                  </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Tabela Fixas/Variáveis */}
      {(subTab === "fixas" || subTab === "variaveis") && (
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: subTab === "fixas" ? COLORS.orange : "#8B5CF6", fontSize: 15, margin: 0 }}>{subTab === "fixas" ? "Despesas Fixas" : "Despesas Variáveis"} — {mesNomes[mesSel.split("-")[1]]}</h2>
        </div>

        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>Carregando...</div>
        ) : current.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: COLORS.textMuted, fontSize: 12 }}>Nenhuma despesa {subTab === "fixas" ? "fixa" : "variável"} neste mês</div>
        ) : renderTabela(current, subTab === "fixas")}

        {/* Adicionar despesa — oculto no modo somente leitura (Zanella) */}
        {!somenteLeitura && (subTab === "fixas" ? (
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
                      <button onClick={() => { setShowAddVar(false); setVarForm({ categoria: "", socio: "", vencimento_dia: "", vencimento_mes: "", valor: "" }); }} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                      <button onClick={() => { adicionarVariavel(); setShowAddVar(false); }} disabled={!varForm.categoria || (varForm.categoria === "Pagamento Socios" && !varForm.socio) || !varForm.valor} style={{ flex: 1, background: !varForm.categoria || (varForm.categoria === "Pagamento Socios" && !varForm.socio) || !varForm.valor ? COLORS.textDim : "#8B5CF6", color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: !varForm.categoria || (varForm.categoria === "Pagamento Socios" && !varForm.socio) || !varForm.valor ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Salvar</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {/* Boletos atrasados de meses anteriores — abaixo das despesas fixas */}
      {subTab === "fixas" && (() => {
        const atrasadosLista = boletos
          .filter(b => b.status === "pendente" && (b.vencimento || "") < hojeISO)
          .sort((a, b) => (a.vencimento || "").localeCompare(b.vencimento || ""));
        if (atrasadosLista.length === 0) return null;
        const totalAtr = atrasadosLista.reduce((s, b) => s + (Number(b.valor) || 0), 0);
        const fmtVenc = (s) => {
          if (!s) return "—";
          const p = String(s).split("-");
          return p.length < 3 ? s : `${p[2]}/${p[1]}/${p[0]}`;
        };
        const diasAtraso = (venc) => {
          if (!venc) return 0;
          const d = Math.floor((new Date(hojeISO) - new Date(venc)) / (1000 * 60 * 60 * 24));
          return d > 0 ? d : 0;
        };
        return (
          <div style={{ background: "#F8717110", border: `2px solid #F87171`, borderRadius: 12, overflow: "hidden", marginTop: 16 }}>
            <div style={{ padding: "12px 18px", borderBottom: `1px solid #F8717140`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#F87171", fontSize: 15, margin: 0 }}>⚠️ Boletos atrasados</h2>
              <span style={{ color: "#F87171", fontSize: 13, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
                {atrasadosLista.length} {atrasadosLista.length === 1 ? "boleto" : "boletos"} · {Number(totalAtr).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <div>
              {atrasadosLista.map((b, i) => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderBottom: i < atrasadosLista.length - 1 ? `1px solid #F8717120` : "none", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{b.beneficiario || "—"}</div>
                    <div style={{ color: "#F87171", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>
                      Venceu em {fmtVenc(b.vencimento)} · {diasAtraso(b.vencimento)} {diasAtraso(b.vencimento) === 1 ? "dia" : "dias"} de atraso
                      {b.observacao ? ` · ${b.observacao}` : ""}
                    </div>
                  </div>
                  <div style={{ color: COLORS.orange, fontSize: 13, fontWeight: 700, fontFamily: "'Playfair Display', serif", whiteSpace: "nowrap" }}>
                    {Number(b.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                  {!somenteLeitura && (
                    <button onClick={() => marcarBoletoPago(b.id)} style={{ background: "#10B981", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 7, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>✓ Marcar Pago</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}


      {/* Bloco BOLETOS — lista única de contas a pagar (substitui os cards agrupados) */}
      {subTab === "fornecedores" && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, overflow: "hidden", marginTop: 16 }}>
          {(() => {
            // Filtro de status (em_aberto = pendente, pagos = pago, todos = tudo)
            const passaFiltro = (b) => {
              if (boletoStatusFiltro === "todos") return true;
              if (boletoStatusFiltro === "pagos") return b.status === "pago";
              return b.status === "pendente"; // em_aberto
            };
            // Cada boleto aparece SÓ no seu mês de vencimento (acompanha o seletor de mês).
            const noMes = (b) => (b.vencimento || "").startsWith(mesSel);
            const lista = boletos.filter(b => noMes(b) && passaFiltro(b)).sort((a, b) => (a.vencimento || "").localeCompare(b.vencimento || ""));
            const vencidos = boletos.filter(b => b.status === "pendente" && b.vencimento && b.vencimento < hojeISO && noMes(b));
            const totalAberto = boletos.filter(b => b.status === "pendente" && noMes(b)).reduce((s, b) => s + (Number(b.valor) || 0), 0);
            return (
              <>
                <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#F59E0B", fontSize: 18, margin: 0 }}>📄 Boletos a Pagar</h2>
                    <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Em aberto: <strong style={{ color: COLORS.orange, fontFamily: "'Playfair Display', serif" }}>{fmt(totalAberto)}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 4, background: COLORS.bg, padding: 3, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
                      {[
                        { v: "em_aberto", lbl: "Em Aberto", col: "#F59E0B" },
                        { v: "pagos",     lbl: "Pagos",     col: "#10B981" },
                        { v: "todos",     lbl: "Todos",     col: COLORS.text },
                      ].map(opt => (
                        <button
                          key={opt.v}
                          onClick={() => setBoletoStatusFiltro(opt.v)}
                          style={{
                            background: boletoStatusFiltro === opt.v ? opt.col + "20" : "transparent",
                            border: boletoStatusFiltro === opt.v ? `1px solid ${opt.col}60` : "1px solid transparent",
                            color: boletoStatusFiltro === opt.v ? opt.col : COLORS.textMuted,
                            padding: "4px 10px", borderRadius: 6,
                            fontSize: 10, fontWeight: 700, cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.4,
                          }}
                        >{opt.lbl}</button>
                      ))}
                    </div>
                    <span style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontStyle: "italic" }}>
                      Manda o boleto pelo chat que o Claude cadastra aqui.
                    </span>
                  </div>
                </div>
                {vencidos.length > 0 && boletoStatusFiltro !== "pagos" && (
                  <div style={{ background: COLORS.danger + "10", borderBottom: `2px solid ${COLORS.danger}30`, padding: "10px 18px" }}>
                    <div style={{ color: COLORS.danger, fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      ⚠️ {vencidos.length} boleto{vencidos.length > 1 ? "s" : ""} vencido{vencidos.length > 1 ? "s" : ""} · total {fmt(vencidos.reduce((s, b) => s + Number(b.valor || 0), 0))}
                    </div>
                  </div>
                )}
                {lista.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
                    Nenhum boleto {boletoStatusFiltro === "pagos" ? "pago" : boletoStatusFiltro === "em_aberto" ? "em aberto" : "cadastrado"} em {mesNomes[mesSel.split("-")[1]]} {mesSel.split("-")[0]}.
                  </div>
                ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <th style={{ padding: "10px 12px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Beneficiário</th>
                        <th style={{ padding: "10px 12px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Vencimento</th>
                        <th style={{ padding: "10px 12px", textAlign: "right", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Valor</th>
                        <th style={{ padding: "10px 12px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Situação</th>
                        <th style={{ padding: "10px 12px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Status</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Código de Barras</th>
                        <th style={{ padding: "10px 12px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map(b => {
                        const pago = b.status === "pago";
                        const cancelado = b.status === "cancelado";
                        const aberto = !pago && !cancelado;
                        const vencido = aberto && b.vencimento && b.vencimento < hojeISO;
                        const venceHoje = aberto && b.vencimento === hojeISO;
                        const diasDelta = b.vencimento ? Math.round((new Date(b.vencimento + "T00:00:00") - new Date(hojeISO + "T00:00:00")) / 86400000) : null;
                        const vencFmt = b.vencimento ? new Date(b.vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "—";
                        const stLabel = pago ? "Pago" : cancelado ? "Cancelado" : vencido ? "Vencida" : "Em aberto";
                        const stCol = pago ? "#10B981" : cancelado ? COLORS.textDim : vencido ? COLORS.danger : "#F59E0B";
                        const editandoVenc = editBoleto.id === b.id && editBoleto.campo === "vencimento";
                        const editandoValor = editBoleto.id === b.id && editBoleto.campo === "valor";
                        return (
                          <tr key={b.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: vencido ? COLORS.danger + "08" : "transparent" }}>
                            <td style={{ padding: "10px 12px", color: COLORS.text, fontWeight: 500 }}>{b.beneficiario}{b.observacao && <div style={{ color: COLORS.textDim, fontSize: 9 }}>{b.observacao}</div>}</td>
                            <td style={{ padding: "10px 12px", textAlign: "center", fontSize: 11 }}>
                              {editandoVenc ? (
                                <input type="date" autoFocus defaultValue={b.vencimento || ""}
                                  onChange={e => atualizarBoletoCampo(b.id, "vencimento", e.target.value)}
                                  onBlur={() => setEditBoleto({ id: null, campo: null })}
                                  onKeyDown={e => { if (e.key === "Escape") setEditBoleto({ id: null, campo: null }); }}
                                  style={{ background: COLORS.bg, border: `1px solid ${COLORS.accent}`, borderRadius: 6, color: COLORS.text, padding: "4px 6px", fontSize: 11, fontFamily: "'DM Sans', sans-serif", outline: "none", colorScheme: "dark" }} />
                              ) : (
                                <span onClick={() => !somenteLeitura && setEditBoleto({ id: b.id, campo: "vencimento" })}
                                  title={somenteLeitura ? "" : "Clique para alterar o vencimento"}
                                  style={{ cursor: somenteLeitura ? "default" : "pointer", color: vencido ? COLORS.danger : COLORS.text, fontWeight: 600, borderBottom: somenteLeitura ? "none" : `1px dashed ${COLORS.textDim}`, paddingBottom: 1 }}>{vencFmt}</span>
                              )}
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "right" }}>
                              {editandoValor ? (
                                <input type="number" min="0" step="0.01" autoFocus defaultValue={Number(b.valor) || 0}
                                  onBlur={e => atualizarBoletoCampo(b.id, "valor", e.target.value)}
                                  onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditBoleto({ id: null, campo: null }); }}
                                  style={{ width: 110, background: COLORS.bg, border: `1px solid ${COLORS.accent}`, borderRadius: 6, color: COLORS.orange, padding: "4px 6px", fontSize: 13, fontWeight: 700, textAlign: "right", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
                              ) : (
                                <span onClick={() => !somenteLeitura && setEditBoleto({ id: b.id, campo: "valor" })}
                                  title={somenteLeitura ? "" : "Clique para alterar o valor"}
                                  style={{ cursor: somenteLeitura ? "default" : "pointer", color: COLORS.orange, fontWeight: 700, fontFamily: "'Playfair Display', serif", fontSize: 13, borderBottom: somenteLeitura ? "none" : `1px dashed ${COLORS.textDim}`, paddingBottom: 1 }}>{fmt(Number(b.valor) || 0)}</span>
                              )}
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              {(pago || cancelado) ? (
                                <span style={{ color: COLORS.textDim, fontSize: 11 }}>—</span>
                              ) : (
                                <span style={{ background: (vencido ? COLORS.danger : "#F59E0B") + "18", color: vencido ? COLORS.danger : "#F59E0B", border: `1px solid ${(vencido ? COLORS.danger : "#F59E0B")}40`, padding: "3px 10px", borderRadius: 12, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>
                                  {vencido ? "Vencido" : "A vencer"}
                                  <span style={{ opacity: 0.75, marginLeft: 4, fontWeight: 600 }}>{venceHoje ? "hoje" : vencido ? `há ${Math.abs(diasDelta)}d` : `em ${diasDelta}d`}</span>
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <span style={{ background: stCol + "20", color: stCol, border: `1px solid ${stCol}40`, padding: "3px 10px", borderRadius: 12, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>{stLabel}</span>
                            </td>
                            <td style={{ padding: "10px 12px", color: COLORS.textDim, fontSize: 9, fontFamily: "monospace", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {b.codigo_barras ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }} title={b.codigo_barras}>{b.codigo_barras}</span>
                                  <button onClick={() => { navigator.clipboard.writeText(b.codigo_barras); }} title="Copiar" style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.accent, padding: "2px 8px", borderRadius: 5, fontSize: 10, cursor: "pointer", flexShrink: 0 }}>📋</button>
                                </div>
                              ) : <span style={{ color: COLORS.textDim }}>—</span>}
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              {somenteLeitura ? (
                                <span style={{ color: COLORS.textDim, fontSize: 10 }}>—</span>
                              ) : !pago ? (
                                <button onClick={() => marcarBoletoPago(b.id)} style={{ background: "#10B98115", border: "1px solid #10B98140", color: "#10B981", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✓ Marcar Pago</button>
                              ) : (
                                <button onClick={() => desmarcarBoletoPago(b.id)} title="Voltar pra pendente" style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "4px 8px", borderRadius: 6, fontSize: 10, cursor: "pointer" }}>↩ Reabrir</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── DRE ───
function DrePage() {
  const [vendas, setVendas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [mesSel, setMesSel] = useState(() => { const n = new Date(); return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0"); });
  const [comparacao, setComparacao] = useState(true);
  // Sprint 2.2 — filtro por empresa. Cada CNPJ tem seu DRE isolado.
  // "todos" = DRE consolidado (soma as duas empresas)
  const [empresaSel, setEmpresaSel] = useState("todos");
  const mesNomes = { "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr", "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago", "09": "Set", "10": "Out", "11": "Nov", "12": "Dez" };
  const mesNomesLongo = { "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril", "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };

  const [boletosAbertos, setBoletosAbertos] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data: orcData } = await supabase.from("orcamentos").select("*").eq("status", "Concluído");
      if (orcData) setVendas(orcData);
      const { data: despData } = await supabase.from("despesas").select("*");
      if (despData) setDespesas(despData);
      const { data: bolData } = await supabase.from("boletos_a_pagar").select("*").eq("status", "pendente");
      if (bolData) setBoletosAbertos(bolData);
      // Receita do DRE = entradas reais dos extratos (regime de caixa — decisão do Ale 02-ago).
      const { data: lancData } = await supabase.from("lancamentos_bancarios").select("*").eq("tipo", "entrada");
      if (lancData) setLancamentos(lancData);
    };
    load();
  }, []);

  // Filtro por empresa aplicado a despesas e vendas
  const filtroEmpresa = (item, campoEmpresa) => {
    if (empresaSel === "todos") return true;
    return (item[campoEmpresa] || "gondolas_suprema") === empresaSel;
  };

  // ─── Receita do DRE em regime de CAIXA (dos extratos) — decisão do Ale 02-ago ───
  // Cada banco pertence a uma empresa. Receita = soma das ENTRADAS de venda reais
  // nos extratos, excluindo transferências entre contas e PIX pessoal do Ale.
  const BANCO_EMPRESA = {
    sicredi_gondolas: "gondolas_suprema",
    mercadopago_gondolas: "gondolas_suprema",
    c6_instalacoes: "suprema_instalacoes",
  };
  const entradaEhReceita = (l) => {
    const obs = (l.observacao || "").toLowerCase();
    if (/transfer|pessoal|não é receita|nao e receita|aporte|empr[eé]stimo/.test(obs)) return false;
    const desc = (l.descricao || "").toUpperCase();
    if (/G[OÔ]NDOLAS SUPREMA|SUPREMA INSTALAC/.test(desc)) return false;
    return true;
  };
  const receitaCaixaMes = (mes) => lancamentos
    .filter(l => l.tipo === "entrada" && l.mes === mes && entradaEhReceita(l))
    .filter(l => empresaSel === "todos" || (BANCO_EMPRESA[l.banco] || "gondolas_suprema") === empresaSel)
    .reduce((s, l) => s + (Number(l.valor) || 0), 0);

  // ─── Sprint 3.3 — Fluxo de caixa projetado 30 dias ───
  const calcularFluxo30d = () => {
    const hoje = new Date();
    const daqui30 = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
    const iso = (d) => d.toISOString().split("T")[0];
    const inRange = (dt) => dt && dt >= iso(hoje) && dt <= iso(daqui30);
    // A Pagar: boletos pendentes + despesas Em Aberto vencendo em 30d
    const boletos30d = boletosAbertos.filter(b => inRange(b.vencimento)).reduce((s, b) => s + (Number(b.valor) || 0), 0);
    const despesas30d = despesas
      .filter(d => d.status === "Em Aberto" && !d.tipo?.includes("APORTE") && !d.tipo?.includes("FINANCIAMENTO"))
      .filter(d => filtroEmpresa(d, "empresa"))
      .filter(d => inRange(d.vencimento))
      .reduce((s, d) => s + (Number(d.valor) || 0), 0);
    // A Receber: vendas concluídas com data_pagamento futura (que ainda não caiu)
    const receber30d = vendas
      .filter(o => !isOrcamentoRsOculto(o))
      .filter(o => filtroEmpresa(o, "venda_empresa_recebedora"))
      .filter(o => o.data_pagamento && inRange(o.data_pagamento.slice(0, 10)))
      .reduce((s, o) => {
        if (o.venda_empresa_recebedora === "suprema_instalacoes") {
          return s + (Number(o.valor_recebido != null ? o.valor_recebido : (o.comissao || 0)) || 0);
        }
        return s + (Number(o.total) || 0);
      }, 0);
    return { aPagar: boletos30d + despesas30d, aReceber: receber30d, saldo: receber30d - (boletos30d + despesas30d) };
  };

  // ─── Sprint 3.1/3.2 — Indicadores fiscais e contábeis ───
  // RBT12 = Receita Bruta acumulada dos últimos 12 meses (base do DAS Simples Nacional).
  // Calculamos somando as vendas concluídas dos 12 meses anteriores ao mês selecionado.
  const calcularRBT12 = (mesRef) => {
    const [yRef, mRef] = mesRef.split("-").map(Number);
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      const d = new Date(yRef, mRef - 1 - i, 1);
      const mesStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      const vendasM = vendas.filter(o => {
        if (isOrcamentoRsOculto(o)) return false;
        if (!filtroEmpresa(o, "venda_empresa_recebedora")) return false;
        const ref = o.data_entrega || o.data;
        if (!ref) return false;
        const dd = new Date(ref);
        return (dd.getFullYear() + "-" + String(dd.getMonth() + 1).padStart(2, "0")) === mesStr;
      });
      total += vendasM.reduce((s, o) => {
        if (o.venda_empresa_recebedora === "suprema_instalacoes") {
          return s + (Number(o.valor_recebido != null ? o.valor_recebido : (o.comissao || 0)) || 0);
        }
        return s + (Number(o.total) || 0);
      }, 0);
    }
    return total;
  };
  // Tabela Anexo I (Comércio) — Gôndolas Suprema. 2026.
  // [limite_faixa, aliquota_nominal, deducao]
  const FAIXAS_ANEXO_I = [
    [180000,   0.04,  0],
    [360000,   0.073, 5940],
    [720000,   0.095, 13860],
    [1800000,  0.107, 22500],
    [3600000,  0.143, 87300],
    [4800000,  0.190, 378000],
  ];
  const faixaSimples = (rbt12) => {
    for (let i = 0; i < FAIXAS_ANEXO_I.length; i++) {
      if (rbt12 <= FAIXAS_ANEXO_I[i][0]) return { faixa: i + 1, ...{ limite: FAIXAS_ANEXO_I[i][0], aliqNom: FAIXAS_ANEXO_I[i][1], deducao: FAIXAS_ANEXO_I[i][2] } };
    }
    return { faixa: 6, limite: 4800000, aliqNom: 0.19, deducao: 378000, excedeu: true };
  };
  const aliqEfetiva = (rbt12) => {
    if (rbt12 <= 0) return 0;
    const f = faixaSimples(rbt12);
    return Math.max(0, (rbt12 * f.aliqNom - f.deducao) / rbt12);
  };

  // Receita usa data_entrega (regime de competencia). Fallback: data do orcamento.
  // Orcamentos RS-ocultos do Ale ficam fora da DRE consolidada.
  const calcularMes = (mes) => {
    const vendasMes = vendas.filter(o => {
      if (isOrcamentoRsOculto(o)) return false;
      if (!filtroEmpresa(o, "venda_empresa_recebedora")) return false;
      const ref = o.data_entrega || o.data;
      if (!ref) return false;
      const d = new Date(ref);
      return (d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")) === mes;
    });
    const noMes = (d) => d.vencimento && d.vencimento.startsWith(mes);
    const empOk = (d) => filtroEmpresa(d, "empresa");
    const porTipo = (tipo) => despesas.filter(d => d.tipo === tipo && noMes(d) && empOk(d)).reduce((s, d) => s + (Number(d.valor) || 0), 0);
    const itensTipo = (tipo) => despesas.filter(d => d.tipo === tipo && noMes(d) && empOk(d) && (Number(d.valor) || 0) > 0).map(d => ({ nome: d.nome, categoria: d.categoria || "—", valor: Number(d.valor) || 0 }));

    // Receita bruta considera o "valor recebido em conta":
    // - Suprema Instalações → valor_recebido (default = comissão)
    // - Gôndolas Suprema → valor_recebido (quando definido, ex: só entrada quando boleto parcelado
    //   é pago direto pra RRE); senão total da venda
    const valorReceitaConta = (o) => {
      if (o.venda_empresa_recebedora === "suprema_instalacoes") {
        return Number(o.valor_recebido != null ? o.valor_recebido : (o.comissao || 0)) || 0;
      }
      return Number(o.valor_recebido != null ? o.valor_recebido : (o.total || 0)) || 0;
    };
    // Receita = entradas reais dos extratos (caixa). Fallback pro modo antigo
    // (valor_recebido das vendas) quando o mês não tem extrato lançado.
    const temExtrato = lancamentos.some(l => l.mes === mes && (empresaSel === "todos" || (BANCO_EMPRESA[l.banco] || "gondolas_suprema") === empresaSel));
    const receitaBruta = temExtrato
      ? receitaCaixaMes(mes)
      : vendasMes.reduce((s, o) => s + valorReceitaConta(o), 0);
    const comissoes    = vendasMes.reduce((s, o) => s + (Number(o.comissao) || 0), 0);
    // Vendas sem data_entrega: caem no mês do orçamento por fallback, mas contabilmente
    // são "sem competência definida" — flaggamos pra visibilidade.
    const vendasSemEntrega = vendasMes.filter(o => !o.data_entrega).length;
    // Deduções: só impostos sobre venda (ICMS, ISS, PIS/COFINS, devoluções).
    // DAS NÃO entra aqui — é tributo único que substitui vários, vai como Provisão depois do EBIT.
    const deducoes = porTipo("DEDUCAO_RECEITA");
    const receitaLiquida = receitaBruta - deducoes;
    const cmv = porTipo("CMV");
    const lucroBruto = receitaLiquida - cmv;
    const despVendas    = porTipo("DESPESA_VENDAS") + comissoes;
    const despAdm       = porTipo("DESPESA_ADM");
    const despLogistica = porTipo("DESPESA_LOGISTICA");
    const despGeral     = porTipo("DESPESA_GERAL");
    const totalOp = despVendas + despAdm + despLogistica + despGeral;
    const ebit = lucroBruto - totalOp;
    const recFin  = porTipo("RECEITA_FINANCEIRA");
    const despFin = porTipo("DESPESA_FINANCEIRA");
    const resultadoFin = recFin - despFin;
    const lair = ebit + resultadoFin; // Lucro Antes do IR (LAIR)
    // Provisão de Tributos (DAS + IRPJ + CSLL) — depois do LAIR, antes do Lucro Líquido
    const provisaoTributos = porTipo("PROVISAO_TRIBUTOS");
    const lucroLiquido = lair - provisaoTributos;
    // Linhas informativas (não afetam o resultado, saem do PL / fluxo caixa)
    const retiradaLucro = porTipo("RETIRADA_LUCRO");
    const aporteSocio   = porTipo("APORTE_SOCIO");
    const financiamento = porTipo("FINANCIAMENTO");
    return {
      mes,
      receitaBruta, qtdVendas: vendasMes.length, vendasSemEntrega,
      deducoes, receitaLiquida,
      cmv, lucroBruto,
      margemBruta: receitaBruta > 0 ? lucroBruto / receitaBruta * 100 : 0,
      despVendas, despAdm, despLogistica, despGeral, totalOp, comissoes,
      ebit, margemOp: receitaBruta > 0 ? ebit / receitaBruta * 100 : 0,
      recFin, despFin, resultadoFin,
      lair,
      provisaoTributos,
      lucroLiquido, margemLiq: receitaBruta > 0 ? lucroLiquido / receitaBruta * 100 : 0,
      retiradaLucro, aporteSocio, financiamento,
      itens: {
        DEDUCAO_RECEITA:    itensTipo("DEDUCAO_RECEITA"),
        CMV:                itensTipo("CMV"),
        DESPESA_VENDAS:     itensTipo("DESPESA_VENDAS"),
        DESPESA_ADM:        itensTipo("DESPESA_ADM"),
        DESPESA_LOGISTICA:  itensTipo("DESPESA_LOGISTICA"),
        DESPESA_GERAL:      itensTipo("DESPESA_GERAL"),
        DESPESA_FINANCEIRA: itensTipo("DESPESA_FINANCEIRA"),
        RECEITA_FINANCEIRA: itensTipo("RECEITA_FINANCEIRA"),
        PROVISAO_TRIBUTOS:  itensTipo("PROVISAO_TRIBUTOS"),
        RETIRADA_LUCRO:     itensTipo("RETIRADA_LUCRO"),
        APORTE_SOCIO:       itensTipo("APORTE_SOCIO"),
        FINANCIAMENTO:      itensTipo("FINANCIAMENTO"),
      },
    };
  };

  const offsetMes = (m, off) => {
    const [y, mm] = m.split("-").map(Number);
    const d = new Date(y, mm - 1 + off, 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  };
  const mesesParaComparar = comparacao ? [offsetMes(mesSel, -2), offsetMes(mesSel, -1), mesSel] : [mesSel];
  const dados = mesesParaComparar.map(calcularMes);
  const dadosAtual = dados[dados.length - 1];
  const numCols = dados.length;
  const colTemplate = "1.6fr " + Array(numCols).fill("1fr").join(" ");
  const fmtNeg = (v) => v < 0 ? "- " + fmt(Math.abs(v)) : fmt(v);

  const linha = ({ label, valores, bold, color, indent, bg, italic, sign }) => (
    <div style={{ display: "grid", gridTemplateColumns: colTemplate, alignItems: "center", padding: indent ? "5px 14px 5px 30px" : "8px 14px", background: bg || "transparent", borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ color: bold ? COLORS.white : (italic ? COLORS.textDim : COLORS.textMuted), fontSize: bold ? 12 : (italic ? 10 : 11), fontWeight: bold ? 700 : 400, fontFamily: "'DM Sans', sans-serif", fontStyle: italic ? "italic" : "normal" }}>{label}</span>
      {valores.map((v, i) => {
        const isLast = i === valores.length - 1;
        return (
          <span key={i} style={{ textAlign: "right", color: color || (v >= 0 ? COLORS.text : COLORS.danger), fontSize: bold ? 13 : (italic ? 10 : 11), fontWeight: bold ? 800 : 600, fontFamily: "'Playfair Display', serif", opacity: isLast ? 1 : 0.55 }}>
            {sign === "minus" ? "(-) " : ""}{fmtNeg(v)}
          </span>
        );
      })}
    </div>
  );
  const linhaPct = (label, pcts, color) => (
    <div style={{ display: "grid", gridTemplateColumns: colTemplate, padding: "3px 14px" }}>
      <span style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      {pcts.map((p, i) => (
        <span key={i} style={{ textAlign: "right", color: color || COLORS.textMuted, fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", opacity: i === pcts.length - 1 ? 1 : 0.55 }}>{p.toFixed(1)}%</span>
      ))}
    </div>
  );
  const separator = (label, color) => (
    <div style={{ padding: "10px 14px", background: (color || COLORS.orange) + "10", borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ color: color || COLORS.orange, fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
    </div>
  );
  const get = (campo) => dados.map(d => d[campo]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 4px" }}>DRE</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            {empresaSel === "todos" ? "Consolidado (Gôndolas + Instalações)" : empresaSel === "gondolas_suprema" ? "Gôndolas Suprema LTDA" : "Suprema Instalações LTDA"}
            {" · "}{comparacao ? "comparação 3 meses" : "mês único"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={empresaSel} onChange={e => setEmpresaSel(e.target.value)} style={{ padding: "8px 16px", background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
            <option value="todos">🏢 Consolidado</option>
            <option value="gondolas_suprema">Gôndolas Suprema</option>
            <option value="suprema_instalacoes">Suprema Instalações</option>
          </select>
          <button onClick={() => setComparacao(!comparacao)} style={{ background: comparacao ? COLORS.orange + "20" : COLORS.card, border: `1px solid ${comparacao ? COLORS.orange + "60" : COLORS.border}`, color: comparacao ? COLORS.orange : COLORS.textMuted, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
            {comparacao ? "Comparação 3M" : "Mês único"}
          </button>
          <select value={mesSel} onChange={e => setMesSel(e.target.value)} style={{ padding: "8px 16px", background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
            {Array.from({ length: 18 }, (_, i) => {
              const d = new Date(); d.setMonth(d.getMonth() - 9 + i);
              const v = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
              return <option key={v} value={v}>{mesNomesLongo[String(d.getMonth() + 1).padStart(2, "0")]} {d.getFullYear()}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Sprint 3.3 — Fluxo de caixa projetado 30 dias */}
      {(() => {
        const fluxo = calcularFluxo30d();
        return (
          <div style={{ background: "#3B82F608", border: `1px solid #3B82F630`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>💰 A Receber (próximos 30 dias)</div>
                <div style={{ color: "#10B981", fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(fluxo.aReceber)}</div>
                <div style={{ color: COLORS.textDim, fontSize: 9, marginTop: 2 }}>Vendas concluídas com pagamento futuro</div>
              </div>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>💸 A Pagar (próximos 30 dias)</div>
                <div style={{ color: COLORS.danger, fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(fluxo.aPagar)}</div>
                <div style={{ color: COLORS.textDim, fontSize: 9, marginTop: 2 }}>Boletos + Despesas em aberto</div>
              </div>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>📊 Saldo Projetado 30d</div>
                <div style={{ color: fluxo.saldo >= 0 ? "#10B981" : COLORS.danger, fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fluxo.saldo >= 0 ? "+" : ""}{fmt(fluxo.saldo)}</div>
                <div style={{ color: COLORS.textDim, fontSize: 9, marginTop: 2 }}>
                  {fluxo.saldo >= 0 ? "Sobra prevista" : "⚠️ Falta prevista"}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Sprint 3.1 — Card de indicadores fiscais (só faz sentido pra Gôndolas ou Consolidado) */}
      {(() => {
        const rbt12 = calcularRBT12(mesSel);
        const f = faixaSimples(rbt12);
        const aliqEf = aliqEfetiva(rbt12);
        const dasProvisMes = dadosAtual.receitaBruta * aliqEf;
        const perFaixa = f.limite > 0 ? (rbt12 / f.limite) * 100 : 0;
        const dasPagoMes = dadosAtual.provisaoTributos;
        const diffDAS = dasProvisMes - dasPagoMes;
        const alertaSublimite = rbt12 > 3200000;
        const alertaTeto = rbt12 > 4300000;
        // Retirada de lucros > R$50k na PF (regra 2026, retenção 10% na fonte)
        const retiradaMes = dadosAtual.retiradaLucro;
        const alertaRetencao = retiradaMes > 50000;
        // Pró-labore pago no mês?
        const proLaboreItens = (dadosAtual.itens.DESPESA_ADM || []).filter(i => (i.categoria || "").toLowerCase().includes("pró-labore") || (i.categoria || "").toLowerCase().includes("pro-labore"));
        const proLaborePago = proLaboreItens.reduce((s, i) => s + (i.valor || 0), 0);
        const alertaProLabore = proLaborePago === 0 && dadosAtual.receitaBruta > 0;
        return (
          <div style={{ background: "#F59E0B08", border: `1px solid #F59E0B30`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>RBT12 · últimos 12 meses</div>
                <div style={{ color: alertaTeto ? COLORS.danger : (alertaSublimite ? "#F59E0B" : COLORS.text), fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(rbt12)}</div>
                <div style={{ color: COLORS.textDim, fontSize: 9, marginTop: 2 }}>{perFaixa.toFixed(1)}% da faixa {f.faixa} (limite {fmt(f.limite)})</div>
              </div>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Alíquota Efetiva Simples</div>
                <div style={{ color: "#F59E0B", fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{(aliqEf * 100).toFixed(2)}%</div>
                <div style={{ color: COLORS.textDim, fontSize: 9, marginTop: 2 }}>Anexo I (Comércio) · faixa {f.faixa}</div>
              </div>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>DAS provisionado do mês</div>
                <div style={{ color: Math.abs(diffDAS) > 200 ? "#F59E0B" : "#10B981", fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(dasProvisMes)}</div>
                <div style={{ color: COLORS.textDim, fontSize: 9, marginTop: 2 }}>
                  Pago: {fmt(dasPagoMes)}
                  {Math.abs(diffDAS) > 200 && ` (Δ ${diffDAS > 0 ? "+" : ""}${fmt(diffDAS)})`}
                </div>
              </div>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Pró-labore do mês</div>
                <div style={{ color: alertaProLabore ? COLORS.danger : "#10B981", fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(proLaborePago)}</div>
                <div style={{ color: COLORS.textDim, fontSize: 9, marginTop: 2 }}>
                  {alertaProLabore ? "⚠️ Não pago ainda" : proLaborePago > 0 ? "OK" : "Sem receita no mês"}
                </div>
              </div>
            </div>
            {(alertaSublimite || alertaTeto || alertaRetencao || alertaProLabore) && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                {alertaTeto && <div style={{ color: COLORS.danger, fontSize: 11, fontWeight: 700 }}>🚨 RBT12 próximo do TETO do Simples (R$ 4,8mi) — planejar transição pra Lucro Presumido</div>}
                {alertaSublimite && !alertaTeto && <div style={{ color: "#F59E0B", fontSize: 11, fontWeight: 700 }}>⚠️ RBT12 se aproxima do sublimite estadual (R$ 3,6mi) — ICMS/ISS podem sair do DAS</div>}
                {alertaRetencao && <div style={{ color: "#F59E0B", fontSize: 11, fontWeight: 700 }}>⚠️ Distribuição de Lucros do mês ({fmt(retiradaMes)}) &gt; R$ 50k — retenção 10% na fonte (regra 2026)</div>}
                {alertaProLabore && <div style={{ color: COLORS.danger, fontSize: 11, fontWeight: 700 }}>⚠️ Pró-labore não pago neste mês — pagar antes de distribuir lucros (evita reclassificação pelo Fisco)</div>}
              </div>
            )}
          </div>
        );
      })()}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4 }}>Receita Líquida</div>
          <div style={{ color: COLORS.orange, fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(dadosAtual.receitaLiquida)}</div>
          <div style={{ color: COLORS.textDim, fontSize: 9, marginTop: 2 }}>{dadosAtual.qtdVendas} vendas</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4 }}>Lucro Bruto</div>
          <div style={{ color: dadosAtual.lucroBruto >= 0 ? "#10B981" : COLORS.danger, fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmtNeg(dadosAtual.lucroBruto)}</div>
          <div style={{ color: COLORS.textDim, fontSize: 9, marginTop: 2 }}>Margem {dadosAtual.margemBruta.toFixed(1)}%</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4 }}>EBIT (Operacional)</div>
          <div style={{ color: dadosAtual.ebit >= 0 ? "#3B82F6" : COLORS.danger, fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmtNeg(dadosAtual.ebit)}</div>
          <div style={{ color: COLORS.textDim, fontSize: 9, marginTop: 2 }}>Margem {dadosAtual.margemOp.toFixed(1)}%</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${dadosAtual.lucroLiquido >= 0 ? "#10B98140" : COLORS.danger + "40"}`, borderRadius: 10, padding: 14 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4 }}>Lucro Líquido</div>
          <div style={{ color: dadosAtual.lucroLiquido >= 0 ? "#10B981" : COLORS.danger, fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmtNeg(dadosAtual.lucroLiquido)}</div>
          <div style={{ color: COLORS.textDim, fontSize: 9, marginTop: 2 }}>Margem {dadosAtual.margemLiq.toFixed(1)}%</div>
        </div>
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: colTemplate, padding: "12px 14px", background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ color: COLORS.white, fontSize: 13, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>DRE</span>
          {dados.map(d => {
            const [y, mm] = d.mes.split("-");
            const isAtual = d.mes === mesSel;
            return (
              <span key={d.mes} style={{ textAlign: "right", color: isAtual ? COLORS.orange : COLORS.textMuted, fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {mesNomes[mm]}/{y.slice(2)}{isAtual ? " ★" : ""}
              </span>
            );
          })}
        </div>

        {separator("Receita", "#10B981")}
        {linha({ label: "Receita Bruta de Vendas", valores: get("receitaBruta"), bold: true, color: COLORS.orange })}
        {linha({ label: "Vendas concluídas no período (qtd)", valores: get("qtdVendas"), italic: true, indent: true, color: COLORS.textDim })}
        {dados.some(d => d.vendasSemEntrega > 0) && linha({ label: "⚠️ Vendas sem data de entrega (fallback = data do orçamento)", valores: get("vendasSemEntrega"), italic: true, indent: true, color: "#F59E0B" })}

        {separator("(-) Deduções da Receita", "#F59E0B")}
        {linha({ label: "Impostos sobre vendas (ICMS, ISS, PIS/COFINS)", valores: dados.map(d => -d.deducoes), color: COLORS.danger, indent: true, sign: "minus" })}
        {linha({ label: "= Receita Líquida", valores: get("receitaLiquida"), bold: true, color: COLORS.text })}

        {separator("(-) Custo dos Produtos Vendidos (CMV)", "#F87171")}
        {linha({ label: "Fornecedores + Mão-de-obra produção", valores: dados.map(d => -d.cmv), color: COLORS.danger, indent: true, sign: "minus" })}
        {linha({ label: "= Lucro Bruto", valores: get("lucroBruto"), bold: true, color: dadosAtual.lucroBruto >= 0 ? "#10B981" : COLORS.danger, bg: dadosAtual.lucroBruto >= 0 ? "#10B98108" : COLORS.danger + "08" })}
        {linhaPct("Margem Bruta", dados.map(d => d.margemBruta), dadosAtual.lucroBruto >= 0 ? "#10B981" : COLORS.danger)}

        {separator("(-) Despesas Operacionais", "#8B5CF6")}
        {linha({ label: "Despesas com Vendas (incl. comissões)", valores: dados.map(d => -d.despVendas), color: COLORS.danger, indent: true, sign: "minus" })}
        {linha({ label: "Despesas Administrativas", valores: dados.map(d => -d.despAdm), color: COLORS.danger, indent: true, sign: "minus" })}
        {linha({ label: "Despesas Logísticas", valores: dados.map(d => -d.despLogistica), color: COLORS.danger, indent: true, sign: "minus" })}
        {dados.some(d => d.despGeral > 0) && linha({ label: "Despesas Gerais (a classificar)", valores: dados.map(d => -d.despGeral), color: COLORS.danger, indent: true, sign: "minus", italic: true })}
        {linha({ label: "(=) Total Despesas Operacionais", valores: dados.map(d => -d.totalOp), bold: true, color: COLORS.danger })}

        {separator("Resultado Operacional", "#3B82F6")}
        {linha({ label: "EBIT (antes do Resultado Financeiro)", valores: get("ebit"), bold: true, color: dadosAtual.ebit >= 0 ? "#3B82F6" : COLORS.danger, bg: dadosAtual.ebit >= 0 ? "#3B82F608" : COLORS.danger + "08" })}
        {linhaPct("Margem Operacional", dados.map(d => d.margemOp), dadosAtual.ebit >= 0 ? "#3B82F6" : COLORS.danger)}

        {separator("(+/-) Resultado Financeiro", "#EC4899")}
        {dados.some(d => d.recFin > 0) && linha({ label: "Receitas financeiras", valores: get("recFin"), color: "#10B981", indent: true })}
        {dados.some(d => d.despFin > 0) && linha({ label: "Despesas financeiras", valores: dados.map(d => -d.despFin), color: COLORS.danger, indent: true, sign: "minus" })}
        {linha({ label: "(=) Resultado Financeiro Líquido", valores: get("resultadoFin"), color: COLORS.textMuted, indent: true })}
        {linha({ label: "= LAIR (Lucro Antes IR/CSLL)", valores: get("lair"), bold: true, color: dadosAtual.lair >= 0 ? COLORS.text : COLORS.danger })}

        {separator("(-) Provisão de Tributos", "#F59E0B")}
        {linha({ label: "Simples Nacional (DAS) / IRPJ / CSLL", valores: dados.map(d => -d.provisaoTributos), color: COLORS.danger, indent: true, sign: "minus" })}

        {separator("Lucro Líquido", dadosAtual.lucroLiquido >= 0 ? "#10B981" : "#F87171")}
        <div style={{ display: "grid", gridTemplateColumns: colTemplate, alignItems: "center", padding: "16px 14px", background: dadosAtual.lucroLiquido >= 0 ? "#10B98112" : COLORS.danger + "12" }}>
          <span style={{ color: COLORS.white, fontSize: 14, fontWeight: 800, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>Lucro Líquido</span>
          {dados.map((d, i) => {
            const isLast = i === dados.length - 1;
            return (
              <span key={i} style={{ textAlign: "right", color: d.lucroLiquido >= 0 ? "#10B981" : COLORS.danger, fontSize: isLast ? 18 : 14, fontWeight: 800, fontFamily: "'Playfair Display', serif", opacity: isLast ? 1 : 0.55 }}>
                {fmtNeg(d.lucroLiquido)}
              </span>
            );
          })}
        </div>
        {linhaPct("Margem Líquida", dados.map(d => d.margemLiq), dadosAtual.lucroLiquido >= 0 ? "#10B981" : COLORS.danger)}

        {/* Movimentações informativas — saem do PL / Fluxo de Caixa, não afetam o resultado */}
        {(dados.some(d => d.retiradaLucro > 0) || dados.some(d => d.aporteSocio > 0) || dados.some(d => d.financiamento > 0)) && (
          <>
            {separator("Movimentações do Patrimônio (informativo)", "#94A3B8")}
            {dados.some(d => d.aporteSocio > 0) && linha({ label: "Aporte de Sócio (entrada de PF)", valores: get("aporteSocio"), color: "#10B981", indent: true, italic: true })}
            {dados.some(d => d.retiradaLucro > 0) && linha({ label: "Distribuição de Lucros / Retirada de Sócio", valores: dados.map(d => -d.retiradaLucro), color: "#94A3B8", indent: true, sign: "minus", italic: true })}
            {dados.some(d => d.financiamento > 0) && linha({ label: "Empréstimos / Financiamentos recebidos", valores: get("financiamento"), color: "#94A3B8", indent: true, italic: true })}
          </>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 16, marginBottom: 12 }}>Detalhamento — {mesNomesLongo[mesSel.split("-")[1]]} {mesSel.split("-")[0]}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {TIPOS_DESPESA.filter(t => (dadosAtual.itens[t.key] || []).length > 0).map(t => (
            <div key={t.key} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14 }}>
              <div style={{ color: t.color, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{t.label}</div>
              {(dadosAtual.itens[t.key] || []).map((it, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < dadosAtual.itens[t.key].length - 1 ? `1px solid ${COLORS.border}40` : "none" }}>
                  <div>
                    <div style={{ color: COLORS.text, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{it.nome}</div>
                    <div style={{ color: COLORS.textDim, fontSize: 9 }}>{it.categoria}</div>
                  </div>
                  <span style={{ color: COLORS.textMuted, fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{fmt(it.valor)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NOTAS FISCAIS ───
function NFPage({ user }) {
  const [vendas, setVendas] = useState([]);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consultando, setConsultando] = useState(null);
  // Filtro de mês — default = mês atual. Pode trocar pra "all" (todos os meses)
  // ou um mês específico pelo dropdown.
  const [mesSel, setMesSel] = useState(() => {
    const n = new Date();
    return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0");
  });
  // Filtro de status venda — espelha o que foi marcado na ADM (Em Aberto / Pago).
  // Default "pagas" pra abrir já mostrando o que foi recebido (a NF normalmente
  // é emitida pra venda já paga). Pode trocar pra "todas" ou "em_aberto".
  const [filtroPag, setFiltroPag] = useState("pagas");
  // Edição manual do valor da NF antes de emitir (lápis no modal).
  // editandoValor = true mostra input number; valorEditado é o texto digitado.
  // Default = valor padrão (total pra Gôndolas, comissão pra Instalações).
  const [editandoValor, setEditandoValor] = useState(false);
  const [valorEditado, setValorEditado] = useState("");
  // Edição inline do "Valor Recebido" direto na tabela (lápis na linha).
  // editandoRecebidoId = id da venda sendo editada; valorRecebidoEdit = texto digitado.
  const [editandoRecebidoId, setEditandoRecebidoId] = useState(null);
  const [valorRecebidoEdit, setValorRecebidoEdit] = useState("");

  // Helper: retorna o valor recebido salvo (ou comissão como default se null)
  const getValorRecebido = (o) => {
    if (o.valor_recebido != null) return Number(o.valor_recebido);
    return Number(o.comissao || 0);
  };

  // Salva o valor_recebido no banco
  const salvarValorRecebido = async (orderId, valor) => {
    const v = Number(valor);
    if (isNaN(v) || v < 0) return;
    await supabase.from("orcamentos").update({ valor_recebido: v }).eq("id", orderId);
    setVendas(prev => prev.map(o => o.id === orderId ? { ...o, valor_recebido: v } : o));
    setEditandoRecebidoId(null);
    setValorRecebidoEdit("");
  };
  // Estados do fluxo de emissão (igual ao do AdminPage antigo)
  const [confirmEmitir, setConfirmEmitir] = useState(null);
  const [emitenteSel, setEmitenteSel] = useState(null); // null | 'gondolas' | 'instalacoes'
  const [emitindoNfe, setEmitindoNfe] = useState(null);
  const [nfeResult, setNfeResult] = useState(null);
  const [cancelandoNfe, setCancelandoNfe] = useState(null);
  const [cancelJustificativa, setCancelJustificativa] = useState("");
  const [cancelRef, setCancelRef] = useState("");
  // NFS-e da Suprema Instalações: tomador é RRE (padrão) ou customizado
  const [tomadorTipo, setTomadorTipo] = useState("rre"); // 'rre' | 'custom'
  const TOMADOR_VAZIO = { cnpj: "", razao_social: "", logradouro: "", numero: "", bairro: "", codigo_municipio: "", uf: "", cep: "" };
  const [tomadorCustom, setTomadorCustom] = useState(TOMADOR_VAZIO);
  // Texto livre da OBS — anexado à discriminação automática "NF X - Cliente Y"
  const [observacaoNfse, setObservacaoNfse] = useState("");
  // IE editável no modal de emissão NF-e Gôndolas — sincroniza com o orçamento ao emitir
  const [ieEditNfe, setIeEditNfe] = useState("");
  const [salvandoIe, setSalvandoIe] = useState(false);
  // Envio por transportadora — checkbox no modal Gôndolas Suprema abre modal
  // dedicado pra preencher dados exigidos pela SEFAZ (grupo Transporte da NFe).
  const [usarTransportadora, setUsarTransportadora] = useState(false);
  const [transportadoraModalOpen, setTransportadoraModalOpen] = useState(false);
  const TRANSPORTADORA_VAZIA = { nome: "", documento: "", ie: "", endereco: "", municipio: "", uf: "", frete_modalidade: "0", quantidade: "1", peso_bruto: "", peso_liquido: "" };
  const [transportadoraData, setTransportadoraData] = useState(TRANSPORTADORA_VAZIA);
  const [buscandoCnpjTransp, setBuscandoCnpjTransp] = useState(false);
  const [erroTransp, setErroTransp] = useState("");
  // Carta de Correção Eletrônica (CC-e) — corrige NF-e já autorizada sem
  // precisar cancelar (ex: esqueceu de preencher volumes/transportador).
  const [cartaCorrecaoRef, setCartaCorrecaoRef] = useState(null);
  const [correcaoTexto, setCorrecaoTexto] = useState("");
  const [enviandoCorrecao, setEnviandoCorrecao] = useState(false);
  const [correcaoResult, setCorrecaoResult] = useState(null);
  const buscarCnpjTransportadora = async () => {
    const docLimpo = (transportadoraData.documento || "").replace(/\D/g, "");
    if (docLimpo.length !== 14) { setErroTransp("CNPJ deve ter 14 dígitos para a consulta automática."); return; }
    setErroTransp(""); setBuscandoCnpjTransp(true);
    try {
      const resp = await fetch(`/api/consultar-cnpj/${docLimpo}`, { cache: "no-store" });
      const d = await resp.json().catch(() => ({}));
      if (!resp.ok || d?.success === false) {
        setErroTransp(resp.status === 404 ? "CNPJ não encontrado na Receita." : (d?.mensagem || "Falha ao consultar CNPJ."));
        return;
      }
      setTransportadoraData(prev => ({
        ...prev,
        nome: prev.nome.trim() || d.razao_social || d.nome_fantasia || "",
        endereco: prev.endereco.trim() || d.logradouro || "",
        municipio: prev.municipio.trim() || d.municipio || "",
        uf: prev.uf.trim() || d.uf || "",
      }));
      setErroTransp("A Receita não retorna Inscrição Estadual — preencha manualmente se souber.");
    } catch (e) {
      setErroTransp("Falha de rede ao consultar o CNPJ.");
    } finally {
      setBuscandoCnpjTransp(false);
    }
  };
  const mesNomes = { "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril", "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto", "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro" };

  // Só admin/gestor (Ale e Zanella) podem emitir/cancelar NF
  const role = user?.role || (user?.isAdmin ? "admin" : "vendedor");
  const podeEmitir = role === "admin" || role === "gestor";

  // Carrega vendas concluídas + notas emitidas em paralelo
  const carregarTudo = async () => {
    setLoading(true);
    const [v, n] = await Promise.all([
      supabase.from("orcamentos").select("*").eq("status", "Concluído").order("data", { ascending: false }),
      supabase.from("notas_fiscais").select("*").order("data_emissao", { ascending: false }),
    ]);
    if (v.data) {
      const visiveis = v.data.filter(o => !isOrcamentoRsOculto(o));
      setVendas(visiveis);
    }
    if (n.data) setNotas(n.data);
    setLoading(false);
  };

  // Emite NF (Gôndolas Suprema = NF-e mercadoria, Suprema Instalações = NFS-e serviço).
  // Mesma lógica que estava no AdminPage. Roteia entre /api/emitir-nfe e /api/emitir-nfse.
  const emitirNfe = async (ordem, opts = {}) => {
    const emitente = opts.emitente || "gondolas";
    setConfirmEmitir(null);
    setEmitindoNfe(ordem.id);
    setNfeResult(null);
    try {
      const endpoint = emitente === "instalacoes" ? "/api/emitir-nfse" : "/api/emitir-nfe";
      const ambiente = opts.ambiente || (emitente === "instalacoes" ? "homologacao" : "producao");
      // Monta payload no formato esperado pela rota /api/emitir-nfe (espera ordem com .client)
      // Nas notas_fiscais a ordem aqui vem do orcamentos cru (cliente_*) — adapta pro shape esperado.
      const ordemPayload = {
        ...ordem,
        client: {
          empresa: ordem.cliente_empresa,
          cnpj: ordem.cliente_cnpj,
          ie: ordem.cliente_ie,
          responsavel: ordem.cliente_responsavel,
          telefone: ordem.cliente_telefone,
          email: ordem.cliente_email,
          endereco: ordem.cliente_endereco,
          numero: ordem.cliente_numero,
          bairro: ordem.cliente_bairro,
          cidade: ordem.cliente_cidade,
          estado: ordem.cliente_estado,
          cep: ordem.cliente_cep,
        },
        vendedor: ordem.vendedor_nome,
        date: ordem.data,
      };
      // Pra NFS-e da Suprema Instalações, propaga tomador customizado e
      // observação livre se vierem nos opts.
      const reqBody = { ordem: ordemPayload, ambiente };
      if (emitente === "instalacoes" && opts.tomador_custom) {
        reqBody.tomador_custom = opts.tomador_custom;
      }
      if (emitente === "instalacoes" && opts.observacao) {
        reqBody.observacao = opts.observacao;
      }
      // Envio por transportadora (NF-e Gôndolas Suprema) — dados do grupo
      // Transporte da SEFAZ, preenchidos no modal quando o checkbox é marcado.
      if (emitente === "gondolas" && opts.transportadora) {
        reqBody.transportadora = opts.transportadora;
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });
      const data = await res.json();
      setNfeResult(data);
      if (data.success) {
        const valorNota = emitente === "instalacoes"
          ? (Number(data.valor) || Number(ordem.comissao) || 0)
          : (Number(ordem.total) || 0);
        const destinatarioNome = emitente === "instalacoes"
          ? (data.tomador || "RRE MAQUINAS E EQUIPAMENTOS LTDA")
          : (ordem.cliente_empresa || "");
        const cnpjDest = emitente === "instalacoes"
          ? (data.cnpj_tomador || "23505287000107")
          : (ordem.cliente_cnpj || "");
        await supabase.from("notas_fiscais").insert({
          id: data.ref || genId(),
          ordem_id: ordem.id,
          numero: data.numero,
          chave: data.chave,
          ref: data.ref,
          status: data.status || (emitente === "instalacoes" ? "processando" : "autorizado"),
          valor: valorNota,
          destinatario: destinatarioNome,
          cnpj_destinatario: cnpjDest,
          data_emissao: dataEmissaoBRT(),
          url_danfe: data.url_danfe || "",
          url_xml: data.url_xml || "",
          vendedor: ordem.vendedor_nome || "",
          tipo: emitente === "instalacoes" ? "nfse" : "nfe",
          emitente,
          ambiente,
        });
        // Não mexe no Status venda automaticamente — pagamento (Em Aberto/Pago)
        // agora é marcado manualmente na ADM, separado da emissão de NF.
        await carregarTudo();
      }
    } catch (e) {
      setNfeResult({ success: false, mensagem: e.message });
    }
    setEmitindoNfe(null);
  };

  const cancelarNfe = async (ref, justificativa) => {
    if (!ref) return;
    setCancelandoNfe("loading");
    try {
      const nota = notas.find(n => n.ref === ref);
      const endpoint = nota?.tipo === "nfse" ? "/api/emitir-nfse" : "/api/emitir-nfe";
      const ambiente = nota?.ambiente || "producao";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "cancelar", ref_cancelamento: ref, justificativa, ambiente }),
      });
      const data = await res.json();
      setNfeResult(data.success ? { ...data, cancelado: true } : data);
      if (data.success) {
        await supabase.from("notas_fiscais").update({ status: "cancelado" }).eq("ref", ref);
        await carregarTudo();
      }
    } catch (e) {
      setNfeResult({ success: false, mensagem: e.message });
    }
    setCancelandoNfe(null);
    setCancelJustificativa("");
    setCancelRef("");
  };

  const emitirCartaCorrecao = async (ref, texto) => {
    if (!ref || texto.trim().length < 15) return;
    setEnviandoCorrecao(true);
    try {
      const nota = notas.find(n => n.ref === ref);
      const ambiente = nota?.ambiente || "producao";
      const res = await fetch("/api/emitir-nfe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "carta_correcao", ref_correcao: ref, correcao: texto.trim(), ambiente }),
      });
      const data = await res.json();
      setCorrecaoResult(data);
      if (data.success) {
        const registro = {
          texto: texto.trim(),
          numero: data.numero_carta_correcao,
          url_pdf: data.url_pdf_carta_correcao,
          url_xml: data.url_xml_carta_correcao,
          data: new Date().toISOString(),
        };
        const historico = [...(nota?.cartas_correcao || []), registro];
        await supabase.from("notas_fiscais").update({ cartas_correcao: historico }).eq("ref", ref);
        setNotas(prev => prev.map(n => n.ref === ref ? { ...n, cartas_correcao: historico } : n));
        setCartaCorrecaoRef(null);
        setCorrecaoTexto("");
      }
    } catch (e) {
      setCorrecaoResult({ success: false, mensagem: e.message });
    }
    setEnviandoCorrecao(false);
  };

  const consultarSefaz = async (nota) => {
    if (!nota.ref) return;
    setConsultando(nota.id);
    try {
      const ehNfse = nota.tipo === "nfse" || nota.emitente === "instalacoes";
      let data;
      if (ehNfse) {
        // NFS-e: consulta na Focus NFe via /api/emitir-nfse com acao=consultar.
        // A resposta da Focus traz status, numero, url_danfse, codigo_verificacao
        // e caminho_xml_nota_fiscal. A gente persiste tudo na linha da nota.
        const res = await fetch("/api/emitir-nfse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acao: "consultar", ref_consulta: nota.ref, ambiente: nota.ambiente || "producao" }),
        });
        data = await res.json();
      } else {
        // NF-e: consulta SEFAZ direta (rota antiga)
        const res = await fetch("/api/consultar-nfe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref: nota.ref, ambiente: nota.ambiente || "producao" }),
        });
        data = await res.json();
      }
      if (data.success && data.status) {
        // Pra NFS-e: a Focus devolve url_danfse (com 's') e caminho_xml_nota_fiscal.
        // A gente normaliza pro nosso schema (url_danfe / url_xml).
        const update = { status: data.status };
        if (data.numero) update.numero = String(data.numero);
        if (data.url_danfse) update.url_danfe = data.url_danfse;
        if (data.url_danfe) update.url_danfe = data.url_danfe;
        if (data.caminho_xml_nota_fiscal) {
          // URL pública do XML — a Focus disponibiliza pelo endpoint da nota
          update.url_xml = `https://api.focusnfe.com.br/v2/nfse/${encodeURIComponent(nota.ref)}.xml`;
        }
        await supabase.from("notas_fiscais").update(update).eq("id", nota.id);
        setNotas(notas.map(n => n.id === nota.id ? { ...n, ...update } : n));
      }
    } catch (e) { console.error(e); }
    setConsultando(null);
  };

  useEffect(() => { carregarTudo(); }, []);

  // Polling automático: pra cada nota em "processando_autorizacao", consulta
  // a Focus a cada 8s até status virar autorizado/erro. Evita fricção do Ale
  // ter que clicar ↻ manualmente. Ativo enquanto houver ao menos 1 pendente
  // no state; interval é limpo quando todas resolvem.
  useEffect(() => {
    const pendentes = notas.filter(n => n.status === "processando_autorizacao" || n.status === "processando");
    if (pendentes.length === 0) return;
    let cancelado = false;
    const timer = setInterval(() => {
      if (cancelado) return;
      // Consulta a primeira pendente (spread evita paralelizar demais)
      pendentes.forEach((n, idx) => setTimeout(() => !cancelado && consultarSefaz(n), idx * 500));
    }, 8000);
    return () => { cancelado = true; clearInterval(timer); };
  }, [notas]);

  // Mapeia notas por ordem_id (uma venda pode ter NF-e e NFS-e)
  const notasPorOrdem = {};
  notas.forEach(n => {
    if (!n.ordem_id) return;
    if (!notasPorOrdem[n.ordem_id]) notasPorOrdem[n.ordem_id] = [];
    notasPorOrdem[n.ordem_id].push(n);
  });

  // Lê o status venda (Em Aberto / Pago) das notes do orçamento (mesma
  // lógica do getVendaStatus do AdminPage). Valores antigos (Concluído,
  // Gerar NF) são tratados como Pago.
  const getVendaStatusNF = (o) => {
    const match = (o.notes || "").match(/🏷️ Status venda: (.+)$/m);
    const s = match ? match[1] : "Em Aberto";
    if (s === "Concluído" || s === "Gerar NF") return "Pago";
    return s;
  };

  // Vendas filtradas: por mês + status venda (Pagas / Em Aberto / Todas)
  // Pra "Pagas", o mês é referenciado pela data_pagamento (momento em que
  // foi marcada como Pago na ADM). Pra outras, usa data_conclusao.
  const vendasMes = vendas.filter(o => {
    const st = getVendaStatusNF(o);
    // Filtro de status venda
    if (filtroPag !== "todas") {
      if (filtroPag === "pagas" && st !== "Pago") return false;
      if (filtroPag === "em_aberto" && st !== "Em Aberto") return false;
    }
    // Filtro de mês — pra Pago, referência é data_pagamento; senão data_conclusao
    if (mesSel !== "all") {
      const ref = st === "Pago"
        ? (o.data_pagamento || o.data_conclusao || o.data_entrega || o.data)
        : (o.data_conclusao || o.data_entrega || o.data);
      if (!ref) return false;
      const d = new Date(ref);
      if ((d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")) !== mesSel) return false;
    }
    return true;
  });

  const statusColor = (s) => {
    if (s === "autorizado") return "#10B981";
    if (s === "cancelado") return "#F87171";
    if (s === "processando") return "#F59E0B";
    return "#888";
  };

  // Stats do mês (baseado em vendasMes)
  const idsVendas = new Set(vendasMes.map(v => v.id));
  const notasMes = notas.filter(n => idsVendas.has(n.ordem_id));
  const totalFaturado = vendasMes.reduce((s, o) => s + Number(o.total || 0), 0);
  const qtdNfEmitidas = notasMes.filter(n => n.status !== "cancelado").length;
  const qtdNfPendentes = vendasMes.filter(v => !(notasPorOrdem[v.id] || []).some(n => n.status !== "cancelado")).length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 24, margin: "0 0 4px" }}>Notas Fiscais</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            Vendas concluídas do mês — emita NF-e ou NFS-e direto daqui
            {!podeEmitir && <span style={{ color: COLORS.textDim, fontStyle: "italic" }}> · somente leitura</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={filtroPag} onChange={e => setFiltroPag(e.target.value)} style={{ padding: "8px 16px", background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
            <option value="pagas">Pagas</option>
            <option value="em_aberto">Em Aberto</option>
            <option value="todas">Todas</option>
          </select>
          <select value={mesSel} onChange={e => setMesSel(e.target.value)} style={{ padding: "8px 16px", background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
            <option value="all">Todos os meses</option>
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date(); d.setMonth(d.getMonth() - 6 + i);
              const v = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
              return <option key={v} value={v}>{mesNomes[String(d.getMonth() + 1).padStart(2, "0")]} {d.getFullYear()}</option>;
            })}
          </select>
          <button onClick={carregarTudo} style={{ background: COLORS.orange + "15", border: `1px solid ${COLORS.orange}40`, color: COLORS.orange, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Atualizar</button>
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 10 }}>Vendas Concluídas</div>
          <div style={{ color: COLORS.white, fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{vendasMes.length}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 10 }}>Faturado</div>
          <div style={{ color: COLORS.orange, fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalFaturado)}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 10 }}>NF Emitidas</div>
          <div style={{ color: "#10B981", fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{qtdNfEmitidas}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 10 }}>Pendentes</div>
          <div style={{ color: qtdNfPendentes > 0 ? "#F59E0B" : COLORS.textMuted, fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{qtdNfPendentes}</div>
        </div>
      </div>

      {/* Tabela de vendas concluídas */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 16, margin: 0 }}>Vendas — {mesSel === "all" ? "todos os meses" : `${mesNomes[mesSel.split("-")[1]]} ${mesSel.split("-")[0]}`}</h2>
        </div>
        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>Carregando...</div>
        ) : vendasMes.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: COLORS.textMuted, fontSize: 12 }}>Nenhuma venda concluída neste mês</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Cliente</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>CNPJ</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Valor</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Vendedor</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Valor Recebido</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Recebido em</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>NF-e<br/><span style={{ fontSize: 7, fontWeight: 400, textTransform: "none" }}>(Gôndolas)</span></th>
                  <th style={{ padding: "10px 12px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>NFS-e<br/><span style={{ fontSize: 7, fontWeight: 400, textTransform: "none" }}>(Instalações)</span></th>
                  {podeEmitir && <th style={{ padding: "10px 12px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {vendasMes.map(o => {
                  const notasDessa = notasPorOrdem[o.id] || [];
                  const nfe = notasDessa.find(n => n.tipo === "nfe" && n.status !== "cancelado");
                  const nfse = notasDessa.find(n => n.tipo === "nfse" && n.status !== "cancelado");
                  const renderNotaCell = (n, corOk) => {
                    if (!n) return <span style={{ color: COLORS.textDim, fontSize: 11 }}>—</span>;
                    const dataEmissaoStr = n.data_emissao
                      ? new Date(n.data_emissao).toLocaleDateString("pt-BR")
                      : null;
                    return (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <span style={{ background: statusColor(n.status) + "20", color: statusColor(n.status), padding: "2px 6px", borderRadius: 8, fontSize: 9, fontWeight: 700 }}>
                          {n.numero ? `#${n.numero}` : "—"} · {n.status === "autorizado" ? "Autorizada" : n.status === "cancelado" ? "Cancelada" : (n.status === "processando" || n.status === "processando_autorizacao") ? "Processando" : n.status}
                        </span>
                        {dataEmissaoStr && (
                          <span style={{ color: COLORS.textDim, fontSize: 9, fontFamily: "'DM Sans', sans-serif" }}>📅 {dataEmissaoStr}</span>
                        )}
                        <div style={{ display: "flex", gap: 6 }}>
                          {n.url_danfe && n.status === "autorizado" && <a href={n.url_danfe} target="_blank" rel="noopener noreferrer" style={{ color: "#10B981", fontSize: 9, fontWeight: 700, textDecoration: "none" }}>PDF</a>}
                          {n.url_xml && n.status === "autorizado" && <a href={n.url_xml} target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6", fontSize: 9, fontWeight: 700, textDecoration: "none" }}>XML</a>}
                          {podeEmitir && (
                            <>
                              <button onClick={() => consultarSefaz(n)} style={{ background: "transparent", border: "none", color: COLORS.textMuted, fontSize: 9, cursor: "pointer", padding: 0, textDecoration: "underline" }}>↻</button>
                              {n.status !== "cancelado" && (
                                <button onClick={() => { setCancelRef(n.ref); setCancelandoNfe(n.id); }} style={{ background: "transparent", border: "none", color: COLORS.danger, fontSize: 9, cursor: "pointer", padding: 0, textDecoration: "underline" }}>cancelar</button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  };
                  return (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: "10px 12px", color: COLORS.text, fontWeight: 500 }}>{o.cliente_empresa || "—"}<div style={{ color: COLORS.textDim, fontSize: 9 }}>{o.cliente_cidade}{o.cliente_estado ? `/${o.cliente_estado}` : ""}</div></td>
                      <td style={{ padding: "10px 12px", color: COLORS.textDim, fontSize: 10 }}>{o.cliente_cnpj || "—"}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: COLORS.orange, fontWeight: 700 }}>{fmt(Number(o.total || 0))}{(Number(o.comissao) || 0) > 0 && <div style={{ color: "#10B981", fontSize: 9, fontWeight: 600 }}>Com.: {fmt(Number(o.comissao))}</div>}</td>
                      <td style={{ padding: "10px 12px", color: COLORS.accent, fontWeight: 500 }}>{o.vendedor_nome || "—"}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        {editandoRecebidoId === o.id ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <span style={{ color: COLORS.textMuted, fontSize: 10 }}>R$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={valorRecebidoEdit}
                              onChange={e => setValorRecebidoEdit(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") salvarValorRecebido(o.id, valorRecebidoEdit);
                                if (e.key === "Escape") { setEditandoRecebidoId(null); setValorRecebidoEdit(""); }
                              }}
                              autoFocus
                              style={{ width: 90, padding: "3px 6px", background: COLORS.bg, border: `1px solid ${COLORS.accent}40`, borderRadius: 6, color: COLORS.accent, fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "right" }}
                            />
                            <button onClick={() => salvarValorRecebido(o.id, valorRecebidoEdit)} title="Confirmar" style={{ background: "#10B981", color: "#fff", border: "none", padding: "2px 6px", borderRadius: 5, fontSize: 10, cursor: "pointer" }}>✓</button>
                            <button onClick={() => { setEditandoRecebidoId(null); setValorRecebidoEdit(""); }} title="Cancelar" style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "2px 6px", borderRadius: 5, fontSize: 10, cursor: "pointer" }}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                            <span style={{ color: "#10B981", fontWeight: 700, fontSize: 11 }}>{fmt(getValorRecebido(o))}</span>
                            {podeEmitir && (
                              <button
                                onClick={() => { setEditandoRecebidoId(o.id); setValorRecebidoEdit(String(getValorRecebido(o).toFixed(2))); }}
                                title="Editar valor recebido"
                                style={{ background: "transparent", border: "none", color: COLORS.textMuted, fontSize: 11, cursor: "pointer", padding: "0 2px" }}
                              >✏️</button>
                            )}
                            {o.valor_recebido != null && Math.abs(Number(o.valor_recebido) - Number(o.comissao || 0)) >= 0.01 && (
                              <span style={{ color: COLORS.textDim, fontSize: 9 }} title={`Comissão: ${fmt(Number(o.comissao) || 0)}`}>*</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        {(() => {
                          const banco = o.venda_banco_recebedor;
                          const empresa = o.venda_empresa_recebedora;
                          if (!banco) return <span style={{ color: COLORS.textDim, fontSize: 10 }}>—</span>;
                          // Pagamento em PF MP = Venda PF (destaque dourado)
                          if (banco === "pf_mp") {
                            return <span style={{ background: "#F5A62315", color: "#F5A623", border: "1px solid #F5A62340", padding: "3px 8px", borderRadius: 8, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>🏷️ Venda PF</span>;
                          }
                          // Outros bancos: Empresa · Banco
                          const labelEmp = empresa === "gondolas_suprema" ? "Gôndolas Suprema" : empresa === "suprema_instalacoes" ? "Suprema Instalações" : "—";
                          const labelBan = ({ sicredi: "Sicredi", mercado_pago: "Mercado Pago", c6_bank: "C6 Bank" })[banco] || banco;
                          return (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                              <span style={{ background: "#10B98115", color: "#10B981", border: "1px solid #10B98140", padding: "2px 8px", borderRadius: 8, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>{labelBan}</span>
                              <span style={{ color: COLORS.textDim, fontSize: 8 }}>{labelEmp}</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>{renderNotaCell(nfe)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>{renderNotaCell(nfse)}</td>
                      {podeEmitir && (
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {emitindoNfe === o.id ? (
                            <span style={{ color: COLORS.textMuted, fontSize: 10 }}>Emitindo...</span>
                          ) : (
                            <button onClick={() => { setEmitenteSel(null); setConfirmEmitir(o); }} style={{ background: "#10B98115", border: "1px solid #10B98140", color: "#10B981", padding: "5px 10px", borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>+ Emitir NF</button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Seção NFs Emitidas no mês — agrupadas por empresa emissora */}
      {(() => {
        // Filtra por mês (data_emissao) só as autorizadas do mês atual — usa BRT
        // pra pegar o dia local (não UTC, que fura à noite).
        const notasDoMes = notas.filter(n => n.status === "autorizado" && n.data_emissao && mesBRT(n.data_emissao) === mesSel);
        const nfsGondolas = notasDoMes.filter(n => n.emitente === "gondolas" || (n.tipo === "nfe" && n.emitente !== "instalacoes"));
        const nfsInstalacoes = notasDoMes.filter(n => n.emitente === "instalacoes" || n.tipo === "nfse");
        const totalGondolas = nfsGondolas.reduce((s, n) => s + (Number(n.valor) || 0), 0);
        const totalInstalacoes = nfsInstalacoes.reduce((s, n) => s + (Number(n.valor) || 0), 0);
        const totalGeral = totalGondolas + totalInstalacoes;
        if (notasDoMes.length === 0) return null;
        const renderNota = (n) => (
          <tr key={n.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <td style={{ padding: "8px 12px", color: COLORS.text, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>#{n.numero || "—"}</td>
            <td style={{ padding: "8px 12px", color: COLORS.textMuted, fontSize: 11 }}>{n.destinatario || "—"}<div style={{ color: COLORS.textDim, fontSize: 9 }}>{n.cnpj_destinatario || ""}</div></td>
            <td style={{ padding: "8px 12px", color: COLORS.textDim, fontSize: 10, whiteSpace: "nowrap" }}>{n.data_emissao ? new Date(n.data_emissao).toLocaleDateString("pt-BR") : "—"}</td>
            <td style={{ padding: "8px 12px", textAlign: "right", color: COLORS.orange, fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>{fmt(Number(n.valor) || 0)}</td>
            <td style={{ padding: "8px 12px", textAlign: "center" }}>
              {n.url_danfe ? (
                <a href={n.url_danfe} target="_blank" rel="noopener noreferrer" title="Baixar PDF" style={{ background: "#10B98115", border: "1px solid #10B98140", color: "#10B981", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, textDecoration: "none", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>📥 PDF</a>
              ) : (
                <span style={{ color: COLORS.textDim, fontSize: 10 }}>—</span>
              )}
            </td>
            <td style={{ padding: "8px 12px", textAlign: "center" }}>
              {n.tipo === "nfse" ? (
                <span style={{ color: COLORS.textDim, fontSize: 10 }}>—</span>
              ) : (n.cartas_correcao || []).length > 0 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {n.cartas_correcao[n.cartas_correcao.length - 1].url_pdf && (
                    <a href={n.cartas_correcao[n.cartas_correcao.length - 1].url_pdf} target="_blank" rel="noopener noreferrer" title="Baixar última CC-e" style={{ color: "#3B82F6", fontSize: 10, fontWeight: 700, textDecoration: "none" }}>✓ {n.cartas_correcao.length}ª CC-e</a>
                  )}
                  <button onClick={() => { setCartaCorrecaoRef(n.ref); setCorrecaoTexto(""); setCorrecaoResult(null); }} title="Emitir nova Carta de Correção" style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "3px 8px", borderRadius: 6, fontSize: 9, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ CC-e</button>
                </div>
              ) : (
                <button onClick={() => { setCartaCorrecaoRef(n.ref); setCorrecaoTexto(""); setCorrecaoResult(null); }} title="Emitir Carta de Correção" style={{ background: "#3B82F615", border: "1px solid #3B82F640", color: "#3B82F6", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>📝 CC-e</button>
              )}
            </td>
          </tr>
        );
        const renderCard = (titulo, cor, notasLista, total) => (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: cor + "08" }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: cor, fontSize: 15, margin: 0 }}>{titulo}</h3>
              <span style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{notasLista.length} nota{notasLista.length === 1 ? "" : "s"}</span>
            </div>
            {notasLista.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: COLORS.textDim, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Nenhuma NF emitida neste mês.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: COLORS.textDim, fontSize: 9, textTransform: "uppercase" }}>Nº</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: COLORS.textDim, fontSize: 9, textTransform: "uppercase" }}>Destinatário</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: COLORS.textDim, fontSize: 9, textTransform: "uppercase" }}>Emissão</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: COLORS.textDim, fontSize: 9, textTransform: "uppercase" }}>Valor</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", color: COLORS.textDim, fontSize: 9, textTransform: "uppercase" }}>PDF</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", color: COLORS.textDim, fontSize: 9, textTransform: "uppercase" }}>CC-e</th>
                    </tr>
                  </thead>
                  <tbody>{notasLista.map(renderNota)}</tbody>
                  <tfoot>
                    <tr style={{ borderTop: `2px solid ${cor}40`, background: cor + "08" }}>
                      <td colSpan={3} style={{ padding: "10px 12px", color: cor, fontWeight: 700, fontSize: 12 }}>Total {titulo}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: cor, fontWeight: 800, fontFamily: "'Playfair Display', serif", fontSize: 14, whiteSpace: "nowrap" }}>{fmt(total)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        );
        return (
          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 20, margin: 0 }}>Notas Fiscais Emitidas — {mesNomes[mesSel.split("-")[1]]} {mesSel.split("-")[0]}</h2>
              <p style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>NFs autorizadas no mês, agrupadas por empresa emissora. Clica em <strong>📥 PDF</strong> pra reimprimir.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {renderCard("🏪 Gôndolas Suprema", COLORS.orange, nfsGondolas, totalGondolas)}
              {renderCard("🔧 Suprema Instalações", "#3B82F6", nfsInstalacoes, totalInstalacoes)}
            </div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>💰 Total geral emitido em {mesNomes[mesSel.split("-")[1]]}</span>
              <span style={{ color: COLORS.orange, fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalGeral)}</span>
            </div>
          </div>
        );
      })()}

      {/* Modal Cancelar NF */}
      {cancelandoNfe && cancelandoNfe !== "loading" && !nfeResult && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 420, maxWidth: "100%" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.danger, fontSize: 18, margin: "0 0 12px" }}>Cancelar Nota Fiscal</h2>
            <p style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: "0 0 14px" }}>Informe a justificativa do cancelamento (mínimo 15 caracteres). O cancelamento é restrito ao prazo legal (24h pra NF-e, varia pra NFS-e).</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" }}>Ref da NF</div>
                <input value={cancelRef || ""} onChange={e => setCancelRef(e.target.value)} placeholder="ref da nota" style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" }}>Justificativa (mín. 15 caracteres) *</div>
                <input value={cancelJustificativa} onChange={e => setCancelJustificativa(e.target.value)} placeholder="Motivo do cancelamento..." style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => { setCancelandoNfe(null); setCancelRef(""); setCancelJustificativa(""); }} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Voltar</button>
                <button onClick={() => cancelarNfe(cancelRef, cancelJustificativa)} disabled={!cancelRef || cancelJustificativa.length < 15} style={{ flex: 1, background: !cancelRef || cancelJustificativa.length < 15 ? COLORS.textDim : COLORS.danger, color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: !cancelRef || cancelJustificativa.length < 15 ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancelar NF</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Carta de Correção (CC-e) — corrige NF-e autorizada sem cancelar */}
      {cartaCorrecaoRef && !correcaoResult && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 460, maxWidth: "100%" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#3B82F6", fontSize: 18, margin: "0 0 6px" }}>📝 Carta de Correção Eletrônica</h2>
            <p style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: "0 0 14px" }}>
              Corrige dados da NF-e sem cancelar — só pode ser usada pra informações que <strong>não mudam valor, quantidade faturada ou as partes envolvidas</strong> (ex: dados do transportador, quantidade/peso dos volumes). Depois de enviada, a Carta de Correção é definitiva.
            </p>
            <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" }}>Texto da correção (15 a 1000 caracteres) *</div>
            <textarea
              value={correcaoTexto}
              onChange={e => setCorrecaoTexto(e.target.value.slice(0, 1000))}
              placeholder="Ex: Corrige a quantidade de volumes transportados para 1, peso bruto 25,000 kg e peso líquido 22,000 kg, informados incorretamente na emissão original."
              rows={5}
              style={{ width: "100%", padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical" }}
            />
            <div style={{ color: correcaoTexto.trim().length < 15 ? COLORS.danger : COLORS.textDim, fontSize: 10, marginTop: 4, textAlign: "right" }}>{correcaoTexto.trim().length}/1000 {correcaoTexto.trim().length < 15 ? "(mínimo 15)" : ""}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={() => { setCartaCorrecaoRef(null); setCorrecaoTexto(""); }} disabled={enviandoCorrecao} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: enviandoCorrecao ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Voltar</button>
              <button
                onClick={() => emitirCartaCorrecao(cartaCorrecaoRef, correcaoTexto)}
                disabled={correcaoTexto.trim().length < 15 || enviandoCorrecao}
                style={{ flex: 1, background: correcaoTexto.trim().length < 15 || enviandoCorrecao ? COLORS.textDim : "#3B82F6", color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: correcaoTexto.trim().length < 15 || enviandoCorrecao ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}
              >{enviandoCorrecao ? "Enviando..." : "Emitir Carta de Correção"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resultado da Carta de Correção */}
      {correcaoResult && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 420, maxWidth: "100%" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: correcaoResult.success ? "#10B981" : COLORS.danger, fontSize: 18, margin: "0 0 12px" }}>{correcaoResult.success ? "✓ Carta de Correção Emitida!" : "✕ Erro ao Emitir Correção"}</h2>
            {correcaoResult.success ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {correcaoResult.numero_carta_correcao && (
                  <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ color: COLORS.textMuted, fontSize: 10 }}>Número da CC-e</div>
                    <div style={{ color: COLORS.white, fontSize: 14, fontWeight: 700 }}>{correcaoResult.numero_carta_correcao}</div>
                  </div>
                )}
                {correcaoResult.url_pdf_carta_correcao && (
                  <a href={correcaoResult.url_pdf_carta_correcao} target="_blank" rel="noopener noreferrer" style={{ background: "#10B981", color: "#fff", padding: "10px", borderRadius: 8, textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>📄 Baixar PDF da CC-e</a>
                )}
                {correcaoResult.url_xml_carta_correcao && (
                  <a href={correcaoResult.url_xml_carta_correcao} target="_blank" rel="noopener noreferrer" style={{ background: "#3B82F615", border: "1px solid #3B82F640", color: "#3B82F6", padding: "10px", borderRadius: 8, textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>📋 Baixar XML da CC-e</a>
                )}
              </div>
            ) : (
              <div style={{ background: COLORS.danger + "10", border: `1px solid ${COLORS.danger}30`, borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: COLORS.danger, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{correcaoResult.mensagem || "Erro desconhecido"}</div>
              </div>
            )}
            <button onClick={() => { setCorrecaoResult(null); setCartaCorrecaoRef(null); setCorrecaoTexto(""); }} style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 12 }}>Fechar</button>
          </div>
        </div>
      )}

      {/* Modal Emissão NF — 2 passos */}
      {confirmEmitir && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 460, maxWidth: "100%" }}>
            {emitenteSel === null && (
              <>
                <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 18, margin: "0 0 6px" }}>Emitir Nota Fiscal</h2>
                <p style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: "0 0 16px" }}>Escolha qual empresa vai emitir:</p>
                <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
                  <div style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" }}>Venda</div>
                  <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 600 }}>{confirmEmitir.cliente_empresa}</div>
                  <div style={{ color: COLORS.textMuted, fontSize: 11 }}>CNPJ: {confirmEmitir.cliente_cnpj || "—"}</div>
                  <div style={{ color: COLORS.orange, fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif", marginTop: 4 }}>{fmt(Number(confirmEmitir.total))}</div>
                  {Number(confirmEmitir.comissao) > 0 && <div style={{ color: "#10B981", fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>Comissão: {fmt(Number(confirmEmitir.comissao))}</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={() => { setEmitenteSel("gondolas"); setValorEditado(Number(confirmEmitir.total || 0).toFixed(2)); setEditandoValor(false); setIeEditNfe(confirmEmitir.cliente_ie || ""); setUsarTransportadora(false); setTransportadoraData(TRANSPORTADORA_VAZIA); setErroTransp(""); }} style={{ background: COLORS.orange + "12", border: `1px solid ${COLORS.orange}40`, color: COLORS.text, padding: "14px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                    <div style={{ color: COLORS.orange, fontSize: 13, fontWeight: 700 }}>🏪 Gôndolas Suprema</div>
                    <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 2 }}>NF-e de mercadoria · destinatário: <strong style={{ color: COLORS.text }}>{confirmEmitir.cliente_empresa}</strong></div>
                    <div style={{ color: COLORS.textDim, fontSize: 10, marginTop: 2 }}>Valor: {fmt(Number(confirmEmitir.total))}</div>
                  </button>
                  <button onClick={() => { setEmitenteSel("instalacoes"); setValorEditado(Number(getValorRecebido(confirmEmitir)).toFixed(2)); setEditandoValor(false); setTomadorTipo("rre"); setTomadorCustom(TOMADOR_VAZIO); setObservacaoNfse(""); }} style={{ background: "#3B82F612", border: "1px solid #3B82F640", color: COLORS.text, padding: "14px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                    <div style={{ color: "#3B82F6", fontSize: 13, fontWeight: 700 }}>🔧 Suprema Instalações</div>
                    <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 2 }}>NFS-e de serviço · destinatário: <strong style={{ color: COLORS.text }}>Gôndolas Brasil</strong> (23.505.287/0001-07)</div>
                    <div style={{ color: COLORS.textDim, fontSize: 10, marginTop: 2 }}>Valor: {fmt(getValorRecebido(confirmEmitir))} <em style={{ color: COLORS.textDim }}>{confirmEmitir.valor_recebido != null && Math.abs(Number(confirmEmitir.valor_recebido) - Number(confirmEmitir.comissao || 0)) >= 0.01 ? "(valor recebido — editado)" : "(comissão)"}</em></div>
                  </button>
                </div>
                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <button onClick={() => setConfirmEmitir(null)} style={{ background: "transparent", border: "none", color: COLORS.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                </div>
              </>
            )}
            {emitenteSel === "gondolas" && (
              <>
                <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#F59E0B", fontSize: 18, margin: "0 0 12px" }}>⚠️ Confirmar — Gôndolas Suprema</h2>
                <p style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: "0 0 14px" }}>Esta ação irá emitir uma <strong style={{ color: COLORS.danger }}>NF-e REAL</strong> na SEFAZ.</p>
                <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                  <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 600 }}>{confirmEmitir.cliente_empresa}</div>
                  <div style={{ color: COLORS.textMuted, fontSize: 11 }}>CNPJ: {confirmEmitir.cliente_cnpj} | {confirmEmitir.cliente_cidade}/{confirmEmitir.cliente_estado}</div>
                  {/* Valor com lápis pra editar manualmente */}
                  <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                    {editandoValor ? (
                      <>
                        <span style={{ color: COLORS.textMuted, fontSize: 12 }}>R$</span>
                        <input type="number" min="0" step="0.01" value={valorEditado} onChange={e => setValorEditado(e.target.value)} style={{ flex: 1, padding: "6px 10px", background: COLORS.surface, border: `1px solid ${COLORS.orange}40`, borderRadius: 6, color: COLORS.orange, fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif", outline: "none" }} autoFocus />
                        <button onClick={() => setEditandoValor(false)} style={{ background: "#10B981", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>✓</button>
                      </>
                    ) : (
                      <>
                        <span style={{ color: COLORS.orange, fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(Number(valorEditado) || 0)}</span>
                        <button onClick={() => setEditandoValor(true)} title="Editar valor" style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "2px 6px", borderRadius: 5, fontSize: 11, cursor: "pointer" }}>✏️</button>
                        {Math.abs((Number(valorEditado) || 0) - Number(confirmEmitir.total)) >= 0.01 && (
                          <span style={{ color: COLORS.textDim, fontSize: 10 }}>(padrão: {fmt(Number(confirmEmitir.total))})</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {/* Inscrição Estadual — obrigatória pra cliente PJ contribuinte. Salva no orçamento ao emitir. */}
                <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Inscrição Estadual</span>
                    <a
                      href="http://www.sintegra.gov.br/"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Consultar IE no SINTEGRA — escolha o estado"
                      style={{ color: COLORS.orange, fontSize: 10, textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}
                    >🔍 Consultar SINTEGRA ↗</a>
                  </div>
                  <input
                    value={ieEditNfe}
                    onChange={e => setIeEditNfe(e.target.value)}
                    placeholder='Apenas dígitos · ou "ISENTO" se o cliente for isento'
                    style={{ width: "100%", padding: "7px 10px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <div style={{ color: COLORS.textDim, fontSize: 9, marginTop: 4, fontStyle: "italic" }}>
                    A IE preenchida aqui é salva também no orçamento — não precisa reabrir.
                  </div>
                </div>
                {/* Envio por transportadora — SEFAZ exige dados do transportador quando o material sai por terceiro */}
                <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={usarTransportadora}
                      onChange={e => {
                        const marcado = e.target.checked;
                        setUsarTransportadora(marcado);
                        if (marcado) { setTransportadoraModalOpen(true); }
                        else { setTransportadoraData(TRANSPORTADORA_VAZIA); setErroTransp(""); }
                      }}
                      style={{ width: 16, height: 16, accentColor: COLORS.orange, cursor: "pointer" }}
                    />
                    <span style={{ color: COLORS.text, fontSize: 12, fontWeight: 600 }}>🚚 Enviar por transportadora</span>
                  </label>
                  {usarTransportadora && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ color: COLORS.textMuted, fontSize: 11 }}>
                        {transportadoraData.nome ? (
                          <>{transportadoraData.nome} · {transportadoraData.frete_modalidade === "1" ? "FOB" : "CIF"} · {transportadoraData.quantidade || 1} vol. · {transportadoraData.peso_bruto || "0"}kg bruto</>
                        ) : "Nenhum dado preenchido ainda"}
                      </div>
                      <button type="button" onClick={() => setTransportadoraModalOpen(true)} style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.orange, padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>✏️ Editar</button>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setEmitenteSel(null)} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13 }}>← Voltar</button>
                  <button
                    onClick={async () => {
                      const ieFinal = (ieEditNfe || "").trim();
                      // Salva IE atualizada no orçamento (se mudou) antes de emitir,
                      // pra que próximas emissões da mesma venda já tenham a IE.
                      if (ieFinal !== String(confirmEmitir.cliente_ie || "").trim()) {
                        setSalvandoIe(true);
                        try {
                          await supabase.from("orcamentos").update({ cliente_ie: ieFinal || null }).eq("id", confirmEmitir.id);
                          setVendas(prev => prev.map(o => o.id === confirmEmitir.id ? { ...o, cliente_ie: ieFinal || null } : o));
                        } catch (_e) { /* segue mesmo se falhar — emissão é o crítico */ }
                        setSalvandoIe(false);
                      }
                      emitirNfe(
                        { ...confirmEmitir, total: Number(valorEditado) || Number(confirmEmitir.total), cliente_ie: ieFinal || null },
                        {
                          emitente: "gondolas",
                          ambiente: "producao",
                          ...(usarTransportadora && transportadoraData.nome ? { transportadora: transportadoraData } : {}),
                        }
                      );
                    }}
                    disabled={editandoValor || salvandoIe}
                    style={{ flex: 1, background: (editandoValor || salvandoIe) ? COLORS.textDim : "#10B981", color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: (editandoValor || salvandoIe) ? "not-allowed" : "pointer", fontSize: 13 }}
                  >{salvandoIe ? "Salvando IE..." : "Sim, Emitir NF-e"}</button>
                </div>
              </>
            )}
            {emitenteSel === "instalacoes" && (() => {
              // CNPJ do cliente da venda (limpo)
              const cnpjCliente = String(confirmEmitir.cliente_cnpj || "").replace(/\D/g, "");
              const clienteTemCnpj = cnpjCliente.length === 14;
              // Validação: se for "cliente da venda", precisa ter CNPJ válido (o sistema busca o resto)
              const tomadorValido = tomadorTipo === "rre" || clienteTemCnpj;
              const valorOk = Number(valorEditado) > 0;
              const podeEmitir = !editandoValor && valorOk && tomadorValido;
              const lbl = (t) => <div style={{ color: COLORS.textDim, fontSize: 9, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.3 }}>{t}</div>;
              const inputStyle = { width: "100%", padding: "6px 10px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" };
              return (
              <>
                <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#3B82F6", fontSize: 18, margin: "0 0 12px" }}>🔧 Confirmar — Suprema Instalações</h2>
                <p style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: "0 0 12px" }}>Esta ação irá emitir uma <strong style={{ color: COLORS.danger }}>NFS-e REAL</strong> na Prefeitura de Palhoça.</p>
                {/* Toggle Tomador: RRE (padrão) | Cliente da venda */}
                <div style={{ marginBottom: 10 }}>
                  {lbl("Tomador")}
                  <div style={{ display: "flex", gap: 4, background: COLORS.bg, padding: 3, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
                    {[
                      { v: "rre",     lbl: "RRE Máquinas (padrão)" },
                      { v: "cliente", lbl: "Cliente da venda" },
                    ].map(opt => (
                      <button
                        key={opt.v}
                        onClick={() => setTomadorTipo(opt.v)}
                        style={{
                          flex: 1,
                          background: tomadorTipo === opt.v ? "#3B82F620" : "transparent",
                          border: tomadorTipo === opt.v ? "1px solid #3B82F660" : "1px solid transparent",
                          color: tomadorTipo === opt.v ? "#3B82F6" : COLORS.textMuted,
                          padding: "5px 10px", borderRadius: 6,
                          fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        }}
                      >{opt.lbl}</button>
                    ))}
                  </div>
                </div>
                {/* Dados do tomador — só preview, sistema busca o resto via CNPJ */}
                <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                  {tomadorTipo === "rre" ? (
                    <>
                      <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 600 }}>RRE MAQUINAS E EQUIPAMENTOS LTDA</div>
                      <div style={{ color: COLORS.textMuted, fontSize: 11 }}>CNPJ: 23.505.287/0001-07 · São José/SC</div>
                    </>
                  ) : (
                    <>
                      <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 600 }}>{confirmEmitir.cliente_empresa || "—"}</div>
                      <div style={{ color: COLORS.textMuted, fontSize: 11 }}>CNPJ: {confirmEmitir.cliente_cnpj || "—"} · {confirmEmitir.cliente_cidade || ""}{confirmEmitir.cliente_estado ? "/" + confirmEmitir.cliente_estado : ""}</div>
                      {clienteTemCnpj ? (
                        <div style={{ color: COLORS.textDim, fontSize: 10, marginTop: 4, fontStyle: "italic" }}>O sistema busca razão, endereço e código IBGE direto na Receita Federal pelo CNPJ.</div>
                      ) : (
                        <div style={{ color: COLORS.danger, fontSize: 10, marginTop: 4, fontWeight: 600 }}>⚠️ Cliente da venda sem CNPJ cadastrado. Cadastra o CNPJ na ficha do cliente ou usa "RRE Máquinas".</div>
                      )}
                    </>
                  )}
                  {/* Valor com lápis pra editar manualmente */}
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    {editandoValor ? (
                      <>
                        <span style={{ color: COLORS.textMuted, fontSize: 12 }}>R$</span>
                        <input type="number" min="0" step="0.01" value={valorEditado} onChange={e => setValorEditado(e.target.value)} style={{ flex: 1, padding: "6px 10px", background: COLORS.surface, border: "1px solid #3B82F640", borderRadius: 6, color: "#3B82F6", fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif", outline: "none" }} autoFocus />
                        <button onClick={() => setEditandoValor(false)} style={{ background: "#10B981", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>✓</button>
                      </>
                    ) : (
                      <>
                        <span style={{ color: "#3B82F6", fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(Number(valorEditado) || 0)}</span>
                        <button onClick={() => setEditandoValor(true)} title="Editar valor" style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "2px 6px", borderRadius: 5, fontSize: 11, cursor: "pointer" }}>✏️</button>
                        {Math.abs((Number(valorEditado) || 0) - Number(confirmEmitir.comissao || 0)) >= 0.01 && (
                          <span style={{ color: COLORS.textDim, fontSize: 10 }}>(comissão: {fmt(Number(confirmEmitir.comissao) || 0)})</span>
                        )}
                      </>
                    )}
                  </div>
                  <div style={{ color: COLORS.textDim, fontSize: 10, marginTop: 4 }}>(ISS 3% · Simples · NBS 100501 — intermediação)</div>
                </div>
                {/* Observação livre (anexada à discriminação como "OBS: ...") */}
                <div style={{ marginBottom: 14 }}>
                  {lbl("Observação (opcional)")}
                  <textarea
                    value={observacaoNfse}
                    onChange={e => setObservacaoNfse(e.target.value.slice(0, 500))}
                    rows={3}
                    placeholder="Texto livre que aparece na NF após o número do pedido e cliente."
                    style={{ ...inputStyle, resize: "vertical", minHeight: 60, fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <div style={{ color: COLORS.textDim, fontSize: 9, marginTop: 3, display: "flex", justifyContent: "space-between" }}>
                    <span>Vai aparecer como "OBS: ..." no DANFSE.</span>
                    <span>{observacaoNfse.length}/500</span>
                  </div>
                </div>
                {!valorOk && (
                  <div style={{ background: COLORS.danger + "12", border: `1px solid ${COLORS.danger}40`, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                    <div style={{ color: COLORS.danger, fontSize: 12, fontWeight: 600 }}>⚠️ Valor precisa ser maior que zero</div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setEmitenteSel(null)} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13 }}>← Voltar</button>
                  <button
                    onClick={() => emitirNfe(
                      { ...confirmEmitir, comissao: Number(valorEditado) || Number(confirmEmitir.comissao) },
                      {
                        emitente: "instalacoes",
                        ambiente: "producao",
                        // Pra "cliente da venda", mandamos só o CNPJ — o backend
                        // resolve razão, endereço e código IBGE na BrasilAPI.
                        ...(tomadorTipo === "cliente" ? { tomador_custom: { cnpj: cnpjCliente } } : {}),
                        ...(observacaoNfse.trim() ? { observacao: observacaoNfse.trim() } : {}),
                      }
                    )}
                    disabled={!podeEmitir}
                    style={{ flex: 1, background: !podeEmitir ? COLORS.textDim : "#3B82F6", color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: !podeEmitir ? "not-allowed" : "pointer", fontSize: 13 }}
                  >Sim, Emitir NFS-e</button>
                </div>
              </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal Transportadora — dados exigidos pela SEFAZ quando o material sai por terceiro */}
      {transportadoraModalOpen && (() => {
        const docLimpo = (transportadoraData.documento || "").replace(/\D/g, "");
        const docOk = docLimpo.length === 0 || docLimpo.length === 11 || docLimpo.length === 14;
        const qtdOk = Number(transportadoraData.quantidade) > 0;
        const pesoBrutoOk = Number(transportadoraData.peso_bruto) > 0;
        const pesoLiquidoOk = Number(transportadoraData.peso_liquido) > 0;
        const podeConfirmar = transportadoraData.nome.trim().length > 0 && qtdOk && pesoBrutoOk && pesoLiquidoOk;
        const selStyle = { width: "100%", padding: "10px 14px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };
        const lblStyle = { color: COLORS.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: 0.5 };
        return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 460, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.orange, fontSize: 18, margin: "0 0 6px" }}>🚚 Dados da Transportadora</h2>
              <p style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: "0 0 16px" }}>Informações exigidas pela SEFAZ quando o envio é feito por transportadora.</p>

              {erroTransp && (
                <div style={{ background: (erroTransp.startsWith("A Receita não retorna") ? "#F59E0B15" : COLORS.danger + "15"), color: erroTransp.startsWith("A Receita não retorna") ? "#F59E0B" : COLORS.danger, padding: "8px 12px", borderRadius: 8, fontSize: 11, marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>{erroTransp}</div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={lblStyle}>Buscar por CNPJ (opcional)</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      placeholder="00.000.000/0001-00"
                      value={transportadoraData.documento}
                      onChange={e => setTransportadoraData(prev => ({ ...prev, documento: formatarCnpjOuCpf(e.target.value) }))}
                      maxLength={18}
                      style={{ ...selStyle, flex: 1, ...(docOk ? {} : { borderColor: COLORS.danger }) }}
                    />
                    <button type="button" onClick={buscarCnpjTransportadora} disabled={buscandoCnpjTransp} style={{ background: COLORS.orange, color: "#000", border: "none", padding: "0 16px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: buscandoCnpjTransp ? "wait" : "pointer", whiteSpace: "nowrap", opacity: buscandoCnpjTransp ? 0.6 : 1 }}>
                      {buscandoCnpjTransp ? "Buscando..." : "Buscar dados"}
                    </button>
                  </div>
                  {!docOk && <div style={{ color: COLORS.danger, fontSize: 10, marginTop: 4 }}>CNPJ deve ter 14 dígitos ou CPF 11 dígitos.</div>}
                </div>

                <div>
                  <label style={lblStyle}>Nome da Transportadora *</label>
                  <input placeholder="Razão social ou nome do motorista" value={transportadoraData.nome} onChange={e => setTransportadoraData(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))} style={selStyle} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={lblStyle}>Inscrição Estadual</label>
                    <input placeholder="Opcional" value={transportadoraData.ie} onChange={e => setTransportadoraData(prev => ({ ...prev, ie: e.target.value }))} style={selStyle} />
                  </div>
                  <div>
                    <label style={lblStyle}>UF</label>
                    <input placeholder="SC" maxLength={2} value={transportadoraData.uf} onChange={e => setTransportadoraData(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))} style={selStyle} />
                  </div>
                </div>

                <div>
                  <label style={lblStyle}>Endereço</label>
                  <input placeholder="Rua, número — opcional" value={transportadoraData.endereco} onChange={e => setTransportadoraData(prev => ({ ...prev, endereco: e.target.value }))} style={selStyle} />
                </div>

                <div>
                  <label style={lblStyle}>Município</label>
                  <input placeholder="Opcional" value={transportadoraData.municipio} onChange={e => setTransportadoraData(prev => ({ ...prev, municipio: e.target.value.toUpperCase() }))} style={selStyle} />
                </div>

                <div>
                  <label style={lblStyle}>Frete *</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setTransportadoraData(prev => ({ ...prev, frete_modalidade: "0" }))}
                      style={{ flex: 1, background: transportadoraData.frete_modalidade === "0" ? COLORS.orange + "20" : COLORS.bg, border: `1px solid ${transportadoraData.frete_modalidade === "0" ? COLORS.orange : COLORS.border}`, color: transportadoraData.frete_modalidade === "0" ? COLORS.orange : COLORS.textMuted, padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}
                    >CIF (você paga)</button>
                    <button
                      type="button"
                      onClick={() => setTransportadoraData(prev => ({ ...prev, frete_modalidade: "1" }))}
                      style={{ flex: 1, background: transportadoraData.frete_modalidade === "1" ? COLORS.orange + "20" : COLORS.bg, border: `1px solid ${transportadoraData.frete_modalidade === "1" ? COLORS.orange : COLORS.border}`, color: transportadoraData.frete_modalidade === "1" ? COLORS.orange : COLORS.textMuted, padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}
                    >FOB (cliente paga)</button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={lblStyle}>Quantidade *</label>
                    <input type="number" min="1" placeholder="1" value={transportadoraData.quantidade} onChange={e => setTransportadoraData(prev => ({ ...prev, quantidade: e.target.value }))} style={qtdOk ? selStyle : { ...selStyle, borderColor: COLORS.danger }} />
                  </div>
                  <div>
                    <label style={lblStyle}>Peso Bruto (kg) *</label>
                    <input type="number" min="0" step="0.001" placeholder="0,000" value={transportadoraData.peso_bruto} onChange={e => setTransportadoraData(prev => ({ ...prev, peso_bruto: e.target.value }))} style={pesoBrutoOk ? selStyle : { ...selStyle, borderColor: COLORS.danger }} />
                  </div>
                  <div>
                    <label style={lblStyle}>Peso Líquido (kg) *</label>
                    <input type="number" min="0" step="0.001" placeholder="0,000" value={transportadoraData.peso_liquido} onChange={e => setTransportadoraData(prev => ({ ...prev, peso_liquido: e.target.value }))} style={pesoLiquidoOk ? selStyle : { ...selStyle, borderColor: COLORS.danger }} />
                  </div>
                </div>
                {!(qtdOk && pesoBrutoOk && pesoLiquidoOk) && (
                  <div style={{ color: COLORS.danger, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>
                    ⚠️ Quantidade, Peso Bruto e Peso Líquido são obrigatórios — a SEFAZ só mostra os volumes na NF se os três vierem preenchidos.
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => { setUsarTransportadora(false); setTransportadoraData(TRANSPORTADORA_VAZIA); setErroTransp(""); setTransportadoraModalOpen(false); }}
                  style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.textMuted, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}
                >Cancelar</button>
                <button
                  onClick={() => setTransportadoraModalOpen(false)}
                  disabled={!podeConfirmar}
                  style={{ flex: 1, background: podeConfirmar ? "#10B981" : COLORS.textDim, color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, cursor: podeConfirmar ? "pointer" : "not-allowed", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}
                >Salvar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Resultado da Emissão / Cancelamento */}
      {nfeResult && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 460, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: nfeResult.cancelado ? "#F59E0B" : nfeResult.success ? "#10B981" : COLORS.danger, fontSize: 18, margin: "0 0 12px" }}>{nfeResult.cancelado ? "✓ NF Cancelada" : nfeResult.success ? "✓ NF Emitida!" : "✕ Erro"}</h2>
            {nfeResult.success ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {nfeResult.numero && <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px" }}><div style={{ color: COLORS.textMuted, fontSize: 10 }}>Número</div><div style={{ color: COLORS.white, fontSize: 14, fontWeight: 700 }}>{nfeResult.numero}</div></div>}
                {nfeResult.ref && <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px" }}><div style={{ color: COLORS.textMuted, fontSize: 10 }}>Ref</div><div style={{ color: COLORS.text, fontSize: 11, wordBreak: "break-all" }}>{nfeResult.ref}</div></div>}
                {nfeResult.status && <div style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 14px" }}><div style={{ color: COLORS.textMuted, fontSize: 10 }}>Status</div><div style={{ color: "#10B981", fontSize: 13, fontWeight: 700 }}>{nfeResult.status}</div></div>}
                {nfeResult.url_danfe && <a href={nfeResult.url_danfe} target="_blank" rel="noopener noreferrer" style={{ background: "#10B981", color: "#fff", padding: "10px", borderRadius: 8, textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>📄 Baixar PDF</a>}
                {nfeResult.url_xml && <a href={nfeResult.url_xml} target="_blank" rel="noopener noreferrer" style={{ background: "#3B82F6", color: "#fff", padding: "10px", borderRadius: 8, textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>📄 Baixar XML</a>}
              </div>
            ) : (
              <div style={{ background: COLORS.danger + "12", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ color: COLORS.danger, fontSize: 13, fontWeight: 600 }}>{nfeResult.mensagem || "Erro desconhecido"}</div>
              </div>
            )}
            <button onClick={() => { setNfeResult(null); setEmitenteSel(null); setCancelandoNfe(null); setCancelRef(""); setCancelJustificativa(""); }} style={{ marginTop: 14, width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.text, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 13 }}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── APP ───
// SHA do commit atual (injetado pela Vercel no build). Usado pelo polling
// de auto-reload: quando o servidor passar a responder com um SHA diferente
// deste, todas as abas abertas recarregam sozinhas. Forca os usuarios a
// pegar a versao nova sem precisar dar refresh manual.
const APP_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "dev";

// Banner que aparece no topo do app quando o Ale tem boletos atrasados.
// Visível só pro Ale (v1). Click leva pro Financeiro → Boletos.
// Botão X fecha só pra sessão atual — volta a aparecer no próximo carregamento.
function BoletosAtrasadosBanner({ user, setPage }) {
  const [atrasados, setAtrasados] = useState([]);
  const [dispensado, setDispensado] = useState(false);
  useEffect(() => {
    if (!user || user.id !== "v1") return;
    const carregar = async () => {
      const hoje = new Date().toISOString().slice(0, 10);
      const { data } = await supabase.from("boletos_a_pagar")
        .select("*")
        .eq("status", "pendente")
        .lt("vencimento", hoje)
        .order("vencimento");
      if (data) setAtrasados(data);
    };
    carregar();
  }, [user]);
  if (!user || user.id !== "v1" || atrasados.length === 0 || dispensado) return null;
  const total = atrasados.reduce((s, b) => s + (Number(b.valor) || 0), 0);
  return (
    <div
      style={{
        background: "linear-gradient(90deg, #F87171 0%, #DC2626 100%)",
        color: "#fff",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <div style={{ width: 32, flexShrink: 0 }} />
      <div
        onClick={() => setPage("financeiro")}
        style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", flexWrap: "wrap", justifyContent: "center", flex: 1 }}
        title="Clique pra ir pro Financeiro → Boletos"
      >
        <span style={{ fontSize: 18 }}>⚠️</span>
        <span>
          <strong>{atrasados.length}</strong> {atrasados.length === 1 ? "boleto atrasado" : "boletos atrasados"} —
          total <strong>{(total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
        </span>
        <span style={{ background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
          Ver no Financeiro →
        </span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setDispensado(true); }}
        title="Fechar (volta a aparecer no próximo carregamento)"
        aria-label="Fechar aviso"
        style={{
          background: "rgba(255,255,255,0.25)",
          border: "1px solid rgba(255,255,255,0.4)",
          color: "#fff",
          width: 32,
          height: 32,
          borderRadius: "50%",
          cursor: "pointer",
          fontSize: 18,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.4)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
      >
        ×
      </button>
    </div>
  );
}

// ─── Conciliação Bancária ─────────────────────────────────────────────
// Fase 1 (upload PDF) + Fase 2 (matching automático) + Fase 3 (ações
// inline: criar despesa, marcar ignorado, vincular venda).
function ConciliacaoPage({ user }) {
  const BANCOS = [
    { k: "c6_instalacoes",   l: "C6 (Suprema Instalações)",     cor: "#3B82F6" },
    { k: "sicredi_gondolas", l: "Sicredi (Gôndolas Suprema)",   cor: "#10B981" },
    { k: "mp_gondolas",      l: "Mercado Pago (Gôndolas)",      cor: "#06B6D4" },
  ];
  const [bancoSel, setBancoSel] = useState("c6_instalacoes");
  const _hojeMes = (() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); })();
  const [mesSel, setMesSel] = useState(_hojeMes);
  const [lancamentos, setLancamentos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const [uploadResultado, setUploadResultado] = useState(null);
  const [reconciliando, setReconciliando] = useState(false);
  const [reconcResultado, setReconcResultado] = useState(null);
  const [processandoAcao, setProcessandoAcao] = useState(null); // id do lancamento
  const [vincularVenda, setVincularVenda] = useState(null); // { lancamento }
  const [vendasDisponiveis, setVendasDisponiveis] = useState([]);
  const fileInputRef = useRef(null);

  const carregar = async () => {
    setCarregando(true);
    const { data } = await supabase
      .from("lancamentos_bancarios")
      .select("*")
      .eq("banco", bancoSel)
      .eq("mes", mesSel)
      .order("data", { ascending: true })
      .order("criado_em", { ascending: true });
    if (data) setLancamentos(data);
    setCarregando(false);
  };

  useEffect(() => { carregar(); setReconcResultado(null); }, [bancoSel, mesSel]);

  const onUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadando(true);
    setUploadResultado(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/conciliacao/upload-extrato", { method: "POST", body: form });
      const data = await res.json();
      setUploadResultado(data);
      if (data.success) {
        if (data.banco && data.banco !== bancoSel) setBancoSel(data.banco);
        await carregar();
      }
    } catch (err) {
      setUploadResultado({ success: false, mensagem: err.message });
    }
    setUploadando(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const reconciliar = async () => {
    setReconciliando(true);
    setReconcResultado(null);
    try {
      const res = await fetch("/api/conciliacao/reconciliar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banco: bancoSel, mes: mesSel }),
      });
      const data = await res.json();
      setReconcResultado(data);
      if (data.success) await carregar();
    } catch (err) {
      setReconcResultado({ success: false, mensagem: err.message });
    }
    setReconciliando(false);
  };

  const aplicarAcao = async (lancamento, acao, extras = {}) => {
    setProcessandoAcao(lancamento.id);
    try {
      const res = await fetch("/api/conciliacao/acao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lancamento_id: lancamento.id, acao, ...extras }),
      });
      const data = await res.json();
      if (data.success) await carregar();
      else alert("Erro: " + (data.mensagem || "ação falhou"));
    } catch (err) { alert("Erro: " + err.message); }
    setProcessandoAcao(null);
  };

  const abrirVincularVenda = async (lancamento) => {
    setVincularVenda({ lancamento });
    // Busca vendas concluídas do mês (sem orçamentos RS-ocultos)
    const { data } = await supabase
      .from("orcamentos")
      .select("id, cliente_empresa, total, valor_recebido, data_entrega")
      .eq("status", "Concluído")
      .order("data_entrega", { ascending: false })
      .limit(50);
    if (data) setVendasDisponiveis(data.filter(o => !isOrcamentoRsOculto(o)));
  };

  const totalEntradas = lancamentos.filter(l => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0);
  const totalSaidas   = lancamentos.filter(l => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);

  // Gera lista de meses pro filtro (últimos 12)
  const mesesOpts = (() => {
    const out = [];
    const hoje = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      const lbl = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      out.push({ k, lbl: lbl.charAt(0).toUpperCase() + lbl.slice(1) });
    }
    return out;
  })();

  const bancoAtual = BANCOS.find(b => b.k === bancoSel);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, padding: "30px 40px" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.white, fontSize: 28, margin: 0 }}>Conciliação Bancária</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginTop: 6 }}>
            Suba o PDF do extrato e o sistema parseia + (em breve) cruza com despesas e vendas do sistema.
          </p>
        </div>

        {/* Filtro banco + mês + upload */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, padding: 18, marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4, background: COLORS.bg, padding: 3, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
            {BANCOS.map(b => (
              <button
                key={b.k}
                onClick={() => setBancoSel(b.k)}
                style={{
                  background: bancoSel === b.k ? b.cor + "20" : "transparent",
                  border: bancoSel === b.k ? `1px solid ${b.cor}60` : "1px solid transparent",
                  color: bancoSel === b.k ? b.cor : COLORS.textMuted,
                  padding: "6px 14px", borderRadius: 6,
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
              >{b.l}</button>
            ))}
          </div>
          <select value={mesSel} onChange={e => setMesSel(e.target.value)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.text, padding: "6px 12px", borderRadius: 6, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
            {mesesOpts.map(m => <option key={m.k} value={m.k}>{m.lbl}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <input ref={fileInputRef} type="file" accept="application/pdf" onChange={onUploadFile} style={{ display: "none" }} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadando}
            style={{ background: uploadando ? COLORS.textDim : COLORS.orange, color: "#000", border: "none", padding: "8px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: uploadando ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >{uploadando ? "Parseando PDF..." : "📄 Subir extrato (PDF)"}</button>
          <button
            onClick={reconciliar}
            disabled={reconciliando || lancamentos.length === 0}
            style={{ background: (reconciliando || lancamentos.length === 0) ? COLORS.textDim : "#8B5CF6", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: (reconciliando || lancamentos.length === 0) ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >{reconciliando ? "Reconciliando..." : "🔄 Reconciliar agora"}</button>
        </div>

        {/* Resultado do matching */}
        {reconcResultado && (
          <div style={{
            background: reconcResultado.success ? "#8B5CF612" : COLORS.danger + "12",
            border: `1px solid ${reconcResultado.success ? "#8B5CF640" : COLORS.danger + "40"}`,
            borderRadius: 8, padding: "10px 14px", marginBottom: 14,
            color: reconcResultado.success ? "#8B5CF6" : COLORS.danger, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
          }}>
            {reconcResultado.success ? (
              <>
                <strong>✓ Reconciliado {reconcResultado.total} lançamentos:</strong>{" "}
                {reconcResultado.stats?.conciliado || 0} conciliados · {reconcResultado.stats?.so_extrato || 0} só no extrato · {reconcResultado.stats?.ignorado || 0} ignorados
              </>
            ) : (<>⚠️ {reconcResultado.mensagem || "Falha"}</>)}
          </div>
        )}

        {/* Resultado do último upload */}
        {uploadResultado && (
          <div style={{
            background: uploadResultado.success ? "#10B98112" : COLORS.danger + "12",
            border: `1px solid ${uploadResultado.success ? "#10B98140" : COLORS.danger + "40"}`,
            borderRadius: 8, padding: "10px 14px", marginBottom: 14,
            color: uploadResultado.success ? "#10B981" : COLORS.danger, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          }}>
            {uploadResultado.success
              ? `✓ ${uploadResultado.total} lançamentos extraídos do PDF (${uploadResultado.banco}). Mostrando os do mês atual abaixo.`
              : `⚠️ ${uploadResultado.mensagem || "Falha ao processar PDF"}`}
          </div>
        )}

        {/* Totais */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14 }}>
            <div style={{ color: COLORS.textDim, fontSize: 10, textTransform: "uppercase" }}>Entradas</div>
            <div style={{ color: "#10B981", fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalEntradas)}</div>
          </div>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14 }}>
            <div style={{ color: COLORS.textDim, fontSize: 10, textTransform: "uppercase" }}>Saídas</div>
            <div style={{ color: COLORS.danger, fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalSaidas)}</div>
          </div>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 10, padding: 14 }}>
            <div style={{ color: COLORS.textDim, fontSize: 10, textTransform: "uppercase" }}>Saldo do mês</div>
            <div style={{ color: COLORS.orange, fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{fmt(totalEntradas - totalSaidas)}</div>
          </div>
        </div>

        {/* Tabela de lançamentos */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: bancoAtual?.cor || COLORS.orange, fontSize: 16, margin: 0 }}>{bancoAtual?.l} — {lancamentos.length} lançamento{lancamentos.length === 1 ? "" : "s"}</h2>
            <span style={{ color: COLORS.textMuted, fontSize: 11, fontStyle: "italic" }}>matching com despesas/vendas: Fase 2</span>
          </div>
          {carregando ? (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>Carregando...</div>
          ) : lancamentos.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
              Nenhum lançamento desse banco em {mesesOpts.find(m => m.k === mesSel)?.lbl}. Sobe o PDF do extrato acima.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Data</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Descrição</th>
                    <th style={{ padding: "8px 12px", textAlign: "right", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Valor</th>
                    <th style={{ padding: "8px 12px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Status</th>
                    <th style={{ padding: "8px 12px", textAlign: "center", color: COLORS.textMuted, fontSize: 9, textTransform: "uppercase" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map(l => {
                    const statusInfo = {
                      conciliado: { cor: "#10B981", lbl: "✓ Conciliado", bg: "#10B98115" },
                      divergente: { cor: "#F59E0B", lbl: "⚠ Divergente", bg: "#F59E0B15" },
                      so_extrato: { cor: COLORS.danger, lbl: "🆕 Só no extrato", bg: COLORS.danger + "12" },
                      ignorado:   { cor: COLORS.textDim, lbl: "🚫 Ignorado", bg: COLORS.textDim + "12" },
                      pendente:   { cor: COLORS.textMuted, lbl: "— Pendente", bg: "transparent" },
                    }[l.status_conciliacao] || { cor: COLORS.textMuted, lbl: l.status_conciliacao, bg: "transparent" };
                    const linhaBg = l.status_conciliacao === "so_extrato" ? COLORS.danger + "08" :
                                    l.status_conciliacao === "divergente" ? "#F59E0B08" : "transparent";
                    const podeAgir = l.status_conciliacao !== "conciliado" && l.status_conciliacao !== "ignorado";
                    const processando = processandoAcao === l.id;
                    return (
                      <tr key={l.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: linhaBg }}>
                        <td style={{ padding: "8px 12px", color: COLORS.text, whiteSpace: "nowrap" }}>{new Date(l.data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                        <td style={{ padding: "8px 12px", color: COLORS.text }}>
                          {l.descricao}
                          {l.observacao && <div style={{ color: COLORS.textDim, fontSize: 9, marginTop: 2, fontStyle: "italic" }}>{l.observacao}</div>}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: l.tipo === "entrada" ? "#10B981" : COLORS.danger, fontWeight: 700, whiteSpace: "nowrap" }}>
                          {l.tipo === "saida" ? "-" : "+"}{fmt(Number(l.valor))}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          <span style={{ background: statusInfo.bg, color: statusInfo.cor, padding: "2px 8px", borderRadius: 12, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>{statusInfo.lbl}</span>
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          {processando ? (
                            <span style={{ color: COLORS.textDim, fontSize: 10 }}>...</span>
                          ) : podeAgir ? (
                            <div style={{ display: "inline-flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                              <button
                                onClick={() => aplicarAcao(l, "criar_despesa")}
                                title="Criar despesa nova com tipo/categoria inferidos"
                                style={{ background: "#10B98115", border: "1px solid #10B98140", color: "#10B981", padding: "3px 7px", borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                              >+ Despesa</button>
                              {l.tipo === "entrada" && (
                                <button
                                  onClick={() => abrirVincularVenda(l)}
                                  title="Vincular a uma venda do sistema"
                                  style={{ background: "#3B82F615", border: "1px solid #3B82F640", color: "#3B82F6", padding: "3px 7px", borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                                >🛒 Venda</button>
                              )}
                              <button
                                onClick={() => aplicarAcao(l, "marcar_ignorado")}
                                title="Marcar como ignorado (transferência interna, pessoal, etc)"
                                style={{ background: COLORS.textDim + "15", border: `1px solid ${COLORS.textDim}40`, color: COLORS.textDim, padding: "3px 7px", borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                              >🚫 Ignorar</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => aplicarAcao(l, "desconciliar")}
                              title="Desfazer conciliação"
                              style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, padding: "3px 7px", borderRadius: 6, fontSize: 9, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                            >↺ Desfazer</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: vincular lançamento a uma venda */}
      {vincularVenda && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: 600, maxWidth: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#3B82F6", fontSize: 18, margin: "0 0 6px" }}>Vincular a uma venda</h2>
            <p style={{ color: COLORS.textMuted, fontSize: 12, margin: "0 0 12px" }}>
              Lançamento: <strong style={{ color: COLORS.text }}>{vincularVenda.lancamento.descricao.slice(0, 80)}</strong>{" "}
              · <strong style={{ color: "#10B981" }}>+{fmt(Number(vincularVenda.lancamento.valor))}</strong>
            </p>
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, maxHeight: 360, overflowY: "auto" }}>
              {vendasDisponiveis.length === 0 ? (
                <div style={{ padding: 20, color: COLORS.textMuted, textAlign: "center", fontSize: 12 }}>Carregando vendas...</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: COLORS.textDim, fontSize: 9, textTransform: "uppercase" }}>Cliente</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: COLORS.textDim, fontSize: 9, textTransform: "uppercase" }}>Total</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: COLORS.textDim, fontSize: 9, textTransform: "uppercase" }}>Recebido</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: COLORS.textDim, fontSize: 9, textTransform: "uppercase" }}>Entrega</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", color: COLORS.textDim, fontSize: 9, textTransform: "uppercase" }}>Vincular</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendasDisponiveis.map(v => {
                      const vrIgual = v.valor_recebido != null && Math.abs(Number(v.valor_recebido) - Number(vincularVenda.lancamento.valor)) < 0.01;
                      const totalIgual = Math.abs(Number(v.total) - Number(vincularVenda.lancamento.valor)) < 0.01;
                      const destaque = vrIgual || totalIgual;
                      return (
                        <tr key={v.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: destaque ? "#10B98108" : "transparent" }}>
                          <td style={{ padding: "8px 12px", color: COLORS.text }}>{v.cliente_empresa || "—"}</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", color: COLORS.orange, fontWeight: 700 }}>{fmt(Number(v.total || 0))}</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", color: vrIgual ? "#10B981" : COLORS.textDim, fontWeight: vrIgual ? 700 : 400 }}>
                            {v.valor_recebido != null ? fmt(Number(v.valor_recebido)) : "—"}
                          </td>
                          <td style={{ padding: "8px 12px", color: COLORS.textMuted, fontSize: 10 }}>{v.data_entrega || "—"}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center" }}>
                            <div style={{ display: "inline-flex", gap: 4 }}>
                              <button
                                onClick={() => { aplicarAcao(vincularVenda.lancamento, "vincular_venda", { ordem_id: v.id, atualizar_valor_recebido: false }); setVincularVenda(null); }}
                                title="Apenas vincular (sem mexer no valor_recebido)"
                                style={{ background: "#3B82F615", border: "1px solid #3B82F640", color: "#3B82F6", padding: "3px 7px", borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: "pointer" }}
                              >Vincular</button>
                              <button
                                onClick={() => { aplicarAcao(vincularVenda.lancamento, "vincular_venda", { ordem_id: v.id, atualizar_valor_recebido: true }); setVincularVenda(null); }}
                                title="Vincular E atualizar valor_recebido da venda pra esse valor"
                                style={{ background: "#10B98115", border: "1px solid #10B98140", color: "#10B981", padding: "3px 7px", borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: "pointer" }}
                              >+ Atualizar VR</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button onClick={() => setVincularVenda(null)} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: CARD_GLOW, color: COLORS.text, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);

  // Auto-reload: a cada 2 min compara a versao do bundle (APP_VERSION) com
  // a versao retornada pelo servidor (/api/version). Se diferentes, o
  // usuario esta com um bundle antigo — recarrega pra pegar o novo.
  // Tambem reage ao tab voltar a ter foco (visibilitychange/focus).
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelado = false;
    const checar = async () => {
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        if (!r.ok) return;
        const { version } = await r.json();
        if (!cancelado && version && APP_VERSION !== "dev" && version !== APP_VERSION) {
          window.location.reload();
        }
      } catch {}
    };
    checar();
    const intervalo = setInterval(checar, 120000); // 2 min
    const onFocus = () => checar();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);
  const [cart, setCart] = useState([]);
  const EMPTY_CLIENT = { empresa: "", cnpj: "", responsavel: "", telefone: "", email: "", endereco: "", numero: "", bairro: "", cidade: "", estado: "", cep: "" };
  const [clientData, setClientData] = useState(EMPTY_CLIENT);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingOrderInfo, setEditingOrderInfo] = useState(null); // { num, empresa, qtdItens, totalAtual } — mostrado no banner do Resumo
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0); // incrementado apos salvar pra forcar reload da lista
  const [markup, setMarkup] = useState(0);
  const [frete, setFrete] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [uniplusProducts, setUniplusProducts] = useState([]);
  const [mppChinaProducts, setMppChinaProducts] = useState([]);
  // Indexa preços por id (legado) E por nome normalizado (forma estável).
  // PRODUCT_RECIPES passou a referenciar produtos pelo nome (slug normalizado),
  // assim reordenar a planilha não quebra mais as receitas — só renomear
  // afeta. computeProductPrice tenta resolver primeiro como nome, depois id.
  const uniplusPriceMap = useMemo(() => {
    const m = {};
    const normalize = (s) => (s || "").toString().toUpperCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ").trim();
    const slug = (s) => normalize(s).replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
    uniplusProducts.forEach(p => {
      const preco = Number(p.preco_brasil) || 0;
      if (p.id) m[p.id] = preco;          // chave legada por id
      if (p.nome) m["nome:" + slug(p.nome)] = preco; // chave estável por nome
    });
    mppChinaProducts.forEach(p => {
      const preco = Number(p.preco_brasil) || 0;
      if (p.id) m[p.id] = preco;
      if (p.nome) m["nome:" + slug(p.nome)] = preco;
    });
    return m;
  }, [uniplusProducts, mppChinaProducts]);

  // Carrega catalogos APENAS depois do usuario estar autenticado.
  // Antes disso a sessao do supabase-js ainda eh anon e a RLS retorna []
  // — bug que afetava Zanella e Adelmo recem-logados (ver issue 30/abr/2026).
  useEffect(() => {
    if (!user) { setUniplusProducts([]); setMppChinaProducts([]); return; }
    // O Supabase Cloud tem `db-max-rows: 1000` no PostgREST que CAPA qualquer
    // SELECT a 1000 linhas — independente de .range() ou .limit() do client.
    // Como a tabela já tem 1300+ produtos, precisamos paginar manualmente.
    const PAGE = 1000;
    const fetchAllUniplus = async () => {
      const acc = [];
      for (let from = 0; from < 100000; from += PAGE) {
        const { data, error } = await supabase.from("produtos_uniplus")
          .select("id, nome, preco_brasil, categoria, linha_planilha")
          .eq("ativo", true)
          .order("nome", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error || !data || data.length === 0) break;
        acc.push(...data);
        if (data.length < PAGE) break;
      }
      setUniplusProducts(acc);
    };
    const fetchAllMppChina = async () => {
      const acc = [];
      for (let from = 0; from < 100000; from += PAGE) {
        const { data, error } = await supabase.from("produtos_mpp_china")
          .select("id, nome, preco_brasil, categoria, codigo, linha_planilha")
          .eq("ativo", true)
          // Ordena pela ordem manual (linha_planilha) — mantem agrupamento da
          // planilha original. Nulls vao pro fim, depois desempate alfabetico.
          .order("linha_planilha", { ascending: true, nullsFirst: false })
          .order("nome", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error || !data || data.length === 0) break;
        acc.push(...data);
        if (data.length < PAGE) break;
      }
      setMppChinaProducts(acc);
    };
    fetchAllUniplus();
    fetchAllMppChina();
  }, [user?.id]);

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
        role: meta.role || (meta.isAdmin ? "admin" : "vendedor"),
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
    setDesconto(0);
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
    <div style={{ background: "transparent", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet" />
      {/* Camada de fundo fixa (cor do tema) — fica atrás de todo o conteúdo */}
      <div aria-hidden="true" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: COLORS.bg, zIndex: -2, pointerEvents: "none" }} />
      {/* Marca d'água premium — emblema dourado (águia) da marca, fixo e
          centralizado, atrás de todo o conteúdo e não clicável. As asas
          emolduram o conteúdo (aparece no login e em todas as telas). */}
      <div aria-hidden="true" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, pointerEvents: "none", backgroundImage: "url(/watermark3.png)", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "min(680px, 80vw)", opacity: 0.06 }} />
      <Nav page={page} setPage={setPage} user={user} onLogout={logout} cartCount={cart.length} />
      {page === "login" && <Login onLogin={login} setPage={setPage} />}
      {page === "client" && user && <ClientPage key={`client-${user.id}`} clientData={clientData} setClientData={setClientData} setPage={setPage} />}
      {page === "client" && !user && <Login onLogin={login} setPage={setPage} />}
      {page === "catalog" && user && <Catalog onAdd={addToQuote} uniplusProducts={uniplusProducts} mppChinaProducts={mppChinaProducts} uniplusPriceMap={uniplusPriceMap} />}
      {page === "catalog" && !user && <Login onLogin={login} setPage={setPage} />}
      {page === "quote" && user && <Quote items={cart} setItems={setCart} user={user} setPage={setPage} clientData={clientData} editingOrderId={editingOrderId} setEditingOrderId={setEditingOrderId} editingOrderInfo={editingOrderInfo} markup={markup} setMarkup={setMarkup} frete={frete} setFrete={setFrete} desconto={desconto} setDesconto={setDesconto} uniplusPriceMap={uniplusPriceMap} />}
      {page === "quote" && !user && <Login onLogin={login} setPage={setPage} />}
      {page === "resumo" && user && <ResumoPage items={cart} user={user} setPage={setPage} clientData={clientData} editingOrderId={editingOrderId} setEditingOrderId={setEditingOrderId} editingOrderInfo={editingOrderInfo} setEditingOrderInfo={setEditingOrderInfo} setItems={setCart} markup={markup} setMarkup={setMarkup} frete={frete} setFrete={setFrete} desconto={desconto} setDesconto={setDesconto} uniplusPriceMap={uniplusPriceMap} bumpOrdersRefresh={() => setOrdersRefreshKey(k => k + 1)} />}
      {page === "resumo" && !user && <Login onLogin={login} setPage={setPage} />}
      {page === "orders" && user && <Orders user={user} setPage={setPage} setCart={setCart} clientData={clientData} setEditingOrderId={setEditingOrderId} setEditingOrderInfo={setEditingOrderInfo} refreshKey={ordersRefreshKey} uniplusProducts={uniplusProducts} />}
      {page === "orders" && !user && <Login onLogin={login} setPage={setPage} />}
      {page === "leads" && canAccess(user, "leads") && <LeadsPage user={user} />}
      {page === "leads" && !canAccess(user, "leads") && <Login onLogin={login} setPage={setPage} />}
      {page === "adm" && canAccess(user, "adm") && <AdminPage user={user} />}
      {page === "adm" && !canAccess(user, "adm") && <Login onLogin={login} setPage={setPage} />}
      {page === "financeiro" && canAccess(user, "financeiro") && <FinanceiroPage user={user} />}
      {page === "financeiro" && !canAccess(user, "financeiro") && <Login onLogin={login} setPage={setPage} />}
      {page === "dre" && canAccess(user, "dre") && <DrePage />}
      {page === "dre" && !canAccess(user, "dre") && <Login onLogin={login} setPage={setPage} />}
      {page === "nf" && canAccess(user, "nf") && <NFPage user={user} />}
      {page === "nf" && !canAccess(user, "nf") && <Login onLogin={login} setPage={setPage} />}
      {page === "conciliacao" && canAccess(user, "conciliacao") && <ConciliacaoPage user={user} />}
      {page === "conciliacao" && !canAccess(user, "conciliacao") && <Login onLogin={login} setPage={setPage} />}
      {page === "graficos" && user && <GraficosPage user={user} />}
      {page === "graficos" && !user && <Login onLogin={login} setPage={setPage} />}
      {page === "mariana" && canAccess(user, "mariana") && <PainelMarianaPage />}
      {page === "mariana" && !canAccess(user, "mariana") && <Login onLogin={login} setPage={setPage} />}
      {page === "logistica" && canAccess(user, "logistica") && <LogisticaPage user={user} />}
      {page === "logistica" && !canAccess(user, "logistica") && <Login onLogin={login} setPage={setPage} />}
      {page === "comissoes" && canAccess(user, "comissoes") && <ComissoesPage user={user} />}
      {page === "comissoes" && !canAccess(user, "comissoes") && <Login onLogin={login} setPage={setPage} />}
    </div>
  );
}
