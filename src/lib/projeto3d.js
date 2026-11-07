// Configurador 3D da gôndola da aba Projeto: peças geradas por código, sem arquivo de modelo.
// Carregado por import() só nessa aba, para não pesar no resto do sistema.
// Só desenha quando algo muda; parado, a tela não gasta bateria.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries, toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { COL_X, COL_Z, VAO, FACE_Z, LINHAS, ALTURAS, MAX_MODULOS, MAX_CORREDORES, LARGURA_CORREDOR, comprimentoFileira, larguraFileira } from "./projetoMedidas";

const Y_BASE = 0.135;
const CHAVES = ["aco", "amarelo", "furo", "nylon", "rosca", "arame", "gancho", "etiqueta"];
const GANCHOS_POR_REGUA = 5;
const PROF_CESTO = 0.37; // cesto 370 x 900 mm
const SALA_X = 32, SALA_Z = 32, PE_DIREITO = 3; // grande o bastante para a câmera recuar com 6 corredores no celular
const FATOR_CONTATO = 0.2;

// Prateleiras distribuídas por igual entre a base e o topo da coluna.
function alturaDe(chave) {
  const a = ALTURAS[chave];
  const topo = a.m - 0.02;
  const passo = (topo - Y_BASE) / a.prateleiras;
  return {
    m: a.m,
    paineis: a.paineis,
    topo,
    niveis: Array.from({ length: a.prateleiras }, (_, i) => Y_BASE + passo * (i + 1)),
    // Réguas e cestos ficam entre a bandeja da base e a do topo (mesma quantidade das prateleiras).
    entreBandejas: Array.from({ length: a.prateleiras }, (_, i) => Y_BASE + ((topo - Y_BASE) * (i + 1)) / (a.prateleiras + 1)),
  };
}

// ── Texturas feitas em código ────────────────────────────────────────────────
function folha(w, h = w) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return [c, c.getContext("2d")];
}

function ruidoAltura(tam, blur, seed = 1) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const [c, g] = folha(tam);
  const img = g.createImageData(tam, tam);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rnd() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  if (blur) {
    // Média de cópias deslocadas: o ctx.filter não é garantido no Safari. Repete o quadro ao redor para não deixar emenda.
    const [c2, g2] = folha(tam);
    let n = 0;
    for (const ox of [-blur, 0, blur]) for (const oy of [-blur, 0, blur]) {
      g2.globalAlpha = 1 / ++n;
      for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) g2.drawImage(c, x * tam + ox, y * tam + oy);
    }
    g2.globalAlpha = 1;
    return c2;
  }
  return c;
}

function alturaParaNormal(alturaCanvas, forca) {
  const tam = alturaCanvas.width;
  const src = alturaCanvas.getContext("2d").getImageData(0, 0, tam, tam).data;
  const [c, g] = folha(tam);
  const img = g.createImageData(tam, tam);
  const h = (x, y) => src[(((y + tam) % tam) * tam + ((x + tam) % tam)) * 4] / 255;
  for (let y = 0; y < tam; y++) for (let x = 0; x < tam; x++) {
    const dx = (h(x + 1, y) - h(x - 1, y)) * forca;
    const dy = (h(x, y + 1) - h(x, y - 1)) * forca;
    const l = Math.hypot(dx, dy, 1);
    const i = (y * tam + x) * 4;
    img.data[i] = (-dx / l * 0.5 + 0.5) * 255;
    img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255;
    img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

function textura(c, repete, srgb = false) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repete, repete);
  t.anisotropy = 16;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Piso cerâmico bege 60x60 com rejunte (a textura cobre 8x8 placas)
function texturasPiso(tam) {
  const n = 8, placa = tam / n, rej = tam * 0.0017;
  const [cor, gc] = folha(tam);
  const [rug, gr] = folha(tam);
  const [alt, ga] = folha(tam);
  gc.fillStyle = "#7f786c"; gc.fillRect(0, 0, tam, tam);
  gr.fillStyle = "#e8e8e8"; gr.fillRect(0, 0, tam, tam);
  ga.fillStyle = "#000"; ga.fillRect(0, 0, tam, tam);
  let s = 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) {
    const px = x * placa + rej / 2, py = y * placa + rej / 2, t = placa - rej;
    const v = (rnd() - 0.5) * 7;
    gc.fillStyle = `rgb(${214 + v},${209 + v},${197 + v})`;
    gc.fillRect(px, py, t, t);
    for (let i = 0; i < 26; i++) {
      gc.fillStyle = `rgba(${rnd() > 0.5 ? "255,250,238" : "150,140,122"},${0.012 + rnd() * 0.022})`;
      const r = t * (0.05 + rnd() * 0.22);
      gc.beginPath();
      gc.ellipse(px + rnd() * t, py + rnd() * t, r, r * (0.4 + rnd()), rnd() * 3.14, 0, 6.3);
      gc.save(); gc.rect(px, py, t, t); gc.clip(); gc.fill(); gc.restore();
    }
    const r = 62 + rnd() * 18;
    gr.fillStyle = `rgb(${r},${r},${r})`;
    gr.fillRect(px, py, t, t);
    ga.fillStyle = "#fff"; ga.fillRect(px, py, t, t);
  }
  // pontinhos do esmalte
  gc.globalAlpha = 0.05; gc.drawImage(ruidoAltura(1024, 0, 3), 0, 0, tam, tam); gc.globalAlpha = 1;
  gr.globalAlpha = 0.1; gr.drawImage(ruidoAltura(512, 1, 5), 0, 0, tam, tam); gr.globalAlpha = 1;
  const repete = 1 / (n * 0.6);
  const [mini, gm] = folha(tam / 2);
  gm.drawImage(alt, 0, 0, tam / 2, tam / 2);
  return { map: textura(cor, repete, true), roughnessMap: textura(rug, repete), normalMap: textura(alturaParaNormal(mini, 2.2), repete) };
}

// Forro de placas com perfil metálico
function texturasForro() {
  const tam = 1024, n = 4, placa = tam / n;
  const [cor, g] = folha(tam);
  g.fillStyle = "#eceae5"; g.fillRect(0, 0, tam, tam);
  g.globalAlpha = 0.16; g.drawImage(ruidoAltura(512, 1, 9), 0, 0, tam, tam); g.globalAlpha = 1;
  g.strokeStyle = "#bdbab3"; g.lineWidth = 5;
  for (let i = 0; i <= n; i++) {
    g.beginPath(); g.moveTo(i * placa, 0); g.lineTo(i * placa, tam); g.stroke();
    g.beginPath(); g.moveTo(0, i * placa); g.lineTo(tam, i * placa); g.stroke();
  }
  return { map: textura(cor, 1 / (n * 0.625), true) };
}

// Sombra de contato: a luz do forro quase não chega embaixo da base
function texturaContato() {
  const [c, g] = folha(512);
  const m = 512 * FATOR_CONTATO;
  g.fillStyle = "#000"; // alphaMap lê o canal verde: fundo preto = sem sombra
  g.fillRect(0, 0, 512, 512);
  // Desenha o retângulo fora da folha e fica só com a sombra dele, igual em todos os navegadores.
  g.shadowColor = "#fff";
  g.shadowBlur = 68;
  g.shadowOffsetX = 1024;
  g.fillRect(m - 1024, m, 512 - 2 * m, 512 - 2 * m);
  return new THREE.CanvasTexture(c);
}

// ── Peças ────────────────────────────────────────────────────────────────────
const caixa = (x, y, z, r = 0.0015) => new RoundedBoxGeometry(x, y, z, 2, r);

function extrudar(shape, espessura, curva = 8) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: espessura, bevelEnabled: false, curveSegments: curva });
  return toCreasedNormals(g, 0.6);
}

