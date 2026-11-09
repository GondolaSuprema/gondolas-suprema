"use client";
// Página que o cliente abre pelo link gerado na aba Projeto: o 3D que o consultor montou, com as medidas.
// Cada link abre uma vez só (função projeto_link_abrir no banco). Recarregar a mesma aba não gasta o link:
// o projeto fica guardado nesta aba (sessionStorage). Outra aba, outro aparelho ou outro dia: "já foi aberto".
// Se a resposta da 1ª abertura se perder (rede caiu, recarregou no "Preparando…"), a aba manda a mesma chave
// aleatória que guardou antes de chamar e o banco devolve o projeto de novo (até 1 hora depois).
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { usePasseio3D, estiloPasseio, CamadaPasseio, IconeAndar, IconeTelaCheia } from "./Passeio3D";

const AZUL = "#123a66";
const AMARELO = "#f2b200";
const FUNDO = "#f3f5f9";
const TEXTO = "#1c2433";
const APAGADO = "#5d6878";
const BORDA = "rgba(18,58,102,.10)";
const FONTE = "'DM Sans', sans-serif";
const FONTE_TITULO = "'Playfair Display', serif";
const VISTAS = [["geral", "Geral"], ["ponta", "Quina"], ["frente", "Frente"], ["corredor", "Corredor"], ["giro", "Girar"]];
const TOKEN_OK = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const semMovimento = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const texto = (v) => (typeof v === "string" ? v : "");

// Chave desta aba para este link, gravada ANTES de chamar o banco. Sem sessionStorage: null (sem segunda chance).
function chaveDaAba(token) {
  try {
    const nome = `projeto-link-aparelho:${token}`;
    let k = sessionStorage.getItem(nome);
    if (!TOKEN_OK.test(k || "")) {
      const b = crypto.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
      const h = Array.from(b, x => x.toString(16).padStart(2, "0")).join("");
      k = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
      sessionStorage.setItem(nome, k);
    }
    return k;
  } catch { return null; }
}

export default function ProjetoCliente({ token }) {
  const [situacao, setSituacao] = useState("carregando"); // carregando | ok | usado | nao-existe | falha
  const [dados, setDados] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  const pedido = useRef(-1);

  useEffect(() => {
    const chave = `projeto-link:${token}`;
    try {
      const salvo = sessionStorage.getItem(chave);
      const d = salvo && JSON.parse(salvo);
      if (d?.config && typeof d.config === "object") { setDados(d); setSituacao("ok"); return; }
    } catch {}
    if (!TOKEN_OK.test(token || "")) { setSituacao("nao-existe"); return; }
    if (pedido.current === tentativa) return; // o efeito pode rodar duas vezes: o link não pode ser gasto à toa
    pedido.current = tentativa;
    setSituacao("carregando");
    supabase.rpc("projeto_link_abrir", { p_token: token, p_aparelho: chaveDaAba(token) }).then(({ data, error }) => {
      if (error) { setSituacao("falha"); return; }
      if (data?.dados?.config && typeof data.dados.config === "object") {
        try { sessionStorage.setItem(chave, JSON.stringify(data.dados)); } catch {}
        setDados(data.dados);
        setSituacao("ok");
      } else setSituacao(data?.usado ? "usado" : "nao-existe");
    }, () => setSituacao("falha"));
  }, [token, tentativa]);

  if (situacao === "ok" && dados) return <Projeto dados={dados} />;
  const avisos = {
    carregando: { titulo: "Preparando o seu projeto…", texto: "Só um instante." },
    usado: { titulo: "Este link já foi aberto", texto: "Por segurança, cada link do seu projeto abre uma vez só. É só pedir um novo link ao seu consultor para ver de novo quando quiser." },
    "nao-existe": { titulo: "Link não encontrado", texto: "Confira se o link chegou completo ou peça um novo ao seu consultor." },
    falha: { titulo: "Não conseguimos abrir agora", texto: "Confira a sua internet e tente de novo." },
  };
  const a = avisos[situacao];
  return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px", background: `radial-gradient(1200px 600px at 50% -10%, #ffffff 0%, ${FUNDO} 60%)`, fontFamily: FONTE }}>
      <div style={{ width: "100%", maxWidth: 440, textAlign: "center", background: "#fff", border: `1px solid ${BORDA}`, borderRadius: 24, padding: "36px 28px", boxShadow: "0 24px 60px rgba(18,58,102,.12)" }}>
        <img src="/logo-suprema.png" alt="Gôndolas Suprema" style={{ width: 120, height: "auto", margin: "0 auto 14px", display: "block" }} />
        <h1 style={{ fontFamily: FONTE_TITULO, color: AZUL, fontSize: 26, lineHeight: 1.2, margin: "0 0 10px" }}>{a.titulo}</h1>
        <p style={{ color: APAGADO, fontSize: 15, lineHeight: 1.55, margin: 0 }}>{a.texto}</p>
        {situacao === "falha" && (
          <button onClick={() => setTentativa(t => t + 1)} style={{ marginTop: 20, height: 46, padding: "0 22px", border: 0, borderRadius: 12, background: AZUL, color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: FONTE, cursor: "pointer" }}>Tentar de novo</button>
        )}
      </div>
    </main>
  );
}

