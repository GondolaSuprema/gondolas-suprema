// ─── Arena 3D do Painel (WebGL com Three.js) ─────────────────────────────────
// Cena única com 4 vistas (consultores, 12 meses, funil e vendedores). O usuário gira
// para qualquer lado, aproxima e toca num bloco para focar nele. Este arquivo só é
// carregado quando o Painel abre (import dinâmico), então não pesa nas outras abas.
// Só desenha: os números chegam prontos do PainelPage e todos os blocos de uma vista
// usam a mesma escala, com o valor exato escrito ao lado.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const FMT_MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const FMT_PCT = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
const FMT_INT = new Intl.NumberFormat("pt-BR");
const moeda = (v) => FMT_MOEDA.format(Number(v) || 0);
const pct = (v) => FMT_PCT.format(Number(v) || 0);
const inteiro = (v) => FMT_INT.format(Math.round(v));
const decimal = (v) => v.toFixed(1).replace(".", ",");
const milhar = (v) => (v >= 999500 ? decimal(v / 1e6) + " mi" : v >= 9950 ? Math.round(v / 1000) + "k" : v >= 1000 ? decimal(v / 1000) + "k" : String(Math.round(v)));

const ALT_MAX = 4.4; // altura do maior bloco, em unidades da cena
const MIN_ALT = 0.06; // valor zero aparece como placa fina, com o "0" escrito

// ── Vistas: transformam os dados em blocos e textos ──────────────────────────
function vistaConsultores({ consultores, series }, compacto) {
  const w = compacto ? 0.8 : 0.95, gap = compacto ? 0.1 : 0.16, sep = compacto ? 0.55 : 1.5;
  const grupoL = series.length * w + (series.length - 1) * gap;
  const totalL = consultores.length * grupoL + (consultores.length - 1) * sep;
  const max = Math.max(1, ...consultores.map(c => c.recebidos));
  const itens = [], rotulos = [];
  consultores.forEach((c, gi) => {
    const x0 = -totalL / 2 + gi * (grupoL + sep);
    const centro = x0 + grupoL / 2;
    itens.push({ id: `c:${c.nome}:base`, tipo: "caixa", x: centro, y: 0, z: 0, w: grupoL + 0.5, d: w + 0.9, h: 0.07, cor: "#26262C", cresce: "xz", semEscolha: true, atraso: gi * 90 });
    rotulos.push({ id: `c:${c.nome}:nome`, x: centro, y: 0.02, z: (w + 0.9) / 2 + 0.45, texto: c.nome, forte: true });
    series.forEach((s, si) => {
      const v = c[s.key];
      const pctTxt = si > 0 && c.recebidos ? ` (${pct(v / c.recebidos)} dos recebidos)` : "";
      itens.push({
        id: `c:${c.nome}:${s.key}`, tipo: "caixa", x: x0 + si * (w + gap) + w / 2, y: 0.07, z: 0, w, d: w,
        h: Math.max(MIN_ALT, (v / max) * ALT_MAX), cor: s.cor, valor: v, fmt: inteiro,
        detalhe: `${c.nome} · ${s.nome}: ${inteiro(v)}${pctTxt}`, atraso: 120 + gi * 130 + si * 80,
      });
    });
  });
  return { itens, rotulos, raioX: totalL / 2 + 0.7, raioY: ALT_MAX / 2 + 0.9, alvoY: 1.95, az: -0.38, pol: 1.25 };
}

function vistaMeses({ meses }, compacto) {
  const max = Math.max(1, ...meses.map(m => m.y));
  const R = compacto ? 7.5 : 11;
  const passo = (compacto ? 0.14 : 0.145);
  const itens = [], rotulos = [];
  const w = compacto ? 0.72 : 1.05;
  meses.forEach((m, i) => {
    const t = (i - (meses.length - 1) / 2) * passo;
    const x = Math.sin(t) * R, z = R - Math.cos(t) * R;
    const ultimo = i === meses.length - 1;
    itens.push({
      id: `m:${m.a}-${m.lab}`, tipo: "caixa", x, y: 0, z: -z, w, d: w, rotY: -t,
      h: Math.max(MIN_ALT, (m.y / max) * ALT_MAX), cor: ultimo ? "#F5A623" : "#9A7433", valor: m.y, fmt: (n) => (n < 0.5 ? "" : milhar(n)),
      detalhe: `${m.lab}/${m.a}: ${moeda(m.y)}`, atraso: i * 60,
    });
    rotulos.push({ id: `m:${m.a}-${m.lab}:n`, x, y: 0.02, z: -z + w / 2 + 0.45, texto: m.lab, forte: ultimo, discreto: !ultimo });
  });
  return { itens, rotulos, raioX: Math.sin(passo * 5.5) * R + (compacto ? 0.35 : 0.8), raioY: ALT_MAX / 2 + 0.9, alvoY: 1.9, az: compacto ? -0.1 : -0.22, pol: 1.3 };
}

