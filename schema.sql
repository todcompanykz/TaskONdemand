-- Task on Demand (ToD) - PostgreSQL + PostGIS Schema
-- MVP Database Schema

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS installation
SELECT PostGIS_version();

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(50),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "shortDescription" VARCHAR(100) NOT NULL,
    "fullDescription" TEXT NOT NULL,
    reward INTEGER NOT NULL CHECK (reward >= 5 AND reward % 5 = 0),
    city VARCHAR(100) NOT NULL DEFAULT 'Астана',
    address VARCHAR(200) NOT NULL DEFAULT '',
    "geoPoint" geometry(Point, 4326) NOT NULL,
    urgency VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
    status VARCHAR(20) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'claimed', 'completed', 'cancelled', 'expired')),
    "createdById" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "claimedById" UUID REFERENCES users(id) ON DELETE SET NULL,
    "customerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "executorConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_tasks_createdById ON tasks("createdById");
CREATE INDEX IF NOT EXISTS idx_tasks_claimedById ON tasks("claimedById");

-- Status index for filtering
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Expiration index for filtering expired tasks
CREATE INDEX IF NOT EXISTS idx_tasks_expiresAt ON tasks("expiresAt");

-- Spatial index on geoPoint (GIST) for fast geospatial queries
CREATE INDEX IF NOT EXISTS idx_tasks_geoPoint ON tasks USING GIST("geoPoint");

-- Composite index for feed queries (status + expiration)
CREATE INDEX IF NOT EXISTS idx_tasks_status_expiresAt ON tasks(status, "expiresAt") WHERE status = 'created';

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updatedAt on users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updatedAt on tasks
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get tasks within radius (in meters)
-- Usage: SELECT * FROM get_tasks_within_radius(71.4304, 51.1694, 1000);
CREATE OR REPLACE FUNCTION get_tasks_within_radius(
    p_longitude DOUBLE PRECISION,
    p_latitude DOUBLE PRECISION,
    p_radius_meters INTEGER DEFAULT 1000
)
RETURNS TABLE (
    id UUID,
    "shortDescription" VARCHAR,
    "fullDescription" TEXT,
    reward INTEGER,
    urgency VARCHAR,
    status VARCHAR,
    "createdAt" TIMESTAMP,
    "expiresAt" TIMESTAMP,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t."shortDescription",
        t."fullDescription",
        t.reward,
        t.urgency,
        t.status,
        t."createdAt",
        t."expiresAt",
        ST_Distance(
            t."geoPoint"::geography,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        ) AS distance_meters
    FROM tasks t
    WHERE 
        t.status = 'created'
        AND t."expiresAt" > CURRENT_TIMESTAMP
        AND ST_DWithin(
            t."geoPoint"::geography,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
            p_radius_meters
        )
    ORDER BY t."createdAt" DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS
-- ============================================

-- View for active tasks (not expired, not cancelled, not completed)
CREATE OR REPLACE VIEW active_tasks AS
SELECT 
    t.*,
    ST_X(t."geoPoint") AS longitude,
    ST_Y(t."geoPoint") AS latitude,
    u.email AS creator_email,
    u."phoneNumber" AS creator_phone
FROM tasks t
INNER JOIN users u ON t."createdById" = u.id
WHERE 
    t.status IN ('created', 'claimed')
    AND (t."expiresAt" IS NULL OR t."expiresAt" > CURRENT_TIMESTAMP);

-- View for task statistics
CREATE OR REPLACE VIEW task_stats AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'created') AS created_count,
    COUNT(*) FILTER (WHERE status = 'claimed') AS claimed_count,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count,
    COUNT(*) FILTER (WHERE status = 'expired') AS expired_count,
    COUNT(*) AS total_count,
    SUM(reward) FILTER (WHERE status = 'completed') AS total_rewards_paid
FROM tasks;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment to insert sample data for testing
/*
-- Sample user
INSERT INTO users (email, password, "phoneNumber") VALUES
('test@example.com', '$2b$10$example_hashed_password', '+77001234567');

-- Sample task in Astana (Nur-Sultan)
-- Coordinates: ~71.4304°E, 51.1694°N
INSERT INTO tasks (
    "shortDescription",
    "fullDescription",
    reward,
    "geoPoint",
    urgency,
    "createdById",
    "expiresAt"
) VALUES (
    'Sample Task',
    'This is a sample task description',
    1000,
    ST_SetSRID(ST_MakePoint(71.4304, 51.1694), 4326),
    'medium',
    (SELECT id FROM users WHERE email = 'test@example.com'),
    CURRENT_TIMESTAMP + INTERVAL '24 hours'
);
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check PostGIS is working
SELECT 
    PostGIS_version() AS postgis_version,
    ST_AsText(ST_MakePoint(71.4304, 51.1694)) AS sample_point;

-- Check tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'tasks')
ORDER BY table_name;

-- Check indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('users', 'tasks')
ORDER BY tablename, indexname;