function Projeto({ dados }) {
  const canvasRef = useRef(null);
  const motor = useRef(null);
  const [estado3d, setEstado3d] = useState("carregando"); // carregando | ok | erro
  const [vista, setVista] = useState(dados.config.vista || "ponta");
  const [mexeu, setMexeu] = useState(false);
  // Já nasce com a largura certa: o Projeto só aparece no navegador (depois do banco), nunca no servidor.
  // Começar em true fazia o celular piscar o título grande do computador antes de encolher.
  const [larga, setLarga] = useState(() => typeof window === "undefined" || window.innerWidth >= 860);
  const toque = typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;
  // Andar pelo projeto e tela cheia (iguais aos da aba Projeto)
  const caixaRef = useRef(null), molduraRef = useRef(null), andarRef = useRef(null);
  const { andando, cheia, aoMudarModo, alternarCheia } = usePasseio3D({ motor, caixaRef, molduraRef });
  const [deitado, setDeitado] = useState(false); // celular deitado: na tela cheia, vistas e botões numa linha só
  // Os textos vêm do banco: tipo errado vira vazio em vez de derrubar a página.
  const t = dados.textos && typeof dados.textos === "object" ? dados.textos : {};
  // O nome do consultor continua salvo no link (dados.consultor), mas não aparece para o cliente (pedido do Ale, 8-nov-2026).
  const titulo = texto(t.titulo), nota = texto(t.nota);
  const extras = Array.isArray(t.extras) ? t.extras.filter(e => typeof e === "string") : [];

  useEffect(() => {
    const baixa = window.matchMedia("(orientation: landscape) and (max-height: 500px)");
    const ver = () => { setLarga(window.innerWidth >= 860); setDeitado(baixa.matches); };
    ver();
    window.addEventListener("resize", ver);
    baixa.addEventListener("change", ver);
    return () => { window.removeEventListener("resize", ver); baixa.removeEventListener("change", ver); };
  }, []);

  useEffect(() => {
    let vivo = true, timer = null;
    import("../lib/projeto3d").then(({ criarProjeto3D }) => {
      if (!vivo || !canvasRef.current) return;
      motor.current = criarProjeto3D({
        canvas: canvasRef.current,
        camadaRotulos: null,
        compacto: toque || window.innerWidth < 720,
        semMovimento: semMovimento(),
        config: { ...dados.config, vista: dados.config.vista || "ponta" },
        aoMudarVista: setVista,
        aoMudarModo,
        aoInteragir: () => setMexeu(true),
        aoFalhar: () => { timer = setTimeout(() => setEstado3d("erro"), 2500); },
        aoVoltar: () => { clearTimeout(timer); setEstado3d("ok"); },
      });
      setEstado3d("ok");
    }).catch((e) => { console.error("Projeto do cliente:", e); if (vivo) setEstado3d("erro"); });
    return () => { vivo = false; clearTimeout(timer); motor.current?.destruir(); motor.current = null; };
  }, [dados]);

  const trocarVista = (v) => { setVista(v); motor.current?.irPara(v); };
  const medidas = texto(t.medidas).split(" · ").filter(Boolean);
  const cartao = { background: "#fff", border: `1px solid ${BORDA}`, borderRadius: 20, boxShadow: "0 10px 30px rgba(18,58,102,.06)" };

  return (
    <main style={{ minHeight: "100dvh", background: `radial-gradient(1400px 700px at 50% -20%, #ffffff 0%, ${FUNDO} 55%)`, fontFamily: FONTE, color: TEXTO }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "max(16px, env(safe-area-inset-top)) max(18px, env(safe-area-inset-right)) 40px max(18px, env(safe-area-inset-left))" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: larga ? 22 : 14 }}>
          <img src="/logo-suprema.png" alt="Gôndolas Suprema" style={{ height: larga ? 64 : 50, width: "auto" }} />
          <span style={{ padding: "7px 13px", borderRadius: 999, background: "rgba(242,178,0,.14)", color: "#8a6500", fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase" }}>Projeto exclusivo</span>
        </header>

        <section style={{ marginBottom: larga ? 22 : 16 }}>
          <h1 style={{ fontFamily: FONTE_TITULO, color: AZUL, fontSize: larga ? 44 : 31, lineHeight: 1.08, margin: "0 0 10px", letterSpacing: "-.01em", textWrap: "balance" }}>
            Veja como vai ficar o <span style={{ backgroundImage: `linear-gradient(transparent 62%, rgba(242,178,0,.45) 62%)` }}>seu projeto</span>
          </h1>
          <p style={{ color: APAGADO, fontSize: larga ? 17 : 15, lineHeight: 1.5, margin: 0, maxWidth: 640 }}>
            Preparado especialmente para você pelo nosso consultor da Gôndolas Suprema.
            {/* No celular a dica já aparece em cima do 3D; aqui ela só empurraria o 3D para baixo. */}
            {!toque && " Arraste para girar, use a rodinha para aproximar e veja de todos os ângulos."}
          </p>
        </section>

        {/* O 3D, com a marca d'água da Suprema por cima (não atrapalha girar: pointer-events none) */}
        {/* Tela cheia: este cartão cobre a tela, com as vistas e os botões embaixo (deitado, numa linha só) */}
        <section ref={molduraRef} style={cheia
          ? { ...cartao, position: "fixed", inset: 0, zIndex: 900, margin: 0, border: 0, borderRadius: 0, boxShadow: "none", background: FUNDO, overscrollBehavior: "contain", padding: "max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left))", ...(deitado ? { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gridTemplateRows: "minmax(0, 1fr) auto", columnGap: 8 } : { display: "flex", flexDirection: "column" }) }
          : { ...cartao, padding: 8, marginBottom: 12 }}>
          <div ref={caixaRef} style={andando ? estiloPasseio(FUNDO)
            : { position: "relative", ...(cheia ? { flex: 1, minHeight: 0, gridColumn: "1 / -1" } : { height: larga ? "min(620px, 64vh)" : "min(470px, 52vh)" }), borderRadius: 14, overflow: "hidden", background: "#0b0f17" }}>
            <canvas ref={canvasRef} role="img" aria-label={`Projeto em 3D: ${titulo || "gôndola"}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", outline: "none" }} />
            {/* Marca d'água do meio some no passeio (pedido do Ale: atrapalhava a visão de quem anda); o selo do canto fica */}
            {!andando && <img src="/logo-suprema.png" alt="" aria-hidden="true" draggable={false} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: larga ? "min(36%, 340px)" : "min(58%, 260px)", opacity: 0.15, pointerEvents: "none", userSelect: "none" }} />}
            <div aria-hidden="true" style={{ position: "absolute", right: 12, bottom: 12, display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 6px", borderRadius: 999, background: "rgba(255,255,255,.82)", backdropFilter: "blur(6px)", pointerEvents: "none" }}>
              <img src="/logo-suprema.png" alt="" style={{ width: 26, height: 26, objectFit: "contain" }} />
              <span style={{ color: AZUL, fontSize: 12, fontWeight: 700 }}>Gôndolas Suprema</span>
            </div>
            {estado3d === "carregando" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.75)", fontSize: 14 }}>Montando o seu projeto…</div>}
            {estado3d === "erro" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", color: "rgba(255,255,255,.85)", fontSize: 14, background: "#0b0f17" }}>Este aparelho não conseguiu abrir o 3D. As medidas do seu projeto estão logo abaixo.</div>}
            {/* No alto da cena: embaixo ela encostava no selo do canto nos celulares estreitos. */}
            {estado3d === "ok" && !mexeu && !andando && <div style={{ position: "absolute", left: 0, right: 0, top: 12, margin: "0 auto", width: "fit-content", maxWidth: "calc(100% - 24px)", padding: "7px 14px", borderRadius: 999, background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 12.5, textAlign: "center", pointerEvents: "none" }}>{toque ? "Arraste para girar · dois dedos aproximam" : "Arraste para girar"}</div>}
            <CamadaPasseio andando={andando} toque={toque} motor={motor} focoAoSair={andarRef} />
          </div>
          <div role="group" aria-label="Ver de" style={{ display: "grid", gridTemplateColumns: `repeat(${VISTAS.length}, 1fr)`, gap: 4, padding: 4, marginTop: 8, borderRadius: 12, background: cheia ? "#fff" : FUNDO, ...(cheia ? { border: `1px solid ${BORDA}` } : {}) }}>
            {VISTAS.map(([k, n]) => (
              <button key={k} aria-pressed={vista === k} onClick={() => trocarVista(k)} style={{ height: cheia && deitado ? 38 : toque ? 44 : 40, border: 0, borderRadius: 9, background: vista === k ? AZUL : "transparent", color: vista === k ? "#fff" : TEXTO, fontSize: 14, fontWeight: vista === k ? 700 : 500, fontFamily: FONTE, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>{n}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, marginTop: 8 }}>
            <button ref={andarRef} type="button" disabled={estado3d !== "ok"} onClick={() => motor.current?.andar()} style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: 0, borderRadius: 12, background: AMARELO, color: TEXTO, fontSize: larga ? 15 : 14, fontWeight: 700, fontFamily: FONTE, cursor: estado3d === "ok" ? "pointer" : "default", opacity: estado3d === "ok" ? 1 : 0.5, WebkitTapHighlightColor: "transparent" }}>
              <IconeAndar tamanho={22} />
              Andar pelo projeto
            </button>
            <button type="button" disabled={estado3d !== "ok"} aria-pressed={cheia} aria-label={cheia ? "Fechar a tela cheia" : "Ver em tela cheia"} onClick={alternarCheia} style={{ height: 48, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid rgba(18,58,102,.18)", borderRadius: 12, background: "#fff", color: AZUL, fontSize: larga ? 15 : 14, fontWeight: 700, fontFamily: FONTE, whiteSpace: "nowrap", cursor: estado3d === "ok" ? "pointer" : "default", opacity: estado3d === "ok" ? 1 : 0.5, WebkitTapHighlightColor: "transparent" }}>
              <IconeTelaCheia cheia={cheia} />
              {cheia ? "Fechar" : "Tela cheia"}
            </button>
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: larga ? "1.4fr 1fr" : "1fr", gap: 12 }}>
          <section style={{ ...cartao, padding: larga ? "22px 24px" : "18px 18px" }}>
            <div style={{ color: "#8a6500", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>O seu projeto</div>
            <h2 style={{ color: AZUL, fontSize: larga ? 20 : 18, lineHeight: 1.3, margin: "0 0 8px", textWrap: "balance" }}>{titulo}</h2>
            {extras.map((e, i) => <p key={i} style={{ color: APAGADO, fontSize: 14.5, lineHeight: 1.5, margin: "0 0 2px" }}>{e}</p>)}
            {medidas.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                {medidas.map((m, i) => <span key={i} style={{ padding: "8px 12px", borderRadius: 10, background: FUNDO, color: TEXTO, fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{m}</span>)}
              </div>
            )}
            {nota && <p style={{ color: APAGADO, fontSize: 12.5, lineHeight: 1.5, margin: "14px 0 0" }}>{nota}</p>}
          </section>
          <section style={{ ...cartao, padding: larga ? "22px 24px" : "18px 18px", background: `linear-gradient(160deg, #ffffff 0%, #fff8e1 100%)`, borderColor: "rgba(242,178,0,.35)" }}>
            <div style={{ width: 34, height: 4, borderRadius: 4, background: AMARELO, marginBottom: 12 }} />
            <h2 style={{ color: AZUL, fontSize: 17, lineHeight: 1.35, margin: "0 0 8px" }}>Este link é só seu e abre uma vez</h2>
            <p style={{ color: APAGADO, fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>
              Para ver o projeto de novo ou ajustar alguma medida, é só pedir um novo link ao seu consultor. A gente adora ajudar a deixar a sua loja do jeito certo.
            </p>
          </section>
        </div>

        <footer style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 28, color: APAGADO, fontSize: 13 }}>
          <img src="/logo-suprema.png" alt="" style={{ width: 30, height: 30, objectFit: "contain" }} />
          <span>Gôndolas Suprema · Entregamos tudo montado na sua loja</span>
        </footer>
      </div>
    </main>
  );
}
