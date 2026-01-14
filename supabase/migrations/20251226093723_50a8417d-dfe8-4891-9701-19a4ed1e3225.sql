-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.quote_number IS NULL THEN
    NEW.quote_number := 'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.contract_number IS NULL THEN
    NEW.contract_number := 'CT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_opportunity_probability()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  CASE NEW.stage
    WHEN 'new' THEN NEW.probability := 10;
    WHEN 'qualified' THEN NEW.probability := 25;
    WHEN 'proposal' THEN NEW.probability := 50;
    WHEN 'negotiation' THEN NEW.probability := 75;
    WHEN 'closed_won' THEN 
      NEW.probability := 100;
      NEW.is_closed := true;
      NEW.is_won := true;
      NEW.closed_at := NOW();
    WHEN 'closed_lost' THEN 
      NEW.probability := 0;
      NEW.is_closed := true;
      NEW.is_won := false;
      NEW.closed_at := NOW();
    ELSE NEW.probability := NEW.probability;
  END CASE;
  RETURN NEW;
END;
$$;