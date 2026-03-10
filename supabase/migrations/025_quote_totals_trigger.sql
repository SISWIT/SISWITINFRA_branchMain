-- ============================================================================
-- Migration 025: Recompute quote totals in database via trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recompute_quote_totals_for_quote(p_quote_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_subtotal numeric := 0;
  v_discount_percent numeric := 0;
  v_tax_percent numeric := 0;
  v_discount_amount numeric := 0;
  v_taxable_amount numeric := 0;
  v_tax_amount numeric := 0;
  v_total_amount numeric := 0;
BEGIN
  IF p_quote_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(COALESCE(total, line_total, 0)), 0)
  INTO v_subtotal
  FROM public.quote_line_items
  WHERE quote_id = p_quote_id
    AND deleted_at IS NULL;

  SELECT
    COALESCE(discount_percent, 0),
    COALESCE(tax_percent, 0)
  INTO
    v_discount_percent,
    v_tax_percent
  FROM public.quotes
  WHERE id = p_quote_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_discount_amount := v_subtotal * v_discount_percent / 100;
  v_taxable_amount := v_subtotal - v_discount_amount;
  v_tax_amount := v_taxable_amount * v_tax_percent / 100;
  v_total_amount := v_taxable_amount + v_tax_amount;

  UPDATE public.quotes
  SET
    subtotal = v_subtotal,
    discount_amount = v_discount_amount,
    tax_amount = v_tax_amount,
    total_amount = v_total_amount,
    updated_at = now()
  WHERE id = p_quote_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_quote_totals(p_quote_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.recompute_quote_totals_for_quote(p_quote_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recompute_quote_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.recompute_quote_totals_for_quote(COALESCE(NEW.quote_id, OLD.quote_id));

  IF TG_OP = 'UPDATE' AND NEW.quote_id IS DISTINCT FROM OLD.quote_id THEN
    PERFORM public.recompute_quote_totals_for_quote(OLD.quote_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recompute_quote_totals ON public.quote_line_items;

CREATE TRIGGER trg_recompute_quote_totals
AFTER INSERT OR UPDATE OR DELETE ON public.quote_line_items
FOR EACH ROW
EXECUTE FUNCTION public.trg_recompute_quote_totals();

DO $$
DECLARE
  v_quote record;
BEGIN
  FOR v_quote IN SELECT id FROM public.quotes LOOP
    PERFORM public.recompute_quote_totals_for_quote(v_quote.id);
  END LOOP;
END;
$$;
