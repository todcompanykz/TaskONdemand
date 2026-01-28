#!/bin/bash
# Script to configure pg_hba.conf for PostgreSQL 18
# This script is optional and will gracefully skip if pg_hba.conf is not found

set -e

# Find pg_hba.conf in PostgreSQL 18 data directory
PG_HBA_FILE=""
for path in "/var/lib/postgresql/data/pg_hba.conf" "/var/lib/postgresql/18/data/pg_hba.conf"; do
  if [ -f "$path" ]; then
    PG_HBA_FILE="$path"
    break
  fi
done

if [ -z "$PG_HBA_FILE" ]; then
  echo "Warning: pg_hba.conf not found, skipping configuration"
  exit 0
fi

# Backup original file
cp "$PG_HBA_FILE" "${PG_HBA_FILE}.backup" || true

# Create new pg_hba.conf with proper authentication
cat > "$PG_HBA_FILE" <<EOF
# PostgreSQL Client Authentication Configuration File
# Configured for Docker with external access

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     trust

# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
# IPv6 local connections:
host    all             all             ::1/128                 md5

# Allow connections from any IP (for Docker and external tools like pgAdmin)
host    all             all             0.0.0.0/0               md5
host    all             all             ::/0                    md5

# Allow replication connections from localhost
local   replication     all                                     trust
host    replication     all             127.0.0.1/32            trust
host    replication     all             ::1/128                 trust
EOF

# Reload configuration (if PostgreSQL is running)
psql -U postgres -c "SELECT pg_reload_conf();" 2>/dev/null || true

echo "pg_hba.conf configured successfully"
