-- Aba Leads (18-nov-2026, Ale): a venda passa a ficar ligada ao lead de onde veio,
-- mesmo quando o orçamento é cadastrado com outro telefone (caso Manoela: celular no
-- lead, fixo da empresa no orçamento). Antes, o casamento era só pelo telefone.
-- Coluna nova, opcional; nada existente muda. Lead apagado: o vínculo some (SET NULL).
ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS lead_id bigint REFERENCES public.mariana_leads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orcamentos_lead_id_idx ON public.orcamentos (lead_id) WHERE lead_id IS NOT NULL;

-- Painel: o vendedor lê pela função; ela passa a devolver também o lead_id.
DROP FUNCTION IF EXISTS public.painel_orcamentos_resumo();
CREATE FUNCTION public.painel_orcamentos_resumo()
RETURNS TABLE (id text, cliente_telefone text, cliente_estado text, vendedor_id text, status text,
               total numeric, data timestamptz, data_entrega date, lead_id bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
  SELECT o.id::text, o.cliente_telefone::text, o.cliente_estado::text, o.vendedor_id::text, o.status::text,
         CASE WHEN upper(trim(coalesce(o.cliente_estado::text,''))) = 'RS' AND o.vendedor_id::text = 'v1'
              THEN 0 ELSE o.total::numeric END,
         o.data, o.data_entrega, o.lead_id
  FROM public.orcamentos o
  WHERE (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin','gestor','vendedor');
$$;
REVOKE ALL ON FUNCTION public.painel_orcamentos_resumo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.painel_orcamentos_resumo() TO authenticated;
