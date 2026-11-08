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
export const MAX_FILAS = 6; // filas lado a lado
export const MAX_CORREDORES_FILA = 4; // corredores um atrás do outro na mesma fila
export const LARGURA_CORREDOR = 1.2; // espaço entre uma gôndola e outra: entre filas e entre corredores da mesma fila

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

// Cor da gôndola e do porta-etiqueta, as mesmas da gôndola 3D do site. O porta-etiqueta só existe nas bandejas.
export const CORES_GONDOLA = { preta: "Preta", branca: "Branca" };
export const CORES_ETIQUETA = { amarelo: "Amarelo", azul: "Azul", branco: "Branco", cinza: "Cinza", laranja: "Laranja", preto: "Preto", rosa: "Rosa", verdeClaro: "Verde claro", verdeEscuro: "Verde escuro", vermelho: "Vermelho" };

// As paredes são vistas de quem está na entrada da loja olhando para o fundo.
export const LADOS_PAREDE = { esq: "Parede esquerda", dir: "Parede direita", fundo: "Parede do fundo" };
export const LETRA_PAREDE = { esq: "E", dir: "D", fundo: "F" };

// Inicial 0,96 m + 0,93 m por módulo seguinte, no centro e na parede.
export const comprimentoFileira = (modulos) => COL_X + modulos * (VAO + COL_X);
export const larguraFileira = (linha) => 2 * (FACE_Z + LINHAS[linha].profBase + 0.0145);
export const avancoFace = (linha) => FACE_Z + LINHAS[linha].profBase + 0.015;
// filas = corredores de cada fila: [2, 3] = fila 1 com 2 corredores, fila 2 com 3.
// Vistas da entrada olhando o fundo: a fila 1 fica à esquerda (+Z), todas começam do lado da entrada e cada corredor seguinte
// fica atrás do anterior, na direção do fundo, com o espaço de um corredor entre eles. A fila mais comprida fica centralizada:
// o centro inteiro cabe no salão do 3D.
const pontasDe = ({ pontas, linha }) => ({ atras: pontas >= 2 ? avancoFace(linha) : 0, frente: pontas >= 1 ? avancoFace(linha) : 0 });
const passoCorredor = (cfg) => { const { atras, frente } = pontasDe(cfg); return atras + comprimentoFileira(cfg.modulos) + frente + LARGURA_CORREDOR; };
export const comprimentoDoCentro = (cfg) => Math.max(...cfg.filas) * passoCorredor(cfg) - LARGURA_CORREDOR; // como no desenho
// x0 = onde começam os módulos do corredor (a ponta de trás fica antes dele).
export function corredoresDe(cfg) {
  const { linha, filas } = cfg;
  const primeiro = comprimentoDoCentro(cfg) / 2 - pontasDe(cfg).frente - comprimentoFileira(cfg.modulos); // o corredor 1 encosta na entrada
  const passoZ = larguraFileira(linha) + LARGURA_CORREDOR;
  return filas.flatMap((n, f) => Array.from({ length: n }, (_, k) => ({ f, k, x0: primeiro - k * passoCorredor(cfg), z: ((filas.length - 1) / 2 - f) * passoZ })));
}
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
  const { montagem, linha, filas, cantos } = cfg;
  const p = paredesDe(cfg);
  const avanco = avancoFace(linha);
  const meioCentro = comprimentoDoCentro(cfg) / 2;
  const centro = montagem === "parede" ? null : {
    xMin: -meioCentro,
    xMax: meioCentro,
    z: ((filas.length - 1) / 2) * (larguraFileira(linha) + LARGURA_CORREDOR) + avanco,
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

const fmt = (v) => v.toFixed(2).replace(".", ",");

export function medidasDe(cfg) {
  const { montagem, modulos, pontas, linha, altura, filas, tipos, alturaParede, tiposParede } = cfg;
  const p = paredesDe(cfg);
  const corredores = filas.reduce((soma, n) => soma + n, 0);
  const emSequencia = Math.max(...filas); // a fila mais comprida
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
  const comprimentoCorredor = comprimentoFileira(modulos) + pontas * LINHAS[linha].medidaPonta;
  const comprimentoCentro = emSequencia * comprimentoCorredor + (emSequencia - 1) * LARGURA_CORREDOR;
  const larguraCentro = filas.length * larguraFileira(linha) + (filas.length - 1) * LARGURA_CORREDOR;
  const ocupado = `≈ ${fmt(l.xMax - l.xMin)} × ${fmt(l.zMax - l.zMin)} m`;
  return {
    comprimento: `≈ ${fmt(comprimentoCorredor)} m`, // de um corredor
    comprimentoTotal: emSequencia > 1 ? `≈ ${fmt(comprimentoCentro)} m` : "", // da fila mais comprida
    corredores,
    rotuloLargura: filas.length > 1 ? "Largura total" : "Largura",
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

// ── Mini porta palete: duas linhas, sempre com prateleira de MDF ──
// Na tela as linhas têm o nome da aparência, nunca o do fornecedor (decisão do Ale, 8-nov-2026).
// "preta" (MPP China): montante de 4 cm; o comprimento é a medida de tabela da inicial (1,00, 1,50 ou 2,00 m),
//   que o Ale escolheu até medir um montado; cada continuação mede 4 cm a menos.
// "cinza" (MPP Amapá): montante de 5 cm; o comprimento é a longarina (1,20 ou 1,80 m), como no orçamento.
//   A inicial mede a longarina + 10 cm (1,30 e 1,90) e a continuação + 5 cm (1,25 e 1,85).
//   O 500 kg leva transversina por baixo do MDF: 2 por nível na longarina de 1,20 e 3 na de 1,80.
export const MPP_LINHAS = {
  preta: {
    nome: "Preto", montante: 0.04, tamanho: ["inicial", "módulos"],
    pesos: { "200": "200 kg", "500": "500 kg" },
    comprimentos: { "1,00": 1, "1,50": 1.5, "2,00": 2 },
    vao: (c) => MPP_LINHAS.preta.comprimentos[c] - 2 * MPP_LINHAS.preta.montante,
    alturas: () => ["2,00", "2,50"],
    profundidades: () => ["0,60", "0,80"],
    cores: () => ["preta"],
    transversinas: () => 0,
  },
  cinza: {
    nome: "Cinza ou branco", montante: 0.05, tamanho: ["longarina", "longarinas"],
    pesos: { "250": "250 kg", "500": "500 kg" },
    comprimentos: { "1,20": 1.2, "1,80": 1.8 },
    vao: (c) => MPP_LINHAS.cinza.comprimentos[c],
    alturas: (peso) => (peso === "500" ? ["2,00", "3,00"] : ["2,00"]),
    profundidades: (peso) => (peso === "500" ? ["0,80"] : ["0,60"]),
    cores: (peso) => (peso === "500" ? ["cinza"] : ["cinza", "branco"]),
    transversinas: (peso, c) => (peso === "500" ? (c === "1,20" ? 2 : 3) : 0),
  },
};
export const MPP_CORES = { preta: "Preto", cinza: "Cinza e laranja", branco: "Branco" };
export const MPP_ALTURAS = { "2,00": 2, "2,50": 2.5, "3,00": 3 };
export const MPP_PROFUNDIDADES = { "0,60": 0.6, "0,80": 0.8 };
export const MIN_NIVEIS_MPP = 2;
export const MAX_NIVEIS_MPP = 6;
export const MAX_MODULOS_MPP = 10; // por fila: a inicial e as continuações, cada uma com o seu comprimento
export const MAX_FILAS_MPP = 6;

// O que muda junto com o peso: altura, profundidade e cor que não existem naquele peso voltam para a primeira que existe.
export function ajustarMPP(linha, m) {
  const L = MPP_LINHAS[linha], ok = (lista, v) => (lista.includes(v) ? v : lista[0]);
  return { ...m, altura: ok(L.alturas(m.peso), m.altura), profundidade: ok(L.profundidades(m.peso), m.profundidade), cor: ok(L.cores(m.peso), m.cor) };
}

// Confere uma montagem guardada: tudo tem que existir naquela linha.
export function mppValido(linha, m) {
  const L = MPP_LINHAS[linha];
  const tem = (lista, v) => typeof v === "string" && lista.includes(v);
  const entre = (n, a, b) => Number.isInteger(n) && n >= a && n <= b;
  return !!m && tem(Object.keys(L.pesos), m.peso) && tem(L.alturas(m.peso), m.altura) && tem(L.profundidades(m.peso), m.profundidade) && tem(L.cores(m.peso), m.cor)
    && Array.isArray(m.comprimentos) && entre(m.comprimentos.length, 1, MAX_MODULOS_MPP) && m.comprimentos.every((c) => tem(Object.keys(L.comprimentos), c))
    && entre(m.niveis, MIN_NIVEIS_MPP, MAX_NIVEIS_MPP) && entre(m.filas, 1, MAX_FILAS_MPP);
}

// m = a montagem da linha escolhida, com m.linha. m.comprimentos = um por módulo da fila, da inicial às continuações.
// Filas lado a lado, com um corredor entre elas e a mesma sequência de módulos; a fila 1 fica à esquerda (+Z), como no centro da gôndola.
export function layoutMPP(m) {
  const L = MPP_LINHAS[m.linha];
  const montante = L.montante;
  const vaos = m.comprimentos.map(L.vao); // entre os montantes de cada módulo
  const prof = MPP_PROFUNDIDADES[m.profundidade];
  const comprimento = vaos.reduce((soma, vao) => soma + vao + montante, montante);
  const passoZ = prof + LARGURA_CORREDOR;
  const meiaLargura = ((m.filas - 1) / 2) * passoZ + prof / 2;
  return {
    montante, vaos, prof, altura: MPP_ALTURAS[m.altura], comprimento, largura: 2 * meiaLargura,
    transversinas: m.comprimentos.map((c) => L.transversinas(m.peso, c)),
    filas: Array.from({ length: m.filas }, (_, f) => ((m.filas - 1) / 2 - f) * passoZ),
    xMin: -comprimento / 2, xMax: comprimento / 2, zMin: -meiaLargura, zMax: meiaLargura,
  };
}

export function medidasMPP(m) {
  const l = layoutMPP(m);
  const modulos = m.comprimentos.length, continuacoes = modulos - 1;
  const iguais = m.comprimentos.every((c) => c === m.comprimentos[0]);
  return {
    comprimento: `≈ ${fmt(l.comprimento)} m`,
    rotuloLargura: m.filas > 1 ? "Largura total" : "Profundidade",
    largura: `≈ ${fmt(l.largura)} m`,
    altura: `${fmt(l.altura)} m`,
    modulos: continuacoes ? `1 inicial + ${continuacoes} ${continuacoes === 1 ? "continuação" : "continuações"}` : "Só a inicial",
    // Tamanho de cada módulo: "1,50 m" ou "2,00 + 1,50 + 1,00 m" (na linha preta, medida de tabela; na cinza, a longarina)
    iguais,
    sequencia: iguais ? `${m.comprimentos[0]} m` : `${m.comprimentos.join(" + ")} m`,
    prateleiras: modulos * m.niveis * m.filas,
    resumo: `≈ ${fmt(l.comprimento)} × ${fmt(l.largura)} m`,
    espaco: `${fmt(LARGURA_CORREDOR)} m`,
  };
}