// Extrusão ao longo de X: o desenho fica em (profundidade, altura) e vai de x=0 a x=comp
function aoLongo(shape, comp, curva) {
  const g = extrudar(shape, comp, curva);
  g.rotateY(-Math.PI / 2);
  g.translate(comp, 0, 0);
  return g;
}

function perfilBandeja(prof, aba) {
  const e = 0.0016;
  const s = new THREE.Shape();
  s.moveTo(0, -0.02);
  s.lineTo(0, 0);
  s.lineTo(prof, 0);
  s.lineTo(prof, -aba);
  s.lineTo(prof - 0.014, -aba);
  s.lineTo(prof - 0.014, -aba + e);
  s.lineTo(prof - e, -aba + e);
  s.lineTo(prof - e, -e);
  s.lineTo(e, -e);
  s.lineTo(e, -0.02);
  s.closePath();
  return s;
}

// Porta-etiqueta amarelo: encaixa na aba e tem o lábio arredondado da foto
function perfilEtiqueta(prof, aba) {
  const s = new THREE.Shape();
  s.moveTo(prof - 0.0005, 0.003);
  s.lineTo(prof + 0.0075, 0.003);
  s.lineTo(prof + 0.0105, 0.0005);
  s.lineTo(prof + 0.0125, -aba * 0.5);
  s.lineTo(prof + 0.0135, -aba + 0.0025);
  s.lineTo(prof + 0.0115, -aba - 0.0025);
  s.lineTo(prof + 0.004, -aba - 0.0035);
  s.lineTo(prof - 0.0005, -aba - 0.0035);
  s.closePath();
  return s;
}

// Mão-francesa vista de lado: reta embaixo da bandeja e curva até a coluna
function perfilMaoFrancesa(prof, alt) {
  const L = prof * 0.84;
  const s = new THREE.Shape();
  s.moveTo(-0.006, -0.0018);
  s.lineTo(L, -0.0018);
  s.quadraticCurveTo(L + 0.006, -0.0018, L + 0.004, -0.012);
  s.lineTo(L * 0.86, -0.024);
  s.bezierCurveTo(L * 0.55, -0.03, L * 0.25, -alt * 0.45, 0.022, -alt);
  s.lineTo(-0.006, -alt);
  s.closePath();
  const f = new THREE.Path();
  f.moveTo(0.03, -0.012);
  f.lineTo(L * 0.62, -0.012);
  f.quadraticCurveTo(L * 0.3, -0.02, 0.03, -alt * 0.62);
  f.closePath();
  s.holes.push(f);
  return s;
}

function pe(partes, x, z) {
  const barra = caixa(0.028, Y_BASE - 0.062, 0.028, 0.002);
  barra.translate(x, (Y_BASE - 0.05 + 0.024) / 2, z);
  partes.aco.push(barra);
  const rosca = new THREE.CylinderGeometry(0.005, 0.005, 0.016, 12);
  rosca.translate(x, 0.016, z);
  partes.rosca.push(rosca);
  const perfil = [[0, 0], [0.019, 0], [0.021, 0.002], [0.021, 0.005], [0.017, 0.009], [0.009, 0.011], [0, 0.011]]
    .map(([a, b]) => new THREE.Vector2(a, b));
  const sapata = new THREE.LatheGeometry(perfil, 18);
  sapata.translate(x, 0, z);
  partes.nylon.push(sapata);
}

const novaPartes = () => Object.fromEntries(CHAVES.map((k) => [k, []]));

// Régua presa no painel, com os ganchos de 25 cm saindo para a frente e subindo na ponta.
function regua(partes, y, larg) {
  const z = FACE_Z + 0.007;
  const barra = caixa(larg - 0.002, 0.028, 0.01, 0.0015);
  barra.translate(larg / 2, y, z);
  partes.arame.push(barra);
  for (const x of [0.012, larg - 0.012]) {
    const encaixe = new THREE.BoxGeometry(0.024, 0.034, 0.016);
    encaixe.translate(x, y, z);
    partes.arame.push(encaixe);
  }
  const curva = new THREE.CatmullRomCurve3([[0, 0], [0.004, 0.06], [0.016, 0.18], [0.03, 0.245], [0.052, 0.25]].map(([a, b]) => new THREE.Vector3(0, a, b)));
  for (let i = 0; i < GANCHOS_POR_REGUA; i++) {
    const x = (larg * (i + 0.5)) / GANCHOS_POR_REGUA;
    const presilha = new THREE.BoxGeometry(0.016, 0.032, 0.005);
    presilha.translate(x, y, z + 0.007);
    partes.arame.push(presilha);
    const brilho = new THREE.BoxGeometry(0.007, 0.012, 0.001); // a pecinha clara que aparece na foto
    brilho.translate(x, y + 0.004, z + 0.0102);
    partes.rosca.push(brilho);
    const gancho = new THREE.TubeGeometry(curva, 10, 0.004, 5, false);
    gancho.translate(x, y, z + 0.008);
    partes.gancho.push(gancho);
  }
}

// Cesto aramado: fundo em grade, costas altas, laterais em rampa e etiqueta na frente, como na foto.
function cesto(partes, y, larg) {
  const e = 0.0032, aro = 0.0048;
  const z0 = FACE_Z + 0.006, z1 = z0 + PROF_CESTO, zMeio = (z0 + z1) / 2;
  const ALTO_FUNDO = 0.165, ALTO_FRENTE = 0.05, RETO = 0.12;
  const comp = larg - 0.008;
  const fio = (w, h, d, x, yy, z) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, yy, z);
    partes.arame.push(g);
  };
  for (let x = 0.015; x < larg - 0.005; x += 0.03) {
    fio(e, e, PROF_CESTO, x, y, zMeio);
    fio(e, ALTO_FUNDO, e, x, y + ALTO_FUNDO / 2, z0);
    fio(e, ALTO_FRENTE, e, x, y + ALTO_FRENTE / 2, z1);
  }
  for (let z = z0; z < z1 + 0.001; z += 0.06) fio(comp, e, e, larg / 2, y + e, z);
  fio(comp, aro, aro, larg / 2, y + ALTO_FUNDO, z0);
  fio(comp, aro, aro, larg / 2, y + ALTO_FRENTE, z1);
  fio(comp, aro, aro, larg / 2, y, z1);
  const altoEm = (z) => (z < z0 + RETO ? ALTO_FUNDO : ALTO_FUNDO + ((ALTO_FRENTE - ALTO_FUNDO) * (z - z0 - RETO)) / (PROF_CESTO - RETO));
  const dz = PROF_CESTO - RETO, dy = ALTO_FUNDO - ALTO_FRENTE;
  for (const x of [0.007, larg - 0.007]) {
    for (let z = z0 + 0.035; z < z1 - 0.005; z += 0.035) fio(e, altoEm(z), e, x, y + altoEm(z) / 2, z);
    fio(aro, aro, RETO, x, y + ALTO_FUNDO, z0 + RETO / 2);
    fio(aro, aro, PROF_CESTO, x, y, zMeio);
    const rampa = new THREE.BoxGeometry(aro, aro, Math.hypot(dz, dy));
    rampa.rotateX(Math.atan2(dy, dz));
    rampa.translate(x, y + (ALTO_FUNDO + ALTO_FRENTE) / 2, z0 + RETO + dz / 2);
    partes.arame.push(rampa);
    fio(0.02, 0.05, 0.006, x + (x < larg / 2 ? 0.012 : -0.012), y + 0.1, FACE_Z + 0.003); // suporte no painel
  }
  const etiqueta = new THREE.BoxGeometry(larg - 0.014, 0.04, 0.003);
  etiqueta.rotateX(-0.42);
  etiqueta.translate(larg / 2, y + ALTO_FRENTE + 0.002, z1 + 0.008);
  partes.etiqueta.push(etiqueta);
}

