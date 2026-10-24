import { createClient } from "@supabase/supabase-js";

// Valida o token de sessão do Supabase enviado pelo front no header
// "Authorization: Bearer <access_token>". Retorna o usuário logado ou null.
// Usado pelas rotas /api que emitem nota fiscal ou mexem no financeiro:
// sem isso, qualquer pessoa na internet conseguia chamá-las.
export async function requireUser(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export function naoAutorizado() {
  return Response.json(
    { success: false, mensagem: "Sessão expirada ou ausente. Faça login de novo no sistema." },
    { status: 401 }
  );
}
