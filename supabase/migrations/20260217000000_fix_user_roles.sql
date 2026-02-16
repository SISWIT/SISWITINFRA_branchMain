-- Fresh fix for user_roles table - drops and recreates with approved column

BEGIN;

-- Step 1: Create signup_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.signup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 2: Drop the existing user_roles table (this will also remove the trigger)
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Step 3: Create new user_roles table with approved column
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'employee', 'user')),
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 4: Create the handle_new_user function (simplified - no dependencies on profiles or is_admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_name_val text;
  last_name_val text;
  signup_type_val text;
BEGIN
  first_name_val := NULLIF(new.raw_user_meta_data->>'first_name', '');
  last_name_val := NULLIF(new.raw_user_meta_data->>'last_name', '');
  signup_type_val := lower(coalesce(NULLIF(new.raw_user_meta_data->>'signup_type', ''), 'customer'));

  -- Employee signup - pending approval (check this FIRST, before first user check)
  IF signup_type_val = 'employee' THEN
    -- Create signup request
    INSERT INTO public.signup_requests (user_id, email, first_name, last_name, status)
    VALUES (new.id, new.email, first_name_val, last_name_val, 'pending')
    ON CONFLICT (user_id)
    DO UPDATE SET
      email = excluded.email,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      status = 'pending',
      updated_at = now();
    
    -- Create user role as employee (not approved yet)
    INSERT INTO public.user_roles (user_id, role, approved)
    VALUES (new.id, 'employee', false)
    ON CONFLICT (user_id)
    DO UPDATE SET
      role = 'employee',
      approved = false,
      updated_at = now();
  
  -- First user gets admin role (only for non-employee signups)
  ELSIF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role, approved)
    VALUES (new.id, 'admin', true)
    ON CONFLICT (user_id) DO NOTHING;
  
  -- Customer signup - instant access
  ELSE
    INSERT INTO public.user_roles (user_id, role, approved)
    VALUES (new.id, 'user', true)
    ON CONFLICT (user_id)
    DO UPDATE SET
      role = 'user',
      approved = true,
      updated_at = now();

    -- Remove any pending signup request for this user
    DELETE FROM public.signup_requests WHERE user_id = new.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 5: Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Create index
CREATE INDEX IF NOT EXISTS idx_user_roles_approved ON public.user_roles(approved) WHERE role = 'employee';
CREATE INDEX IF NOT EXISTS idx_signup_requests_status ON public.signup_requests(status);

-- Step 7: Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies for user_roles - allow users to read their own role
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Allow service role (admin) to do everything
DROP POLICY IF EXISTS "user_roles_service_role_all" ON public.user_roles;
CREATE POLICY "user_roles_service_role_all" ON public.user_roles FOR ALL
USING (auth.role() = 'service_role');

-- Step 8: Enable RLS on signup_requests
ALTER TABLE public.signup_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signup_requests_select_own" ON public.signup_requests;
CREATE POLICY "signup_requests_select_own" ON public.signup_requests FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "signup_requests_service_role_all" ON public.signup_requests;
CREATE POLICY "signup_requests_service_role_all" ON public.signup_requests FOR ALL
USING (auth.role() = 'service_role');

COMMIT;
