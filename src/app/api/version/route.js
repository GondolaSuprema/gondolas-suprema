// Endpoint para o cliente checar a versão atual do servidor.
// Usado pelo polling de auto-reload em App.jsx.
// Retorna o SHA do commit injetado automaticamente pela Vercel.

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const version = process.env.VERCEL_GIT_COMMIT_SHA || "dev";
  return new Response(JSON.stringify({ version }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
