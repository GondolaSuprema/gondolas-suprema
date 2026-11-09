"use client";
// Passeio e tela cheia do 3D, iguais na aba Projeto e no link do cliente:
// - passeio: o 3D cobre a tela e a pessoa anda pela loja na altura dos olhos (motor: andar/sairAndar/joystick);
//   botão Sair, legenda das teclas no computador, controle de andar e dica no celular;
// - tela cheia: o 3D com as vistas cobre a tela; no computador, Android e iPad também pede a tela cheia do
//   navegador; no iPhone, que não deixa, fica só o cartão por cima da página.
import { useCallback, useEffect, useRef, useState } from "react";

const AZUL = "#123a66";
const TEXTO = "#1c2433";
const FONTE = "'DM Sans', sans-serif";

// Deixa inativo (Tab e leitor de tela não chegam) tudo o que está fora do elemento; devolve como estava.
function inativarFora(el) {
  const marcados = [];
  for (let n = el; n && n.parentElement && n !== document.body; n = n.parentElement) {
    for (const s of n.parentElement.children) if (s !== n && !s.inert) { s.inert = true; marcados.push(s); }
  }
  return () => marcados.forEach((s) => { s.inert = false; });
}

// A página não rola por trás enquanto algo cobre a tela; ao sair, volta para o mesmo ponto.
function travarRolagem() {
  const y = window.scrollY, h = document.documentElement, b = document.body;
  const antes = [h.style.overflow, b.style.overflow];
  h.style.overflow = "hidden";
  b.style.overflow = "hidden";
  return () => { h.style.overflow = antes[0]; b.style.overflow = antes[1]; window.scrollTo(0, y); };
}