function vistaFunil({ funil }) {
  const max = Math.max(1, funil[0]?.v || 0, ...funil.map(f => f.v));
  const h = 0.62, vao = 0.5, DIAM = 6.4;
  const base = funil[0]?.v || 0;
  const itens = [], rotulos = [];
  funil.forEach((f, i) => {
    const y = (funil.length - 1 - i) * (h + vao) + 0.15;
    const pctTxt = i > 0 && base ? ` (${pct(f.v / base)} dos recebidos)` : "";
    const diam = Math.max(0.55, (f.v / max) * DIAM);
    itens.push({ id: `f:${f.nm}`, tipo: "disco", x: 0, y, z: 0, w: diam, d: diam, h, cor: f.c, cresce: "xz", detalhe: `${f.nm}: ${inteiro(f.v)}${pctTxt}`, atraso: i * 150 });
    rotulos.push({ id: `f:${f.nm}:n`, x: 0, y: y + h + 0.03, z: 0, valorTexto: f.v, prefixo: `${f.nm} · `, forte: true, sempreVisivel: true, pilula: true });
  });
  // Câmera baixa: vista de cima, o disco largo esconderia os menores que ficam embaixo dele.
  return { itens, rotulos, raioX: DIAM / 2 + 0.5, raioY: 2.6, alvoY: 2.05, az: -0.5, pol: 1.42 };
}

function vistaVendedores({ vendedores }, compacto) {
  const max = Math.max(1, ...vendedores.map(v => Math.max(v.valor, v.meta))) * 1.05;
  const w = compacto ? 1.2 : 1.5, sep = compacto ? 2.4 : 3.6;
  const itens = [], rotulos = [];
  vendedores.forEach((v, i) => {
    const x = (i - (vendedores.length - 1) / 2) * sep;
    const altMeta = (v.meta / max) * ALT_MAX;
    itens.push({ id: `v:${v.nome}:meta`, tipo: "vidro", x, y: 0.01, z: 0, w: w + 0.3, d: w + 0.3, h: altMeta, cor: v.cor, detalhe: `${v.nome}: meta de ${moeda(v.meta)}`, atraso: i * 130 });
    itens.push({
      id: `v:${v.nome}:real`, tipo: "caixa", x, y: 0.01, z: 0, w, d: w, h: Math.max(MIN_ALT, (v.valor / max) * ALT_MAX), cor: v.cor,
      valor: v.valor, fmt: (n) => `${moeda(n)}\n${pct(n / v.meta)} da meta`, rotuloY: altMeta + 0.15, detalhe: `${v.nome}: ${moeda(v.valor)} (${pct(v.valor / v.meta)} da meta)`, atraso: 130 + i * 130,
    });
    rotulos.push({ id: `v:${v.nome}:n`, x, y: 0.02, z: (w + 0.3) / 2 + 0.45, texto: String(v.nome).split(" ")[0], forte: true });
  });
  return { itens, rotulos, raioX: ((vendedores.length - 1) / 2) * sep + w + 0.3, raioY: ALT_MAX / 2 + 1.1, alvoY: 2.1, az: -0.32, pol: 1.25 };
}

const VISTAS = { consultores: vistaConsultores, meses: vistaMeses, funil: vistaFunil, vendedores: vistaVendedores };

