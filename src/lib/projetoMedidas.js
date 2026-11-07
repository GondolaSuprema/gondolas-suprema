// Medidas das gôndolas da aba Projeto, em metros (catálogo do sistema).
// Sem Three.js: a tela mostra as medidas mesmo antes de o 3D carregar ou se ele falhar.

export const COL_X = 0.03; // coluna, no sentido do comprimento
export const COL_Z = 0.05; // coluna, no sentido da profundidade
export const VAO = 0.9; // bandeja do módulo
export const FACE_Z = 0.024; // onde o painel termina, medido do miolo
export const ATRAS_PAREDE = COL_Z / 2; // quanto a coluna da parede passa para trás
export const MAX_MODULOS = 8;
export const MAX_MODULOS_PAREDE = 15; // em cada parede
export const MAX_PAREDES_LADO = 4; // paredes no mesmo lado, separadas pelo vão da coluna
export const MAX_MODULOS_LADO = 30; // somando as paredes de um lado: mais que isso sai do salão do 3D
export const VAO_COLUNA = 0.3; // espaço entre duas paredes do mesmo lado, onde fica o pilar da loja
export const PROF_PILAR = 0.3;
// Canto: da quina até a primeira coluna de cada parede. Medido na foto do catálogo, a confirmar num canto montado.
export const CANTO_PAREDE = 0.64;
export const CANTO_ATE_COLUNA = CANTO_PAREDE - ATRAS_PAREDE;
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
export const ALTURAS_PAREDE = ["1,70", "2,02"]; // parede não tem 1,37 m

// O que cada lado de um módulo expõe.
export const TIPOS_FACE = { bandeja: "Bandeja", gancho: "Gancho", cesto: "Cesto" };

// As paredes são vistas de quem está na entrada da loja olhando para o fundo.
export const LADOS_PAREDE = { esq: "Parede esquerda", dir: "Parede direita", fundo: "Parede do fundo" };
export const LETRA_PAREDE = { esq: "E", dir: "D", fundo: "F" };

// Inicial 0,96 m + 0,93 m por módulo seguinte, no centro e na parede.
export const comprimentoFileira = (modulos) => COL_X + modulos * (VAO + COL_X);
export const larguraFileira = (linha) => 2 * (FACE_Z + LINHAS[linha].profBase + 0.0145);
export const avancoFace = (linha) => FACE_Z + LINHAS[linha].profBase + 0.015;
// paredes = módulos de cada parede, por lado: { esq: [4, 3], dir: [], fundo: [4] }. Lado sem parede = lista vazia.
export const paredesDe = ({ montagem, paredes }) => (montagem === "centro" ? { esq: [], dir: [], fundo: [] } : paredes);
const comprimentoLado = (lista) => lista.reduce((soma, n) => soma + comprimentoFileira(n) + VAO_COLUNA, -VAO_COLUNA * (lista.length ? 1 : 0));
// Onde cada parede começa, medido do começo do lado.
export const trechosDoLado = (lista) => {
  let inicio = 0;
  return lista.map((n) => {
    const trecho = { n, inicio };
    inicio += comprimentoFileira(n) + VAO_COLUNA;
    return trecho;
  });
};
// E3 com uma parede só; com mais de uma, E2.3 = módulo 3 da parede 2. Assim o número não muda quando outra parede cresce.
export const nomeModuloParede = (lado, quantas, parede, modulo) => (quantas > 1 ? `${LETRA_PAREDE[lado]}${parede + 1}.${modulo + 1}` : `${LETRA_PAREDE[lado]}${modulo + 1}`);

