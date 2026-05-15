export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Cálculo de frete por distância (custo de combustível) ───
// Regra definida pelo Ale: diesel R$ 7,69/L, veículo faz 11 km/L.
// Custo por km rodado = 7,69 / 11 ≈ R$ 0,699.
// Considera IDA E VOLTA (o veículo entrega e retorna pra Palhoça).
// Para ajustar no futuro, mude só estas constantes.
const PRECO_DIESEL = 7.69;     // R$ por litro
const KM_POR_LITRO = 11;       // km que o veículo faz por litro
const IDA_E_VOLTA = true;      // multiplica a distância por 2 (vai e volta)

// Origem fixa: Palhoça/SC (sede da Gôndolas Suprema)
const ORIGEM = { lat: -27.6455, lon: -48.6678, nome: "Palhoça/SC" };

const custoPorKm = PRECO_DIESEL / KM_POR_LITRO;

// GET /api/calcular-frete?cidade=Criciuma&uf=SC
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cidade = (searchParams.get("cidade") || "").trim();
  const uf = (searchParams.get("uf") || "").trim();

  if (!cidade) {
    return Response.json(
      { success: false, mensagem: "Informe a cidade do cliente no orçamento." },
      { status: 400 }
    );
  }

  // 1) Geocoding da cidade do cliente via Nominatim (OpenStreetMap)
  let destino;
  try {
    const q = encodeURIComponent(`${cidade}${uf ? ", " + uf : ""}, Brasil`);
    const geoResp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=br`,
      { headers: { "User-Agent": "GondolasSuprema/1.0 (orcamentos)" }, cache: "no-store" }
    );
    if (!geoResp.ok) {
      return Response.json(
        { success: false, mensagem: `Falha ao localizar a cidade (status ${geoResp.status}).` },
        { status: 502 }
      );
    }
    const arr = await geoResp.json();
    if (!Array.isArray(arr) || arr.length === 0) {
      return Response.json(
        { success: false, mensagem: `Cidade "${cidade}${uf ? "/" + uf : ""}" não encontrada no mapa. Verifique o nome.` },
        { status: 404 }
      );
    }
    destino = { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon), nome: `${cidade}${uf ? "/" + uf : ""}` };
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

  // 3) Cálculo do frete
  const kmCobrados = distanciaKm * (IDA_E_VOLTA ? 2 : 1);
  const freteBruto = kmCobrados * custoPorKm;
  const frete = Math.round(freteBruto * 100) / 100;

  return Response.json({
    success: true,
    origem: ORIGEM.nome,
    destino: destino.nome,
    distancia_km: Math.round(distanciaKm * 10) / 10,
    ida_e_volta: IDA_E_VOLTA,
    km_cobrados: Math.round(kmCobrados * 10) / 10,
    custo_por_km: Math.round(custoPorKm * 1000) / 1000,
    preco_diesel: PRECO_DIESEL,
    km_por_litro: KM_POR_LITRO,
    frete,
  });
}
