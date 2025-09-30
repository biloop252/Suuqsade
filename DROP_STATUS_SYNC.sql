-- DROP ALL STATUS SYNC FUNCTIONALITY
-- Run this script in your Supabase SQL editor to completely remove all status sync functionality

-- ==============================================
-- DROP ALL TRIGGERS
-- ==============================================

-- Drop status sync triggers
DROP TRIGGER IF EXISTS trigger_sync_order_from_delivery ON deliveries;
DROP TRIGGER IF EXISTS trigger_sync_delivery_from_order ON orders;
DROP TRIGGER IF EXISTS trigger_create_delivery_on_ship ON orders;

-- ==============================================
-- DROP ALL FUNCTIONS
-- ==============================================

-- Drop status sync functions
DROP FUNCTION IF EXISTS sync_order_status_from_delivery();
DROP FUNCTION IF EXISTS sync_delivery_status_from_order();
DROP FUNCTION IF EXISTS create_delivery_on_ship();

-- Drop utility functions
DROP FUNCTION IF EXISTS get_order_status_summary(UUID);
DROP FUNCTION IF EXISTS force_sync_all_order_statuses();

-- Drop debug functions
DROP FUNCTION IF EXISTS test_order_status_update(UUID, order_status);
DROP FUNCTION IF EXISTS check_order_delivery_consistency(UUID);
DROP FUNCTION IF EXISTS create_delivery_for_order(UUID, delivery_status);
DROP FUNCTION IF EXISTS test_status_sync_safe();

-- ==============================================
-- DROP INDEXES
-- ==============================================

-- Drop indexes created for status sync
DROP INDEX IF EXISTS idx_deliveries_order_id_status;
DROP INDEX IF EXISTS idx_orders_status_updated_at;

-- ==============================================
-- REVOKE PERMISSIONS
-- ==============================================

-- Revoke execute permissions (if they exist)
-- Note: These might not exist if functions were already dropped
DO $$
BEGIN
    -- Try to revoke permissions, ignore errors if they don't exist
    BEGIN
        REVOKE EXECUTE ON FUNCTION sync_order_status_from_delivery FROM authenticated;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        REVOKE EXECUTE ON FUNCTION sync_delivery_status_from_order FROM authenticated;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        REVOKE EXECUTE ON FUNCTION create_delivery_on_ship FROM authenticated;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        REVOKE EXECUTE ON FUNCTION get_order_status_summary FROM authenticated;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        REVOKE EXECUTE ON FUNCTION force_sync_all_order_statuses FROM authenticated;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        REVOKE EXECUTE ON FUNCTION test_order_status_update FROM authenticated;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        REVOKE EXECUTE ON FUNCTION check_order_delivery_consistency FROM authenticated;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        REVOKE EXECUTE ON FUNCTION create_delivery_for_order FROM authenticated;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        REVOKE EXECUTE ON FUNCTION test_status_sync_safe FROM authenticated;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
END $$;

-- ==============================================
-- CLEAN UP COMMENTS
-- ==============================================

-- Remove function comments (if they exist)
DO $$
BEGIN
    -- Try to remove comments, ignore errors if they don't exist
    BEGIN
        COMMENT ON FUNCTION sync_order_status_from_delivery IS NULL;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        COMMENT ON FUNCTION sync_delivery_status_from_order IS NULL;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        COMMENT ON FUNCTION create_delivery_on_ship IS NULL;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        COMMENT ON FUNCTION get_order_status_summary IS NULL;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        COMMENT ON FUNCTION force_sync_all_order_statuses IS NULL;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        COMMENT ON FUNCTION test_order_status_update IS NULL;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        COMMENT ON FUNCTION check_order_delivery_consistency IS NULL;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        COMMENT ON FUNCTION create_delivery_for_order IS NULL;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
    
    BEGIN
        COMMENT ON FUNCTION test_status_sync_safe IS NULL;
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist, ignore
    END;
END $$;

-- ==============================================
-- VERIFICATION
-- ==============================================

-- Check what's left (optional - for verification)
SELECT 
    'TRIGGERS' as object_type,
    trigger_name as object_name,
    event_object_table as table_name
FROM information_schema.triggers 
WHERE trigger_name LIKE '%sync%' OR trigger_name LIKE '%delivery%' OR trigger_name LIKE '%order%'
UNION ALL
SELECT 
    'FUNCTIONS' as object_type,
    routine_name as object_name,
    routine_type as table_name
FROM information_schema.routines 
WHERE routine_name LIKE '%sync%' OR routine_name LIKE '%delivery%' OR routine_name LIKE '%order%'
ORDER BY object_type, object_name;

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE 'Status sync functionality has been completely removed from the database.';
    RAISE NOTICE 'All triggers, functions, indexes, and permissions have been dropped.';
    RAISE NOTICE 'Order and delivery statuses will now work independently without automatic synchronization.';
END $$;


