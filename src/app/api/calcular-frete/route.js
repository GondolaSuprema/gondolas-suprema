export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import MUNICIPIOS from "./municipios.json";

// ─── Cálculo de frete por distância ───
// Regra do Ale (11-nov-2026): frete = km rodados (IDA E VOLTA) × R$ 1,50.
// Ex.: 300 km ida e volta × R$ 1,50 = R$ 450,00. Sem frete mínimo.
// Para mudar no futuro, mude só VALOR_POR_KM / IDA_E_VOLTA.
const VALOR_POR_KM = 1.50;     // R$ por km rodado
const IDA_E_VOLTA = true;      // multiplica a distância por 2 (vai e volta)

// Origem fixa: barracão da Gôndolas Suprema
// R. José Cosme Pamplona, 1700 — Bela Vista, Palhoça/SC, CEP 88132-700
const ORIGEM = { lat: -27.6556041, lon: -48.6792553, nome: "Palhoça/SC (barracão)" };

// Cidade conferida na lista oficial do IBGE (municipios.json, 5.571 municípios por UF).
// Motivo: em 10-nov-2026 "FRIBURGO" (erro de digitação de Fraiburgo) foi parar numa
// rua de Blumenau no mapa: 156 km em vez de 337, sem aviso nenhum.
const UF_NOME = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará",
  DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão",
  MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará",
  PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima",
  SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

