// Medidas da gôndola de centro da aba Projeto, em metros (catálogo do sistema).
// Sem Three.js: a tela mostra as medidas mesmo antes de o 3D carregar ou se ele falhar.

export const COL_X = 0.03; // coluna, no sentido do comprimento
export const COL_Z = 0.05; // coluna, no sentido da profundidade
export const VAO = 0.9; // bandeja do módulo
export const FACE_Z = 0.024; // onde o painel termina, medido do miolo
export const MAX_MODULOS = 8;
export const MAX_CORREDORES = 6; // cada corredor é uma fileira de gôndola
export const LARGURA_CORREDOR = 1.2; // espaço entre um corredor e outro

export const LINHAS = {
  // medidaPonta: quanto cada ponta soma ao comprimento. Padrão: 0,40 m, igual ao orçamento por medidas (PONTA_M).
  // Reforçada: 0,78 m por decisão do Ale (7-nov-2026), mesmo sendo maior que o desenho 3D; não trocar sem ele pedir.
  fit40: { nome: "Padrão", profBase: 0.396, profPrat: 0.296, vaoPonta: 0.78, medidaPonta: 0.4 },
  fit60: { nome: "Reforçada", profBase: 0.496, profPrat: 0.396, vaoPonta: 0.98, medidaPonta: 0.78 },
};

// Das receitas do catálogo: bandeja base + prateleiras por face, e painéis de 34 cm por módulo.
export const ALTURAS = {
  "1,37": { m: 1.37, prateleiras: 3, paineis: 4 },
  "1,70": { m: 1.7, prateleiras: 4, paineis: 5 },
  "2,02": { m: 2.02, prateleiras: 4, paineis: 6 },
};

// O que cada lado de um módulo expõe.
export const TIPOS_FACE = { bandeja: "Bandeja", gancho: "Gancho", cesto: "Cesto" };

// Inicial 0,96 m + 0,93 m por módulo seguinte.
export const comprimentoFileira = (modulos) => COL_X + modulos * (VAO + COL_X);
export const larguraFileira = (linha) => 2 * (FACE_Z + LINHAS[linha].profBase + 0.0145);

export function medidasDe({ modulos, pontas, linha, altura, corredores, tipos }) {
  const fmt = (v) => v.toFixed(2).replace(".", ",");
  const { prateleiras } = ALTURAS[altura];
  // Receitas: bandeja = base + prateleiras; gancho e cesto = base + topo + réguas ou cestos no meio.
  const niveisDaFace = (tipo) => (tipo === "bandeja" ? prateleiras + 1 : prateleiras + 2);
  let niveis = pontas * (prateleiras + 1);
  for (let i = 0; i < modulos; i++) niveis += niveisDaFace(tipos[i].esq) + niveisDaFace(tipos[i].dir);
  return {
    comprimento: `≈ ${fmt(comprimentoFileira(modulos) + pontas * LINHAS[linha].medidaPonta)} m`,
    rotuloLargura: corredores > 1 ? "Largura total" : "Largura",
    largura: `≈ ${fmt(corredores * larguraFileira(linha) + (corredores - 1) * LARGURA_CORREDOR)} m`,
    altura: `${fmt(ALTURAS[altura].m)} m`,
    espaco: `${fmt(LARGURA_CORREDOR)} m`,
    niveis: niveis * corredores,
  };
}