// caixaRef: o quadro do 3D (vai para a tela inteira no passeio). molduraRef: o 3D com as vistas (tela cheia).
export function usePasseio3D({ motor, caixaRef, molduraRef }) {
  const [andando, setAndando] = useState(false);
  const [cheia, setCheia] = useState(false);
  const andandoRef = useRef(false), cheiaRef = useRef(false);

  // Vai no criarProjeto3D: o motor avisa quando entra e sai do passeio (Sair, Esc ou o botão)
  const aoMudarModo = useCallback((m) => { andandoRef.current = m === "andar"; setAndando(m === "andar"); }, []);

  const alternarCheia = useCallback(() => {
    const ligar = !cheiaRef.current;
    cheiaRef.current = ligar;
    setCheia(ligar);
    const el = molduraRef.current;
    // Pedido dentro do clique: fora dele o navegador recusa
    if (ligar && el?.requestFullscreen && document.fullscreenEnabled && !document.fullscreenElement) {
      el.requestFullscreen().then(() => { if (!cheiaRef.current) document.exitFullscreen().catch(() => {}); }).catch(() => {});
    }
    if (!ligar && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, [molduraRef]);

  useEffect(() => {
    if (!andando || !caixaRef.current) return;
    const devolver = inativarFora(caixaRef.current), destravar = travarRolagem();
    return () => { devolver(); destravar(); };
  }, [andando, caixaRef]);

  useEffect(() => {
    if (!cheia || !molduraRef.current) return;
    const devolver = inativarFora(molduraRef.current), destravar = travarRolagem();
    return () => { devolver(); destravar(); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
  }, [cheia, molduraRef]);

  useEffect(() => {
    // O Esc do navegador sai da tela cheia de verdade e não chega à página. No passeio, a pessoa queria sair do
    // passeio: sai dele e o cartão continua cobrindo a tela. Fora do passeio, o cartão volta para a página.
    const aoMudarTela = () => {
      if (document.fullscreenElement || !cheiaRef.current) return;
      if (andandoRef.current) { motor.current?.sairAndar(); return; }
      cheiaRef.current = false;
      setCheia(false);
    };
    // Esc na tela cheia só do cartão (iPhone com teclado). No documento, antes do motor (que escuta na janela):
    // no passeio o Esc é dele.
    const aoTecla = (e) => {
      if (e.key !== "Escape" || !cheiaRef.current || andandoRef.current) return;
      cheiaRef.current = false;
      setCheia(false);
    };
    document.addEventListener("fullscreenchange", aoMudarTela);
    document.addEventListener("keydown", aoTecla);
    return () => { document.removeEventListener("fullscreenchange", aoMudarTela); document.removeEventListener("keydown", aoTecla); };
  }, [motor]);

  return { andando, cheia, aoMudarModo, alternarCheia };
}

// Estilo do quadro do 3D no passeio: cobre a tela inteira, por cima de tudo.
// fundo: a cor da página (o Safari do iPhone pinta as barras com a cor do elemento fixo e mantém depois).
export const estiloPasseio = (fundo) => ({ position: "fixed", inset: 0, zIndex: 1000, width: "auto", height: "100dvh", margin: 0, border: 0, borderRadius: 0, touchAction: "none", overscrollBehavior: "contain", background: fundo });

export function IconeAndar({ tamanho = 20 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <circle cx="14" cy="4.2" r="2" /><path d="M13 8l-2 6M11 14l-3 7M11 14l3 3v4M8.5 10.5L13 8l3.5 3" />
    </svg>
  );
}

export function IconeTelaCheia({ cheia, tamanho = 20 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d={cheia ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"} />
    </svg>
  );
}

const TECLAS_LEGENDA = [
  [["W", "↑"], "Andar para frente"],
  [["S", "↓"], "Andar para trás"],
  [["A", "D"], "Passo para o lado"],
  [["←", "→"], "Virar"],
  [["Shift"], "Segure para ir mais rápido"],
  ["arrastar", "Arraste para olhar em volta"],
  ["clicar", "Clique no chão para ir até lá"],
  [["Esc"], "Sair do passeio"],
];
const NOMES_SETA = { "↑": "seta para cima", "↓": "seta para baixo", "←": "seta para a esquerda", "→": "seta para a direita" };

function Mouse({ clique }) {
  return (
    <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" style={{ color: AZUL }}>
      {clique && <path d="M12 3a5.5 5.5 0 0 0-5.5 5.5h5.5z" fill="currentColor" stroke="none" />}
      <rect x="6.5" y="3" width="11" height="18" rx="5.5" /><path d="M12 3v5.5" />
      {!clique && <path d="M2.5 12h2M19.5 12h2" />}
    </svg>
  );
}

// Botão Sair, dica, controle de andar (celular) e legenda das teclas (computador): por cima do 3D, só no passeio.
// focoAoSair: o botão que recebe o foco quando o passeio acaba (o "Andar").
export function CamadaPasseio({ andando, toque, motor, focoAoSair }) {
  const sairRef = useRef(null), joyRef = useRef(null), pinoRef = useRef(null), joyId = useRef(null);
  const [dica, setDica] = useState(false);
  const [legendaAberta, setLegendaAberta] = useState(true);
  const estavaAndando = useRef(false);

  useEffect(() => {
    if (andando) {
      estavaAndando.current = true;
      sairRef.current?.focus({ preventScroll: true });
      if (!toque) return;
      setDica(true);
      const t = setTimeout(() => setDica(false), 9000);
      return () => clearTimeout(t);
    }
    setDica(false);
    if (estavaAndando.current) { estavaAndando.current = false; focoAoSair?.current?.focus({ preventScroll: true }); }
  }, [andando, toque, focoAoSair]);

  if (!andando) return null;

  const RAIO_JOY = 44;
  const moverJoy = (e) => {
    const r = joyRef.current.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > RAIO_JOY) { dx *= RAIO_JOY / d; dy *= RAIO_JOY / d; }
    pinoRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    const zona = d < 7; // folga no centro: o dedo parado não faz a pessoa andar sozinha
    motor.current?.joystick(zona ? 0 : dx / RAIO_JOY, zona ? 0 : dy / RAIO_JOY);
  };
  const soltarJoy = (e) => {
    if (e.pointerId !== joyId.current) return;
    joyId.current = null;
    if (pinoRef.current) pinoRef.current.style.transform = "";
    motor.current?.joystick(0, 0);
  };
  const baixa = typeof window !== "undefined" && window.innerHeight < 600;
  const tecla = { minWidth: baixa ? 23 : 27, height: baixa ? 23 : 27, padding: "0 6px", display: "inline-flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", border: "1px solid rgba(18,58,102,.22)", borderBottomWidth: 3, borderRadius: 7, background: "#fff", color: AZUL, font: `700 12.5px ${FONTE}`, lineHeight: 1 };

  return (
    <>
      <button ref={sairRef} type="button" onClick={() => motor.current?.sairAndar()} style={{ position: "absolute", zIndex: 3, top: "max(12px, env(safe-area-inset-top))", left: "max(12px, env(safe-area-inset-left))", height: 42, padding: "0 16px 0 12px", display: "flex", alignItems: "center", gap: 6, border: 0, borderRadius: 999, background: "rgba(255,255,255,.94)", color: AZUL, font: `700 14px ${FONTE}`, boxShadow: "0 4px 14px rgba(0,0,0,.28)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        Sair
      </button>

      {toque && dica && (
        <div role="status" style={{ position: "absolute", zIndex: 3, left: 0, right: 0, top: "calc(max(12px, env(safe-area-inset-top)) + 54px)", margin: "0 auto", width: "fit-content", maxWidth: "calc(100% - 24px)", padding: "7px 14px", borderRadius: 999, background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 12.5, lineHeight: 1.45, textAlign: "center", fontFamily: FONTE, pointerEvents: "none" }}>
          Arraste para olhar em volta · use o controle para andar · toque no chão para ir até lá
        </div>
      )}

      {toque && (
        <div ref={joyRef} aria-hidden="true"
          onPointerDown={(e) => { joyId.current = e.pointerId; try { joyRef.current.setPointerCapture(e.pointerId); } catch {} moverJoy(e); }}
          onPointerMove={(e) => { if (e.pointerId === joyId.current) moverJoy(e); }}
          onPointerUp={soltarJoy} onPointerCancel={soltarJoy}
          style={{ position: "absolute", zIndex: 3, left: "max(22px, env(safe-area-inset-left))", bottom: "max(26px, calc(env(safe-area-inset-bottom) + 14px))", width: 124, height: 124, borderRadius: "50%", background: "rgba(255,255,255,.14)", border: "2px solid rgba(255,255,255,.5)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}>
          <div ref={pinoRef} style={{ position: "absolute", left: "50%", top: "50%", width: 54, height: 54, margin: "-27px 0 0 -27px", borderRadius: "50%", background: "rgba(255,255,255,.92)", boxShadow: "0 2px 10px rgba(0,0,0,.35)", pointerEvents: "none" }} />
        </div>
      )}

      {!toque && (
        <aside aria-label="Como andar pelo projeto" style={{ position: "absolute", zIndex: 3, left: "max(12px, env(safe-area-inset-left))", bottom: "max(12px, env(safe-area-inset-bottom))", width: legendaAberta ? 300 : "auto", maxWidth: "calc(100% - 24px)", borderRadius: 14, background: "rgba(255,255,255,.95)", color: TEXTO, boxShadow: "0 6px 20px rgba(0,0,0,.28)", overflow: "hidden", fontFamily: FONTE }}>
          <button type="button" aria-expanded={legendaAberta} onClick={() => setLegendaAberta((a) => !a)} style={{ width: "100%", height: baixa ? 36 : 40, padding: "0 12px 0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, border: 0, background: "transparent", color: AZUL, font: `700 12.5px ${FONTE}`, letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer" }}>
            Como andar
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", transform: legendaAberta ? "none" : "rotate(180deg)", transition: "transform .2s" }}><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {legendaAberta && (
            <ul style={{ listStyle: "none", margin: 0, padding: `0 14px ${baixa ? 10 : 13}px`, display: "grid", gap: baixa ? 4 : 7 }}>
              {TECLAS_LEGENDA.map(([teclas, texto]) => (
                <li key={texto} style={{ display: "grid", gridTemplateColumns: "70px minmax(0, 1fr)", alignItems: "center", gap: 10, fontSize: 13, lineHeight: 1.25 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {Array.isArray(teclas)
                      ? teclas.map((k) => <kbd key={k} aria-label={NOMES_SETA[k]} style={tecla}>{k}</kbd>)
                      : <Mouse clique={teclas === "clicar"} />}
                  </span>
                  <span>{texto}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}
    </>
  );
}
