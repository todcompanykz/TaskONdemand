-- Task on Demand (ToD) - Schema Verification Queries
-- Run these to verify the schema is set up correctly

-- ============================================
-- 1. Check PostGIS Extension
-- ============================================
SELECT 
    extname AS extension_name,
    extversion AS version
FROM pg_extension
WHERE extname = 'postgis';

-- ============================================
-- 2. Verify Tables Exist
-- ============================================
SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = t.table_name 
     AND table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'tasks')
ORDER BY table_name;

-- ============================================
-- 3. Check Table Columns
-- ============================================
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('users', 'tasks')
ORDER BY table_name, ordinal_position;

-- ============================================
-- 4. Verify Constraints
-- ============================================
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('users', 'tasks')
ORDER BY tc.table_name, tc.constraint_type;

-- ============================================
-- 5. Check Indexes (including spatial)
-- ============================================
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('users', 'tasks')
ORDER BY tablename, indexname;

-- ============================================
-- 6. Verify Foreign Keys
-- ============================================
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('users', 'tasks');

-- ============================================
-- 7. Test PostGIS Geometry
-- ============================================
SELECT 
    'PostGIS Test' AS test_name,
    ST_AsText(ST_MakePoint(71.4304, 51.1694)) AS sample_point_wkt,
    ST_SetSRID(ST_MakePoint(71.4304, 51.1694), 4326) AS sample_point_geometry;

-- ============================================
-- 8. Check Triggers
-- ============================================
SELECT
    trigger_name,
    event_object_table AS table_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
    AND event_object_table IN ('users', 'tasks')
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 9. Verify Functions
-- ============================================
SELECT
    routine_name,
    routine_type,
    data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN ('get_tasks_within_radius', 'update_updated_at_column')
ORDER BY routine_name;

-- ============================================
-- 10. Test Helper Function
-- ============================================
-- This will return empty if no tasks exist, but verifies the function works
SELECT * FROM get_tasks_within_radius(71.4304, 51.1694, 1000) LIMIT 5;
