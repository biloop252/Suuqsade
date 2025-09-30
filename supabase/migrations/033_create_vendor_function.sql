-- Create a function to create vendor profile after auth user is created
CREATE OR REPLACE FUNCTION create_vendor_profile(
  p_user_id UUID,
  p_business_name VARCHAR(255),
  p_business_description TEXT,
  p_address TEXT,
  p_city VARCHAR(100),
  p_district VARCHAR(100),
  p_neighborhood VARCHAR(100),
  p_country VARCHAR(100),
  p_tax_id VARCHAR(100),
  p_commission_rate DECIMAL(5,2),
  p_logo_url TEXT DEFAULT NULL,
  p_business_license_url TEXT DEFAULT NULL,
  p_national_id_url TEXT DEFAULT NULL,
  p_status VARCHAR(20) DEFAULT 'pending'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Update the profile to set role as vendor
  UPDATE profiles 
  SET role = 'vendor'
  WHERE id = p_user_id;
  
  -- Insert into vendor_profiles table
  INSERT INTO vendor_profiles (
    id, business_name, business_description, address, city, district, 
    neighborhood, country, tax_id, commission_rate, status, logo_url, 
    business_license_url, national_id_url
  ) VALUES (
    p_user_id, p_business_name, p_business_description, p_address, p_city, 
    p_district, p_neighborhood, p_country, p_tax_id, p_commission_rate, 
    p_status, p_logo_url, p_business_license_url, p_national_id_url
  );
  
  -- Return success result
  v_result := json_build_object(
    'success', true,
    'user_id', p_user_id,
    'message', 'Vendor profile created successfully'
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to create vendor profile'
    );
    
    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_vendor_profile TO authenticated;