// "São José" → "SAO JOSE"; "Herval d'Oeste" → "HERVAL D OESTE"
function normalizar(s) {
  return String(s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

// Índice: nome normalizado → [{ cidade, uf }]
const INDICE = new Map();
for (const [uf, lista] of Object.entries(MUNICIPIOS)) {
  for (const cidade of lista) {
    const k = normalizar(cidade);
    if (!INDICE.has(k)) INDICE.set(k, []);
    INDICE.get(k).push({ cidade, uf });
  }
}

// Separa "São José, SC" / "São José/SC" / "São José - SC" quando a UF veio junto no campo cidade.
function separarCidadeUf(cidadeBruta, ufBruta) {
  let cidade = String(cidadeBruta || "").trim();
  let uf = String(ufBruta || "").trim().toUpperCase();
  const m = INDICE.has(normalizar(cidade)) ? null : cidade.match(/^(.*?)[\s]*[,/\-–][\s]*([A-Za-z]{2})$/);
  if (m && UF_NOME[m[2].toUpperCase()]) {
    cidade = m[1].trim();
    if (!uf) uf = m[2].toUpperCase();
  }
  if (!UF_NOME[uf]) uf = "";
  return { cidade, uf };
}

// Sugestões parecidas (erro de digitação) dentro da UF; sem UF, no país todo.
function sugerir(chave, uf) {
  const limite = Math.max(1, Math.floor(chave.length / 5));
  const ufs = uf ? [uf] : Object.keys(MUNICIPIOS);
  const achados = [];
  for (const u of ufs) {
    for (const cidade of MUNICIPIOS[u] || []) {
      const k = normalizar(cidade);
      const dist = levenshtein(chave, k);
      const contem = chave.length >= 4 && (` ${k} `).includes(` ${chave} `);
      if (dist <= limite || contem) achados.push({ cidade, uf: u, dist: contem ? Math.min(dist, limite) : dist });
    }
  }
  achados.sort((a, b) => a.dist - b.dist || a.cidade.localeCompare(b.cidade));
  return achados.slice(0, 4).map(({ cidade, uf: u }) => ({ cidade, uf: u }));
}

// Devolve { ok:true, cidade, uf } (nome oficial) ou { ok:false, mensagem, sugestoes }.
function conferirCidade(cidadeDigitada, ufDigitada) {
  const { cidade, uf } = separarCidadeUf(cidadeDigitada, ufDigitada);
  const chave = normalizar(cidade);
  const exatos = INDICE.get(chave) || [];
  if (uf) {
    const naUf = exatos.find(x => x.uf === uf);
    if (naUf) return { ok: true, ...naUf };
    const sugestoes = [...sugerir(chave, uf), ...exatos.filter(x => x.uf !== uf)].slice(0, 4);
    return {
      ok: false,
      mensagem: `Não achei a cidade "${cidade}" em ${uf} na lista oficial do IBGE.` +
        (sugestoes.length ? " Você quis dizer:" : " Confira o nome no cadastro do cliente."),
      sugestoes,
    };
  }
  if (exatos.length === 1) return { ok: true, ...exatos[0] };
  if (exatos.length > 1) {
    return {
      ok: false,
      mensagem: `Existe "${exatos[0].cidade}" em mais de um estado. Preencha o estado (UF) do cliente ou escolha:`,
      sugestoes: exatos.slice(0, 6),
    };
  }
  const sugestoes = sugerir(chave, "");
  return {
    ok: false,
    mensagem: `Não achei a cidade "${cidade}" na lista oficial do IBGE.` +
      (sugestoes.length ? " Você quis dizer:" : " Confira o nome e o estado (UF) no cadastro do cliente."),
    sugestoes,
  };
}

// Geocoding via Nominatim (OpenStreetMap), sempre com endereço detalhado para conferir o resultado.
async function nominatim(params) {
  const qs = new URLSearchParams({ ...params, format: "jsonv2", addressdetails: "1", limit: "5", countrycodes: "br" });
  const resp = await fetch(`https://nominatim.openstreetmap.org/search?${qs}`, {
    headers: { "User-Agent": "GondolasSuprema/1.0 (orcamentos)" },
    cache: "no-store",
  });
  if (!resp.ok) throw new Error(`Nominatim status ${resp.status}`);
  const arr = await resp.json();
  return Array.isArray(arr) ? arr : [];
}

const TIPOS_CIDADE = new Set(["municipality", "city", "town", "village"]);
const nomesDoMunicipio = (a = {}) => [a.city, a.town, a.village, a.municipality].filter(Boolean).map(normalizar);
const mesmaUf = (x, uf) => (x?.address?.["ISO3166-2-lvl4"] || "") === `BR-${uf}`;

// Centro da cidade: só aceita resultado que É a cidade certa, no estado certo.
async function geocodeCidade(cidade, uf) {
  const chave = normalizar(cidade);
  const valida = x => mesmaUf(x, uf) && TIPOS_CIDADE.has(x.addresstype) && normalizar(x.name) === chave;
  let r = (await nominatim({ city: cidade, state: UF_NOME[uf], country: "Brasil" })).find(valida);
  if (!r) r = (await nominatim({ q: `${cidade}, ${UF_NOME[uf]}, Brasil` })).find(valida);
  return r ? { lat: parseFloat(r.lat), lon: parseFloat(r.lon) } : null;
}

// Endereço exato: só aceita se o mapa achou o endereço DENTRO da cidade conferida.
async function geocodeEndereco(texto, cidade, uf) {
  const chave = normalizar(cidade);
  const r = (await nominatim({ q: texto })).find(x => mesmaUf(x, uf) && nomesDoMunicipio(x.address).includes(chave));
  return r ? { lat: parseFloat(r.lat), lon: parseFloat(r.lon) } : null;
}

// GET /api/calcular-frete?cidade=Fraiburgo&uf=SC&endereco=...&numero=...&bairro=...
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cidadeDigitada = (searchParams.get("cidade") || "").trim();
  const ufDigitada = (searchParams.get("uf") || "").trim();
  const endereco = (searchParams.get("endereco") || "").trim();
  const numero = (searchParams.get("numero") || "").trim();
  const bairro = (searchParams.get("bairro") || "").trim();

  if (!cidadeDigitada) {
    return Response.json(
      { success: false, mensagem: "Informe a cidade do cliente no orçamento." },
      { status: 400 }
    );
  }

  // 0) Cidade conferida na lista oficial (erro de digitação não calcula: sugere)
  const conf = conferirCidade(cidadeDigitada, ufDigitada);
  if (!conf.ok) {
    return Response.json(
      { success: false, mensagem: conf.mensagem, sugestoes: conf.sugestoes || [] },
      { status: 422 }
    );
  }
  const { cidade, uf } = conf;

  // 1) Ponto de destino: endereço exato (se tiver e cair na cidade certa) ou centro da cidade
  let destino;
  let avisoEndereco = false;
  try {
    let ponto = null;
    let precisao = "cidade";
    if (endereco) {
      const texto = [
        numero ? `${endereco}, ${numero}` : endereco,
        bairro, cidade, UF_NOME[uf], "Brasil",
      ].filter(Boolean).join(", ");
      ponto = await geocodeEndereco(texto, cidade, uf);
      if (ponto) precisao = "endereço";
      else avisoEndereco = true;
    }
    if (!ponto) ponto = await geocodeCidade(cidade, uf);
    if (!ponto) {
      return Response.json(
        { success: false, mensagem: `Não achei ${cidade}/${uf} no mapa. Tente de novo em instantes ou digite o frete.` },
        { status: 502 }
      );
    }
    const nomeDestino = precisao === "endereço"
      ? `${endereco}${numero ? ", " + numero : ""} — ${cidade}/${uf}`
      : `${cidade}/${uf}`;
    destino = { ...ponto, nome: nomeDestino, precisao };
  } catch (e) {
    return Response.json(
      { success: false, mensagem: "Falha ao consultar o mapa: " + (e?.message || "erro desconhecido") },
      { status: 502 }
    );
  }

  // 2) Distância rodoviária via OSRM (rota de carro)
  let distanciaKm;
  try {
    const coords = `${ORIGEM.lon},${ORIGEM.lat};${destino.lon},${destino.lat}`;
    const osrmResp = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`,
      { headers: { "User-Agent": "GondolasSuprema/1.0" }, cache: "no-store" }
    );
    if (!osrmResp.ok) {
      return Response.json(
        { success: false, mensagem: `Falha ao calcular a rota (status ${osrmResp.status}).` },
        { status: 502 }
      );
    }
    const data = await osrmResp.json();
    const metros = data?.routes?.[0]?.distance;
    if (!metros || metros <= 0) {
      return Response.json(
        { success: false, mensagem: "Não foi possível traçar a rota até essa cidade." },
        { status: 502 }
      );
    }
    distanciaKm = metros / 1000;
  } catch (e) {
    return Response.json(
      { success: false, mensagem: "Falha ao calcular a rota: " + (e?.message || "erro desconhecido") },
      { status: 502 }
    );
  }

  // 3) Frete: a conta sai dos MESMOS números arredondados que aparecem na tela,
  //    para quem refizer na calculadora bater no centavo.
  const distancia = Math.round(distanciaKm * 10) / 10;
  const kmCobrados = Math.round(distancia * (IDA_E_VOLTA ? 2 : 1) * 10) / 10;
  const frete = Math.round(kmCobrados * VALOR_POR_KM * 100) / 100;

  return Response.json({
    success: true,
    origem: ORIGEM.nome,
    destino: destino.nome,
    cidade_oficial: cidade,
    uf_oficial: uf,
    precisao: destino.precisao,
    aviso_endereco: avisoEndereco,
    distancia_km: distancia,
    ida_e_volta: IDA_E_VOLTA,
    km_cobrados: kmCobrados,
    valor_por_km: VALOR_POR_KM,
    custo_por_km: VALOR_POR_KM, // nome antigo, mantido para abas abertas com a versão anterior
    frete,
    link_mapa: `https://www.google.com/maps/dir/?api=1&origin=${ORIGEM.lat},${ORIGEM.lon}&destination=${destino.lat},${destino.lon}&travelmode=driving`,
  });
}
