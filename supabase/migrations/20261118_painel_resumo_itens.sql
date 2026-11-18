-- Painel (18-nov-2026, Ale): comparar R$ vendido em Gôndolas × Mini Porta Palete, SEM mostrar lucro.
-- A função NÃO devolve o custo dos itens (com custo + total daria para calcular a margem).
-- Ela já entrega o valor vendido (total − frete) repartido por linha de produto, na proporção
-- do custo de cada item: v_gondola, v_mpp, v_outros. É a única fonte dessa regra (todos os papéis).
-- Regra das linhas: categoria com "GONDOLA" → gôndola; categoria MPP*/SLIM → mpp; itens soltos pelo nome:
-- porta palete grande (LONGARINA TUBO, MONTANTE PP, PP ####KG) → outros; MPP/SLIM/MINI PORTA/LONGARINA Z/
-- TRANSVERSINA/PLANO METALICO ou "MDF 1800X600" (deck) → mpp; FIT/GONDOLA/PAR SLG/TESTEIRA/CREMALHEIRA/GANCHO → gôndola;
-- o resto (porta etiqueta, móveis, fábrica) → outros.
-- Orçamento RS do Ale (v1) continua oculto: tudo 0.
CREATE OR REPLACE FUNCTION public.painel_linha_item(p_cat text, p_nome text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public', 'pg_catalog' AS $$
  SELECT CASE
    WHEN c LIKE '%GONDOLA%' THEN 'g'
    WHEN c LIKE 'MPP%' OR c = 'SLIM' THEN 'm'
    WHEN n ~ 'LONGARINA TUBO|MONTANTE PP |\mPP\M.*[0-9]{4}KG' THEN 'o'
    WHEN n ~ 'MPP|SLIM|SLIN|MINI PORTA|LONGARINA Z|TRANSVERSINA|PLANOS? METALIC' OR trim(n) ~ '^MDF [0-9]+ ?X ?[0-9]+$' THEN 'm'
    WHEN n ~ '\mFIT\M|GONDOLA|PAR SLG|TESTEIRA|CREMALHEIRA|GANCHO' THEN 'g'
    ELSE 'o' END
  FROM (SELECT upper(translate(coalesce(p_cat,''), 'ÁÀÂÃÉÊÍÓÔÕÚÇáàâãéêíóôõúç', 'AAAAEEIOOOUCaaaaeeiooouc')) c,
               upper(translate(coalesce(p_nome,''), 'ÁÀÂÃÉÊÍÓÔÕÚÇáàâãéêíóôõúç', 'AAAAEEIOOOUCaaaaeeiooouc')) n) x;
$$;
REVOKE ALL ON FUNCTION public.painel_linha_item(text, text) FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.painel_orcamentos_resumo();
CREATE FUNCTION public.painel_orcamentos_resumo()
RETURNS TABLE (id text, cliente_telefone text, cliente_estado text, vendedor_id text, status text,
               total numeric, data timestamptz, data_entrega date, lead_id bigint,
               frete numeric, v_gondola numeric, v_mpp numeric, v_outros numeric)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
  SELECT o.id::text, o.cliente_telefone::text, o.cliente_estado::text, o.vendedor_id::text, o.status::text,
         CASE WHEN x.oc THEN 0 ELSE o.total::numeric END,
         o.data, o.data_entrega, o.lead_id,
         CASE WHEN x.oc THEN 0 ELSE coalesce(o.frete::numeric, 0) END,
         CASE WHEN x.oc THEN 0 ELSE coalesce(r.g, 0) END,
         CASE WHEN x.oc THEN 0 ELSE coalesce(r.m, 0) END,
         CASE WHEN x.oc THEN 0 ELSE coalesce(r.o, 0) END
  FROM public.orcamentos o
  CROSS JOIN LATERAL (SELECT (upper(trim(coalesce(o.cliente_estado::text,''))) = 'RS' AND o.vendedor_id::text = 'v1') AS oc,
                             greatest(0, coalesce(o.total::numeric,0) - coalesce(o.frete::numeric,0)) AS venda) x
  CROSS JOIN LATERAL (
    SELECT CASE WHEN coalesce(sum(it.custo),0) <= 0 THEN 0 ELSE sum(it.custo) FILTER (WHERE it.l = 'g') * x.venda / sum(it.custo) END AS g,
           CASE WHEN coalesce(sum(it.custo),0) <= 0 THEN 0 ELSE sum(it.custo) FILTER (WHERE it.l = 'm') * x.venda / sum(it.custo) END AS m,
           CASE WHEN coalesce(sum(it.custo),0) <= 0 THEN x.venda ELSE sum(it.custo) FILTER (WHERE it.l = 'o') * x.venda / sum(it.custo) END AS o
    FROM (
      SELECT public.painel_linha_item(i->>'cat', i->>'name') AS l,
             greatest(0, CASE WHEN jsonb_typeof(i->'total') = 'number' THEN (i->>'total')::numeric
                              WHEN (i->>'total') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (i->>'total')::numeric ELSE 0 END) AS custo
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(o.items) = 'array' THEN o.items ELSE '[]'::jsonb END) i
    ) it
  ) r
  WHERE (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin','gestor','vendedor');
$$;
REVOKE ALL ON FUNCTION public.painel_orcamentos_resumo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.painel_orcamentos_resumo() TO authenticated;
