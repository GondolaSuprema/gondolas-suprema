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
import { COL_X, COL_Z, VAO, FACE_Z, LINHAS, ALTURAS, LETRA_PAREDE, ATRAS_PAREDE, MAX_MODULOS, MAX_PAREDES_LADO, MAX_MODULOS_LADO, MAX_FILAS, MAX_CORREDORES_FILA, LARGURA_CORREDOR, comprimentoFileira, corredoresDe, MONTANTE_MPP, MAX_MODULOS_MPP, MAX_FILAS_MPP, layoutMPP, larguraFileira, layoutDe, paredesDe, trechosDoLado, nomeModuloParede, VAO_COLUNA, PROF_PILAR, CANTO_ATE_COLUNA } from "./projetoMedidas";

const Y_BASE = 0.135;
const CHAVES = ["aco", "amarelo", "furo", "nylon", "rosca", "arame", "gancho", "etiqueta", "pilar", "mppAco", "mppFuro", "mdf"];
const GANCHOS_POR_REGUA = 5;
const PROF_CESTO = 0.37; // cesto 370 x 900 mm
const SALA_X = 32, SALA_Z = 32, PE_DIREITO = 3; // grande o bastante para a câmera recuar com 6 filas no celular
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
    if (k === "aco" || k === "mppAco") uvProjetado(g);
    lista.push({ k, g });
  }
  return lista;
}

