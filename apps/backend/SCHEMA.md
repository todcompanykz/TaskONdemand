# PostgreSQL + PostGIS Schema Documentation

## Files

- **`schema.sql`** - Main schema file with tables, indexes, functions, and views
- **`schema-drop.sql`** - Cleanup script to drop all schema objects
- **`schema-verify.sql`** - Verification queries to check schema setup

## Quick Start

### 1. Create Database

```bash
# Using psql
psql -U postgres -c "CREATE DATABASE tod;"

# Or using Docker
docker exec -it tod-postgres psql -U postgres -c "CREATE DATABASE tod;"
```

### 2. Apply Schema

```bash
# Using psql
psql -U postgres -d tod -f schema.sql

# Or using Docker
docker exec -i tod-postgres psql -U postgres -d tod < schema.sql
```

### 3. Verify Schema

```bash
psql -U postgres -d tod -f schema-verify.sql
```

## Schema Overview

### Users Table

```sql
users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── password (VARCHAR, bcrypt hashed)
├── phoneNumber (VARCHAR, nullable)
├── createdAt (TIMESTAMP)
└── updatedAt (TIMESTAMP)
```

### Tasks Table

```sql
tasks
├── id (UUID, PK)
├── shortDescription (VARCHAR 100)
├── fullDescription (TEXT)
├── reward (INTEGER, >= 5, divisible by 5)
├── geoPoint (geometry Point, SRID 4326) ⭐ PostGIS
├── urgency (ENUM: low/medium/high)
├── status (ENUM: created/claimed/completed/cancelled/expired)
├── createdById (UUID, FK → users.id)
├── claimedById (UUID, FK → users.id, nullable)
├── customerConfirmed (BOOLEAN)
├── executorConfirmed (BOOLEAN)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)
└── expiresAt (TIMESTAMP, nullable)
```

## Key Features

### PostGIS Geometry

Tasks use PostGIS `geometry(Point, 4326)` for geolocation:
- SRID 4326 = WGS84 (standard GPS coordinates)
- Format: `ST_MakePoint(longitude, latitude)`
- Example: `ST_SetSRID(ST_MakePoint(71.4304, 51.1694), 4326)`

### Spatial Index

GIST index on `geoPoint` for fast geospatial queries:
```sql
CREATE INDEX idx_tasks_geoPoint ON tasks USING GIST("geoPoint");
```

### Constraints

- **Reward**: Must be >= 5 and divisible by 5
- **Urgency**: Only 'low', 'medium', 'high'
- **Status**: Only valid enum values
- **Foreign Keys**: CASCADE delete for creator, SET NULL for claimer

## Helper Functions

### `get_tasks_within_radius(longitude, latitude, radius_meters)`

Returns tasks within specified radius (in meters) from a point.

**Example:**
```sql
-- Get tasks within 1km of Astana center
SELECT * FROM get_tasks_within_radius(71.4304, 51.1694, 1000);
```

**Returns:**
- All task fields
- `distance_meters` - calculated distance from query point

## Views

### `active_tasks`

Shows all active tasks (created or claimed, not expired):
```sql
SELECT * FROM active_tasks;
```

Includes:
- All task fields
- `longitude`, `latitude` (extracted from geoPoint)
- `creator_email`, `creator_phone`

### `task_stats`

Aggregated statistics:
```sql
SELECT * FROM task_stats;
```

Returns:
- `created_count`
- `claimed_count`
- `completed_count`
- `cancelled_count`
- `expired_count`
- `total_count`
- `total_rewards_paid`

## Common Queries

### Find Tasks Within 1km

```sql
SELECT 
    t.*,
    ST_Distance(
        t."geoPoint"::geography,
        ST_SetSRID(ST_MakePoint(71.4304, 51.1694), 4326)::geography
    ) AS distance_meters
FROM tasks t
WHERE 
    t.status = 'created'
    AND t."expiresAt" > CURRENT_TIMESTAMP
    AND ST_DWithin(
        t."geoPoint"::geography,
        ST_SetSRID(ST_MakePoint(71.4304, 51.1694), 4326)::geography,
        1000  -- 1km in meters
    )
ORDER BY t."createdAt" DESC;
```

### Insert Task with PostGIS Point

```sql
INSERT INTO tasks (
    "shortDescription",
    "fullDescription",
    reward,
    "geoPoint",
    urgency,
    "createdById",
    "expiresAt"
) VALUES (
    'Deliver package',
    'Need to deliver a package to downtown Astana',
    500,
    ST_SetSRID(ST_MakePoint(71.4304, 51.1694), 4326),
    'high',
    'user-uuid-here',
    CURRENT_TIMESTAMP + INTERVAL '24 hours'
);
```

### Extract Coordinates from Point

```sql
SELECT 
    id,
    "shortDescription",
    ST_X("geoPoint") AS longitude,
    ST_Y("geoPoint") AS latitude
FROM tasks;
```

## Indexes

1. **`idx_users_email`** - Fast email lookups
2. **`idx_tasks_createdById`** - Foreign key index
3. **`idx_tasks_claimedById`** - Foreign key index
4. **`idx_tasks_status`** - Status filtering
5. **`idx_tasks_expiresAt`** - Expiration filtering
6. **`idx_tasks_geoPoint`** - Spatial GIST index (most important for feed queries)
7. **`idx_tasks_status_expiresAt`** - Composite partial index for feed

## Triggers

- **`update_users_updated_at`** - Auto-updates `updatedAt` on user changes
- **`update_tasks_updated_at`** - Auto-updates `updatedAt` on task changes

## Maintenance

### Drop Everything

```bash
psql -U postgres -d tod -f schema-drop.sql
```

### Reset Database

```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE IF EXISTS tod;"
psql -U postgres -c "CREATE DATABASE tod;"
psql -U postgres -d tod -f schema.sql
```

## Notes

- PostGIS extension must be installed on PostgreSQL server
- Use `geography` type for accurate distance calculations (meters)
- Use `geometry` type for coordinate storage (SRID 4326)
- All timestamps use `CURRENT_TIMESTAMP` for consistency
- UUIDs are generated automatically using `gen_random_uuid()`