// Uma face de gôndola: painéis, base, prateleiras e régua amarela; ou gancho e cesto entre a base e o topo.
// Local: a bandeja vai de x=0 a x=larg e a frente aponta para +Z.
function face(partes, larg, linha, alt, tipo = "bandeja") {
  const hPainel = (alt.m - 0.055) / alt.paineis;
  for (let i = 0; i < alt.paineis; i++) {
    const p = caixa(larg - 0.001, hPainel - 0.0016, 0.004, 0.0012);
    p.translate(larg / 2, 0.055 + hPainel * (i + 0.5), FACE_Z - 0.002);
    partes.aco.push(p);
  }
  const nivel = (y, prof, aba, altMao) => {
    const b = aoLongo(perfilBandeja(prof, aba), larg);
    b.translate(0, y, FACE_Z);
    partes.aco.push(b);
    // dobra lateral da bandeja
    for (const x of [0.0007, larg - 0.0007]) {
      const dobra = caixa(0.0014, aba, prof - 0.001, 0.0004);
      dobra.translate(x, y - aba / 2, FACE_Z + prof / 2);
      partes.aco.push(dobra);
    }
    const e = aoLongo(perfilEtiqueta(prof, aba), larg + 0.022, 6);
    e.translate(-0.011, y, FACE_Z);
    partes.amarelo.push(e);
    if (altMao) {
      for (const x of [0.0015, larg - 0.0045]) {
        const m = aoLongo(perfilMaoFrancesa(prof, altMao), 0.003, 10);
        m.translate(x, y, FACE_Z);
        partes.aco.push(m);
      }
    }
  };
  nivel(Y_BASE, linha.profBase, 0.045, 0);
  if (tipo === "bandeja") {
    for (const y of alt.niveis) nivel(y, linha.profPrat, 0.038, 0.13);
    return;
  }
  nivel(alt.topo, linha.profPrat, 0.038, 0.13);
  for (const y of alt.entreBandejas) (tipo === "gancho" ? regua : cesto)(partes, y, larg);
}

// Coluna com fileiras de furos de 25 mm e os pés da base
function coluna(partes, x, lados, linha, alt, soBaseETopo = false) {
  const c = caixa(COL_X, alt.m, COL_Z, 0.002);
  c.translate(x, alt.m / 2, 0);
  partes.aco.push(c);
  for (const lado of lados) {
    for (let y = 0.18; y < alt.m - 0.02; y += 0.025) {
      for (const dx of [-0.0075, 0.0075]) {
        const f = new THREE.PlaneGeometry(0.0055, 0.014);
        if (lado < 0) f.rotateY(Math.PI);
        f.translate(x + dx, y, lado * (COL_Z / 2 + 0.0003));
        partes.furo.push(f);
      }
    }
    for (const [y, prof] of [[Y_BASE, linha.profBase], ...(soBaseETopo ? [alt.topo] : alt.niveis).map((n) => [n, linha.profPrat])]) {
      const tampa = caixa(COL_X + 0.024, 0.0012, prof - 0.003, 0.0004);
      tampa.translate(x, y - 0.0026, lado * (FACE_Z + prof / 2 - 0.0015));
      partes.furo.push(tampa);
    }
    const trilho = caixa(0.022, 0.03, linha.profBase, 0.002);
    trilho.translate(x, Y_BASE - 0.062, lado * (FACE_Z + linha.profBase / 2));
    partes.aco.push(trilho);
    pe(partes, x, lado * (FACE_Z + linha.profBase - 0.022));
    pe(partes, x, lado * (FACE_Z + 0.02));
  }
}

