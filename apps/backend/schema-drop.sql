-- Task on Demand (ToD) - Drop Schema
-- Use this to clean up the database

-- Drop views
DROP VIEW IF EXISTS task_stats CASCADE;
DROP VIEW IF EXISTS active_tasks CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_tasks_within_radius(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop tables (cascade will handle foreign keys)
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Note: PostGIS extension is kept as it may be used by other databases
-- To remove PostGIS: DROP EXTENSION IF EXISTS postgis CASCADE;
