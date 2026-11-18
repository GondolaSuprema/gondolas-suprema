-- Aba Painel (18-nov-2026, Ale): "o painel é liberado para todos, todos veem do mesmo modo".
-- O vendedor só lê os próprios orçamentos (RLS de orcamentos não muda). Para o Painel dele
-- mostrar os mesmos números do admin/gestor, esta função entrega SÓ as colunas que o Painel usa
-- (sem nome de cliente). Orçamento RS do Ale (v1) sai com total 0; o Painel já o descarta.
CREATE OR REPLACE FUNCTION public.painel_orcamentos_resumo()
RETURNS TABLE (id text, cliente_telefone text, cliente_estado text, vendedor_id text, status text,
               total numeric, data timestamptz, data_entrega date)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
  SELECT o.id::text, o.cliente_telefone::text, o.cliente_estado::text, o.vendedor_id::text, o.status::text,
         CASE WHEN upper(trim(coalesce(o.cliente_estado::text,''))) = 'RS' AND o.vendedor_id::text = 'v1'
              THEN 0 ELSE o.total::numeric END,
         o.data, o.data_entrega
  FROM public.orcamentos o
  WHERE (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin','gestor','vendedor');
$$;
REVOKE ALL ON FUNCTION public.painel_orcamentos_resumo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.painel_orcamentos_resumo() TO authenticated;