// Mantém a textura da pintura no mesmo tamanho em todas as peças
function uvProjetado(g) {
  const p = g.attributes.position, n = g.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    if (nx >= ny && nx >= nz) { uv[i * 2] = p.getZ(i); uv[i * 2 + 1] = p.getY(i); }
    else if (ny >= nz) { uv[i * 2] = p.getX(i); uv[i * 2 + 1] = p.getZ(i); }
    else { uv[i * 2] = p.getX(i); uv[i * 2 + 1] = p.getY(i); }
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

function juntar(partes) {
  const lista = [];
  for (const k of CHAVES) {
    if (!partes[k].length) continue;
    const g = mergeGeometries(partes[k].map((p) => (p.index ? p.toNonIndexed() : p)));
    partes[k].forEach((p) => p.dispose());
    if (k === "aco") uvProjetado(g);
    lista.push({ k, g });
  }
  return lista;
}

// Só a estrutura do módulo: cada lado é um modelo à parte, para poder ser bandeja, gancho ou cesto.
function modeloModulo(linha, alt) {
  const partes = novaPartes();
  const miolo = caixa(VAO, alt.m - 0.055, 2 * (FACE_Z - 0.005), 0.001);
  miolo.translate(VAO / 2, 0.055 + (alt.m - 0.055) / 2, 0);
  partes.aco.push(miolo);
  coluna(partes, VAO + COL_X / 2, [1, -1], linha, alt, true);
  return juntar(partes);
}

// Um lado do módulo, virado para +Z; o outro lado usa o mesmo modelo girado 180°.
function modeloFace(linha, alt, tipo) {
  const partes = novaPartes();
  face(partes, VAO, linha, alt, tipo);
  if (tipo === "bandeja") {
    // Fecha o vão sobre as colunas nas prateleiras do meio; base e topo já vêm com a coluna.
    for (const y of alt.niveis.slice(0, -1)) for (const x of [-COL_X / 2, VAO + COL_X / 2]) {
      const tampa = caixa(COL_X + 0.024, 0.0012, linha.profPrat - 0.003, 0.0004);
      tampa.translate(x, y - 0.0026, FACE_Z + linha.profPrat / 2 - 0.0015);
      partes.furo.push(tampa);
    }
  }
  return juntar(partes);
}

function modeloColunaInicial(linha, alt) {
  const partes = novaPartes();
  coluna(partes, -COL_X / 2, [1, -1], linha, alt, true);
  return juntar(partes);
}

// A ponta encosta no fim da fileira, com as prateleiras viradas para +X
function modeloPonta(linha, alt) {
  const partes = novaPartes();
  const vao = linha.vaoPonta;
  const miolo = caixa(vao, alt.m - 0.055, 2 * (FACE_Z - 0.005), 0.001);
  miolo.translate(vao / 2, 0.055 + (alt.m - 0.055) / 2, 0);
  partes.aco.push(miolo);
  face(partes, vao, linha, alt);
  coluna(partes, -COL_X / 2, [1], linha, alt);
  coluna(partes, vao + COL_X / 2, [1], linha, alt);
  for (const k of CHAVES) {
    for (const g of partes[k]) { g.translate(-vao / 2, 0, 0); g.rotateY(Math.PI / 2); g.translate(FACE_Z, 0, 0); }
  }
  return juntar(partes);
}

// ── Motor ────────────────────────────────────────────────────────────────────
export function criarProjeto3D({ canvas, camadaRotulos, compacto = false, semMovimento = false, config, aoMudarVista, aoInteragir, aoFalhar, aoVoltar }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  const NITIDEZ_PARADO = Math.min(window.devicePixelRatio || 1, 2);
  let nitidezGirando = Math.min(window.devicePixelRatio || 1, compacto ? 1.25 : 1);
  renderer.setPixelRatio(NITIDEZ_PARADO);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const estado = { modulos: config.modulos, pontas: config.pontas, linha: config.linha, altura: config.altura, corredores: config.corredores, tipos: config.tipos, vista: config.vista || "ponta", ladoCamera: 1 };

  const normalPintura = textura(alturaParaNormal(ruidoAltura(512, 1.2, 11), 1.4), 9);
  const MAT = {
    aco: new THREE.MeshStandardMaterial({ color: 0x161618, roughness: 0.44, metalness: 0, normalMap: normalPintura, normalScale: new THREE.Vector2(0.08, 0.08), envMapIntensity: 0.72 }),
    amarelo: new THREE.MeshStandardMaterial({ color: 0xffbf00, roughness: 0.34, envMapIntensity: 1 }),
    furo: new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 1 }),
    nylon: new THREE.MeshStandardMaterial({ color: 0x151517, roughness: 0.62 }),
    rosca: new THREE.MeshStandardMaterial({ color: 0x8b8b88, metalness: 1, roughness: 0.42 }),
    arame: new THREE.MeshStandardMaterial({ color: 0x2c2c32, roughness: 0.36, metalness: 0.2, envMapIntensity: 1 }),
    gancho: new THREE.MeshStandardMaterial({ color: 0x5a5a64, roughness: 0.3, metalness: 0.4, envMapIntensity: 1.1 }), // mais claro: preto sobre painel preto some
    etiqueta: new THREE.MeshStandardMaterial({ color: 0x9fb0e0, roughness: 0.2, envMapIntensity: 0.8, transparent: true, opacity: 0.7 }),
  };

  const cena = new THREE.Scene();
  cena.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(compacto ? 42 : 34, 1, 0.05, 120);
  const controles = new OrbitControls(camera, canvas);
  controles.enableDamping = !semMovimento;
  controles.dampingFactor = 0.07;
  controles.enablePan = false;
  controles.maxPolarAngle = 1.54;
  controles.minDistance = 1.2;
  controles.maxDistance = SALA_Z - 2.5;
  controles.target.set(0, 0.95, 0);
  // Dedo na vertical rola a página; gesto que começa para o lado gira em qualquer direção.
  canvas.style.touchAction = "pan-y";
  // Rodinha do mouse só aproxima depois de clicar na cena: sem isso, ela prenderia a rolagem da página.
  const toque = window.matchMedia?.("(pointer: coarse)").matches;
  controles.enableZoom = !!toque;

  // Loja
  const sala = new THREE.Group();
  cena.add(sala);
  const pisoMat = new THREE.MeshStandardMaterial({ ...texturasPiso(compacto ? 1024 : 2048), roughness: 1, metalness: 0, normalScale: new THREE.Vector2(0.5, 0.5), envMapIntensity: 1 });
  function plano(mat, larg, prof, ajusta) {
    const g = new THREE.PlaneGeometry(larg, prof);
    const uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getY(i));
    const m = new THREE.Mesh(g, mat);
    ajusta(m);
    sala.add(m);
    return m;
  }
  plano(pisoMat, SALA_X * 2, SALA_Z * 2, (m) => { m.rotation.x = -Math.PI / 2; m.receiveShadow = true; });
  plano(new THREE.MeshStandardMaterial({ ...texturasForro(), roughness: 0.9 }), SALA_X * 2, SALA_Z * 2, (m) => { m.rotation.x = Math.PI / 2; m.position.y = PE_DIREITO; });
  const paredeMat = new THREE.MeshStandardMaterial({ color: 0xcfcbc2, roughness: 0.85 });
  const rodapeMat = new THREE.MeshStandardMaterial({ color: 0x8d877b, roughness: 0.5 });
  for (const [x, z, ry, larg] of [[0, -SALA_Z, 0, SALA_X * 2], [0, SALA_Z, Math.PI, SALA_X * 2], [-SALA_X, 0, Math.PI / 2, SALA_Z * 2], [SALA_X, 0, -Math.PI / 2, SALA_Z * 2]]) {
    plano(paredeMat, larg, PE_DIREITO, (m) => { m.position.set(x, PE_DIREITO / 2, z); m.rotation.y = ry; });
    const rodape = new THREE.Mesh(caixa(larg, 0.1, 0.012, 0.002), rodapeMat);
    rodape.position.set(x, 0.05, z);
    rodape.rotation.y = ry;
    sala.add(rodape);
  }

  // Painéis de LED: acesos de verdade, entram no reflexo do piso e das réguas
  {
    const ledGeo = new THREE.PlaneGeometry(0.62, 0.62);
    ledGeo.rotateX(Math.PI / 2);
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1, emissive: 0xffffff, emissiveIntensity: 8 });
    const posicoes = [];
    for (let x = -30; x <= 30; x += 3.75) for (let z = -30; z <= 30; z += 3.75) posicoes.push([x, z]);
    const leds = new THREE.InstancedMesh(ledGeo, ledMat, posicoes.length);
    const molduras = new THREE.InstancedMesh(caixa(0.66, 0.01, 0.66, 0.002), new THREE.MeshStandardMaterial({ color: 0xcfcdc7, roughness: 0.5 }), posicoes.length);
    const m = new THREE.Matrix4();
    posicoes.forEach(([x, z], i) => {
      leds.setMatrixAt(i, m.makeTranslation(x, PE_DIREITO - 0.012, z));
      molduras.setMatrixAt(i, m.makeTranslation(x, PE_DIREITO - 0.001, z));
    });
    sala.add(leds, molduras);
  }

  // Luzes com sombra: uma por fila de painéis perto da gôndola
  const luzGeral = new THREE.HemisphereLight(0xffffff, 0xd8d2c6, 0.75);
  cena.add(luzGeral);
  const sombras = new THREE.Group();
  cena.add(sombras);
  const mapaSombra = compacto ? 1024 : 2048;
  function luzDoForro(x, z, intensidade, comSombra = true) {
    const s = new THREE.SpotLight(0xffffff, intensidade, 9, 1.28, 0.9, 1.6);
    s.position.set(x, PE_DIREITO - 0.05, z);
    s.target.position.set(x, 0, z);
    s.castShadow = comSombra;
    s.shadow.mapSize.set(mapaSombra, mapaSombra);
    s.shadow.radius = 6;
    s.shadow.blurSamples = 16;
    s.shadow.bias = -0.0004;
    s.shadow.normalBias = 0.012;
    s.shadow.camera.near = 0.3;
    s.shadow.camera.far = 6;
    sombras.add(s, s.target);
  }
  luzDoForro(-1.875, 1.9, 16);
  luzDoForro(1.875, -1.9, 16);
  luzDoForro(1.875, 1.9, 11, false);
  luzDoForro(-1.875, -1.9, 11, false);

  const contatoMat = new THREE.MeshBasicMaterial({ alphaMap: texturaContato(), color: 0x050403, transparent: true, opacity: 0.62, depthWrite: false, toneMapped: false });
  const pernas = 1 / (1 - 2 * FATOR_CONTATO);
  const contatos = new THREE.Group(); // uma sombra por fileira
  const contatoGeo = new THREE.PlaneGeometry(1, 1);
  for (let i = 0; i < MAX_CORREDORES; i++) {
    const c = new THREE.Mesh(contatoGeo, contatoMat);
    c.rotation.x = -Math.PI / 2;
    c.position.y = 0.002;
    contatos.add(c);
  }
  cena.add(contatos);

  const gondola = new THREE.Group();
  cena.add(gondola);

  // Reflexo no piso: a gôndola espelhada vai para uma imagem pequena e desfocada,
  // que escurece o brilho do forro e devolve o amarelo das réguas, como cerâmica de verdade.
  const reflexo = new THREE.Group();
  reflexo.scale.y = -1;
  const reflexoCena = new THREE.Scene();
  reflexoCena.add(reflexo, new THREE.HemisphereLight(0xffffff, 0xd8d2c6, 1.6));
  const reflexoAlvo = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
  const uReflexo = { tReflexo: { value: reflexoAlvo.texture }, uTela: { value: new THREE.Vector2(1, 1) } };
  pisoMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uReflexo);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2D tReflexo; uniform vec2 uTela;")
      .replace("#include <opaque_fragment>", `
        vec2 refUv = gl_FragCoord.xy / uTela;
        vec3 refV = normalize(vViewPosition);
        float refF = 0.05 + 0.42 * pow(1.0 - clamp(dot(normal, refV), 0.0, 1.0), 5.0);
        refF *= smoothstep(0.8, 0.4, roughnessFactor);
        vec4 refC = (textureLod(tReflexo, refUv, 2.0) + textureLod(tReflexo, refUv, 3.5)) * 0.5;
        float refA = clamp(refC.a * 1.35, 0.0, 1.0) * refF;
        outgoingLight = outgoingLight * (1.0 - refA * 0.8) + refC.rgb * refF * 0.62;
        #include <opaque_fragment>`);
  };

  // Luz geral vinda do próprio ambiente: captura a loja vazia e usa como reflexo.
  let ambiente = null;
  function capturarAmbiente() {
    const ocultos = [luzGeral, sombras, contatos, gondola];
    ocultos.forEach((o) => { o.visible = false; });
    cena.environment = null;
    const cubo = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
    const cc = new THREE.CubeCamera(0.1, 80, cubo);
    cc.position.set(0, 1.5, 0);
    const fill = new THREE.HemisphereLight(0xffffff, 0xcfc9bc, 2.6);
    cena.add(fill);
    const mapa = renderer.toneMapping;
    renderer.toneMapping = THREE.NoToneMapping;
    cc.update(renderer, cena);
    renderer.toneMapping = mapa;
    cena.remove(fill);
    fill.dispose();
    const pmrem = new THREE.PMREMGenerator(renderer);
    ambiente?.dispose();
    ambiente = pmrem.fromCubemap(cubo.texture).texture;
    pmrem.dispose();
    cubo.dispose();
    ocultos.forEach((o) => { o.visible = true; });
    cena.environment = reflexoCena.environment = ambiente;
    cena.environmentIntensity = reflexoCena.environmentIntensity = 0.62;
  }
  capturarAmbiente();

  function desenharReflexo() {
    const cor = new THREE.Color();
    renderer.getClearColor(cor);
    const alfa = renderer.getClearAlpha();
    renderer.setRenderTarget(reflexoAlvo);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(reflexoCena, camera);
    renderer.setRenderTarget(null);
    renderer.setClearColor(cor, alfa);
  }

  // ── Montagem ──
  // Instâncias: cada tipo de peça é desenhado de uma vez só, então muitas fileiras não pesam em chamadas de desenho.
  const CAPACIDADE = { modulo: MAX_MODULOS * MAX_CORREDORES, inicio: MAX_CORREDORES, ponta: 2 * MAX_CORREDORES, face: 2 * MAX_MODULOS * MAX_CORREDORES };
  const modelos = new Map(); // "linha:altura:tipo" → modelo (fica guardado para trocar de opção sem refazer)
  function modelo(linha, altura, tipo) {
    const chave = `${linha}:${altura}:${tipo}`;
    if (modelos.has(chave)) return modelos.get(chave);
    const def = LINHAS[linha], alt = alturaDe(altura);
    const ehFace = tipo.startsWith("face:");
    const partes = ehFace ? modeloFace(def, alt, tipo.slice(5)) : tipo === "modulo" ? modeloModulo(def, alt) : tipo === "inicio" ? modeloColunaInicial(def, alt) : modeloPonta(def, alt);
    const cap = CAPACIDADE[ehFace ? "face" : tipo];
    const matriz = new THREE.InstancedBufferAttribute(new Float32Array(cap * 16), 16);
    matriz.setUsage(THREE.DynamicDrawUsage);
    const malhas = [];
    const instancia = (g, k) => {
      const m = new THREE.InstancedMesh(g, MAT[k], cap);
      m.instanceMatrix = matriz;
      m.count = 0;
      m.frustumCulled = false;
      malhas.push(m);
      return m;
    };
    for (const { k, g } of partes) {
      const m = instancia(g, k);
      m.castShadow = !["furo", "arame", "gancho", "etiqueta"].includes(k); // fio fino não faz sombra que apareça e custa caro
      m.receiveShadow = true;
      gondola.add(m);
      reflexo.add(instancia(g, k));
    }
    const novo = { matriz, malhas, usados: 0 };
    modelos.set(chave, novo);
    return novo;
  }

  const fileiras = () => estado.corredores; // cada corredor é uma fileira
  const passoFileiras = () => larguraFileira(estado.linha) + LARGURA_CORREDOR;
  const zDaFileira = (f) => (f - (fileiras() - 1) / 2) * passoFileiras();

  const unidades = [];
  const matrizUnidade = new THREE.Matrix4();
  function escreverPosicoes() {
    for (const u of unidades) {
      matrizUnidade.makeRotationY(u.rot);
      matrizUnidade.setPosition(u.xAtual, u.yAtual, u.zAtual);
      matrizUnidade.toArray(u.modelo.matriz.array, u.slot * 16);
    }
    modelos.forEach((m) => { m.matriz.needsUpdate = true; });
  }

  function limites() {
    const L = comprimentoFileira(estado.modulos);
    const avanco = FACE_Z + LINHAS[estado.linha].profBase + 0.015;
    const metade = ((fileiras() - 1) / 2) * passoFileiras();
    return { xMin: -L / 2 - (estado.pontas >= 2 ? avanco : 0), xMax: L / 2 + (estado.pontas >= 1 ? avanco : 0), z: metade + avanco, avanco };
  }

  function montar() {
    const L = comprimentoFileira(estado.modulos);
    const x0 = -L / 2;
    const querer = new Map();
    for (let f = 0; f < fileiras(); f++) {
      const z = zDaFileira(f);
      const pos = (tipo, chave, x, rot) => querer.set(`${estado.linha}:${estado.altura}:${f}:${chave}`, { tipo, x, z, rot });
      pos("inicio", "inicio", x0 + COL_X, 0);
      for (let i = 0; i < estado.modulos; i++) {
        const xi = x0 + COL_X + i * (VAO + COL_X);
        const { esq, dir } = estado.tipos[i];
        pos("modulo", `m${i}`, xi, 0);
        pos(`face:${esq}`, `m${i}:esq:${esq}`, xi, 0); // lado esquerdo = +Z, visto de quem está na ponta olhando a fileira
        pos(`face:${dir}`, `m${i}:dir:${dir}`, xi + VAO, Math.PI);
      }
      if (estado.pontas >= 1) pos("ponta", "pontaD", L / 2, 0);
      if (estado.pontas >= 2) pos("ponta", "pontaE", -L / 2, Math.PI);
    }
    for (let i = unidades.length - 1; i >= 0; i--) if (!querer.has(unidades[i].chave)) unidades.splice(i, 1);
    modelos.forEach((m) => { m.usados = 0; });
    for (const [chave, q] of querer) {
      let u = unidades.find((v) => v.chave === chave);
      if (!u) {
        u = { chave, modelo: modelo(estado.linha, estado.altura, q.tipo), xAtual: q.x, zAtual: q.z, yAtual: semMovimento ? 0 : 0.55 };
        unidades.push(u);
      }
      u.xAlvo = q.x; u.zAlvo = q.z; u.rot = q.rot;
      u.slot = u.modelo.usados++;
    }
    modelos.forEach((m) => { m.malhas.forEach((malha) => { malha.count = m.usados; malha.visible = m.usados > 0; }); });
    escreverPosicoes();

    const { xMin, xMax, avanco } = limites();
    contatos.children.forEach((c, f) => {
      c.visible = f < fileiras();
      if (!c.visible) return;
      c.position.set((xMin + xMax) / 2, 0.002, zDaFileira(f));
      c.scale.set((xMax - xMin + 0.16) * pernas, (2 * avanco + 0.16) * pernas, 1);
    });
    renderer.shadowMap.needsUpdate = true;
    pedirQuadro(3);
  }

  // ── Câmeras prontas ──
  let voo = null;
  // Distância exata para a gôndola inteira caber no quadro, seja qual for o formato da tela.
  // Com "centrar", também move a mira para a gôndola ficar no meio da imagem.
  function enquadrar(dir, alvo, centrar = true) {
    const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), th = tv * camera.aspect;
    const direita = new THREE.Vector3(0, 1, 0).cross(dir).normalize();
    const cima = dir.clone().cross(direita).normalize();
    const { xMin, xMax, z } = limites();
    const v = new THREE.Vector3();
    let d = 0;
    for (let passo = 0; passo < (centrar ? 3 : 1); passo++) {
      const cantos = [];
      d = 0;
      for (const x of [xMin, xMax]) for (const y of [0, ALTURAS[estado.altura].m]) for (const zz of [-z, z]) {
        v.set(x, y, zz).sub(alvo);
        const c = [v.dot(direita), v.dot(cima), v.dot(dir)];
        cantos.push(c);
        d = Math.max(d, Math.abs(c[0]) / th + c[2], Math.abs(c[1]) / tv + c[2]);
      }
      if (!centrar) break;
      const telaX = cantos.map((c) => c[0] / ((d - c[2]) * th)), telaY = cantos.map((c) => c[1] / ((d - c[2]) * tv));
      alvo.addScaledVector(direita, ((Math.min(...telaX) + Math.max(...telaX)) / 2) * d * th);
      alvo.addScaledVector(cima, ((Math.min(...telaY) + Math.max(...telaY)) / 2) * d * tv);
    }
    return Math.min(d * (compacto ? 1.08 : 1.06), controles.maxDistance);
  }

  function irPara(vista, instantaneo) {
    estado.vista = vista;
    controles.autoRotate = vista === "giro" && !semMovimento;
    const { xMin, xMax } = limites();
    const total = xMax - xMin;
    const varias = fileiras() > 1;
    const alvo = new THREE.Vector3((xMin + xMax) / 2, ALTURAS[estado.altura].m / 2, 0);
    // Com mais de uma fileira a câmera sobe e fica mais de lado, para os corredores aparecerem.
    const azQuina = varias ? 1.15 : compacto ? 0.95 : 0.82;
    const subida = varias ? 0.2 : 0.1;
    let p;
    if (vista === "corredor") {
      const d = Math.min(total / 2 + 1.4, 6);
      const lado = estado.pontas >= 1 ? 1 : -1;
      const z = varias ? zDaFileira(Math.floor((fileiras() - 2) / 2)) + passoFileiras() / 2 : FACE_Z + LINHAS[estado.linha].profBase + 0.9;
      p = new THREE.Vector3(lado * d, 1.5, z);
      alvo.set(0, 1.0, varias ? z : 0.1);
    } else if (vista === "giro") {
      // Longe o bastante para caber em qualquer ângulo da volta inteira.
      const dir = new THREE.Vector3(Math.sin(azQuina), subida, Math.cos(azQuina) * estado.ladoCamera).normalize();
      let d = 0;
      for (let a = 0; a < Math.PI; a += 0.26) d = Math.max(d, enquadrar(new THREE.Vector3(Math.sin(a), subida, Math.cos(a)).normalize(), alvo, false));
      p = dir.multiplyScalar(d).add(alvo);
    } else {
      // Tela estreita: fileira longa não cabe de frente, então a câmera fica um pouco de lado.
      const az = vista === "frente" ? (camera.aspect < 1.1 ? THREE.MathUtils.clamp((total - 3) * 0.22, 0, 0.95) : 0) : azQuina;
      const dir = new THREE.Vector3(Math.sin(az), vista === "frente" ? (varias ? 0.12 : 0.05) : subida, Math.cos(az) * estado.ladoCamera).normalize();
      const d = enquadrar(dir, alvo);
      p = dir.multiplyScalar(d).add(alvo);
    }
    p.y = Math.min(p.y, PE_DIREITO - 0.3); // não atravessa o forro
    if (instantaneo || semMovimento) {
      voo = null;
      camera.position.copy(p);
      controles.target.copy(alvo);
      controles.update();
    } else {
      // Anda em volta da mira: em linha reta, trocar de lado atravessaria a gôndola.
      const de = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controles.target));
      const fim = new THREE.Spherical().setFromVector3(p.clone().sub(alvo));
      let giro = fim.theta - de.theta;
      if (giro > Math.PI) giro -= Math.PI * 2;
      if (giro < -Math.PI) giro += Math.PI * 2;
      voo = { de, fim, giro, para: p, tDe: controles.target.clone(), tPara: alvo, ini: performance.now(), dur: 900 };
    }
    pedirQuadro(3);
  }

  // Trocou um lado que está de costas: a câmera vai até ele, para a mudança aparecer.
  function verLado(lado) {
    const sinal = lado === "esq" ? 1 : -1;
    estado.ladoCamera = sinal;
    if (estado.vista === "giro" || estado.vista === "corredor") return;
    if (Math.sign(camera.position.z - controles.target.z) === sinal) return;
    irPara(estado.vista || "ponta");
    aoMudarVista?.(estado.vista);
  }

  // Números dos módulos e o lado à vista: ficam na tela, nunca entram na imagem do cliente.
  let rotulosLigados = false;
  const estiloRotulo = "position:absolute;pointer-events:none;font-family:'DM Sans',sans-serif;";
  const rotulosModulo = Array.from({ length: MAX_MODULOS }, (_, i) => {
    const el = document.createElement("div");
    el.textContent = i + 1;
    el.style.cssText = `${estiloRotulo}left:0;top:0;display:none;width:22px;height:22px;line-height:22px;border-radius:11px;text-align:center;background:#F5A623;color:#000;font-size:12px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.6);`;
    camadaRotulos?.appendChild(el);
    return el;
  });
  const tagLado = document.createElement("div");
  tagLado.style.cssText = `${estiloRotulo}bottom:46px;left:10px;display:none;padding:5px 11px;border-radius:14px;background:rgba(0,0,0,.74);color:#fff;font-size:12px;font-weight:600;`;
  camadaRotulos?.appendChild(tagLado);
  const proj = new THREE.Vector3();
  function atualizarRotulos() {
    const ver = rotulosLigados && estado.vista !== "corredor";
    tagLado.style.display = ver ? "block" : "none";
    if (ver) tagLado.textContent = camera.position.z >= controles.target.z ? "Vendo o lado esquerdo" : "Vendo o lado direito";
    const L = comprimentoFileira(estado.modulos);
    const f = camera.position.z >= controles.target.z ? fileiras() - 1 : 0; // a fileira mais perto da câmera
    rotulosModulo.forEach((el, i) => {
      proj.set(-L / 2 + COL_X + i * (VAO + COL_X) + VAO / 2, ALTURAS[estado.altura].m + 0.11, zDaFileira(f)).project(camera);
      const aparece = ver && i < estado.modulos && proj.z < 1;
      el.style.display = aparece ? "block" : "none";
      if (aparece) el.style.transform = `translate(${(((proj.x + 1) / 2) * W - 11).toFixed(1)}px,${(((1 - proj.y) / 2) * H_TELA - 11).toFixed(1)}px)`;
    });
  }
  function mostrarRotulos(v) { rotulosLigados = !!v; atualizarRotulos(); }

  // ── Pós-processamento ──
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(cena, camera));
  const gtao = new GTAOPass(cena, camera, 1, 1);
  gtao.updateGtaoMaterial({ radius: 0.32, distanceExponent: 1.2, thickness: 1, scale: 1.25, samples: compacto ? 8 : 16, distanceFallOff: 1, screenSpaceRadius: false });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, radiusExponent: 1.4, rings: 2, samples: compacto ? 8 : 16 });
  gtao.blendIntensity = 0.72;
  composer.addPass(gtao);
  const saida = new OutputPass();
  composer.addPass(saida);
  // Leve queda de luz nos cantos e grão de sensor, como em foto de câmera
  const acabamento = new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
      float r(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec4 c = texture2D(tDiffuse, vUv);
        vec2 q = vUv - 0.5;
        c.rgb *= 1.0 - 0.34 * smoothstep(0.28, 0.82, length(q));
        c.rgb += (r(gl_FragCoord.xy) - 0.5) * 0.016;
        gl_FragColor = c;
      }`,
  });
  composer.addPass(acabamento);

  let W = 1, H_TELA = 1;
  function definirNitidez(pr) {
    renderer.setPixelRatio(pr);
    renderer.setSize(W, H_TELA, false);
    composer.setPixelRatio(pr);
    composer.setSize(W, H_TELA);
    renderer.getDrawingBufferSize(uReflexo.uTela.value);
    // o reflexo é desfocado: um quarto da tela já basta
    reflexoAlvo.setSize(Math.ceil(uReflexo.uTela.value.x / 4), Math.ceil(uReflexo.uTela.value.y / 4));
  }

  function ajustarTela() {
    const pai = canvas.parentElement;
    const novoW = Math.max(1, pai.clientWidth), novoH = Math.max(1, pai.clientHeight);
    if (novoW === W && novoH === H_TELA) return;
    W = novoW; H_TELA = novoH;
    definirNitidez(renderer.getPixelRatio());
    camera.aspect = W / H_TELA;
    camera.updateProjectionMatrix();
    if (estado.vista) irPara(estado.vista, !iniciado);
    pedirQuadro(4);
  }

  // ── Laço: só desenha quando algo muda ──
  let quadrosPedidos = 0, ultimoMovimento = 0, antes = performance.now();
  let vivo = true, visivel = true, idLaco = 0, iniciado = false;
  function pedirQuadro(n = 2) { quadrosPedidos = Math.max(quadrosPedidos, n); }

  // Aparelho fraco: se girar sair lento, reduz a nitidez e congela o reflexo enquanto a câmera anda.
  let fraco = false, medidos = 0, somaMs = 0;
  const medirDesde = performance.now() + 2500;
  function medirFolego(ms, movendo) {
    if (fraco || !movendo || ms > 400 || performance.now() < medirDesde) return;
    somaMs += ms; medidos++;
    if (medidos < 30) return;
    if (somaMs / medidos > 40) { fraco = true; nitidezGirando = 0.75; }
    medidos = 0; somaMs = 0;
  }

  function laco(agora) {
    idLaco = 0;
    if (!vivo || !visivel) return;
    idLaco = requestAnimationFrame(laco);
    const msQuadro = agora - antes;
    const dt = Math.min(msQuadro / 1000, 0.05);
    antes = agora;

    if (voo) {
      const k = Math.min((agora - voo.ini) / voo.dur, 1);
      const e = k * k * (3 - 2 * k);
      controles.target.lerpVectors(voo.tDe, voo.tPara, e);
      camera.position.setFromSphericalCoords(voo.de.radius + (voo.fim.radius - voo.de.radius) * e, voo.de.phi + (voo.fim.phi - voo.de.phi) * e, voo.de.theta + voo.giro * e).add(controles.target);
      if (k >= 1) voo = null;
      pedirQuadro(2);
    }

    // módulo novo desce no lugar e os outros deslizam
    let mexeu = false;
    for (const u of unidades) {
      if (u.xAtual === u.xAlvo && u.zAtual === u.zAlvo && u.yAtual === 0) continue;
      u.xAtual = semMovimento ? u.xAlvo : THREE.MathUtils.damp(u.xAtual, u.xAlvo, 11, dt);
      u.zAtual = semMovimento ? u.zAlvo : THREE.MathUtils.damp(u.zAtual, u.zAlvo, 11, dt);
      u.yAtual = semMovimento ? 0 : THREE.MathUtils.damp(u.yAtual, 0, 9, dt);
      if (Math.abs(u.xAtual - u.xAlvo) < 0.0004) u.xAtual = u.xAlvo;
      if (Math.abs(u.zAtual - u.zAlvo) < 0.0004) u.zAtual = u.zAlvo;
      if (u.yAtual < 0.0004) u.yAtual = 0;
      mexeu = true;
    }
    if (mexeu) { escreverPosicoes(); pedirQuadro(2); renderer.shadowMap.needsUpdate = true; }

    // limite: a câmera não atravessa o forro
    const dist = camera.position.distanceTo(controles.target);
    controles.minPolarAngle = Math.acos(Math.min(0.98, (PE_DIREITO - 0.25 - controles.target.y) / dist));
    controles.update();
    if (controles.autoRotate) pedirQuadro(2);

    // Girando: sem o sombreamento fino, para ficar fluido. Parou: um quadro completo.
    if (voo || mexeu || controles.autoRotate || quadrosPedidos > 1) ultimoMovimento = agora;
    const movendo = agora - ultimoMovimento < 140;
    if (gtao.enabled === movendo) { gtao.enabled = !movendo; pedirQuadro(1); }
    const nitidez = movendo ? nitidezGirando : NITIDEZ_PARADO;
    if (renderer.getPixelRatio() !== nitidez) { definirNitidez(nitidez); pedirQuadro(1); }

    if (quadrosPedidos > 0) {
      quadrosPedidos--;
      medirFolego(msQuadro, movendo);
      if (!(fraco && movendo)) desenharReflexo();
      composer.render(dt);
      if (rotulosLigados) atualizarRotulos();
    }
  }
  function ligarLaco() {
    if (vivo && visivel && !idLaco) { antes = performance.now(); pedirQuadro(2); idLaco = requestAnimationFrame(laco); }
  }

  // ── Mouse e toque ──
  let aoTocar = null, baixo = false;
  const aoIniciarControle = () => {
    aoTocar = { pos: camera.position.clone(), alvo: controles.target.clone(), voo, vista: estado.vista };
    voo = null;
    pedirQuadro(2);
    if (estado.vista !== "giro" && estado.vista) { estado.vista = ""; aoMudarVista?.(""); }
  };
  const aoMudarControle = () => pedirQuadro(2);
  const aoBaixar = () => { baixo = true; controles.enableZoom = true; canvas.style.cursor = "grabbing"; };
  const aoSoltar = () => {
    canvas.style.cursor = "grab";
    if (baixo) { aoInteragir?.(); estado.ladoCamera = camera.position.z >= controles.target.z ? 1 : -1; }
    baixo = false;
    aoTocar = null;
  };
  const aoSair = () => { if (!toque && !baixo) controles.enableZoom = false; };
  // O navegador assumiu o gesto para rolar a página: nada disso foi giro, volta tudo como estava.
  const aoCancelar = () => {
    baixo = false;
    if (!aoTocar) return;
    controles.enableDamping = false;
    controles.update();
    controles.enableDamping = !semMovimento;
    camera.position.copy(aoTocar.pos);
    controles.target.copy(aoTocar.alvo);
    voo = aoTocar.voo;
    if (aoTocar.vista !== estado.vista) { estado.vista = aoTocar.vista; aoMudarVista?.(aoTocar.vista); }
    aoTocar = null;
    pedirQuadro(2);
  };
  controles.addEventListener("start", aoIniciarControle);
  controles.addEventListener("change", aoMudarControle);
  canvas.addEventListener("pointerdown", aoBaixar);
  canvas.addEventListener("pointerup", aoSoltar);
  canvas.addEventListener("pointercancel", aoCancelar);
  canvas.addEventListener("pointerleave", aoSair);
  canvas.style.cursor = "grab";

  // O aparelho pode derrubar o WebGL (voltar de segundo plano, pouca memória); o preventDefault deixa a cena voltar.
  const aoPerderContexto = (ev) => { ev.preventDefault(); aoFalhar?.(); };
  const aoRecuperarContexto = () => {
    capturarAmbiente(); // o reflexo é desenhado na GPU e não volta sozinho
    renderer.shadowMap.needsUpdate = true;
    pedirQuadro(4);
    aoVoltar?.();
  };
  canvas.addEventListener("webglcontextlost", aoPerderContexto);
  canvas.addEventListener("webglcontextrestored", aoRecuperarContexto);

  const obsTamanho = new ResizeObserver(ajustarTela);
  obsTamanho.observe(canvas.parentElement);
  const obsVisivel = new IntersectionObserver((lista) => { visivel = lista[lista.length - 1].isIntersecting; ligarLaco(); }, { threshold: 0.01 });
  obsVisivel.observe(canvas);

  // ── Ligar ──
  // Deixa as fontes prontas agora: a imagem é desenhada de uma vez, sem espera entre o toque e o compartilhar.
  ["700 34px 'Playfair Display'", "700 32px 'DM Sans'", "500 26px 'DM Sans'"].forEach((f) => document.fonts?.load(f).catch(() => {}));
  montar();
  ajustarTela();
  irPara(estado.vista || "ponta", true);
  iniciado = true;
  ligarLaco();

  function configurar({ modulos, pontas, linha, altura, corredores, tipos }) {
    // Trocar só o tipo de um lado não muda o tamanho: a câmera fica onde está.
    const mudouTamanho = modulos !== estado.modulos || pontas !== estado.pontas || linha !== estado.linha || altura !== estado.altura || corredores !== estado.corredores;
    Object.assign(estado, { modulos, pontas, linha, altura, corredores, tipos });
    montar();
    if (mudouTamanho && estado.vista) irPara(estado.vista);
    atualizarRotulos();
  }

  // Imagem para mandar ao cliente: quadro completo em alta resolução, com as medidas numa faixa embaixo.
  function gerarImagem({ titulo, expositor, medidas, nota }) {
    if (renderer.getContext().isContextLost()) throw new Error("WebGL indisponível"); // sairia uma imagem preta
    // Termina na hora o que estiver animando: a imagem tem que sair com a configuração final.
    for (const u of unidades) { u.xAtual = u.xAlvo; u.zAtual = u.zAlvo; u.yAtual = 0; }
    escreverPosicoes();
    if (voo) {
      camera.position.copy(voo.para);
      controles.target.copy(voo.tPara);
      voo = null;
      controles.update();
    }
    renderer.shadowMap.needsUpdate = true;
    const anterior = renderer.getPixelRatio();
    const fator = Math.min(1600 / Math.max(W, H_TELA), 4);
    gtao.enabled = true;
    definirNitidez(fator);
    desenharReflexo();
    composer.render(0);

    const largura = canvas.width, altura = canvas.height;
    const faixaBase = Math.round(Math.max(150, largura * 0.115));
    const faixa = expositor ? Math.round(faixaBase * 1.24) : faixaBase; // linha a mais para os tipos, sem encolher o título
    const [saidaImg, g] = folha(largura, altura + faixa);
    g.drawImage(canvas, 0, 0);
    definirNitidez(anterior);
    pedirQuadro(3);

    g.fillStyle = "#0B0B0D";
    g.fillRect(0, altura, largura, faixa);
    g.fillStyle = "#F5A623";
    g.fillRect(0, altura, largura, Math.max(3, Math.round(faixa * 0.022)));
    const margem = Math.round(largura * 0.03);
    const u = faixaBase / 150;
    const base = altura + faixa * 0.5;

    // Marca à direita; o texto à esquerda encolhe se a imagem for estreita.
    g.textBaseline = "middle";
    g.font = `700 ${Math.round(34 * u)}px 'Playfair Display', Georgia, serif`;
    const parte1 = "Gôndolas ", parte2 = "Suprema";
    const lm = g.measureText(parte1).width + g.measureText(parte2).width;
    g.fillStyle = "#ECEDF1";
    g.fillText(parte1, largura - margem - lm, base);
    g.fillStyle = "#F5A623";
    g.fillText(parte2, largura - margem - g.measureText(parte2).width, base);

    const espaco = largura - margem * 2 - lm - margem;
    const caber = (texto, tam, peso) => {
      let t = tam;
      g.font = `${peso} ${t}px 'DM Sans', Arial, sans-serif`;
      while (t > 12 && g.measureText(texto).width > espaco) { t -= 1; g.font = `${peso} ${t}px 'DM Sans', Arial, sans-serif`; }
    };
    const linhas = [
      [titulo, 32, 700, "#FFFFFF"],
      ...(expositor ? [[expositor, 26, 600, "#ECEDF1"]] : []),
      [medidas, 26, 500, "#ECEDF1"],
      [nota, 21, 500, "#8B8C97"],
    ];
    linhas.forEach(([texto, tamanho, peso, cor], i) => {
      g.fillStyle = cor;
      caber(texto, Math.round(tamanho * u), peso);
      g.fillText(texto, margem, base + (i - (linhas.length - 1) / 2) * faixaBase * 0.255);
    });

    return new Promise((ok, erro) => saidaImg.toBlob((b) => (b ? ok(b) : erro(new Error("imagem vazia"))), "image/jpeg", 0.92));
  }

  function destruir() {
    vivo = false;
    if (idLaco) cancelAnimationFrame(idLaco);
    obsTamanho.disconnect();
    obsVisivel.disconnect();
    controles.removeEventListener("start", aoIniciarControle);
    controles.removeEventListener("change", aoMudarControle);
    canvas.removeEventListener("pointerdown", aoBaixar);
    canvas.removeEventListener("pointerup", aoSoltar);
    canvas.removeEventListener("pointercancel", aoCancelar);
    canvas.removeEventListener("pointerleave", aoSair);
    canvas.removeEventListener("webglcontextlost", aoPerderContexto);
    canvas.removeEventListener("webglcontextrestored", aoRecuperarContexto);
    controles.dispose();
    rotulosModulo.forEach((el) => el.remove());
    tagLado.remove();
    const materiais = new Set(), geometrias = new Set();
    const coletar = (o) => o.traverse((n) => {
      if (n.geometry) geometrias.add(n.geometry);
      if (n.material) materiais.add(n.material);
      if (n.isInstancedMesh) n.dispose();
    });
    coletar(cena);
    coletar(reflexoCena);
    geometrias.forEach((g) => g.dispose());
    materiais.forEach((m) => {
      for (const k of ["map", "normalMap", "roughnessMap", "alphaMap"]) m[k]?.dispose();
      m.dispose();
    });
    [gtao, saida, acabamento, composer].forEach((x) => x.dispose());
    reflexoAlvo.dispose();
    ambiente?.dispose();
    renderer.dispose();
    renderer.forceContextLoss?.();
  }

  return { configurar, irPara, verLado, mostrarRotulos, gerarImagem, destruir };
}