// Só a estrutura do módulo: cada lado é um modelo à parte, para poder ser bandeja, gancho ou cesto.
// Na parede a estrutura é a mesma, com a coluna servindo de um lado só.
function modeloModulo(linha, alt, lados = [1, -1]) {
  const partes = novaPartes();
  const miolo = caixa(VAO, alt.m - 0.055, 2 * (FACE_Z - 0.005), 0.001);
  miolo.translate(VAO / 2, 0.055 + (alt.m - 0.055) / 2, 0);
  partes.aco.push(miolo);
  coluna(partes, VAO + COL_X / 2, lados, linha, alt, true);
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

function modeloColunaInicial(linha, alt, lados = [1, -1]) {
  const partes = novaPartes();
  coluna(partes, -COL_X / 2, lados, linha, alt, true);
  return juntar(partes);
}

// Canto: painel reto a 45° de uma coluna à outra, sem coluna própria, e bandeja em trapézio.
// Local: centrado em x=0, com a frente para +Z. As laterais da bandeja seguem a frente das paredes vizinhas.
function modeloCanto(linha, alt) {
  const partes = novaPartes();
  const meio = CANTO_ATE_COLUNA / Math.SQRT2;
  const fundo = caixa(2 * meio, alt.m - 0.055, 0.02, 0.001);
  fundo.translate(0, 0.055 + (alt.m - 0.055) / 2, -0.012);
  partes.aco.push(fundo);
  const hPainel = (alt.m - 0.055) / alt.paineis;
  for (let i = 0; i < alt.paineis; i++) {
    const p = caixa(2 * meio - 0.001, hPainel - 0.0016, 0.004, 0.0012);
    p.translate(0, 0.055 + hPainel * (i + 0.5), -0.002);
    partes.aco.push(p);
  }
  const nivel = (y, prof, aba, altMao) => {
    const d = (FACE_Z + prof) / Math.SQRT2;
    const frente = meio - d;
    const s = new THREE.Shape();
    s.moveTo(-meio, 0);
    s.lineTo(meio, 0);
    s.lineTo(frente, -d);
    s.lineTo(-frente, -d);
    s.closePath();
    const chapa = extrudar(s, 0.0016);
    chapa.rotateX(-Math.PI / 2);
    chapa.translate(0, y - 0.0016, 0);
    partes.aco.push(chapa);
    const dobraFrente = caixa(2 * frente, aba, 0.0016, 0.0004);
    dobraFrente.translate(0, y - aba / 2, d - 0.0008);
    partes.aco.push(dobraFrente);
    const e = aoLongo(perfilEtiqueta(d, aba), 2 * frente + 0.012, 6);
    e.translate(-frente - 0.006, y, 0);
    partes.amarelo.push(e);
    for (const lado of [1, -1]) {
      const dobra = caixa(0.0014, aba * 0.6, Math.SQRT2 * d - 0.002, 0.0004);
      dobra.rotateY(-lado * Math.PI / 4);
      dobra.translate(lado * (meio - d / 2), y - aba * 0.3, d / 2);
      partes.aco.push(dobra);
      if (altMao) {
        const m = aoLongo(perfilMaoFrancesa(Math.SQRT2 * d, altMao), 0.003, 10);
        m.translate(-0.0015, y, 0);
        m.rotateY(-lado * Math.PI / 4);
        m.translate(lado * (meio - 0.002), 0, 0);
        partes.aco.push(m);
      }
    }
  };
  nivel(Y_BASE, linha.profBase, 0.045, 0);
  for (const y of alt.niveis) nivel(y, linha.profPrat, 0.038, 0.13);
  const dBase = (FACE_Z + linha.profBase) / Math.SQRT2;
  for (const lado of [1, -1]) pe(partes, lado * (meio - dBase - 0.03), dBase - 0.03);
  return juntar(partes);
}

// Lateral e fundo sem canto: a lateral nasce na frente das prateleiras do fundo. Esta chapa fecha a fresta atrás delas.
function modeloFecho(linha, alt) {
  const partes = novaPartes();
  const larg = linha.profBase + 0.015;
  const c = caixa(larg, alt.m - 0.055, 0.012, 0.001);
  c.translate(larg / 2, 0.055 + (alt.m - 0.055) / 2, 0);
  partes.aco.push(c);
  return juntar(partes);
}

// Pilar da loja entre duas paredes do mesmo lado, do piso ao forro.
function modeloPilar() {
  const partes = novaPartes();
  const c = caixa(VAO_COLUNA - 0.004, PE_DIREITO, PROF_PILAR, 0.003);
  c.translate(0, PE_DIREITO / 2, PROF_PILAR / 2 - ATRAS_PAREDE);
  partes.pilar.push(c);
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

// ── Mini porta palete (modelo China, da foto do Ale) ──────────────────────────
// Montante preto com furos, lateral com travessas e diagonais, par de longarina em degrau e prateleira de MDF.
const LONGARINA_MPP = 0.09;
// Topo de cada longarina: a de baixo perto do piso, a de cima perto do topo do montante, as outras por igual.
function niveisMPP(altura, n) {
  const base = 0.13, topo = altura - 0.03;
  return Array.from({ length: n }, (_, i) => base + ((topo - base) * i) / (n - 1));
}

// Uma lateral: os dois montantes (frente e fundo) ligados pelas travessas. Centrada em x=0.
function modeloLateralMPP(prof, altura) {
  const partes = novaPartes();
  const m = MONTANTE_MPP, zMont = prof / 2 - m / 2, zi = prof / 2 - m;
  for (const s of [1, -1]) {
    const c = caixa(m, altura, m, 0.002);
    c.translate(0, altura / 2, s * zMont);
    partes.mppAco.push(c);
    for (let y = 0.1; y < altura - 0.04; y += 0.05) {
      const f = new THREE.PlaneGeometry(0.012, 0.022);
      if (s < 0) f.rotateY(Math.PI);
      f.translate(0, y, s * (prof / 2 + 0.0003));
      partes.mppFuro.push(f);
    }
    const sapata = caixa(0.07, 0.006, 0.07, 0.001);
    sapata.translate(0, 0.003, s * zMont);
    partes.mppAco.push(sapata);
  }
  const yBaixo = 0.08, yCima = altura - 0.05;
  for (const y of [yBaixo, yCima]) {
    const t = caixa(0.012, 0.03, 2 * zi, 0.001);
    t.translate(0, y, 0);
    partes.mppAco.push(t);
  }
  // Diagonais em zigue-zague, de um montante ao outro
  const n = Math.max(2, Math.round((yCima - yBaixo) / 0.6));
  for (let i = 0; i < n; i++) {
    const y0 = yBaixo + ((yCima - yBaixo) * i) / n, y1 = yBaixo + ((yCima - yBaixo) * (i + 1)) / n;
    const z0 = i % 2 ? -zi : zi, z1 = -z0;
    const d = caixa(0.012, 0.03, Math.hypot(y1 - y0, z1 - z0), 0.001);
    d.rotateX(Math.atan2(-(y1 - y0), z1 - z0));
    d.translate(0, (y0 + y1) / 2, (z0 + z1) / 2);
    partes.mppAco.push(d);
  }
  return juntar(partes);
}

// Longarina vista de lado: frente lisa e, por dentro, o degrau onde o MDF apoia. A frente fica em z=0.
function perfilLongarina() {
  const h = LONGARINA_MPP;
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0, h);
  s.lineTo(-0.022, h);
  s.lineTo(-0.022, h - 0.016);
  s.lineTo(-0.045, h - 0.016);
  s.lineTo(-0.045, h - 0.04);
  s.lineTo(-0.006, h - 0.04);
  s.lineTo(-0.006, 0);
  s.closePath();
  return s;
}

// Um vão entre dois montantes, com todos os níveis: par de longarina e MDF em cada um. Vai de x=0 a x=vao.
function modeloVaoMPP(vao, prof, altura, n) {
  const partes = novaPartes();
  for (const topo of niveisMPP(altura, n)) {
    const y = topo - LONGARINA_MPP;
    for (const s of [1, -1]) {
      const g = aoLongo(perfilLongarina(), vao);
      g.translate(0, y, prof / 2);
      if (s < 0) { g.rotateY(Math.PI); g.translate(vao, 0, 0); }
      partes.mppAco.push(g);
      for (const f of [0.35, 0.62]) { // nervuras da frente, como na foto
        const r = caixa(vao, 0.005, 0.003, 0.0008);
        r.translate(vao / 2, y + LONGARINA_MPP * f, s * (prof / 2 + 0.0015));
        partes.mppAco.push(r);
      }
    }
    const mdf = caixa(vao - 0.004, 0.015, prof - 0.048, 0.001);
    mdf.translate(vao / 2, topo - 0.0085, 0);
    partes.mdf.push(mdf);
  }
  return juntar(partes);
}

// "mppLateral:prof:altura" ou "mppVao:vao:prof:altura:niveis"
function modeloMPP(tipo) {
  const [nome, ...n] = tipo.split(":");
  const v = n.map(Number);
  return nome === "mppLateral" ? modeloLateralMPP(v[0], v[1]) : modeloVaoMPP(v[0], v[1], v[2], v[3]);
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

  const estado = { ...config, vista: config.vista || "ponta", ladoCamera: 1 };

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
    pilar: new THREE.MeshStandardMaterial({ color: 0xd6d2c9, roughness: 0.85 }),
    // Mini porta palete: preto próprio, que não muda com a cor escolhida para a gôndola
    mppAco: new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.5, metalness: 0, normalMap: normalPintura, normalScale: new THREE.Vector2(0.08, 0.08), envMapIntensity: 0.72 }),
    mppFuro: new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 1 }),
    mdf: new THREE.MeshStandardMaterial({ color: 0xefeee9, roughness: 0.78, envMapIntensity: 0.6 }),
  };
  // Cor da gôndola: só troca a tinta, sem remontar as peças. Mesmas cores da gôndola 3D do site.
  const CORES = {
    preta: { aco: 0x161618, furo: 0x020202, nylon: 0x151517, arame: 0x2c2c32, gancho: 0x5a5a64 },
    // branca: toda clara, inclusive furos, tampas dos vãos e ganchos
    branca: { aco: 0xe6e5e1, furo: 0xc9c8c3, nylon: 0xd2d1cc, arame: 0xe2e2df, gancho: 0xd4d4d1 },
  };
  // Porta-etiqueta: só nas réguas das bandejas (a faixa do cesto fica como está)
  const CORES_ETIQUETA = {
    amarelo: 0xffbf00, azul: 0x1f5fbf, branco: 0xf2f2ef, cinza: 0x8e9094, laranja: 0xff7a12,
    preto: 0x161618, rosa: 0xf06fa8, verdeClaro: 0x7ccf4a, verdeEscuro: 0x1d6b3a, vermelho: 0xd62828,
  };
  function aplicarCor() {
    const c = Object.hasOwn(CORES, estado.cor) ? CORES[estado.cor] : CORES.preta;
    for (const k of Object.keys(c)) MAT[k].color.setHex(c[k]);
    MAT.amarelo.color.setHex(Object.hasOwn(CORES_ETIQUETA, estado.etiqueta) ? CORES_ETIQUETA[estado.etiqueta] : CORES_ETIQUETA.amarelo);
  }
  aplicarCor();

  const cena = new THREE.Scene();
  cena.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(compacto ? 42 : 34, 1, 0.05, 120);
  const controles = new OrbitControls(camera, canvas);
  controles.enableDamping = !semMovimento;
  controles.dampingFactor = 0.07;
  controles.enablePan = false;
  controles.maxPolarAngle = 1.54;
  controles.minDistance = 1.2;
  controles.maxDistance = 60;
  controles.minPolarAngle = 0.12; // pode ver de cima: acima do forro ele some
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
  // O piso passa das paredes: visto de longe e de cima, numa loja enorme, ele não acaba no preto.
  plano(pisoMat, 240, 240, (m) => { m.rotation.x = -Math.PI / 2; m.receiveShadow = true; });
  const teto = [plano(new THREE.MeshStandardMaterial({ ...texturasForro(), roughness: 0.9 }), SALA_X * 2, SALA_Z * 2, (m) => { m.rotation.x = Math.PI / 2; m.position.y = PE_DIREITO; })];
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
    teto.push(leds, molduras);
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
  const contatos = new THREE.Group(); // uma sombra por corredor e por parede
  const contatoGeo = new THREE.PlaneGeometry(1, 1);
  for (let i = 0; i < MAX_FILAS * MAX_CORREDORES_FILA + 3 * MAX_PAREDES_LADO + 2; i++) {
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
    teto.forEach((o) => { o.visible = true; });
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
  const NO_CENTRO = MAX_FILAS * MAX_CORREDORES_FILA; // corredores de centro, no máximo
  const CAPACIDADE = { mppLateral: MAX_FILAS_MPP * (MAX_MODULOS_MPP + 1), mppVao: MAX_FILAS_MPP * MAX_MODULOS_MPP, modulo: MAX_MODULOS * NO_CENTRO, inicio: NO_CENTRO, ponta: 2 * NO_CENTRO, moduloParede: 3 * MAX_MODULOS_LADO, inicioParede: 3 * MAX_PAREDES_LADO, canto: 2, fecho: 2, pilar: 3 * (MAX_PAREDES_LADO - 1), face: 2 * MAX_MODULOS * NO_CENTRO + 3 * MAX_MODULOS_LADO };
  const modelos = new Map(); // "linha:altura:tipo" → modelo (fica guardado para trocar de opção sem refazer)
  function modelo(linha, altura, tipo) {
    const pecaMpp = tipo.startsWith("mpp");
    const chave = pecaMpp ? tipo : `${linha}:${altura}:${tipo}`; // a peça do mini porta palete não depende da linha da gôndola
    if (modelos.has(chave)) return modelos.get(chave);
    const def = LINHAS[linha], alt = pecaMpp ? null : alturaDe(altura);
    const ehFace = tipo.startsWith("face:");
    const partes = pecaMpp ? modeloMPP(tipo)
      : ehFace ? modeloFace(def, alt, tipo.slice(5))
      : tipo === "modulo" ? modeloModulo(def, alt)
      : tipo === "moduloParede" ? modeloModulo(def, alt, [1])
      : tipo === "inicio" ? modeloColunaInicial(def, alt)
      : tipo === "inicioParede" ? modeloColunaInicial(def, alt, [1])
      : tipo === "canto" ? modeloCanto(def, alt)
      : tipo === "fecho" ? modeloFecho(def, alt)
      : tipo === "pilar" ? modeloPilar()
      : modeloPonta(def, alt);
    const cap = CAPACIDADE[ehFace ? "face" : pecaMpp ? tipo.split(":")[0] : tipo];
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
      // Fio fino não faz sombra nem aparece no reflexo desfocado, e custa caro.
      const fino = ["furo", "arame", "gancho", "etiqueta", "mppFuro"].includes(k);
      m.castShadow = !fino;
      m.receiveShadow = true;
      gondola.add(m);
      if (!fino) reflexo.add(instancia(g, k));
    }
    const novo = { matriz, malhas, usados: 0 };
    modelos.set(chave, novo);
    return novo;
  }

  const ehMPP = () => estado.produto === "mpp";
  const fileiras = () => (ehMPP() ? estado.mpp.filas : estado.filas.length); // filas lado a lado
  const emSequencia = () => (ehMPP() ? 1 : Math.max(...estado.filas)); // corredores um atrás do outro na fila mais comprida
  const larguraDaFila = () => (ehMPP() ? layoutMPP(estado.mpp).prof : larguraFileira(estado.linha));
  const zDaFileira = (f) => ((fileiras() - 1) / 2 - f) * (larguraDaFila() + LARGURA_CORREDOR); // igual a corredoresDe: fila 1 em +Z

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
    if (ehMPP()) {
      // Mesmo formato do layout da gôndola, como um centro sem paredes: as vistas servem para os dois.
      const m = layoutMPP(estado.mpp);
      return { centro: { xMin: m.xMin, xMax: m.xMax, z: m.zMax }, avanco: m.prof / 2, Le: 0, Ld: 0, Lf: 0, xMin: m.xMin, xMax: m.xMax, zMin: m.zMin, zMax: m.zMax, yMax: m.altura, mpp: m };
    }
    const l = layoutDe(estado);
    const alturas = [];
    if (l.centro) alturas.push(ALTURAS[estado.altura].m);
    if (l.Le || l.Ld || l.Lf) alturas.push(ALTURAS[estado.alturaParede].m);
    return { ...l, yMax: Math.max(0, ...alturas) };
  }

  function montar() {
    const l = limites();
    const querer = new Map();
    const pos = (altura, tipo, chave, x, z, rot) => querer.set(`${estado.linha}:${altura}:${chave}`, { altura, tipo, x, z, rot });
    const passo = VAO + COL_X;
    if (ehMPP()) {
      // Cada fila: uma lateral em cada ponta e entre os módulos, e um vão com os níveis entre duas laterais.
      // Cada módulo tem o seu comprimento; a lateral seguinte fica logo depois do vão dele.
      const m = l.mpp;
      const lateral = `mppLateral:${m.prof}:${m.altura}`;
      m.filas.forEach((z, f) => {
        let x = m.xMin;
        pos("mpp", lateral, `mpp${f}:l0:${lateral}`, x + MONTANTE_MPP / 2, z, 0);
        m.vaos.forEach((v, k) => {
          const vao = `mppVao:${v.toFixed(3)}:${m.prof}:${m.altura}:${estado.mpp.niveis}`;
          pos("mpp", vao, `mpp${f}:v${k}:${vao}`, x + MONTANTE_MPP, z, 0);
          x += v + MONTANTE_MPP;
          pos("mpp", lateral, `mpp${f}:l${k + 1}:${lateral}`, x + MONTANTE_MPP / 2, z, 0);
        });
      });
    } else {
      if (l.centro) {
        const L = comprimentoFileira(estado.modulos), a = estado.altura;
        for (const { f, k, x0, z } of corredoresDe(estado)) {
          const c = `c${f}.${k}`;
          pos(a, "inicio", `${c}:inicio`, x0 + COL_X, z, 0);
          for (let i = 0; i < estado.modulos; i++) {
            const xi = x0 + COL_X + i * passo;
            const { esq, dir } = estado.tipos[i];
            pos(a, "modulo", `${c}:m${i}`, xi, z, 0);
            pos(a, `face:${esq}`, `${c}:m${i}:esq:${esq}`, xi, z, 0); // lado esquerdo = +Z, visto de quem está na ponta olhando a fileira
            pos(a, `face:${dir}`, `${c}:m${i}:dir:${dir}`, xi + VAO, z, Math.PI);
          }
          if (estado.pontas >= 1) pos(a, "ponta", `${c}:pontaD`, x0 + L, z, 0);
          if (estado.pontas >= 2) pos(a, "ponta", `${c}:pontaE`, x0, z, Math.PI);
        }
      }
      // Paredes: módulo 1 fica junto do fundo nas laterais, então os números não mudam quando a parede cresce.
      const a = estado.alturaParede;
      const q = paredesDe(estado);
      const parede = (lado, t, n, inicio, modulo, rot) => {
        pos(a, "inicioParede", `${lado}${t}:inicio`, inicio[0], inicio[1], rot);
        for (let i = 0; i < n; i++) {
          const [x, z] = modulo(i);
          const tipo = estado.tiposParede[lado][t][i];
          pos(a, "moduloParede", `${lado}${t}:m${i}`, x, z, rot);
          pos(a, `face:${tipo}`, `${lado}${t}:m${i}:${tipo}`, x, z, rot);
        }
      };
      trechosDoLado(q.dir).forEach(({ n, inicio }, t) => {
        const x = l.inicioD + inicio + COL_X;
        parede("dir", t, n, [x, -l.planoLateral], (i) => [x + i * passo, -l.planoLateral], 0);
      });
      trechosDoLado(q.esq).forEach(({ n, inicio }, t) => {
        const x = l.inicioE + inicio;
        parede("esq", t, n, [x + n * passo, l.planoLateral], (i) => [x + COL_X + i * passo + VAO, l.planoLateral], Math.PI);
      });
      trechosDoLado(q.fundo).forEach(({ n, inicio }, t) => {
        const z = l.fundoIni - inicio - COL_X;
        parede("fundo", t, n, [l.planoFundo, z], (i) => [l.planoFundo, z - i * passo], Math.PI / 2);
      });
      // Um pilar em cada vão entre duas paredes do mesmo lado.
      const noVao = (lista, fazer) => trechosDoLado(lista).slice(0, -1).forEach(({ n, inicio }, t) => fazer(t, inicio + comprimentoFileira(n) + VAO_COLUNA / 2));
      noVao(q.dir, (t, d) => pos(a, "pilar", `dir${t}:pilar`, l.inicioD + d, -l.planoLateral, 0));
      noVao(q.esq, (t, d) => pos(a, "pilar", `esq${t}:pilar`, l.inicioE + d, l.planoLateral, Math.PI));
      noVao(q.fundo, (t, d) => pos(a, "pilar", `fundo${t}:pilar`, l.planoFundo, l.fundoIni - d, Math.PI / 2));
      const meioCanto = CANTO_ATE_COLUNA / 2;
      if (l.cantoE) pos(a, "canto", "canto:esq", l.planoFundo + meioCanto, l.planoLateral - meioCanto, (3 * Math.PI) / 4);
      if (l.cantoD) pos(a, "canto", "canto:dir", l.planoFundo + meioCanto, meioCanto - l.planoLateral, Math.PI / 4);
      if (l.Lf && l.Ld && !l.cantoD) pos(a, "fecho", "fecho:dir", l.planoFundo + FACE_Z, -l.planoLateral, 0);
      if (l.Lf && l.Le && !l.cantoE) pos(a, "fecho", "fecho:esq", l.inicioE, l.planoLateral, Math.PI);
    }

    for (let i = unidades.length - 1; i >= 0; i--) if (!querer.has(unidades[i].chave)) unidades.splice(i, 1);
    modelos.forEach((m) => { m.usados = 0; });
    for (const [chave, u0] of querer) {
      let u = unidades.find((v) => v.chave === chave);
      if (!u) {
        u = { chave, modelo: modelo(estado.linha, u0.altura, u0.tipo), xAtual: u0.x, zAtual: u0.z, yAtual: semMovimento ? 0 : 0.55 };
        unidades.push(u);
      }
      u.xAlvo = u0.x; u.zAlvo = u0.z; u.rot = u0.rot;
      u.slot = u.modelo.usados++;
    }
    modelos.forEach((m) => { m.malhas.forEach((malha) => { malha.count = m.usados; malha.visible = m.usados > 0; }); });
    escreverPosicoes();

    // Sombra de contato no piso: [centro x, centro z, tamanho x, tamanho z]
    const marcas = [];
    if (ehMPP()) for (const z of l.mpp.filas) marcas.push([0, z, l.mpp.comprimento, l.mpp.prof]);
    else {
      const fund = l.avanco + ATRAS_PAREDE;
      const q = paredesDe(estado);
      if (l.centro) {
        const L = comprimentoFileira(estado.modulos);
        const atras = estado.pontas >= 2 ? l.avanco : 0, frente = estado.pontas >= 1 ? l.avanco : 0;
        for (const { x0, z } of corredoresDe(estado)) marcas.push([x0 + (L + frente - atras) / 2, z, L + frente + atras, 2 * l.avanco]);
      }
      const emLateral = (lista, x0, z) => trechosDoLado(lista).forEach(({ n, inicio }) => marcas.push([x0 + inicio + comprimentoFileira(n) / 2, z, comprimentoFileira(n), fund]));
      emLateral(q.esq, l.inicioE, l.planoLateral + (ATRAS_PAREDE - l.avanco) / 2);
      emLateral(q.dir, l.inicioD, -l.planoLateral - (ATRAS_PAREDE - l.avanco) / 2);
      trechosDoLado(q.fundo).forEach(({ n, inicio }) => marcas.push([l.planoFundo + (l.avanco - ATRAS_PAREDE) / 2, l.fundoIni - inicio - comprimentoFileira(n) / 2, fund, comprimentoFileira(n)]));
      // [.., ângulo]: o canto fica a 45° no piso
      const fundoCanto = (FACE_Z + LINHAS[estado.linha].profBase) / Math.SQRT2;
      const recuoCanto = (CANTO_ATE_COLUNA + fundoCanto / Math.SQRT2) / 2;
      const marcaCanto = (sinal) => marcas.push([l.planoFundo + recuoCanto, sinal * (l.planoLateral - recuoCanto), Math.SQRT2 * CANTO_ATE_COLUNA - fundoCanto, fundoCanto, -sinal * Math.PI / 4]);
      if (l.cantoE) marcaCanto(1);
      if (l.cantoD) marcaCanto(-1);
    }
    contatos.children.forEach((c, i) => {
      const m = marcas[i];
      c.visible = !!m;
      if (!m) return;
      c.position.set(m[0], 0.002, m[1]);
      c.rotation.z = m[4] || 0;
      c.scale.set((m[2] + 0.16) * pernas, (m[3] + 0.16) * pernas, 1);
    });
    renderer.shadowMap.needsUpdate = true;
    pedirQuadro(3);
  }

  // ── Câmeras prontas ──
  let voo = null;
  // Distância exata para a gôndola inteira caber no quadro, seja qual for o formato da tela.
  // Com "centrar", também move a mira para a gôndola ficar no meio da imagem.
  function enquadrar(dir, alvo, centrar = true, caixa = null) {
    const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), th = tv * camera.aspect;
    const direita = new THREE.Vector3(0, 1, 0).cross(dir).normalize();
    const cima = dir.clone().cross(direita).normalize();
    const { xMin, xMax, zMin, zMax, yMax } = caixa || limites();
    const v = new THREE.Vector3();
    let d = 0;
    // Três passos centralizam e a última medida já é com a mira final: sem ela, um centro comprido saía do quadro.
    for (let passo = 0; passo < (centrar ? 4 : 1); passo++) {
      const cantos = [];
      d = 0;
      for (const x of [xMin, xMax]) for (const y of [0, yMax]) for (const zz of [zMin, zMax]) {
        v.set(x, y, zz).sub(alvo);
        const c = [v.dot(direita), v.dot(cima), v.dot(dir)];
        cantos.push(c);
        d = Math.max(d, Math.abs(c[0]) / th + c[2], Math.abs(c[1]) / tv + c[2]);
      }
      if (!centrar || passo === 3) break;
      const telaX = cantos.map((c) => c[0] / ((d - c[2]) * th)), telaY = cantos.map((c) => c[1] / ((d - c[2]) * tv));
      alvo.addScaledVector(direita, ((Math.min(...telaX) + Math.max(...telaX)) / 2) * d * th);
      alvo.addScaledVector(cima, ((Math.min(...telaY) + Math.max(...telaY)) / 2) * d * tv);
    }
    return Math.min(d * (compacto ? 1.08 : 1.06), controles.maxDistance);
  }

  function voarPara(p, alvo, instantaneo) {
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

  // Uma lateral sozinha: a câmera fica do lado das prateleiras dela, não nas costas.
  const ladoDaLateral = (l) => (l.Le && !l.Ld ? -1 : l.Ld && !l.Le ? 1 : 0);
  function acertarLado() {
    const lado = ladoDaLateral(limites());
    if (lado) estado.ladoCamera = lado;
  }

  function irPara(vista, instantaneo) {
    estado.vista = vista;
    controles.autoRotate = vista === "giro" && !semMovimento;
    const l = limites();
    const total = l.xMax - l.xMin;
    const temParede = !!(l.Le || l.Ld || l.Lf);
    const variasFilas = !!l.centro && fileiras() > 1;
    const varias = variasFilas || (!!l.centro && emSequencia() > 1); // a câmera sobe para ver uma gôndola por trás da outra
    if (!l.centro) acertarLado(); // com centro, o lado também serve para olhar os dois lados dele
    const soUmaLateral = !l.centro && !l.Lf && !!ladoDaLateral(l);
    const lado = estado.ladoCamera;
    const alvo = new THREE.Vector3((l.xMin + l.xMax) / 2, l.yMax / 2, (l.zMin + l.zMax) / 2);
    // Com parede a câmera sobe, para ver por cima das gôndolas; mais ainda se tiver parede do lado dela.
    const paredeNaFrente = lado > 0 ? l.Le : l.Ld;
    const azQuina = temParede ? (paredeNaFrente ? 1.22 : 1.0) : varias ? 1.15 : compacto ? 0.95 : 0.82;
    // Mini porta palete: um pouco de cima, para as prateleiras de MDF aparecerem.
    const subida = temParede ? (paredeNaFrente ? 0.85 : 0.5) : ehMPP() ? 0.35 : varias ? 0.2 : 0.1;
    let p;
    if (vista === "corredor" && l.centro) {
      // Corredores um atrás do outro: de pé na entrada, olhando a fila inteira.
      const d = Math.min((l.centro.xMax - l.centro.xMin) / 2 + 1.4, emSequencia() > 1 || ehMPP() ? SALA_X - 1 : 6);
      const sentido = temParede || estado.pontas >= 1 ? 1 : -1;
      const entreLinhas = variasFilas || !!l.Le;
      const meio = Math.floor((fileiras() - 2) / 2);
      const z = variasFilas ? (zDaFileira(meio) + zDaFileira(meio + 1)) / 2
        : l.Le ? l.centro.z + (l.vaoInterno - l.centro.z) / 2
        : (ehMPP() ? l.mpp.prof / 2 : FACE_Z + LINHAS[estado.linha].profBase) + 0.9;
      p = new THREE.Vector3(sentido * d, 1.5, z);
      alvo.set(0, 1.0, entreLinhas ? z : 0.1);
    } else if (vista === "corredor") {
      // Só parede: de pé no meio da loja, olhando para o fundo.
      const z = l.Le && !l.Ld ? l.vaoInterno - 0.6 : l.Ld && !l.Le ? 0.6 - l.vaoInterno : 0;
      const fim = l.Le || l.Ld ? Math.max(l.inicioE + l.Le, l.inicioD + l.Ld) : l.planoFundo + l.avanco + 3;
      p = new THREE.Vector3(fim + 2.4, 1.5, z);
      alvo.set(l.planoFundo, 1.0, z);
    } else if (vista === "geral") {
      // Parede única vista da ponta viraria um risco: fica de frente para ela.
      const az = soUmaLateral ? 0.45 : 1.45;
      const dir = new THREE.Vector3(Math.sin(az), soUmaLateral ? 0.7 : 0.95, Math.cos(az) * lado).normalize();
      const d = enquadrar(dir, alvo);
      p = dir.multiplyScalar(d).add(alvo);
    } else if (vista === "giro") {
      // Longe o bastante para caber em qualquer ângulo da volta inteira.
      const dir = new THREE.Vector3(Math.sin(azQuina), subida, Math.cos(azQuina) * lado).normalize();
      let d = 0;
      for (let a = 0; a < Math.PI; a += 0.26) d = Math.max(d, enquadrar(new THREE.Vector3(Math.sin(a), subida, Math.cos(a)).normalize(), alvo, false));
      p = dir.multiplyScalar(d).add(alvo);
    } else {
      // Frente com parede = da entrada, olhando para o fundo; parede única, de frente para ela. Sem parede, em tela estreita, fileira longa não cabe de frente: a câmera fica um pouco de lado.
      const az = vista === "frente" ? (temParede && !soUmaLateral ? Math.PI / 2 : camera.aspect < 1.1 ? THREE.MathUtils.clamp((total - 3) * 0.22, 0, 0.95) : 0) : azQuina;
      const y = vista === "frente" ? (temParede ? 0.22 : varias ? 0.12 : 0.05) : subida;
      const dir = new THREE.Vector3(Math.sin(az), y, Math.cos(az) * lado).normalize();
      const d = enquadrar(dir, alvo);
      p = dir.multiplyScalar(d).add(alvo);
    }
    if ((!temParede && vista !== "geral") || vista === "frente") p.y = Math.min(p.y, PE_DIREITO - 0.3); // nessas vistas fica abaixo do forro
    if (vista === "frente") { // e dentro do salão: numa loja enorme, as pontas das laterais podem ficar fora do quadro
      p.x = THREE.MathUtils.clamp(p.x, 0.5 - SALA_X, SALA_X - 0.5);
      p.z = THREE.MathUtils.clamp(p.z, 0.5 - SALA_Z, SALA_Z - 0.5);
    }
    voarPara(p, alvo, instantaneo);
  }

  // Mudou o tamanho com a câmera solta (arrastada ou olhando uma parede): mantém o ângulo e faz tudo caber de novo.
  function reenquadrar() {
    const l = limites();
    const alvo = new THREE.Vector3((l.xMin + l.xMax) / 2, l.yMax / 2, (l.zMin + l.zMax) / 2);
    const dir = (voo ? voo.para.clone().sub(voo.tPara) : camera.position.clone().sub(controles.target)).normalize();
    const d = enquadrar(dir, alvo);
    voarPara(dir.multiplyScalar(d).add(alvo), alvo);
  }

  // Trocou um lado que está de costas: a câmera vai até ele, para a mudança aparecer.
  function verLado(lado) {
    const sinal = lado === "esq" ? 1 : -1;
    estado.ladoCamera = sinal;
    if (estado.vista === "giro" || estado.vista === "corredor") return;
    if (estado.vista !== "geral" && Math.sign(camera.position.z - controles.target.z) === sinal) return;
    irPara(estado.vista === "geral" ? "ponta" : estado.vista || "ponta");
    aoMudarVista?.(estado.vista);
  }

  // Trocou o tipo de uma parede que não está à vista: a câmera enquadra só ela, de cima, para olhar por cima do centro.
  function verParede(lado) {
    if (estado.vista === "giro") return;
    const n = lado === "esq" ? [0, -1] : lado === "dir" ? [0, 1] : [1, 0];
    const olhar = camera.position.clone().sub(controles.target);
    if ((olhar.x * n[0] + olhar.z * n[1]) / (Math.hypot(olhar.x, olhar.z) || 1) > 0.25) return;
    if (n[1]) estado.ladoCamera = n[1];
    const l = limites();
    const yMax = ALTURAS[estado.alturaParede].m;
    const caixa = lado === "fundo"
      ? { xMin: l.planoFundo - ATRAS_PAREDE, xMax: l.planoFundo + l.avanco, zMin: l.fundoIni - l.Lf, zMax: l.fundoIni, yMax }
      : { xMin: lado === "esq" ? l.inicioE : l.inicioD, xMax: lado === "esq" ? l.inicioE + l.Le : l.inicioD + l.Ld, zMin: lado === "esq" ? l.vaoInterno : -l.planoLateral - ATRAS_PAREDE, zMax: lado === "esq" ? l.planoLateral + ATRAS_PAREDE : -l.vaoInterno, yMax };
    const alvo = new THREE.Vector3((caixa.xMin + caixa.xMax) / 2, yMax / 2, (caixa.zMin + caixa.zMax) / 2);
    const dir = lado === "fundo"
      ? new THREE.Vector3(1, l.centro ? 0.8 : 0.45, 0.12).normalize()
      : new THREE.Vector3(0.25, l.centro ? 1.25 : 0.7, n[1]).normalize();
    const d = enquadrar(dir, alvo, true, caixa);
    controles.autoRotate = false;
    estado.vista = "";
    aoMudarVista?.("");
    voarPara(dir.multiplyScalar(d).add(alvo), alvo);
  }

  // Números dos módulos e o lado à vista: ficam na tela, nunca entram na imagem do cliente.
  let rotulosLigados = { centro: false, parede: false, mpp: false };
  const estiloRotulo = "position:absolute;pointer-events:none;font-family:'DM Sans',sans-serif;";
  const novoRotulo = (texto) => {
    const el = document.createElement("div");
    el.textContent = texto;
    el.style.cssText = `${estiloRotulo}left:0;top:0;display:none;min-width:22px;height:22px;line-height:22px;padding:0 4px;box-sizing:border-box;border-radius:11px;text-align:center;background:#F5A623;color:#000;font-size:12px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.6);`;
    camadaRotulos?.appendChild(el);
    return el;
  };
  const rotulosModulo = Array.from({ length: MAX_MODULOS * MAX_CORREDORES_FILA }, (_, j) => novoRotulo((j % MAX_MODULOS) + 1));
  const rotulosMpp = Array.from({ length: MAX_MODULOS_MPP }, (_, i) => novoRotulo(i + 1));
  const rotulosParede = Object.fromEntries(Object.keys(LETRA_PAREDE).map((lado) => [lado, Array.from({ length: MAX_MODULOS_LADO }, () => novoRotulo(""))]));
  const tagLado = document.createElement("div");
  tagLado.style.cssText = `${estiloRotulo}bottom:46px;left:10px;display:none;padding:5px 11px;border-radius:14px;background:rgba(0,0,0,.74);color:#fff;font-size:12px;font-weight:600;`;
  camadaRotulos?.appendChild(tagLado);
  const proj = new THREE.Vector3();
  let rotulosNaTela = [];
  const colocarRotulo = (el, x, y, z, ver) => {
    if (ver) proj.set(x, y, z).project(camera);
    const px = ((proj.x + 1) / 2) * W, py = ((1 - proj.y) / 2) * H_TELA;
    // Muitos módulos longe da câmera: os números se atropelariam, então mostra só os que cabem.
    const aparece = ver && proj.z < 1 && !rotulosNaTela.some(([a, b]) => Math.abs(a - px) < Math.max(30, el.textContent.length * 9) && Math.abs(b - py) < 22);
    el.style.display = aparece ? "block" : "none";
    if (aparece) {
      rotulosNaTela.push([px, py]);
      el.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) translate(-50%,-50%)`;
    }
  };
  function atualizarRotulos() {
    rotulosNaTela = [];
    const l = limites();
    const foraDoCorredor = estado.vista !== "corredor";
    const verCentro = rotulosLigados.centro && foraDoCorredor && !!l.centro && !ehMPP();
    const verParedes = rotulosLigados.parede && foraDoCorredor && !ehMPP();
    const passo = VAO + COL_X;
    const doLadoEsquerdo = camera.position.z >= controles.target.z;
    tagLado.style.display = verCentro ? "block" : "none";
    if (verCentro) tagLado.textContent = doLadoEsquerdo ? "Vendo o lado esquerdo" : "Vendo o lado direito";
    const f = doLadoEsquerdo ? 0 : fileiras() - 1; // a fila mais perto da câmera (a 1 fica do lado esquerdo); os números vão em todos os corredores dela
    const daFila = corredoresDe(estado).filter((c) => c.f === f);
    rotulosModulo.forEach((el, j) => {
      const c = daFila[Math.floor(j / MAX_MODULOS)], i = j % MAX_MODULOS;
      colocarRotulo(el, (c ? c.x0 : 0) + COL_X + i * passo + VAO / 2, ALTURAS[estado.altura].m + 0.11, c ? c.z : 0, verCentro && !!c && i < estado.modulos);
    });
    // Mini porta palete: o número de cada módulo, em cima dele, na fila mais perto da câmera
    const verMpp = rotulosLigados.mpp && foraDoCorredor && ehMPP();
    const m = verMpp ? l.mpp : null;
    let xMpp = m ? m.xMin + MONTANTE_MPP : 0;
    rotulosMpp.forEach((el, k) => {
      const v = m?.vaos[k];
      colocarRotulo(el, xMpp + (v || 0) / 2, m ? m.altura + 0.11 : 0, m ? m.filas[f] : 0, verMpp && v !== undefined);
      if (v !== undefined) xMpp += v + MONTANTE_MPP;
    });
    const q = paredesDe(estado);
    const y = ALTURAS[estado.alturaParede].m + 0.11;
    const lugar = {
      esq: (inicio, i) => [l.inicioE + inicio + COL_X + i * passo + VAO / 2, l.planoLateral],
      dir: (inicio, i) => [l.inicioD + inicio + COL_X + i * passo + VAO / 2, -l.planoLateral],
      fundo: (inicio, i) => [l.planoFundo, l.fundoIni - inicio - COL_X - i * passo - VAO / 2],
    };
    for (const lado of Object.keys(LETRA_PAREDE)) {
      let k = 0;
      trechosDoLado(q[lado]).forEach(({ n, inicio }, t) => {
        for (let i = 0; i < n; i++, k++) {
          const el = rotulosParede[lado][k];
          const texto = nomeModuloParede(lado, q[lado].length, t, i);
          if (el.textContent !== texto) el.textContent = texto;
          const [x, z] = lugar[lado](inicio, i);
          colocarRotulo(el, x, y, z, verParedes);
        }
      });
      for (; k < MAX_MODULOS_LADO; k++) colocarRotulo(rotulosParede[lado][k], 0, 0, 0, false);
    }
  }
  function mostrarRotulos(v) { rotulosLigados = v; atualizarRotulos(); }

  // ── Pós-processamento ──
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: compacto ? 2 : 4 }));
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

    controles.update();
    // Acima do forro ele some: dá para ver a loja inteira de cima.
    const acimaDoForro = camera.position.y > PE_DIREITO - 0.05;
    if (teto[0].visible === acimaDoForro) teto.forEach((o) => { o.visible = !acimaDoForro; });
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
      if (rotulosLigados.centro || rotulosLigados.parede || rotulosLigados.mpp) atualizarRotulos();
    }
  }
  function ligarLaco() {
    if (vivo && visivel && !idLaco) { antes = performance.now(); pedirQuadro(2); idLaco = requestAnimationFrame(laco); }
  }

  // ── Mouse e toque ──
  let aoTocar = null, baixo = false;
  const soltarVista = () => { if (estado.vista !== "giro" && estado.vista) { estado.vista = ""; aoMudarVista?.(""); } };
  const aoIniciarControle = () => {
    aoTocar = { pos: camera.position.clone(), alvo: controles.target.clone(), voo, vista: estado.vista };
    if (voo) soltarVista(); // a câmera para no meio do caminho
    voo = null;
    pedirQuadro(2);
  };
  // Só clicar não solta a vista: o clique também serve para ligar a rodinha do mouse.
  const aoMudarControle = () => {
    pedirQuadro(2);
    // A folga é proporcional à distância: 1 px de tremida num clique já move a câmera alguns centímetros.
    if (baixo && aoTocar && aoTocar.pos.distanceTo(camera.position) > 0.01 * aoTocar.pos.distanceTo(aoTocar.alvo)) soltarVista();
  };
  const aoRodar = () => { if (controles.enableZoom) soltarVista(); };
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
  canvas.addEventListener("wheel", aoRodar, { passive: true });
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
  try {
    montar();
    acertarLado();
    ajustarTela();
    irPara(estado.vista || "ponta", true);
    iniciado = true;
    ligarLaco();
  } catch (e) {
    destruir(); // "Tentar de novo" cria tudo outra vez: o contexto WebGL e os observadores não podem ficar soltos
    throw e;
  }

  function configurar(cfg) {
    const mudouParedes = cfg.montagem !== estado.montagem || cfg.cantos.esq !== estado.cantos.esq || cfg.cantos.dir !== estado.cantos.dir || Object.keys(LETRA_PAREDE).some((k) => cfg.paredes[k].join() !== estado.paredes[k].join());
    // Trocar só o tipo de um lado não muda o tamanho: a câmera fica onde está.
    const semPeso = (m) => JSON.stringify({ ...m, peso: "" }); // o peso não muda o desenho: a câmera fica onde está
    const mudouTamanho = mudouParedes || cfg.produto !== estado.produto || semPeso(cfg.mpp) !== semPeso(estado.mpp) || cfg.filas.join() !== estado.filas.join() || ["modulos", "pontas", "linha", "altura", "alturaParede"].some((k) => cfg[k] !== estado[k]);
    const mudouCor = cfg.cor !== estado.cor || cfg.etiqueta !== estado.etiqueta;
    Object.assign(estado, cfg);
    if (mudouCor) aplicarCor();
    montar();
    if (mudouParedes) acertarLado();
    if (mudouTamanho) { if (estado.vista) irPara(estado.vista); else reenquadrar(); }
    atualizarRotulos();
  }

  // Imagem para mandar ao cliente: quadro completo em alta resolução, com as medidas numa faixa embaixo.
  function gerarImagem({ titulo, extras = [], medidas, nota }) {
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
    const faixa = Math.round(faixaBase * (1 + 0.24 * extras.length)); // linhas a mais, sem encolher o título
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
      ...extras.map((t) => [t, 26, 600, "#ECEDF1"]),
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
    canvas.removeEventListener("wheel", aoRodar);
    canvas.removeEventListener("webglcontextlost", aoPerderContexto);
    canvas.removeEventListener("webglcontextrestored", aoRecuperarContexto);
    controles.dispose();
    [...rotulosModulo, ...rotulosMpp, ...Object.values(rotulosParede).flat(), tagLado].forEach((el) => el.remove());
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

  return { configurar, irPara, verLado, verParede, mostrarRotulos, gerarImagem, destruir };
}
