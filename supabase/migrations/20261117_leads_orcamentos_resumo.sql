-- Aba Leads: o vendedor passa a ver todos os leads (pedido do Ale, 17-nov-2026).
-- Para casar lead com orçamento, ele precisa do resumo dos orçamentos de todos,
-- sem abrir a tabela orcamentos inteira (a RLS dela continua igual).
CREATE OR REPLACE FUNCTION public.leads_orcamentos_resumo()
RETURNS TABLE (id text, cliente_telefone text, cliente_empresa text, cliente_responsavel text,
               cliente_estado text, vendedor_id text, status text, total numeric,
               data timestamptz, data_entrega date, fechado_em timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
  SELECT o.id::text, o.cliente_telefone::text,
         CASE WHEN oc THEN NULL ELSE o.cliente_empresa::text END,
         CASE WHEN oc THEN NULL ELSE o.cliente_responsavel::text END,
         o.cliente_estado::text, o.vendedor_id::text, o.status::text,
         CASE WHEN oc THEN 0 ELSE o.total::numeric END,
         o.data, o.data_entrega, o.fechado_em
  FROM public.orcamentos o
  CROSS JOIN LATERAL (SELECT (upper(trim(coalesce(o.cliente_estado::text,''))) = 'RS' AND o.vendedor_id::text = 'v1') AS oc) x
  WHERE (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin','gestor','vendedor');
$$;
REVOKE ALL ON FUNCTION public.leads_orcamentos_resumo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leads_orcamentos_resumo() TO authenticated;
