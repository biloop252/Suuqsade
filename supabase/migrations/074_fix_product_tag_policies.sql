-- Create helper function to check admin/staff without leaking table permissions
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','staff')
  );
END;
$$;

-- Allow execution for common roles
GRANT EXECUTE ON FUNCTION public.is_admin_or_staff() TO anon, authenticated, service_role;

-- Update product_tags policies to use the helper
DROP POLICY IF EXISTS "Only admins can manage product tags" ON public.product_tags;
CREATE POLICY "Only admins can manage product tags" ON public.product_tags
  FOR ALL
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

-- Update product_tag_assignments policies to use the helper
DROP POLICY IF EXISTS "Only admins can manage product tag assignments" ON public.product_tag_assignments;
CREATE POLICY "Only admins can manage product tag assignments" ON public.product_tag_assignments
  FOR ALL
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());



