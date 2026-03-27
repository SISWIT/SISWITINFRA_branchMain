-- Repair migration for Employee Dashboard metrics and profile fields

-- 1. Add missing columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company text DEFAULT '';

-- 2. Add missing columns to activities
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT false;

-- 3. Create get_inventory_value RPC
-- Calculates the total value of inventory (quantity * cost from products)
CREATE OR REPLACE FUNCTION public.get_inventory_value(p_org_id uuid DEFAULT NULL)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total numeric;
BEGIN
  SELECT COALESCE(SUM(ii.quantity_on_hand * p.cost), 0)
  INTO v_total
  FROM public.inventory_items ii
  JOIN public.products p ON ii.product_id = p.id
  WHERE (p_org_id IS NULL OR ii.organization_id = p_org_id);
  
  RETURN v_total;
END;
$$;

-- 4. Create get_revenue_mtd RPC
-- Calculates total revenue for the current month based on closed opportunities
CREATE OR REPLACE FUNCTION public.get_revenue_mtd(
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_org_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_revenue numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_revenue
  FROM public.opportunities
  WHERE stage = 'Closed Won'
    AND close_date >= p_start_date
    AND close_date <= p_end_date
    AND (p_org_id IS NULL OR organization_id = p_org_id);
    
  RETURN v_revenue;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_inventory_value(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_mtd(timestamptz, timestamptz, uuid) TO authenticated;
