#!/bin/bash
# Script to configure pg_hba.conf for PostgreSQL 18

PG_HBA_FILE="/var/lib/postgresql/18/docker/pg_hba.conf"

# Backup original file
cp "$PG_HBA_FILE" "${PG_HBA_FILE}.backup"

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

# Reload configuration
psql -U postgres -c "SELECT pg_reload_conf();" || true

echo "pg_hba.conf configured successfully"