const suaveVolta = (t) => { const c = 1.15; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const anguloCurto = (de, para) => { let d = (para - de) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

// ── Motor ────────────────────────────────────────────────────────────────────
export function criarArena({ canvas, camadaRotulos, semMovimento = false, compacto = false, aoDica, aoEscolher, aoInteragir, aoFalhar, aoVoltar }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  function criarAmbiente() {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const sala = new RoomEnvironment();
    const textura = pmrem.fromScene(sala, 0.04).texture;
    sala.dispose();
    pmrem.dispose();
    return textura;
  }
  let ambiente = criarAmbiente();
  scene.environment = ambiente;
  scene.environmentIntensity = 0.38;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  camera.position.set(-6, 7, 18);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.85;
  controls.minPolarAngle = 0.04;
  controls.maxPolarAngle = 2.25; // passa do chão: dá para ver por baixo
  controls.autoRotateSpeed = -0.9;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };

  // Dedo na vertical rola a página; gesto que começa para o lado gira em qualquer direção. Tela cheia: gira sempre.
  canvas.style.touchAction = "pan-y";

  // Rodinha do mouse só aproxima depois de clicar na cena: sem isso, ela prenderia a rolagem da página.
  const toque = window.matchMedia?.("(pointer: coarse)").matches;
  controls.enableZoom = !!toque;

  // Luzes
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x10100c, 0.55));
  const sol = new THREE.DirectionalLight(0xffffff, 2.1);
  sol.position.set(7, 13, 9);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 40 });
  sol.shadow.bias = -0.0006;
  sol.shadow.radius = 5;
  scene.add(sol);
  const luzOuro = new THREE.PointLight(0xf5a623, 26, 26, 1.7);
  scene.add(luzOuro);

  // Chão: some ao olhar por baixo (FrontSide), assim o usuário enxerga a base dos blocos.
  const fade = document.createElement("canvas");
  fade.width = fade.height = 256;
  const ctx = fade.getContext("2d");
  const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  grad.addColorStop(0, "#ffffff"); grad.addColorStop(0.62, "#8a8a8a"); grad.addColorStop(1, "#000000");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 256);
  const texturaFade = new THREE.CanvasTexture(fade);
  const chao = new THREE.Mesh(
    new THREE.CircleGeometry(16, 96),
    new THREE.MeshStandardMaterial({ color: 0x0d0b07, roughness: 0.78, metalness: 0.2, envMapIntensity: 0.25, transparent: true, alphaMap: texturaFade, side: THREE.FrontSide }),
  );
  chao.rotation.x = -Math.PI / 2;
  chao.receiveShadow = true;
  scene.add(chao);
  const grade = new THREE.PolarGridHelper(12, 24, 6, 96, 0xf5a623, 0xf5a623);
  grade.material.transparent = true;
  grade.material.opacity = 0.16;
  grade.material.depthWrite = false;
  grade.position.y = 0.006;
  scene.add(grade);

  // Poeira dourada, bem discreta
  const nPoeira = compacto ? 70 : 150;
  const pontos = new Float32Array(nPoeira * 3);
  for (let i = 0; i < nPoeira; i++) {
    const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 11;
    pontos.set([Math.cos(a) * r, Math.random() * 8, Math.sin(a) * r], i * 3);
  }
  const geoPoeira = new THREE.BufferGeometry();
  geoPoeira.setAttribute("position", new THREE.BufferAttribute(pontos, 3));
  const poeira = new THREE.Points(geoPoeira, new THREE.PointsMaterial({ color: 0xf5c36a, size: 0.045, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(poeira);

  const geoCaixa = new RoundedBoxGeometry(1, 1, 1, 3, 0.05);
  geoCaixa.translate(0, 0.5, 0);
  const geoDisco = new THREE.CylinderGeometry(0.5, 0.5, 1, 72);
  geoDisco.translate(0, 0.5, 0);
  const geoVidro = new THREE.BoxGeometry(1, 1, 1);
  geoVidro.translate(0, 0.5, 0);
  const geoArestas = new THREE.EdgesGeometry(geoVidro);

  const itens = new Map(); // id → bloco em cena
  const textos = new Map(); // id → texto solto em cena
  const grupo = new THREE.Group();
  scene.add(grupo);
  let vistaAtual = null, cenaAtual = null;
  let selecionado = null, hover = null;
  let giroLigado = !semMovimento, retomarEm = 0;
  let voo = null, W = 1, H = 1, visivel = true, vivo = true;
  let tempoAnt = performance.now();
  const dur = semMovimento ? 0 : 1100;

  function novoTexto(def) {
    const el = document.createElement("div");
    el.style.cssText = "position:absolute;left:0;top:0;white-space:pre;text-align:center;pointer-events:none;will-change:transform;font-family:'DM Sans',sans-serif;font-variant-numeric:tabular-nums;line-height:1.25;text-shadow:0 1px 4px #000,0 0 8px #000;transition:opacity .35s;opacity:0";
    el.style.color = def.discreto ? "#8B8C97" : "#FFFFFF";
    el.style.fontWeight = def.forte ? "700" : "800";
    el.style.fontSize = (def.discreto ? (compacto ? 10.5 : 12) : compacto ? 12.5 : 14) + "px";
    if (def.pilula) { el.style.background = "rgba(9,9,11,.74)"; el.style.padding = "2px 9px"; el.style.borderRadius = "999px"; el.style.textShadow = "none"; }
    camadaRotulos.appendChild(el);
    return el;
  }

  function criarItem(def) {
    let material, malha;
    if (def.tipo === "vidro") {
      material = new THREE.MeshStandardMaterial({ color: def.cor, transparent: true, opacity: 0.14, roughness: 0.1, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
      malha = new THREE.Mesh(geoVidro, material);
      malha.add(new THREE.LineSegments(geoArestas, new THREE.LineBasicMaterial({ color: def.cor, transparent: true, opacity: 0.7 })));
    } else {
      material = new THREE.MeshStandardMaterial({ color: def.cor, metalness: 0.22, roughness: 0.34, emissive: def.cor, emissiveIntensity: 0.1, transparent: true });
      malha = new THREE.Mesh(def.tipo === "disco" ? geoDisco : geoCaixa, material);
      malha.castShadow = true;
      malha.receiveShadow = true;
    }
    malha.position.set(def.x, def.y, def.z);
    malha.rotation.y = def.rotY || 0;
    grupo.add(malha);
    const item = { def, malha, material, atual: { h: def.h, w: def.w, d: def.d, k: 0, v: 0 }, de: null, para: null, t0: 0, ms: dur, saindo: false, realce: 0, opac: 1 };
    item.de = { ...item.atual };
    item.para = { h: def.h, w: def.w, d: def.d, k: 1, v: def.valor || 0 };
    item.t0 = performance.now() + (semMovimento ? 0 : def.atraso || 0);
    malha.userData.item = item;
    if (def.fmt) item.el = novoTexto({ forte: false });
    itens.set(def.id, item);
    aplicarEscala(item);
    return item;
  }

  function aplicarEscala(it) {
    const { h, w, d, k } = it.atual, c = it.def.cresce === "xz";
    it.malha.scale.set(Math.max(0.0001, c ? w * k : w), Math.max(0.0001, c ? h : h * k), Math.max(0.0001, c ? d * k : d));
  }

  function removerItem(it) {
    grupo.remove(it.malha);
    it.material.dispose();
    it.malha.children.forEach(c => c.material?.dispose());
    it.el?.remove();
    itens.delete(it.def.id);
  }

  function selecionar(item, focar = true) {
    if (!item && !selecionado) { aoEscolher?.(null); return; } // toque no vazio não desfaz o zoom
    if (selecionado === item) item = null;
    selecionado = item;
    aoEscolher?.(item ? item.def.detalhe : null);
    if (!focar || !cenaAtual) return;
    if (item) {
      const topo = item.def.y + item.def.h / 2;
      voarPara({ alvo: new THREE.Vector3(item.def.x, topo, item.def.z), dist: Math.max(6, distanciaIdeal(cenaAtual) * 0.6) }, 850);
    } else {
      voarPara({ alvo: new THREE.Vector3(0, cenaAtual.alvoY, 0), dist: distanciaIdeal(cenaAtual) }, 850);
    }
  }

  // Distância em que a vista inteira cabe no quadro, seja qual for o formato da tela.
  function distanciaIdeal({ raioX, raioY }) {
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return Math.max(raioY / t, raioX / (t * camera.aspect)) * 1.24;
  }

  // Leva a câmera com suavidade até um ângulo e distância (o usuário pode interromper a qualquer momento).
  function voarPara({ alvo, dist, az, pol }, ms = 1100) {
    const off = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    voo = {
      t0: performance.now(), ms: semMovimento ? 1 : ms,
      alvoDe: controls.target.clone(), alvoPara: alvo ? alvo.clone() : controls.target.clone(),
      raioDe: off.radius, raioPara: dist ?? off.radius,
      azDe: off.theta, azDelta: az == null ? 0 : anguloCurto(off.theta, az),
      polDe: off.phi, polPara: pol ?? off.phi,
    };
  }

  function mostrar(vista, dados) {
    const cena = VISTAS[vista](dados, compacto);
    const mudou = vista !== vistaAtual;
    const agora = performance.now();
    const ids = new Set(cena.itens.map(i => i.id));
    itens.forEach(it => {
      if (!ids.has(it.def.id) && !it.saindo) {
        it.saindo = true;
        it.de = { ...it.atual };
        it.para = { ...it.atual, k: 0 };
        it.t0 = agora; it.ms = semMovimento ? 0 : 320;
        it.el?.remove(); it.el = null;
      }
    });
    const tinhaSelecao = !!selecionado;
    if (selecionado) selecionar(null, false); // dados novos: a seleção antiga não vale mais
    cena.itens.forEach(def => {
      const it = itens.get(def.id);
      if (it && !it.saindo) {
        it.def = def;
        it.material.color.set(def.cor);
        if (it.material.emissive) it.material.emissive.set(def.cor);
        it.malha.position.set(def.x, def.y, def.z);
        it.de = { ...it.atual };
        it.para = { h: def.h, w: def.w, d: def.d, k: 1, v: def.valor || 0 };
        it.t0 = agora; it.ms = dur;
      } else {
        if (it) removerItem(it);
        const novo = criarItem(def);
        if (mudou && !semMovimento && vistaAtual) novo.t0 += 240; // deixa a vista anterior sair antes
      }
    });
    const idsTxt = new Set(cena.rotulos.map(r => r.id));
    textos.forEach((t, id) => { if (!idsTxt.has(id)) { t.el.remove(); textos.delete(id); } });
    cena.rotulos.forEach(def => {
      const t = textos.get(def.id);
      if (t) { t.def = def; t.para = def.valorTexto ?? 0; t.de = t.v; t.t0 = agora; }
      else textos.set(def.id, { def, el: novoTexto(def), v: 0, de: 0, para: def.valorTexto ?? 0, t0: agora + (mudou && vistaAtual ? 240 : 0) });
    });
    const primeira = !vistaAtual;
    const distAntes = cenaAtual ? distanciaIdeal(cenaAtual) : 0;
    cenaAtual = cena;
    vistaAtual = vista;
    const dist = distanciaIdeal(cena);
    const alvo = new THREE.Vector3(0, cena.alvoY, 0);
    controls.maxDistance = dist * 2.2;
    if (mudou) {
      controls.minDistance = 3;
      if (primeira) {
        // Entra de longe e desce até a posição certa
        controls.target.copy(alvo);
        camera.position.setFromSpherical(new THREE.Spherical(dist * 1.35, 0.72, cena.az - 0.7)).add(alvo);
      }
      voarPara({ alvo, dist, az: cena.az, pol: cena.pol }, primeira ? 1500 : 1150);
    } else if (tinhaSelecao || Math.abs(dist / distAntes - 1) > 0.01) {
      voarPara({ alvo, dist }, 850); // mês com mais ou menos consultores: reenquadra para ninguém ficar cortado
    }
  }

  function acao(nome) {
    if (!cenaAtual) return;
    const off = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    retomarEm = performance.now() + 9000;
    aoInteragir?.();
    if (nome === "virar") voarPara({ az: off.theta + Math.PI * 0.999 }, 1100);
    else if (nome === "frente") voarPara({ az: 0, pol: 1.28 });
    else if (nome === "lado") voarPara({ az: Math.PI / 2, pol: 1.28 });
    else if (nome === "cima") voarPara({ pol: 0.08 });
    else if (nome === "baixo") voarPara({ pol: 2.1 });
    else if (nome === "mais") voarPara({ dist: Math.max(controls.minDistance, off.radius * 0.78) }, 450);
    else if (nome === "menos") voarPara({ dist: Math.min(controls.maxDistance, off.radius * 1.28) }, 450);
    else if (nome === "centro") {
      selecionar(null, false);
      voarPara({ alvo: new THREE.Vector3(0, cenaAtual.alvoY, 0), dist: distanciaIdeal(cenaAtual), az: cenaAtual.az, pol: cenaAtual.pol });
    }
  }

  function setGiro(ligado) { giroLigado = !!ligado && !semMovimento; retomarEm = 0; }

  // ── Mouse e toque: clique em bloco, passar o mouse, rodinha ──
  const mira = new THREE.Raycaster();
  const ponteiro = new THREE.Vector2();
  let baixo = null, anguloAoTocar = null, vooAoTocar = null, retomarAoTocar = 0;
  function blocoEm(ev) {
    const r = canvas.getBoundingClientRect();
    ponteiro.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    mira.setFromCamera(ponteiro, camera);
    const alvos = [];
    itens.forEach(it => { if (!it.saindo && !it.def.semEscolha) alvos.push(it.malha); });
    // Sólido na frente do vidro: o que está dentro da meta continua clicável.
    const hits = mira.intersectObjects(alvos, false);
    return (hits.find(h => h.object.userData.item?.def.tipo !== "vidro") || hits[0])?.object.userData.item || null;
  }
  const aoBaixar = (ev) => {
    baixo = { x: ev.clientX, y: ev.clientY };
    anguloAoTocar = ev.pointerType === "touch" ? new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)) : null;
    controls.enableZoom = true;
    canvas.style.cursor = "grabbing";
  };
  const aoSoltar = (ev) => {
    canvas.style.cursor = hover ? "pointer" : "grab";
    anguloAoTocar = null;
    if (!baixo) return;
    aoInteragir?.();
    const mexeu = Math.hypot(ev.clientX - baixo.x, ev.clientY - baixo.y);
    baixo = null;
    if (mexeu < 7) selecionar(blocoEm(ev));
  };
  // O navegador assumiu o gesto para rolar a página: tira a inércia e desfaz o pouco que a cena girou antes disso.
  const aoCancelar = () => {
    baixo = null;
    if (!anguloAoTocar) return;
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = true;
    retomarEm = retomarAoTocar;
    if (vooAoTocar) voo = vooAoTocar; // a animação que estava rodando continua de onde deveria estar
    else voarPara({ az: anguloAoTocar.theta, pol: anguloAoTocar.phi }, 180);
    anguloAoTocar = null;
  };
  const aoMover = (ev) => {
    if (ev.pointerType !== "mouse" || ev.buttons) return;
    const item = blocoEm(ev);
    if (item !== hover) {
      hover = item;
      canvas.style.cursor = item ? "pointer" : "grab";
      aoDica?.(item ? item.def.detalhe : null);
    }
  };
  const aoSair = () => {
    if (!toque && !expandida) controls.enableZoom = false;
    if (hover) { hover = null; aoDica?.(null); }
  };
  let expandida = false;
  function setExpandida(v) {
    expandida = !!v;
    canvas.style.touchAction = expandida ? "none" : "pan-y";
    if (expandida) controls.enableZoom = true;
  }
  canvas.addEventListener("pointerdown", aoBaixar);
  canvas.addEventListener("pointerup", aoSoltar);
  canvas.addEventListener("pointercancel", aoCancelar);
  canvas.addEventListener("pointermove", aoMover);
  canvas.addEventListener("pointerleave", aoSair);
  canvas.style.cursor = "grab";
  const aoControlar = () => { vooAoTocar = voo; retomarAoTocar = retomarEm; voo = null; retomarEm = performance.now() + 7000; };
  controls.addEventListener("start", aoControlar);
  // O aparelho pode derrubar o WebGL (voltar de segundo plano, pouca memória); o preventDefault deixa a cena voltar.
  const aoPerderContexto = (ev) => { ev.preventDefault(); aoFalhar?.(); };
  const aoRecuperarContexto = () => {
    ambiente.dispose();
    ambiente = criarAmbiente(); // o reflexo é desenhado na GPU e não volta sozinho: sem ele os blocos ficam escuros
    scene.environment = ambiente;
    aoVoltar?.();
  };
  canvas.addEventListener("webglcontextlost", aoPerderContexto);
  canvas.addEventListener("webglcontextrestored", aoRecuperarContexto);

  function redimensionar() {
    const pai = canvas.parentElement;
    const antes = cenaAtual ? distanciaIdeal(cenaAtual) : 0;
    W = Math.max(1, pai.clientWidth); H = Math.max(1, pai.clientHeight);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    if (!cenaAtual) return;
    const dist = distanciaIdeal(cenaAtual);
    controls.maxDistance = dist * 2.2;
    // Palco mudou de formato (tela cheia, girar o aparelho): reenquadra mantendo o zoom que a pessoa escolheu.
    const fator = dist / antes;
    if (Math.abs(fator - 1) <= 0.01) return;
    if (voo) voo.raioPara *= fator; // não corta o movimento em andamento
    else if (baixo) camera.position.sub(controls.target).multiplyScalar(fator).add(controls.target);
    else voarPara({ dist: camera.position.distanceTo(controls.target) * fator }, 450);
  }
  const obsTamanho = new ResizeObserver(redimensionar);
  obsTamanho.observe(canvas.parentElement);
  redimensionar();

  // ── Laço de desenho (para quando a cena sai da tela) ──
  const proj = new THREE.Vector3();
  const raioTeste = new THREE.Ray();
  const caixaTeste = new THREE.Box3();
  const pontoTeste = new THREE.Vector3();
  const pontoBatida = new THREE.Vector3();
  // O texto fica por cima do canvas, então o 3D não o esconde: verificamos se há um bloco na frente.
  function textoTapado(x, y, z) {
    pontoTeste.set(x, y, z);
    const dist = camera.position.distanceTo(pontoTeste);
    raioTeste.origin.copy(camera.position);
    raioTeste.direction.copy(pontoTeste).sub(camera.position).normalize();
    for (const it of itens.values()) {
      const d = it.def;
      if (it.saindo || d.tipo === "vidro" || d.semEscolha) continue;
      const c = d.cresce === "xz";
      const mw = (c ? it.atual.w * it.atual.k : it.atual.w) / 2, md = (c ? it.atual.d * it.atual.k : it.atual.d) / 2;
      caixaTeste.min.set(d.x - mw, d.y, d.z - md);
      caixaTeste.max.set(d.x + mw, d.y + (c ? it.atual.h : it.atual.h * it.atual.k), d.z + md);
      if (raioTeste.intersectBox(caixaTeste, pontoBatida) && camera.position.distanceTo(pontoBatida) < dist - 0.05) return true;
    }
    return false;
  }
  let nQuadro = 0;
  function colocarTexto(alvo, x, y, z, centroVertical, sempreVisivel) {
    const el = alvo.el;
    proj.set(x, y, z).project(camera);
    if (proj.z > 1 || proj.z < -1) { el.style.opacity = "0"; return; }
    const px = ((proj.x + 1) / 2) * W, py = ((1 - proj.y) / 2) * H;
    el.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0) translate(-50%,${centroVertical ? "-20%" : "-100%"})`;
    el.style.zIndex = String(Math.round((1 - proj.z) * 100000));
    alvo.px = px; alvo.py = py;
    if (!sempreVisivel && nQuadro % 6 === 0) alvo.tapado = textoTapado(x, y, z);
    el.style.opacity = alvo.colide ? "0" : alvo.tapado ? "0.14" : selecionado ? "0.55" : "1";
  }

  // Nomes discretos (meses) não se atropelam ao girar: o que encostar em outro some até abrir espaço.
  function esconderColisoes() {
    const lista = [...textos.values()], ocupados = lista.filter(t => !t.def.discreto);
    lista.filter(t => t.def.discreto).forEach(t => {
      t.colide = ocupados.some(o => Math.abs(o.px - t.px) < (compacto ? 27 : 30) && Math.abs(o.py - t.py) < 15);
      if (!t.colide) ocupados.push(t);
    });
  }

  // Vistos de cima ou de baixo, os discos do funil ficam no mesmo ponto da tela: as etiquetas descem em coluna.
  function afastarPilulas() {
    let ultimo = -Infinity;
    textos.forEach(t => {
      if (!t.def.pilula || t.px == null) return;
      const py = Math.max(t.py, ultimo + (compacto ? 25 : 28));
      if (py !== t.py) t.el.style.transform = `translate3d(${t.px.toFixed(1)}px,${py.toFixed(1)}px,0) translate(-50%,-100%)`;
      ultimo = py;
    });
  }

  // Aparelho fraco: se os primeiros quadros saírem lentos, reduz a qualidade para o giro continuar fluido.
  // Só mede depois da entrada: compilar os shaders e a animação inicial pesam em qualquer aparelho.
  let qualidade = 2, medidos = 0, somaMs = 0;
  const medirDesde = performance.now() + 2500;
  function ajustarQualidade(ms) {
    if (document.hidden || qualidade === 0 || ms > 400 || performance.now() < medirDesde) return;
    somaMs += ms; medidos++;
    if (medidos < 45) return;
    const media = somaMs / medidos;
    medidos = 0; somaMs = 0;
    if (media < 34) return;
    qualidade--;
    if (qualidade === 1) { sol.castShadow = false; poeira.visible = false; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); }
    else renderer.setPixelRatio(1);
    redimensionar();
  }

  function quadro(agora) {
    if (!vivo) return;
    ajustarQualidade(agora - tempoAnt);
    nQuadro++;
    const dt = Math.min(0.05, (agora - tempoAnt) / 1000);
    tempoAnt = agora;
    const s = agora / 1000;

    if (voo) {
      const t = Math.min(1, (agora - voo.t0) / voo.ms), e = suave(t);
      controls.target.lerpVectors(voo.alvoDe, voo.alvoPara, e);
      const sph = new THREE.Spherical(
        voo.raioDe + (voo.raioPara - voo.raioDe) * e,
        voo.polDe + (voo.polPara - voo.polDe) * e,
        voo.azDe + voo.azDelta * e,
      );
      camera.position.setFromSpherical(sph).add(controls.target);
      if (t >= 1) voo = null;
    }
    controls.autoRotate = giroLigado && !voo && !selecionado && agora > retomarEm;
    controls.update(dt);

    itens.forEach(it => {
      const tt = it.ms <= 0 ? 1 : Math.min(1, Math.max(0, (agora - it.t0) / it.ms));
      const e = it.saindo ? suave(tt) : suaveVolta(tt);
      for (const k of ["h", "w", "d", "k", "v"]) it.atual[k] = it.de[k] + (it.para[k] - it.de[k]) * e;
      aplicarEscala(it);
      const ativo = it === selecionado || it === hover;
      const alvoRealce = ativo ? 1 : 0;
      it.realce += (alvoRealce - it.realce) * (1 - Math.exp(-dt * 12));
      const apagado = selecionado && !ativo && it.def.tipo !== "vidro" && !it.def.semEscolha;
      it.opac += ((apagado ? 0.32 : 1) - it.opac) * (1 - Math.exp(-dt * 10));
      if (it.def.tipo !== "vidro") {
        it.material.emissiveIntensity = 0.1 + it.realce * (0.42 + (it === selecionado ? Math.sin(s * 4) * 0.12 : 0));
        it.material.opacity = it.opac;
      }
      if (it.el) {
        const c = it.def.cresce === "xz";
        const topo = it.def.y + (c ? it.atual.h : it.atual.h * it.atual.k);
        if (tt < 1 || it.textoDe !== it.para.v) { it.el.textContent = it.def.fmt(it.atual.v); it.textoDe = tt < 1 ? null : it.para.v; }
        colocarTexto(it, it.def.x, Math.max(topo, it.def.rotuloY || 0) + 0.12, it.def.z, false);
        if (selecionado && ativo) it.el.style.opacity = "1";
      }
      if (it.saindo && tt >= 1) removerItem(it);
    });
    textos.forEach(t => {
      if (t.def.prefixo != null) {
        const tt = semMovimento ? 1 : Math.min(1, Math.max(0, (agora - t.t0) / dur));
        t.v = t.de + (t.para - t.de) * suave(tt);
        const txt = t.def.prefixo + inteiro(t.v);
        if (t.el.textContent !== txt) t.el.textContent = txt;
      } else if (t.el.textContent !== t.def.texto) t.el.textContent = t.def.texto;
      colocarTexto(t, t.def.x, t.def.y, t.def.z, !t.def.prefixo, t.def.sempreVisivel);
    });
    if (nQuadro % 6 === 0) esconderColisoes();
    afastarPilulas();

    if (!semMovimento) {
      luzOuro.position.set(Math.cos(s * 0.45) * 9, 5.5, Math.sin(s * 0.45) * 9);
      poeira.rotation.y = s * 0.02;
    }
    renderer.render(scene, camera);
  }
  function ligarLaco(ligar) { renderer.setAnimationLoop(ligar ? quadro : null); }
  ligarLaco(true);
  const obsVisivel = new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting;
    if (visivel) tempoAnt = performance.now();
    ligarLaco(visivel);
  });
  obsVisivel.observe(canvas);

  function destruir() {
    vivo = false;
    ligarLaco(false);
    obsVisivel.disconnect();
    obsTamanho.disconnect();
    canvas.removeEventListener("pointerdown", aoBaixar);
    canvas.removeEventListener("pointerup", aoSoltar);
    canvas.removeEventListener("pointercancel", aoCancelar);
    canvas.removeEventListener("pointermove", aoMover);
    canvas.removeEventListener("pointerleave", aoSair);
    canvas.removeEventListener("webglcontextlost", aoPerderContexto);
    canvas.removeEventListener("webglcontextrestored", aoRecuperarContexto);
    controls.removeEventListener("start", aoControlar);
    controls.dispose();
    [...itens.values()].forEach(removerItem);
    textos.forEach(t => t.el.remove());
    textos.clear();
    [geoCaixa, geoDisco, geoVidro, geoArestas, geoPoeira, chao.geometry, chao.material, grade.geometry, grade.material, poeira.material, texturaFade, ambiente].forEach(x => x.dispose());
    renderer.dispose();
    renderer.forceContextLoss?.();
  }

  return { mostrar, acao, setGiro, setExpandida, destruir, webgl: true };
}