// Onde cada coisa fica na loja. O centro fica na origem; as paredes ficam a um corredor dele.
export function layoutDe(cfg) {
  const { montagem, modulos, pontas, linha, corredores, cantos } = cfg;
  const p = paredesDe(cfg);
  const avanco = avancoFace(linha);
  const L = comprimentoFileira(modulos);
  const centro = montagem === "parede" ? null : {
    xMin: -L / 2 - (pontas >= 2 ? avanco : 0),
    xMax: L / 2 + (pontas >= 1 ? avanco : 0),
    z: ((corredores - 1) / 2) * (larguraFileira(linha) + LARGURA_CORREDOR) + avanco,
  };
  const Le = comprimentoLado(p.esq), Ld = comprimentoLado(p.dir), Lf = comprimentoLado(p.fundo);
  const planoFundo = (centro ? centro.xMin - LARGURA_CORREDOR : -Math.max(Le, Ld) / 2) - avanco;
  // Sem fundo, com centro, a lateral alinha com o fim do centro: não reserva espaço de uma parede que não existe.
  const inicioSemCanto = Lf ? planoFundo + avanco : centro ? centro.xMin : planoFundo;
  // Sem centro, laterais frente a frente deixam um corredor livre, mesmo com fundo pequeno entre elas.
  const livreMinimo = !centro && (!Lf || (Le && Ld)) ? LARGURA_CORREDOR / 2 + avanco : 0;
  const planoLivre = Math.max(centro ? centro.z + LARGURA_CORREDOR + avanco : 0, livreMinimo);
  // O canto liga o fundo a uma lateral e fica de pé nas colunas delas: só existe com as duas paredes.
  const pedeE = !!(cantos?.esq && Lf && Le), pedeD = !!(cantos?.dir && Lf && Ld);
  // Com dois cantos, o fundo precisa ir de um ao outro; se não alcança, o direito ficaria solto no ar e não entra.
  const fundoMinimo = 2 * (planoLivre - CANTO_ATE_COLUNA);
  const cantoCortado = pedeE && pedeD && Lf < fundoMinimo - 1e-9;
  const cantoE = pedeE, cantoD = pedeD && !cantoCortado;
  const inicioE = cantoE ? planoFundo + CANTO_ATE_COLUNA : inicioSemCanto;
  const inicioD = cantoD ? planoFundo + CANTO_ATE_COLUNA : inicioSemCanto;
  const planoLateral = Math.max(planoLivre, (Lf + ((cantoE ? 1 : 0) + (cantoD ? 1 : 0)) * CANTO_ATE_COLUNA) / 2);
  // O fundo encosta no canto; sem canto, fica centralizado.
  const fundoIni = cantoE ? planoLateral - CANTO_ATE_COLUNA : cantoD ? Lf + CANTO_ATE_COLUNA - planoLateral : Lf / 2;
  const vaoInterno = planoLateral - avanco;
  const xs = [], zs = [];
  if (centro) { xs.push(centro.xMin, centro.xMax); zs.push(centro.z, -centro.z); }
  if (Lf) { xs.push(planoFundo - ATRAS_PAREDE, planoFundo + avanco); zs.push(fundoIni, fundoIni - Lf); }
  if (Le) { xs.push(inicioE, inicioE + Le); zs.push(planoLateral + ATRAS_PAREDE, vaoInterno); }
  if (Ld) { xs.push(inicioD, inicioD + Ld); zs.push(-planoLateral - ATRAS_PAREDE, -vaoInterno); }
  if (!xs.length) { xs.push(0); zs.push(0); }
  return { centro, avanco, Le, Ld, Lf, cantoE, cantoD, cantoCortado, fundoMinimo, planoFundo, inicioE, inicioD, fundoIni, planoLateral, vaoInterno, xMin: Math.min(...xs), xMax: Math.max(...xs), zMin: Math.min(...zs), zMax: Math.max(...zs) };
}

export function medidasDe(cfg) {
  const { montagem, modulos, pontas, linha, altura, corredores, tipos, alturaParede, tiposParede } = cfg;
  const fmt = (v) => v.toFixed(2).replace(".", ",");
  const p = paredesDe(cfg);
  // Receitas: bandeja = base + prateleiras; gancho e cesto = base + topo + réguas ou cestos no meio.
  const niveisDaFace = (chave, tipo) => ALTURAS[chave].prateleiras + (tipo === "bandeja" ? 1 : 2);
  let niveis = 0;
  if (montagem !== "parede") {
    let fileira = pontas * niveisDaFace(altura, "bandeja");
    for (let i = 0; i < modulos; i++) fileira += niveisDaFace(altura, tipos[i].esq) + niveisDaFace(altura, tipos[i].dir);
    niveis += fileira * corredores;
  }
  for (const lado of Object.keys(LADOS_PAREDE)) p[lado].forEach((n, t) => { for (let i = 0; i < n; i++) niveis += niveisDaFace(alturaParede, tiposParede[lado][t][i]); });
  const l = layoutDe(cfg);
  niveis += ((l.cantoE ? 1 : 0) + (l.cantoD ? 1 : 0)) * niveisDaFace(alturaParede, "bandeja"); // canto só tem bandeja
  const compr = (n) => `≈ ${fmt(comprimentoFileira(n))} m`;
  const comprimentoCentro = comprimentoFileira(modulos) + pontas * LINHAS[linha].medidaPonta;
  const larguraCentro = corredores * larguraFileira(linha) + (corredores - 1) * LARGURA_CORREDOR;
  const ocupado = `≈ ${fmt(l.xMax - l.xMin)} × ${fmt(l.zMax - l.zMin)} m`;
  return {
    comprimento: `≈ ${fmt(comprimentoCentro)} m`,
    rotuloLargura: corredores > 1 ? "Largura total" : "Largura",
    largura: `≈ ${fmt(larguraCentro)} m`,
    altura: `${fmt(ALTURAS[altura].m)} m`,
    alturaParede: `${fmt(ALTURAS[alturaParede].m)} m`,
    paredes: { esq: p.esq.map(compr), dir: p.dir.map(compr), fundo: p.fundo.map(compr) },
    ocupado,
    // Sem parede, usa as mesmas medidas mostradas no painel (a ponta Reforçada soma mais que o desenho).
    resumo: p.esq.length || p.dir.length || p.fundo.length ? ocupado : `≈ ${fmt(comprimentoCentro)} × ${fmt(larguraCentro)} m`,
    espaco: `${fmt(LARGURA_CORREDOR)} m`,
    vaoColuna: `${fmt(VAO_COLUNA)} m`,
    cantoParede: `${fmt(CANTO_PAREDE)} m`,
    fundoParaCanto: l.cantoCortado ? `${fmt(l.fundoMinimo)} m` : "",
    nomeCantos: l.cantoE && l.cantoD ? "esquerdo e direito" : l.cantoE ? "esquerdo" : l.cantoD ? "direito" : "",
    niveis,
  };
}
