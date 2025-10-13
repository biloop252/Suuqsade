-- Create admin user migration
-- This creates a default admin user for the admin panel

-- First, create the user in auth.users (this would normally be done through Supabase Auth)
-- For development purposes, we'll create a profile that can be linked to an auth user

-- Insert admin profile
INSERT INTO profiles (
  id,
  first_name,
  last_name,
  email,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001', -- Fixed UUID for admin user
  'Admin',
  'User',
  'admin@suuqsade.com',
  'super_admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Note: To create the actual auth user, you need to:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" 
-- 3. Set email: admin@suuqsade.com
-- 4. Set password: Admin123! (or your preferred password)
-- 5. The user will be created with the same ID as the profile above

-- Alternative: You can also create the auth user programmatically:
-- INSERT INTO auth.users (
--   id,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   raw_app_meta_data,
--   raw_user_meta_data,
--   is_super_admin,
--   role
-- ) VALUES (
--   '550e8400-e29b-41d4-a716-446655440001',
--   'admin@suuqsade.com',
--   crypt('Admin123!', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW(),
--   '{"provider": "email", "providers": ["email"]}',
--   '{}',
--   false,
--   'authenticated'
-- );

-- Create a function to help with admin user creation
CREATE OR REPLACE FUNCTION create_admin_user(
  admin_email TEXT,
  admin_password TEXT,
  admin_first_name TEXT DEFAULT 'Admin',
  admin_last_name TEXT DEFAULT 'User'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Generate a new UUID for the user
  user_id := uuid_generate_v4();
  
  -- Insert into auth.users (this requires superuser privileges)
  -- Note: This might not work in all Supabase setups due to RLS policies
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    user_id,
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    'authenticated'
  );
  
  -- Insert into profiles
  INSERT INTO profiles (
    id,
    first_name,
    last_name,
    email,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    admin_first_name,
    admin_last_name,
    admin_email,
    'super_admin',
    true,
    NOW(),
    NOW()
  );
  
  RETURN user_id;
END;
$$;

-- Create a simpler function that just creates the profile
-- (Use this if you create the auth user manually through the dashboard)
CREATE OR REPLACE FUNCTION create_admin_profile(
  admin_email TEXT,
  admin_first_name TEXT DEFAULT 'Admin',
  admin_last_name TEXT DEFAULT 'User'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Generate a new UUID for the user
  user_id := uuid_generate_v4();
  
  -- Insert into profiles
  INSERT INTO profiles (
    id,
    first_name,
    last_name,
    email,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    admin_first_name,
    admin_last_name,
    admin_email,
    'super_admin',
    true,
    NOW(),
    NOW()
  );
  
  RETURN user_id;
END;
$$;

-- Instructions for manual admin user creation:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user"
-- 3. Email: admin@suuqsade.com
-- 4. Password: Admin123!
-- 5. After creating, note the user ID and update the profile:
--    UPDATE profiles SET id = 'ACTUAL_USER_ID_FROM_AUTH' WHERE email = 'admin@suuqsade.com';





































