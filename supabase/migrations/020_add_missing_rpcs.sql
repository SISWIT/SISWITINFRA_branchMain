-- Add missing company column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company VARCHAR(255);

-- Create missing RPC for get_inventory_value
CREATE OR REPLACE FUNCTION public.get_inventory_value()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total numeric;
BEGIN
  -- Assuming inventory value is quantity_on_hand * unit_cost or average_cost
  SELECT COALESCE(SUM(quantity_available * average_cost), 0) INTO total
  FROM public.inventory_items;
  
  RETURN total;
END;
$$;

-- Create missing RPC for get_revenue_mtd
CREATE OR REPLACE FUNCTION public.get_revenue_mtd(start_date date, end_date date)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total
  FROM public.financial_records
  WHERE transaction_type = 'income'
  AND transaction_date >= start_date 
  AND transaction_date <= end_date;
  
  RETURN total;
END;
$$;
